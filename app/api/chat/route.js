import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import dbConnect from '../../../lib/mongodb';
import Message from '../../../models/Message';
import fs from 'fs';
import path from 'path';
import { cosine_similarity } from './similarity';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Load symptom embeddings and list
const embeddingsPath = path.join(process.cwd(), 'symptom_embeddings.npy');
const symptomListPath = path.join(process.cwd(), 'symptom_list.json');

const embeddings = JSON.parse(fs.readFileSync(embeddingsPath, 'utf8'));
const symptomList = JSON.parse(fs.readFileSync(symptomListPath, 'utf8'));

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

const systemPrompt = `


You are always to respond in ${language}.
`

export async function POST(req) {
  await dbConnect();

  const { messages } = await req.json();
  const lastMessage = messages[messages.length - 1].content;

  // Find similar symptoms
  const relevantSymptoms = findSimilarSymptoms(lastMessage);
  const symptomPrompt = relevantSymptoms.join(', ');

  const fullSystemPrompt = systemPrompt.replace('{{relevant_symptoms}}', symptomPrompt);

  try {
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: fullSystemPrompt,
        },
        ...messages,
      ],
      model: 'gpt-4-0613',
      stream: true,
      response_format: { type: "text" },
      max_tokens: 150,
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

    return new NextResponse(stream);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 });
  }
}