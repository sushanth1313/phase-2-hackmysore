import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  readAt: { type: Date },
  // Optional job link
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' }
}, { timestamps: true });

messageSchema.index({ conversation: 1, createdAt: -1 });

const conversationSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  // The most recent message for quick display
  lastMessage: { type: String },
  lastMessageAt: { type: Date },
  // Opportunity context (recruiter reaching out about a role)
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
  subject: { type: String }
}, { timestamps: true });

conversationSchema.index({ participants: 1 });

export const Message = mongoose.model('Message', messageSchema);
export const Conversation = mongoose.model('Conversation', conversationSchema);
