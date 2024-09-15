import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import dbConnect from '@/lib/dbConnect';
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

// Updated getQueryEmbedding function
function getQueryEmbedding(query) {
  const words = query.toLowerCase().split(/\W+/);
  const embedding = new Array(diseaseEmbeddings[Object.keys(diseaseEmbeddings)[0]][0].length).fill(0);
  let wordCount = 0;

  words.forEach(word => {
    for (const [disease, embeddings] of Object.entries(diseaseEmbeddings)) {
      if (diseaseSymptomLists[disease].includes(word)) {
        embeddings.forEach(symptomEmbedding => {
          for (let i = 0; i < embedding.length; i++) {
            embedding[i] += symptomEmbedding[i];
          }
        });
        wordCount++;
        break;
      }
    }
  });

  // Normalize the embedding
  if (wordCount > 0) {
    for (let i = 0; i < embedding.length; i++) {
      embedding[i] /= wordCount;
    }
  }

  return embedding;
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
    weights[disease] = totalWeight > 0 ? (weights[disease] / totalWeight) * 100 : 0;
  }

  return weights;
}

function getTopThreeDiseases(weights) {
  return Object.entries(weights)
    .filter(([_, weight]) => !isNaN(weight) && isFinite(weight))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([disease, weight]) => ({ disease, weight: parseFloat(weight.toFixed(2)) }));
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

Be thorough, polite, and professional while focusing on gathering medical data one question at a time. Do not explicitly mention the predicted diseases unless directly asked
in the following manner "Now now what are my diseases?"

Relevant symptoms to inquire about include: {{relevant_symptoms}}. 

Please use this information to guide your questions and assessment. Ask only one question at a time, and wait for the patient's response before asking 
the next question. If {{questionCount}} is 5, don't ask any questions. 

You are always to respond in {{language_preference}}
`;

export async function POST(req) {
  await dbConnect();
  let questionCount = 5;

  const body = await req.json();
  const { messages = [], conversationId = null, languagePreference = 'English', userId } = body;

  const lastMessage = messages[messages.length - 1]?.content || '';

  // Extract symptoms from the user's message
  const extractedSymptoms = extractSymptoms(lastMessage);

  let conversation;

  if (!conversationId) {
    conversation = await Conversation.create({
      userId,
      extractedSymptoms,
      lastUpdated: new Date(),
      questionCount,
      status: 'active',
      startedAt: new Date()
    });
  } else {
    conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }
  }

  // Decrement question count
  questionCount--;

  // Calculate disease weights
  const diseaseWeights = calculateDiseaseWeights(lastMessage);
  const topDiseases = getTopThreeDiseases(diseaseWeights);
  const relevantSymptoms = getRelevantSymptoms(topDiseases);

  const fullSystemPrompt = systemPrompt
    .replace('{{top_diseases}}', topDiseases.map(d => `${d.disease} (${d.weight.toFixed(2)}%)`).join(', '))
    .replace('{{relevant_symptoms}}', relevantSymptoms.join(', '))
    .replace('{{question_count}}', questionCount.toString())
    .replace('{{language_preference}}', languagePreference);

  const openai = new OpenAI();

  try {
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: fullSystemPrompt,
        },
        ...messages,
        { role: 'user', content: lastMessage },
      ],
      model: 'gpt-4o-mini',
      stream: true,
      max_tokens: 150,
    });

    let aiResponse = '';

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let aiResponse = '';

        for await (const part of completion) {
          const text = part.choices[0]?.delta?.content || '';
          aiResponse += text;
          controller.enqueue(encoder.encode(text));
        }

        // Save the AI's response to MongoDB
        await Message.create({
          role: 'assistant',
          content: aiResponse,
        });

        controller.close();
      },
    });

    // After processing the AI response
    const userMessage = await Message.create({ role: 'user', content: lastMessage });
    const aiMessage = await Message.create({ role: 'assistant', content: aiResponse });

    // Update the conversation with new messages and data
    await Conversation.findByIdAndUpdate(conversation._id, {
      $push: { 
        messages: [userMessage._id, aiMessage._id],
        userInputs: lastMessage,
        aiResponses: aiResponse,
        extractedSymptoms: { $each: extractedSymptoms }
      },
      $set: {
        topDiseases: topDiseases.filter(d => !isNaN(d.weight) && isFinite(d.weight)),
        diseaseWeights,
        lastUpdated: new Date(),
        questionCount
      }
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