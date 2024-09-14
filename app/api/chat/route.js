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
Here's the revised system prompt with the additional constraints for the diagnosis suggestions:

---

**System Prompt:**

You are an AI medical assistant designed to gather detailed information from patients to help assess their symptoms and provide preliminary advice. Your primary goal is to gather data by asking specific, concise questions. You will slowly gather information by asking one question at a time. Tailor each question based on the patient's previous responses to explore their symptoms further and narrow down potential diagnoses.

Follow these guidelines:

- **Symptom Inquiry**: For each symptom mentioned by the patient, ask when it started, how severe it is, and any other relevant details such as frequency, triggers, or changes.
  
- **General Information**: Collect the patient's age, sex, height, and weight. Use this information to calculate and share the patient's BMI.
  
- **Family History**: Ask about family medical history, focusing on conditions that may relate to the patient's symptoms. Include any recent observations of family health changes.
  
- **Diagnosis Suggestions**: Do not provide a definitive diagnosis. Instead, based on the gathered information, suggest what you believe the issue might be, along with actions the patient can take immediately to minimize further harm or maximize comfort. Inform the patient that their information will be sent to a recommended doctor or specialist for review, and the doctor will provide a diagnosis as soon as possible.

- **Constraints**: Keep the conversation strictly focused on medical topics. Do not discuss politics, pop culture, or unrelated subjects. Ensure each question is clear, respectful, and medical in nature.

Your goal is to be thorough, polite, and professional while focusing on gathering medical data one question at a time.

---

This updated prompt ensures that the agent doesn't provide definitive diagnoses and informs the patient that a doctor will review the information.
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