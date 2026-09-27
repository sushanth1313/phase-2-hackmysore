import mongoose from 'mongoose';

const challengeSubmissionSchema = new mongoose.Schema({
  challenge: { type: mongoose.Schema.Types.ObjectId, ref: 'Challenge', required: true },
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  githubUrl: { type: String, default: '' },
  notes: { type: String, default: '' },
  
  track: { type: String, enum: ['TECHNICAL', 'NON_TECHNICAL'], default: 'TECHNICAL' },
  careerArea: { type: String, default: '' },
  targetRole: { type: String, default: '' },
  submissionType: { type: String, default: '' },
  statusReason: { type: String, default: '' },
  
  status: { 
    type: String, 
    enum: ['AVAILABLE', 'ACCEPTED', 'IN_PROGRESS', 'SUBMITTED', 'UNDER_REVIEW', 'COMPLETED', 'VERIFIED', 'REJECTED', 'FAILED', 'NEEDS_RESUBMISSION', 'INVALID_SUBMISSION', 'INSUFFICIENT_EVIDENCE', 'NEEDS_REVIEW', 'PARTIALLY_VERIFIED'],
    default: 'ACCEPTED'
  },
  
  evidence: { type: mongoose.Schema.Types.ObjectId, ref: 'ProjectEvidence' },
  score: { type: Number },
  feedback: { type: String },

  // Non-Technical Submission Fields
  workTitle: { type: String, default: '' },
  workDescription: { type: String, default: '' },
  workUrl: { type: String, default: '' },
  documentUrl: { type: String, default: '' },
  externalWorkUrl: { type: String, default: '' },
  externalWorkType: { type: String, default: '' },
  artifactFiles: [{
    fileName: { type: String },
    fileUrl: { type: String },
    filePath: { type: String },
    fileSize: { type: Number },
    mimeType: { type: String },
    extractedText: { type: String }
  }],
  nonTechAnalysis: {
    problemUnderstanding: { type: Number },
    researchInsight: { type: Number },
    strategy: { type: Number },
    execution: { type: Number },
    creativity: { type: Number },
    completeness: { type: Number },
    communication: { type: Number },
    roleRelevance: { type: Number },
    overallScore: { type: Number },
    summary: { type: String },
    strengths: [{ type: String }],
    recommendations: [{ type: String }],
    evaluationDimensions: [{
      dimension: { type: String },
      score: { type: Number },
      feedback: { type: String }
    }],
    verifiedSkills: [{ type: String }]
  },
  
  acceptedAt: { type: Date, default: Date.now },
  startedAt: { type: Date },
  submittedAt: { type: Date },
  completedAt: { type: Date }
}, { timestamps: true });

challengeSubmissionSchema.index({ challenge: 1, candidate: 1 }, { unique: true });
challengeSubmissionSchema.index({ candidate: 1, status: 1 });

export default mongoose.model('ChallengeSubmission', challengeSubmissionSchema);
