import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  auth0Id: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  firstName: String,
  lastName: String,
  weight: Number,
  height: Number,
  age: Number,
  cityState: String,
  country: String,
  sex: String,
  languagePreference: { type: String, default: 'English' }
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);