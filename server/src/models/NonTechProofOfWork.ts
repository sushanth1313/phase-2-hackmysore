import mongoose from 'mongoose';

export interface IArtifactFile {
  fileName: string;
  fileUrl: string;
  filePath?: string;
  fileSize: number;
  mimeType: string;
  extractedText?: string;
}

export interface INonTechAnalysis {
  problemUnderstanding: number;
  researchInsight: number;
  strategy: number;
  execution: number;
  creativity: number;
  communication: number;
  completeness: number;
  roleRelevance: number;
  overallScore: number;
  summary: string;
  strengths: string[];
  recommendations: string[];
  evaluationDimensions?: Array<{
    dimension: string;
    score: number;
    feedback: string;
  }>;
  verifiedSkills?: string[];
}

export interface INonTechProofOfWork extends mongoose.Document {
  candidate: mongoose.Types.ObjectId;
  candidateId?: string;
  track: 'NON_TECHNICAL';
  careerArea: string;
  targetRole?: string;
  challenge?: mongoose.Types.ObjectId;
  challengeId?: string;

  title: string;
  submissionType: string;

  description: string;
  deliverables?: string;
  notes?: string;

  artifactFiles: IArtifactFile[];
  externalWorkUrl?: string;
  externalWorkType?: string;

  status: 'SUBMITTED' | 'VERIFIED' | 'COMPLETED' | 'UNDER_REVIEW' | 'NEEDS_RESUBMISSION' | 'INVALID_SUBMISSION' | 'INSUFFICIENT_EVIDENCE' | 'NEEDS_REVIEW' | 'PARTIALLY_VERIFIED';
  statusReason?: string;

  nonTechAnalysis?: INonTechAnalysis | null;
  expertReviewId?: mongoose.Types.ObjectId;

  submittedAt: Date;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const nonTechProofOfWorkSchema = new mongoose.Schema({
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  candidateId: { type: String },
  track: { 
    type: String, 
    enum: ['NON_TECHNICAL'], 
    default: 'NON_TECHNICAL', 
    required: true,
    immutable: true 
  },
  careerArea: { type: String, required: true },
  targetRole: { type: String, default: '' },
  challenge: { type: mongoose.Schema.Types.ObjectId, ref: 'Challenge' },
  challengeId: { type: String },

  title: { type: String, required: true },
  submissionType: { 
    type: String, 
    enum: [
      'CASE_STUDY',
      'BUSINESS_DOCUMENT',
      'MARKETING_PLAN',
      'CAMPAIGN_STRATEGY',
      'MARKET_RESEARCH',
      'CONTENT_STRATEGY',
      'SEO_SEM_PLAN',
      'BRAND_STRATEGY',
      'CAMPAIGN_ANALYSIS',
      'SALES_PLAYBOOK',
      'LEAD_GENERATION_STRATEGY',
      'MARKET_EXPANSION_PLAN',
      'CUSTOMER_DISCOVERY',
      'SALES_ANALYSIS',
      'HR_CASE_STUDY',
      'RECRUITMENT_STRATEGY',
      'EMPLOYEE_ENGAGEMENT_PLAN',
      'HIRING_PROCESS_PROPOSAL',
      'PEOPLE_OPERATIONS_ANALYSIS',
      'BUSINESS_ANALYSIS',
      'BUSINESS_CASE',
      'REQUIREMENTS_DOCUMENT',
      'PROCESS_ANALYSIS',
      'DATA_INSIGHT_REPORT',
      'UI_UX_CASE_STUDY',
      'RESEARCH_REPORT',
      'WIREFRAME_PROTOTYPE',
      'DESIGN_SYSTEM',
      'USABILITY_ANALYSIS',
      'CONTENT_PORTFOLIO',
      'EDITORIAL_PLAN',
      'CONTENT_SAMPLE',
      'PRESENTATION',
      'STRATEGY_DOCUMENT',
      'WORK_SAMPLE',
      'EXTERNAL_WORK_LINK'
    ],
    required: true 
  },

  description: { type: String, default: '' },
  deliverables: { type: String, default: '' },
  notes: { type: String, default: '' },

  artifactFiles: [{
    fileName: { type: String },
    fileUrl: { type: String },
    filePath: { type: String },
    fileSize: { type: Number },
    mimeType: { type: String },
    extractedText: { type: String }
  }],

  externalWorkUrl: { type: String, default: '' },
  externalWorkType: { 
    type: String, 
    enum: ['PORTFOLIO', 'CASE_STUDY', 'CAMPAIGN', 'DOCUMENT', 'PRESENTATION', 'DESIGN', 'CONTENT', 'BUSINESS_WORK', 'OTHER', ''],
    default: ''
  },

  status: {
    type: String,
    enum: [
      'SUBMITTED', 
      'VERIFIED', 
      'COMPLETED', 
      'UNDER_REVIEW', 
      'NEEDS_RESUBMISSION', 
      'INVALID_SUBMISSION', 
      'INSUFFICIENT_EVIDENCE', 
      'NEEDS_REVIEW', 
      'PARTIALLY_VERIFIED'
    ],
    default: 'SUBMITTED'
  },
  statusReason: { type: String, default: '' },

  nonTechAnalysis: {
    problemUnderstanding: { type: Number },
    researchInsight: { type: Number },
    strategy: { type: Number },
    execution: { type: Number },
    creativity: { type: Number },
    communication: { type: Number },
    completeness: { type: Number },
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

  expertReviewId: { type: mongoose.Schema.Types.ObjectId, ref: 'Review' },
  submittedAt: { type: Date, default: Date.now },
  verifiedAt: { type: Date }
}, { timestamps: true });

nonTechProofOfWorkSchema.index({ candidate: 1, status: 1 });
nonTechProofOfWorkSchema.index({ challenge: 1, candidate: 1 });
nonTechProofOfWorkSchema.index({ careerArea: 1 });

export default mongoose.model<INonTechProofOfWork>('NonTechProofOfWork', nonTechProofOfWorkSchema);
