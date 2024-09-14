import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  role: String,
  content: String,
  extractedSymptoms: [String],
  diagnosticInfo: mongoose.Schema.Types.Mixed
});

export default mongoose.models.Message || mongoose.model('Message', MessageSchema);