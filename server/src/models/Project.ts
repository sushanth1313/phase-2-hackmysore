import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  projectName: { type: String, required: true },
  description: { type: String },
  problemStatement: { type: String },
  candidateRole: { type: String },
  claimedTechnologies: [String],
  githubUrl: { type: String },
  liveDemoUrl: { type: String },
  status: { type: String, enum: ['QUEUED', 'VALIDATING', 'ANALYZING', 'EXTRACTING_EVIDENCE', 'AI_ASSESSMENT', 'COMPLETED', 'FAILED'], default: 'QUEUED' },
  uploadPath: { type: String },
  analysisJobId: { type: String }
}, { timestamps: true });

export default mongoose.model('Project', projectSchema);
