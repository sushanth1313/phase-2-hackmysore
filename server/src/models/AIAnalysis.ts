import mongoose, { Schema, Document } from 'mongoose';

export interface IDimensionScore {
  dimension: string;
  name?: string;
  score: number | null;
  maxScore: number;
  weight?: number;
  evidence: string[];
  reasoning: string;
  status?: string;
}

export interface IImprovementItem {
  title: string;
  description: string;
  source: string;
  evidence: string;
  priority?: string;
}

export interface IAIAnalysisDoc extends Document {
  candidateId: mongoose.Types.ObjectId;
  submissionId: mongoose.Types.ObjectId;
  reviewId: mongoose.Types.ObjectId;
  track: 'TECHNICAL' | 'NON_TECHNICAL';
  analysisStatus: 'COMPLETED' | 'INSUFFICIENT_EVIDENCE' | 'ANALYSIS_UNAVAILABLE';
  overallScore: number | null;
  scoreScale: number;
  dimensionScores: IDimensionScore[];
  scoreCalculation: {
    method: string;
    weights: Record<string, number>;
  };
  strengths: string[];
  weaknesses: string[];
  improvements: IImprovementItem[];
  evidenceUsed: string[];
  demonstratedCapabilities?: string[];
  supportingEvidence?: Array<{ claim: string; source: string; citation?: string }>;
  missingEvidence?: Array<{ requirement: string; missingReason: string }>;
  manualVerificationChecklist?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const dimensionScoreSchema = new Schema<IDimensionScore>({
  dimension: { type: String, required: true },
  name: { type: String },
  score: { type: Number, default: null },
  maxScore: { type: Number, default: 10 },
  weight: { type: Number, default: 0 },
  evidence: [{ type: String }],
  reasoning: { type: String, default: '' },
  status: { type: String, default: 'COMPLETED' }
}, { _id: false });

const improvementItemSchema = new Schema<IImprovementItem>({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  source: { type: String, default: '' },
  evidence: { type: String, default: '' },
  priority: { type: String, default: 'MEDIUM' }
}, { _id: false });

const aiAnalysisSchema = new Schema<IAIAnalysisDoc>({
  candidateId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  submissionId: { type: Schema.Types.ObjectId, required: true },
  reviewId: { type: Schema.Types.ObjectId, ref: 'ExpertReview', required: true },
  track: { type: String, enum: ['TECHNICAL', 'NON_TECHNICAL'], required: true },
  analysisStatus: {
    type: String,
    enum: ['COMPLETED', 'INSUFFICIENT_EVIDENCE', 'ANALYSIS_UNAVAILABLE'],
    default: 'COMPLETED'
  },
  overallScore: { type: Number, default: null },
  scoreScale: { type: Number, default: 10 },
  dimensionScores: [dimensionScoreSchema],
  scoreCalculation: {
    method: { type: String, default: 'weighted_average' },
    weights: { type: Schema.Types.Mixed, default: {} }
  },
  strengths: [{ type: String }],
  weaknesses: [{ type: String }],
  improvements: [improvementItemSchema],
  evidenceUsed: [{ type: String }],
  demonstratedCapabilities: [{ type: String }],
  supportingEvidence: [{
    claim: String,
    source: String,
    citation: String
  }],
  missingEvidence: [{
    requirement: String,
    missingReason: String
  }],
  manualVerificationChecklist: [{ type: String }]
}, { timestamps: true });

// Scoped index to ensure analysis is uniquely mapped to review and submission
aiAnalysisSchema.index({ reviewId: 1 }, { unique: true });
aiAnalysisSchema.index({ submissionId: 1, candidateId: 1 });

export default mongoose.model<IAIAnalysisDoc>('AIAnalysis', aiAnalysisSchema);
