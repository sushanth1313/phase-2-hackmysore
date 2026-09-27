import mongoose from 'mongoose';

const challengeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  track: { 
    type: String, 
    enum: ['TECHNICAL', 'NON_TECHNICAL'], 
    required: true,
    default: 'TECHNICAL'
  },
  type: { 
    type: String, 
    default: 'CASE_STUDY'
  },
  careerArea: { type: String, default: '' },
  allowedSubmissionTypes: [{ type: String }],
  difficulty: { 
    type: String, 
    enum: ['EASY', 'MEDIUM', 'HARD', 'EXPERT'],
    required: true 
  },
  domain: { type: String, default: 'General' },
  company: { type: String, default: 'ProofHire' },
  deadline: { type: Date, required: true },
  estimatedTime: { type: String, default: '4-6 hours' },
  skills: [String],
  skillsTargeted: [String],
  evaluationCriteria: [String],
  requirements: [String],
  deliverables: [String],
  starterConstraints: { type: String },
  tags: [String],
  technologies: [String],
  // Canonical status values:
  // OPEN   = visible to candidates, accepting submissions
  // DRAFT  = not yet published
  // CLOSED = deadline passed or manually closed
  // ARCHIVED = soft-deleted
  status: { 
    type: String, 
    enum: ['OPEN', 'DRAFT', 'CLOSED', 'ARCHIVED', 'PUBLISHED', 'AVAILABLE'],
    default: 'OPEN'
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verifiedSubmissions: { type: Number, default: 0 },
  slug: { type: String, unique: true, sparse: true }
}, { timestamps: true });

challengeSchema.index({ status: 1, track: 1, difficulty: 1 });
challengeSchema.index({ skillsTargeted: 1 });
challengeSchema.index({ skills: 1 });
challengeSchema.index({ technologies: 1 });

export default mongoose.model('Challenge', challengeSchema);
