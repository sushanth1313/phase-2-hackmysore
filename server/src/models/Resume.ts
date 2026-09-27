import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resumeId: { type: String },
  fileName: { type: String, required: true },
  fileSize: { type: Number, required: true },
  mimeType: { type: String, required: true },
  fileHash: { type: String, required: true },
  filePath: { type: String, default: '' },
  isPrimary: { type: Boolean, default: false },
  // Explicit document domain — prevents Proof of Work PDFs being treated as Resume
  // RESUME = uploaded via /api/candidate/resume
  // PROOF_OF_WORK = uploaded via /api/candidate/proof-of-work (NOT stored in this collection)
  documentType: {
    type: String,
    enum: ['RESUME', 'PROOF_OF_WORK', 'CERTIFICATE', 'PORTFOLIO', 'OTHER'],
    default: 'RESUME'
  },
  status: { type: String, default: 'Uploaded' },
  analysisStatus: { 
    type: String, 
    enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'], 
    default: 'COMPLETED' 
  },
  extractedText: { type: String, default: '' },
  version: { type: String, default: 'v1.0' },
  track: { type: String, enum: ['TECHNICAL', 'NON_TECHNICAL'], default: 'TECHNICAL' },
  careerArea: { type: String, default: '' },
  atsScore: { type: Number },
  roleRelevanceScore: { type: Number },
  detectedSkills: [{ type: String }],       // All skills found in resume — NOT verified
  roleRelevantSkills: [{ type: String }],   // Skills matching the selected careerArea — NOT verified
  otherDetectedSkills: [{ type: String }],  // Skills outside careerArea (e.g. Java for Marketing) — informational only
  missingRoleSkills: [{ type: String }],
  
  // High-priority Phase 6: Score out of 10
  score10: { type: Number, default: 7.5 },
  scoreBreakdown: {
    atsCompatibility: { type: Number, default: 1.6 }, // out of 2
    skillsRelevance: { type: Number, default: 1.5 },  // out of 2
    projectQuality: { type: Number, default: 1.5 },   // out of 2
    experience: { type: Number, default: 1.5 },       // out of 2
    clarityStructure: { type: Number, default: 1.4 }  // out of 2
  },

  // High-priority Phase 7: AI-Assistance Signal Analysis
  aiAssistanceSignals: {
    category: { 
      type: String, 
      enum: ['LOW AI-ASSISTANCE SIGNAL', 'MEDIUM AI-ASSISTANCE SIGNAL', 'HIGH AI-ASSISTANCE SIGNAL', 'INSUFFICIENT EVIDENCE'],
      default: 'LOW AI-ASSISTANCE SIGNAL'
    },
    confidence: { type: String, default: 'Moderate' },
    evidence: [{ type: String }],
    summary: { type: String, default: '' }
  },

  // Phase 5 Fields
  skills: [{ type: String }],
  experience: [{ type: mongoose.Schema.Types.Mixed }],
  education: [{ type: mongoose.Schema.Types.Mixed }],
  projects: [{ type: mongoose.Schema.Types.Mixed }],
  certifications: [{ type: String }],
  strengths: [{ type: String }],
  weaknesses: [{ type: String }],
  missingKeywords: [{ type: String }],
  formattingIssues: [{ type: String }],
  recommendations: [{ type: String }],

  integrity: {
    fingerprint: { type: String, required: true },
    candidateId: { type: String, required: true },
    version: { type: String, default: 'v1.0 (Immutable)' },
    timestamp: { type: Date, default: Date.now },
    status: { type: String, enum: ['VERIFIED', 'UNDER_REVIEW', 'FLAGGED'], default: 'VERIFIED' }
  },
  scores: {
    atsScore: { type: Number, default: 0 },
    technicalMatchScore: { type: Number, default: 0 },
    impactMetricsScore: { type: Number, default: 0 },
    completenessScore: { type: Number, default: 0 },
    overallScore: { type: Number, default: 0 }
  },
  aiWritingIndicator: {
    percentage: { type: Number, default: 0 },
    confidence: { type: String, default: 'Medium' },
    signalsDetected: [{ type: String }],
    summary: { type: String, default: '' }
  },
  technicalEvidence: {
    matchedSkills: [{ type: String }],
    unverifiedClaims: [{ type: String }],
    detectedTechnologies: [{ type: String }],
    extractedProjects: [{
      title: { type: String },
      description: { type: String },
      technologies: [{ type: String }]
    }]
  },
  improvementSuggestions: [{ type: String }]
}, { timestamps: true });

resumeSchema.index({ user: 1, createdAt: -1 });
resumeSchema.index({ candidateId: 1 });

export default mongoose.model('Resume', resumeSchema);
