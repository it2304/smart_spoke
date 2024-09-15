import dbConnect from '@/lib/dbConnect';
import User from '@/models/user';

export async function createUser(auth0User) {
  console.log('createUser called with:', auth0User);
  
  try {
    await dbConnect();
    console.log('Connected to database');

    const { sub: auth0Id, email } = auth0User;

    const existingUser = await User.findOne({ auth0Id });
    if (existingUser) {
      console.log('Existing user found:', existingUser);
      return existingUser;
    }

    const newUser = new User({
      auth0Id,
      email,
      languagePreference: 'English' // Default language
    });

    const savedUser = await newUser.save();
    console.log('New user saved:', savedUser);
    return savedUser;
  } catch (error) {
    console.error('Error in createUser:', error);
    throw error;
  }
}