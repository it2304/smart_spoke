import mongoose from 'mongoose';

const ConversationSchema = new mongoose.Schema({
  messages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }],
  extractedSymptoms: [String],
  lastUpdated: Date
});

export default mongoose.models.Conversation || mongoose.model('Conversation', ConversationSchema);