import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Conversation from '@/models/conversation';

export async function POST(req) {
    const { conversationData, userId } = await req.json();
    console.log('Received request:', { conversationData, userId });

    try {
        await dbConnect();

        // Sanitize topDiseases data
        const sanitizedTopDiseases = conversationData.topDiseases.map(disease => ({
            disease: disease.disease,
            weight: isNaN(disease.weight) ? 0 : Number(disease.weight)
        }));

        // Sanitize diseaseWeights data
        const sanitizedDiseaseWeights = Object.entries(conversationData.diseaseWeights).reduce((acc, [key, value]) => {
            acc[key] = isNaN(value) ? 0 : Number(value);
            return acc;
        }, {});

        // Create a new conversation in the database
        const newConversation = new Conversation({
            userId,
            status: 'ended',
            startedAt: conversationData.startTime,
            endedAt: new Date(),
            userInputs: conversationData.userInputs,
            aiResponses: conversationData.aiResponses,
            extractedSymptoms: conversationData.extractedSymptoms,
            topDiseases: sanitizedTopDiseases,
            diseaseWeights: sanitizedDiseaseWeights,
        });

        const savedConversation = await newConversation.save();

        console.log('Saved conversation:', JSON.stringify(savedConversation, null, 2));

        return NextResponse.json({ 
            message: 'Conversation ended and recorded successfully',
            conversation: savedConversation
        });
    } catch (error) {
        console.error('Error saving conversation:', error);
        return NextResponse.json({ error: 'An error occurred while saving the conversation', details: error.message }, { status: 500 });
    }
}
