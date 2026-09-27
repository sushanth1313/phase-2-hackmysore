import mongoose from 'mongoose';

const evidenceItemSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ['LANGUAGE', 'FRAMEWORK', 'LIBRARY', 'DATABASE', 'API', 'TESTING', 'SECURITY', 'ARCHITECTURE', 'DEVOPS', 'PATTERN'],
    required: true 
  },
  name: { type: String, required: true },
  confidence: { type: Number, min: 0, max: 1, required: true },
  occurrences: { type: Number, default: 0 },
  files: [String],
  details: { type: mongoose.Schema.Types.Mixed }
}, { _id: false });

const claimVerificationSchema = new mongoose.Schema({
  claim: { type: String, required: true },
  evidenceFound: [String],
  status: { 
    type: String, 
    enum: ['SUPPORTED', 'PARTIALLY_SUPPORTED', 'INSUFFICIENT_EVIDENCE', 'REQUIRES_REVIEW'],
    required: true 
  },
  confidence: { type: Number, min: 0, max: 1 }
}, { _id: false });

const assessmentScoresSchema = new mongoose.Schema({
  functionality: { type: Number },
  codeQuality: { type: Number },
  architecture: { type: Number },
  complexity: { type: Number },
  testing: { type: Number },
  documentation: { type: Number },
  security: { type: Number },
  maintainability: { type: Number },
  overallEvidenceScore: { type: Number }
}, { _id: false });

const projectEvidenceSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // What was found in the codebase
  evidenceItems: [evidenceItemSchema],
  
  // Claim verification
  claimVerifications: [claimVerificationSchema],
  
  // Assessment scores
  scores: assessmentScoresSchema,
  
  // AI-generated assessment
  aiAssessment: {
    summary: String,
    strengths: [String],
    weaknesses: [String],
    architectureNotes: String,
    generatedAt: Date
  },
  
  // Analysis metadata
  analysisVersion: { type: String, default: '1.0' },
  analyzedAt: { type: Date, default: Date.now },
  analysisStatus: { 
    type: String, 
    enum: ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'PARTIAL'],
    default: 'PENDING'
  },
  errorMessage: String,
  
  // Anti-gaming signals
  integritySignals: {
    projectHash: String,
    treeHash: String,
    requiresReview: { type: Boolean, default: false },
    reviewReason: String
  }
}, { timestamps: true });

projectEvidenceSchema.index({ project: 1 }, { unique: true });
projectEvidenceSchema.index({ user: 1 });
projectEvidenceSchema.index({ 'evidenceItems.name': 1 });

export default mongoose.model('ProjectEvidence', projectEvidenceSchema);
