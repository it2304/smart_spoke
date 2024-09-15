import { getSession } from '@auth0/nextjs-auth0';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/user';

export async function GET(request) {
  const session = await getSession();
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  await dbConnect();

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (session.user.sub !== userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const user = await User.findOne({ auth0Id: userId });
    if (user) {
      return NextResponse.json({ languagePreference: user.languagePreference });
    } else {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error fetching language preference:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await getSession();
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  await dbConnect();

  const { userId, languagePreference } = await request.json();

  if (session.user.sub !== userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const updatedUser = await User.findOneAndUpdate(
      { auth0Id: userId },
      { languagePreference },
      { new: true, upsert: true }
    );
    return NextResponse.json({ languagePreference: updatedUser.languagePreference });
  } catch (error) {
    console.error('Error updating language preference:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}