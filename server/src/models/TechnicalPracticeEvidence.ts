import mongoose, { Document, Schema } from 'mongoose';

export interface ITechnicalPracticeEvidence extends Document {
  candidate: mongoose.Types.ObjectId;
  challenge: mongoose.Types.ObjectId;
  submission: mongoose.Types.ObjectId;
  challengeTitle: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  category: string;
  language: string;
  testsPassed: number;
  testsTotal: number;
  passRate: number; // 0.0 - 1.0
  status: 'PASSED' | 'PARTIAL';
  verificationStatus: 'VERIFIED';
  skillsDemonstrated: string[];
  metrics: {
    executionTimeMs: number;
    memoryMb?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const technicalPracticeEvidenceSchema = new Schema<ITechnicalPracticeEvidence>({
  candidate: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  challenge: { type: Schema.Types.ObjectId, ref: 'CodingChallenge', required: true },
  submission: { type: Schema.Types.ObjectId, ref: 'CodingSubmission', required: true },
  challengeTitle: { type: String, required: true },
  difficulty: { type: String, enum: ['EASY', 'MEDIUM', 'HARD'], required: true },
  category: { type: String, required: true },
  language: { type: String, required: true },
  testsPassed: { type: Number, required: true },
  testsTotal: { type: Number, required: true },
  passRate: { type: Number, required: true },
  status: { type: String, enum: ['PASSED', 'PARTIAL'], required: true },
  verificationStatus: { type: String, enum: ['VERIFIED'], default: 'VERIFIED' },
  skillsDemonstrated: { type: [String], default: [] },
  metrics: {
    executionTimeMs: { type: Number, default: 0 },
    memoryMb: { type: Number, default: 0 }
  }
}, { timestamps: true });

technicalPracticeEvidenceSchema.index({ candidate: 1, challenge: 1 });
technicalPracticeEvidenceSchema.index({ candidate: 1, createdAt: -1 });
technicalPracticeEvidenceSchema.index({ language: 1 });

export default mongoose.model<ITechnicalPracticeEvidence>('TechnicalPracticeEvidence', technicalPracticeEvidenceSchema);
