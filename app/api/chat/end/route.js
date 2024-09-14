import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Conversation from '@/models/conversation';

export async function POST(req) {
    await dbConnect();

    const { conversationId } = await req.json();

    try {
        // Find the conversation and update its status to 'ended'
        const conversation = await Conversation.findByIdAndUpdate(
            conversationId,
            { $set: { status: 'ended', endedAt: new Date() } },
            { new: true }
        );

        if (!conversation) {
            return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Conversation ended successfully' });
    } catch (error) {
        console.error('Error ending conversation:', error);
        return NextResponse.json({ error: 'An error occurred while ending the conversation' }, { status: 500 });
    }
}
