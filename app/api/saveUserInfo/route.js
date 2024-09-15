import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/user'; // Assuming you have a User model

export async function POST(req) {
  await dbConnect();

  try {
    const userData = await req.json();
    const { auth0Id } = userData;

    let user = await User.findOne({ auth0Id });

    if (user) {
      // Update existing user
      Object.assign(user, userData);
    } else {
      // Create new user
      user = new User(userData);
    }

    await user.save();

    return NextResponse.json({ message: 'User information saved successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error saving user info:', error);
    return NextResponse.json({ error: 'Failed to save user information' }, { status: 500 });
  }
}