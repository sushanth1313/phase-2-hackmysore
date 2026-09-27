import mongoose from 'mongoose';

// ─── 8-Dimension Rubric Sub-schema ────────────────────────────────────────────
const rubricDimensionSchema = new mongoose.Schema({
  score: { type: Number, min: 0, max: 100, default: 0 },
  comment: { type: String, default: '' },
  evidenceNote: { type: String, default: '' }
}, { _id: false });

const rubricSchema = new mongoose.Schema({
  // Weight 20%
  workQuality: rubricDimensionSchema,
  // Weight 15%
  problemSolving: rubricDimensionSchema,
  // Weight 15%
  domainKnowledge: rubricDimensionSchema,
  // Weight 10%
  communication: rubricDimensionSchema,
  // Weight 10%
  documentation: rubricDimensionSchema,
  // Weight 10%
  creativityAndInitiative: rubricDimensionSchema,
  // Weight 10%
  aiAssessmentAlignment: rubricDimensionSchema,
  // Weight 10%
  peerAndExpertReview: rubricDimensionSchema
}, { _id: false });

// ─── ExpertReview Schema ───────────────────────────────────────────────────────
const expertReviewSchema = new mongoose.Schema({
  // Who is reviewing (null when UNASSIGNED in available pool)
  expert: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  expertId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },

  // What is being reviewed — one of these will be set depending on track
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  challengeSubmission: { type: mongoose.Schema.Types.ObjectId, ref: 'ChallengeSubmission' },
  nonTechProofOfWork: { type: mongoose.Schema.Types.ObjectId, ref: 'NonTechProofOfWork' },
  submissionId: { type: mongoose.Schema.Types.ObjectId, required: false },
  aiAnalysis: { type: mongoose.Schema.Types.Mixed },

  // The candidate being reviewed
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },

  // Track and source info
  track: { type: String, enum: ['TECHNICAL', 'NON_TECHNICAL'], default: 'TECHNICAL' },
  submissionTitle: { type: String, default: '' },
  submissionDescription: { type: String, default: '' },

  // Review lifecycle status (UNASSIGNED -> ASSIGNED -> IN_REVIEW -> COMPLETED)
  status: {
    type: String,
    enum: ['UNASSIGNED', 'ASSIGNED', 'IN_REVIEW', 'COMPLETED', 'CANCELLED'],
    default: 'UNASSIGNED'
  },

  // 8-Dimension rubric scores
  rubric: rubricSchema,
  rubricScores: { type: mongoose.Schema.Types.Mixed },

  // Calculated from rubric using weights (never hardcoded)
  overallScore: { type: Number, min: 0, max: 100 },

  // Expert's final verification decision
  verificationStatus: {
    type: String,
    enum: ['VERIFIED', 'PARTIALLY_VERIFIED', 'NEEDS_RESUBMISSION', 'NEEDS_REVIEW', 'INSUFFICIENT_EVIDENCE'],
  },

  // Expert's written evaluation fields
  overallAssessment: { type: String, default: '' },
  strengths: { type: String, default: '' },
  weaknesses: { type: String, default: '' },
  improvements: { type: String, default: '' },
  whatWasDoneWell: { type: String, default: '' },
  whatNeedsImprovement: { type: String, default: '' },
  recommendedImprovements: { type: String, default: '' },
  expertComments: { type: String, default: '' },
  evidenceNotes: { type: String, default: '' },

  // Expert's written feedback
  feedback: { type: String, default: '' },
  internalNotes: { type: String, default: '' },

  // Added AI Improvement Suggestions (Real expert review feedback)
  improvementSuggestions: [{
    title: { type: String, required: true },
    description: { type: String, default: '' },
    source: { type: String, default: '' },
    evidence: { type: String, default: '' },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    addedAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['ADDED', 'ADDRESSED'],
      default: 'ADDED'
    }
  }],

  // Persisted expert suggestions interaction (Section 19)
  acceptedSuggestions: [{
    id: { type: String },
    text: { type: String },
    expertNote: { type: String, default: '' }
  }],
  modifiedSuggestions: [{
    id: { type: String },
    originalText: { type: String },
    modifiedText: { type: String }
  }],
  rejectedSuggestions: [{
    id: { type: String },
    text: { type: String },
    reason: { type: String, default: '' }
  }],
  improvementRecommendations: [{ type: String }],
  improvementReport: {
    doneWell: { type: String, default: '' },
    needsImprovement: { type: String, default: '' },
    criticalGaps: { type: String, default: '' },
    nextSteps: [{ type: String }]
  },
  evidenceSummarySnapshot: { type: mongoose.Schema.Types.Mixed },
  requirementMatches: { type: mongoose.Schema.Types.Mixed },

  // Timestamps
  assignedAt: { type: Date, default: Date.now },
  startedAt: { type: Date },
  completedAt: { type: Date }
}, { timestamps: true });

// Indexes
expertReviewSchema.index({ expert: 1, status: 1 });
expertReviewSchema.index({ expertId: 1, status: 1 });
expertReviewSchema.index({ expert: 1, createdAt: -1 });
expertReviewSchema.index({ candidate: 1 });
expertReviewSchema.index({ candidateId: 1 });
expertReviewSchema.index({ project: 1 });
expertReviewSchema.index({ challengeSubmission: 1 });
expertReviewSchema.index({ nonTechProofOfWork: 1 });
expertReviewSchema.index({ submissionId: 1 });
expertReviewSchema.index({ status: 1 });

export default mongoose.model('ExpertReview', expertReviewSchema);
