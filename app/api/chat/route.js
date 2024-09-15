import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import dbConnect from '@/lib/mongodb';
import Message from '@/models/message';
import Conversation from '@/models/conversation'; // You'll need to create this model
import fs from 'fs';
import path from 'path';
import { cosine_similarity } from './similarity';

// Load symptom embeddings and lists
const embeddingsPath = path.join(process.cwd(), 'disease_symptom_embeddings.json');
const symptomListsPath = path.join(process.cwd(), 'disease_symptom_lists.json');

const diseaseEmbeddings = JSON.parse(fs.readFileSync(embeddingsPath, 'utf8'));
const diseaseSymptomLists = JSON.parse(fs.readFileSync(symptomListsPath, 'utf8'));

// Keep a total count of questions asked
let questionCount = 5;

// Function to extract symptoms from user input
function extractSymptoms(input) {
  const words = input.toLowerCase().split(/\W+/);
  const symptoms = [];
  let adjective = null;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    if (Object.values(diseaseSymptomLists).some(list => list.includes(word))) {
      if (adjective) {
        symptoms.push(`${adjective} ${word}`);
        adjective = null;
      } else {
        symptoms.push(word);
      }
    } else if (['severe', 'mild', 'moderate', 'intense', 'slight'].includes(word)) {
      adjective = word;
    }
  }

  return symptoms;
}

function getQueryEmbedding(query) {
  // Placeholder: return a random embedding
  return Array.from({length: diseaseEmbeddings[Object.keys(diseaseEmbeddings)[0]][0].length}, () => Math.random());
}

function calculateDiseaseWeights(query) {
  const queryEmbedding = getQueryEmbedding(query);
  let weights = {};
  let totalWeight = 0;

  for (const [disease, embeddings] of Object.entries(diseaseEmbeddings)) {
    let diseaseWeight = 0;
    for (const embedding of embeddings) {
      const similarity = cosine_similarity(queryEmbedding, embedding);
      diseaseWeight += Math.max(0, similarity); // Ensure non-negative weights
    }
    diseaseWeight /= embeddings.length; // Average similarity across all symptoms
    weights[disease] = diseaseWeight;
    totalWeight += diseaseWeight;
  }

  // Normalize weights
  for (const disease in weights) {
    weights[disease] = (weights[disease] / totalWeight) * 100;
  }

  return weights;
}

function getTopThreeDiseases(weights) {
  return Object.entries(weights)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([disease, weight]) => ({ disease, weight }));
}

function getRelevantSymptoms(topDiseases) {
  const symptomSet = new Set();
  topDiseases.forEach(({ disease }) => {
    diseaseSymptomLists[disease].forEach(symptom => symptomSet.add(symptom));
  });
  return Array.from(symptomSet);
}

const systemPrompt = `
You are an AI medical assistant designed to gather detailed information from patients to help assess their 
symptoms and provide preliminary advice. Based on the symptoms provided, the top three most likely diseases appear to be:
{{top_diseases}}

Your goal is to ask relevant questions to gather more information about the patient's symptoms, focusing on those related to these top diseases. However, do not rule out any diseases entirely.

Be thorough, polite, and professional while focusing on gathering medical data one question at a time. 
Remember to respond directly without dialogue formatting. Do not explicitly mention the predicted diseases unless directly asked.

Relevant symptoms to inquire about include: {{relevant_symptoms}}

Please use this information to guide your questions and assessment. Ask only one question at a time, and wait for the patient's response before asking 
the next question. If {{questionCount}} is 0, don't ask any questions, just say your predictions.
are {{top_diseases}} based on the symptoms provided.
`;

export async function POST(req) {
  await dbConnect();

  const { messages = [], conversationId = null } = await req.json();
  const lastMessage = messages[messages.length - 1]?.content || '';

  // Extract symptoms from the user's message
  const extractedSymptoms = extractSymptoms(lastMessage);

  // Decrement question count
  questionCount--;

  // Calculate disease weights
  const diseaseWeights = calculateDiseaseWeights(lastMessage);
  const topDiseases = getTopThreeDiseases(diseaseWeights);
  const relevantSymptoms = getRelevantSymptoms(topDiseases);

  const fullSystemPrompt = systemPrompt
    .replace('{{top_diseases}}', topDiseases.map(d => `${d.disease} (${d.weight.toFixed(2)}%)`).join(', '))
    .replace('{{relevant_symptoms}}', relevantSymptoms.join(', '))
    .replace('{{question_count}}', questionCount.toString());

  const openai = new OpenAI();

  try {
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: fullSystemPrompt,
        },
        ...messages,
      ],
      model: 'gpt-4',
      stream: true,
      max_tokens: 150,
    });

    // Save the user's message to MongoDB
    const userMessage = await Message.create({
      role: 'user',
      content: lastMessage,
      extractedSymptoms,
    });

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let aiResponse = '';
        let diagnosticInfoSent = false;

        for await (const part of completion) {
          const text = part.choices[0]?.delta?.content || '';
          aiResponse += text;
          controller.enqueue(encoder.encode(text));
        }

        // Only send diagnostic info if it hasn't been sent yet
        if (!diagnosticInfoSent) {
          // Prepare the diagnostic information
          const diagnosticInfo = JSON.stringify({
            topDiseases,
            diseaseWeights,
            questionCount
          });

          // Encode and send the diagnostic information
          controller.enqueue(encoder.encode('\n\n###DIAGNOSTIC_INFO###' + diagnosticInfo));
          diagnosticInfoSent = true;
        }

        // Save the AI's response to MongoDB
        const aiMessage = await Message.create({
          role: 'assistant',
          content: aiResponse,
          diagnosticInfo: {
            topDiseases,
            diseaseWeights,
            questionCount
          }
        });

        // Update or create the conversation in MongoDB
        let conversation;
        if (conversationId) {
          conversation = await Conversation.findByIdAndUpdate(
            conversationId,
            {
              $push: { messages: [userMessage._id, aiMessage._id] },
              $set: { lastUpdated: new Date() }
            },
            { new: true }
          );
        } else {
          conversation = await Conversation.create({
            messages: [userMessage._id, aiMessage._id],
            extractedSymptoms,
            lastUpdated: new Date()
          });
        }

        // Send the conversation ID to the client
        controller.enqueue(encoder.encode('\n\n###CONVERSATION_ID###' + conversation._id));

        controller.close();
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 });
  }
}