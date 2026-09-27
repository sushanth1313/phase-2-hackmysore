import mongoose, { Schema, Document } from 'mongoose';

export interface IScoreBreakdown {
  atsCompatibility: number; // 0 - 2.0
  skillsRelevance: number;  // 0 - 2.0
  experience: number;       // 0 - 2.0
  projects: number;         // 0 - 2.0
  clarityStructure: number; // 0 - 2.0
}

export interface IAIAssistanceSignals {
  category: 'LOW AI-ASSISTANCE SIGNAL' | 'MEDIUM AI-ASSISTANCE SIGNAL' | 'HIGH AI-ASSISTANCE SIGNAL' | 'INSUFFICIENT EVIDENCE';
  confidence: 'Low' | 'Moderate' | 'High';
  evidence: string[];
  explanation: string;
}

export interface IDocumentMetadataSignals {
  creator?: string;
  producer?: string;
  creationDate?: string;
  modificationDate?: string;
  isSuspicious: boolean;
  signals: string[];
}

export interface IResumeAnalysis extends Document {
  resumeId: mongoose.Types.ObjectId | string;
  candidateId: mongoose.Types.ObjectId;
  track?: string;
  careerArea?: string;
  overallScore?: number;
  atsScore?: number;
  roleRelevanceScore?: number;
  experienceScore?: number;
  projectsScore?: number;
  clarityScore?: number;
  detectedSkills?: string[];
  roleRelevantSkills?: string[];
  otherDetectedSkills?: string[];   // Skills outside careerArea — informational only, never VERIFIED
  missingRoleSkills?: string[];
  strengths?: string[];
  weaknesses?: string[];
  score: number; // 0.0 - 10.0
  scoreBreakdown: IScoreBreakdown;
  skills: string[];
  experience: any[];
  education: any[];
  projects: any[];
  certifications: string[];
  atsAnalysis: {
    score: number;
    compatibility: number;
    findings: string[];
  };
  missingKeywords: string[];
  formatting: string[];
  recommendations: string[];
  aiAssistanceSignals: IAIAssistanceSignals;
  documentMetadataSignals: IDocumentMetadataSignals;
  createdAt: Date;
  updatedAt: Date;
}

const resumeAnalysisSchema = new Schema<IResumeAnalysis>({
  resumeId: { type: Schema.Types.Mixed, required: true, ref: 'Resume' },
  candidateId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  track: { type: String, enum: ['TECHNICAL', 'NON_TECHNICAL'], default: 'TECHNICAL' },
  careerArea: { type: String, default: '' },
  overallScore: { type: Number },
  atsScore: { type: Number },
  roleRelevanceScore: { type: Number },
  experienceScore: { type: Number },
  projectsScore: { type: Number },
  clarityScore: { type: Number },
  detectedSkills: [{ type: String }],
  roleRelevantSkills: [{ type: String }],
  otherDetectedSkills: [{ type: String }],
  missingRoleSkills: [{ type: String }],
  strengths: [{ type: String }],
  weaknesses: [{ type: String }],
  score: { type: Number, required: true, min: 0, max: 10 },
  scoreBreakdown: {
    atsCompatibility: { type: Number, default: 1.6, min: 0, max: 2 },
    skillsRelevance: { type: Number, default: 1.5, min: 0, max: 2 },
    experience: { type: Number, default: 1.5, min: 0, max: 2 },
    projects: { type: Number, default: 1.5, min: 0, max: 2 },
    clarityStructure: { type: Number, default: 1.4, min: 0, max: 2 }
  },
  skills: [{ type: String }],
  experience: [{ type: Schema.Types.Mixed }],
  education: [{ type: Schema.Types.Mixed }],
  projects: [{ type: Schema.Types.Mixed }],
  certifications: [{ type: String }],
  atsAnalysis: {
    score: { type: Number, default: 80 },
    compatibility: { type: Number, default: 1.6 },
    findings: [{ type: String }]
  },
  missingKeywords: [{ type: String }],
  formatting: [{ type: String }],
  recommendations: [{ type: String }],
  aiAssistanceSignals: {
    category: {
      type: String,
      enum: ['LOW AI-ASSISTANCE SIGNAL', 'MEDIUM AI-ASSISTANCE SIGNAL', 'HIGH AI-ASSISTANCE SIGNAL', 'INSUFFICIENT EVIDENCE'],
      default: 'LOW AI-ASSISTANCE SIGNAL'
    },
    confidence: { type: String, enum: ['Low', 'Moderate', 'High'], default: 'Moderate' },
    evidence: [{ type: String }],
    explanation: { type: String, default: '' }
  },
  documentMetadataSignals: {
    creator: { type: String, default: 'Standard Document Editor' },
    producer: { type: String, default: 'PDF Generator' },
    creationDate: { type: String, default: '' },
    modificationDate: { type: String, default: '' },
    isSuspicious: { type: Boolean, default: false },
    signals: [{ type: String }]
  }
}, { timestamps: true });

resumeAnalysisSchema.index({ candidateId: 1, createdAt: -1 });
resumeAnalysisSchema.index({ resumeId: 1 });

export default mongoose.model<IResumeAnalysis>('ResumeAnalysis', resumeAnalysisSchema);
