import mongoose from 'mongoose';

const ConversationSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true }, // Add this line
  messages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }],
  extractedSymptoms: [String],
  status: { type: String, enum: ['active', 'ended'], default: 'active' },
  startedAt: { type: Date, default: Date.now },
  endedAt: Date,
  userInputs: [String],
  aiResponses: [String],
  symptomSummary: [String],
  topDiseases: [{
    disease: String,
    weight: Number
  }],
  diseaseWeights: mongoose.Schema.Types.Mixed,
  lastUpdated: { type: Date, default: Date.now }
});

export default mongoose.models.Conversation || mongoose.model('Conversation', ConversationSchema);