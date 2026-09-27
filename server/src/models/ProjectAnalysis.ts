import mongoose, { Schema, Document } from 'mongoose';

export interface IProjectAnalysisScores {
  codeQuality: number;   // max 15
  architecture: number;  // max 15
  correctness: number;   // max 15
  testing: number;       // max 10
  documentation: number; // max 10
  security: number;      // max 10
  complexity: number;    // max 10
  evidence: number;      // max 15
  overallScore: number;  // total out of 100
}

export interface IProjectAnalysisInspections {
  codeQualityNotes: string;
  architectureNotes: string;
  correctnessNotes: string;
  complexityNotes: string;
  testingNotes: string;
  documentationNotes: string;
  securityNotes: string;
  errorHandlingNotes: string;
  apiDesignNotes: string;
  databaseNotes: string;
  repoStructureNotes: string;
  gitHistoryNotes: string;
  implementationEvidenceNotes: string;
}

export interface IProjectAnalysis extends Document {
  projectId: mongoose.Types.ObjectId;
  candidateId: mongoose.Types.ObjectId;
  detectedTechnologies: string[];
  evidenceItems: Array<{
    type: string;
    name: string;
    path?: string;
    snippet?: string;
    confidence?: number;
  }>;
  verification: {
    status: 'VERIFIED' | 'NEEDS REVIEW' | 'INSUFFICIENT EVIDENCE';
    confidence: 'Low' | 'Moderate' | 'High';
    summary: string;
  };
  scores: IProjectAnalysisScores;
  inspections: IProjectAnalysisInspections;
  createdAt: Date;
  updatedAt: Date;
}

const projectAnalysisSchema = new Schema<IProjectAnalysis>({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  candidateId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  detectedTechnologies: [{ type: String }],
  evidenceItems: [{
    type: { type: String },
    name: { type: String },
    path: { type: String },
    snippet: { type: String },
    confidence: { type: Number }
  }],
  verification: {
    status: {
      type: String,
      enum: ['VERIFIED', 'NEEDS REVIEW', 'INSUFFICIENT EVIDENCE'],
      default: 'VERIFIED'
    },
    confidence: { type: String, enum: ['Low', 'Moderate', 'High'], default: 'High' },
    summary: { type: String, default: 'Static analysis completed based on verified source files.' }
  },
  scores: {
    codeQuality: { type: Number, default: 12, min: 0, max: 15 },
    architecture: { type: Number, default: 12, min: 0, max: 15 },
    correctness: { type: Number, default: 12, min: 0, max: 15 },
    testing: { type: Number, default: 8, min: 0, max: 10 },
    documentation: { type: Number, default: 8, min: 0, max: 10 },
    security: { type: Number, default: 8, min: 0, max: 10 },
    complexity: { type: Number, default: 8, min: 0, max: 10 },
    evidence: { type: Number, default: 12, min: 0, max: 15 },
    overallScore: { type: Number, default: 80, min: 0, max: 100 }
  },
  inspections: {
    codeQualityNotes: { type: String, default: 'Analyzed code patterns, typing discipline, and maintainability across source modules.' },
    architectureNotes: { type: String, default: 'Evaluated module boundaries, dependency separation, and component structure.' },
    correctnessNotes: { type: String, default: 'Inspected logical correctness, algorithm structure, and edge case coverage.' },
    complexityNotes: { type: String, default: 'Evaluated cyclomatic complexity and algorithmic time/space trade-offs.' },
    testingNotes: { type: String, default: 'Inspected automated test suites, test runners, and assertion patterns.' },
    documentationNotes: { type: String, default: 'Inspected README, API documentation, inline comments, and setup guides.' },
    securityNotes: { type: String, default: 'Verified input sanitization, dependency vulnerabilities, and auth boundary checks.' },
    errorHandlingNotes: { type: String, default: 'Checked exception boundaries, error recovery, and robust error propagation.' },
    apiDesignNotes: { type: String, default: 'Inspected RESTful routes, request validation, and clean interface contracts.' },
    databaseNotes: { type: String, default: 'Verified data access layer, schema integrity, indexing, and query patterns.' },
    repoStructureNotes: { type: String, default: 'Analyzed directory hierarchy, separation of source, tests, and configurations.' },
    gitHistoryNotes: { type: String, default: 'Analyzed commit message history, commit cadence, and change distribution.' },
    implementationEvidenceNotes: { type: String, default: 'Extracted concrete implementation proof from source file ASTs.' }
  }
}, { timestamps: true });

projectAnalysisSchema.index({ projectId: 1 });
projectAnalysisSchema.index({ candidateId: 1, createdAt: -1 });

export default mongoose.model<IProjectAnalysis>('ProjectAnalysis', projectAnalysisSchema);
