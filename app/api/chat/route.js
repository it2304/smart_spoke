import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import dbConnect from '@/lib/mongodb';
import Message from '@/models/message';
import fs from 'fs';
import path from 'path';
import { cosine_similarity } from './similarity';

// Load symptom embeddings and list
const embeddingsPath = path.join(process.cwd(), 'symptom_embeddings.json');
const symptomListPath = path.join(process.cwd(), 'symptom_list.json');

const embeddings = JSON.parse(fs.readFileSync(embeddingsPath, 'utf8'));
const symptomList = JSON.parse(fs.readFileSync(symptomListPath, 'utf8'));

function readNumpyFile(filePath) {
  const data = fs.readFileSync(filePath);
  const npLoader = new npyjs();
  const { data: array, shape } = npLoader.parse(data.buffer);
  return Array.from(array);
}

function findSimilarSymptoms(query, topK = 3) {
  // Assume we have a function to get embedding for the query
  const queryEmbedding = getQueryEmbedding(query);
  
  const similarities = embeddings.map(embedding => cosine_similarity(queryEmbedding, embedding));
  
  const topIndices = similarities
    .map((similarity, index) => ({ similarity, index }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK)
    .map(item => item.index);
  
  return topIndices.map(index => symptomList[index]);
}

function getQueryEmbedding(query) {
  // Placeholder: return a random embedding
  return Array.from({length: embeddings[0].length}, () => Math.random());
}

const systemPrompt = `
You are an AI medical assistant designed to gather detailed information from patients to help assess their 
symptoms and provide preliminary advice. Your primary goal is to gather data by asking specific, concise 
questions. You will slowly gather information by asking one question at a time. Tailor each question 
based on the patient's previous responses to explore their symptoms further and narrow down potential diagnoses.

Follow these guidelines:

- **Symptom Inquiry**: For each symptom mentioned by the patient, ask when it started, 
how severe it is, and any other relevant details such as frequency, triggers, or changes. Be aware of when asking 
about severity is appropriate, and when it is not.
  
- **General Information**: Collect the patient's age, sex, height, and weight. 
Use this information to calculate and share the patient's BMI.
  
- **Family History**: Ask about family medical history, focusing on conditions that 
may relate to the patient's symptoms. Include any recent observations of family health changes.
  
- **Diagnosis Suggestions**: Do not provide a definitive diagnosis. Instead, based on 
the gathered information, suggest what you believe the issue might be, along with actions 
the patient can take immediately to minimize further harm or maximize comfort. Inform the 
patient that their information will be sent to a recommended doctor or specialist for review, 
and the doctor will provide a diagnosis as soon as possible.

- **Constraints**: Keep the conversation strictly focused on medical topics. 
Do not discuss politics, pop culture, or unrelated subjects. Ensure each question is clear, 
respectful, and medical in nature.

Your goal is to be thorough, polite, and professional while focusing on gathering medical data one 
question at a time. Remember to respond directly without dialogue formatting.

`

export async function POST(req) {
  await dbConnect();

  const { messages = [] } = await req.json();
  const lastMessage = messages[messages.length - 1]?.content || '';

  // Ensure embeddings and symptomList are loaded
  if (!Array.isArray(embeddings) || !Array.isArray(symptomList)) {
    console.error("Embeddings or symptom list not properly loaded");
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  // Find similar symptoms
  const relevantSymptoms = findSimilarSymptoms(lastMessage);
  const symptomPrompt = relevantSymptoms.join(', ');

  const fullSystemPrompt = systemPrompt.replace('{{relevant_symptoms}}', symptomPrompt);

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
      response_format: { type: "text" },
      max_tokens: 300,
    });

    // Save the user's message to MongoDB
    await Message.create({
      role: 'user',
      content: lastMessage,
    });

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