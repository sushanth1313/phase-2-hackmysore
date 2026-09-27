import mongoose from 'mongoose';

const interviewSessionSchema = new mongoose.Schema({
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  targetType: { 
    type: String, 
    enum: ['project', 'resume', 'job', 'PROJECT', 'RESUME', 'JOB'], 
    default: 'project' 
  },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
  resumeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume' },

  // C++ as primary coding language
  track: { 
    type: String, 
    enum: ['TECHNICAL', 'NON_TECHNICAL'], 
    default: 'TECHNICAL' 
  },
  careerArea: { type: String, default: '' },
  language: { type: String, default: 'C++' },
  domain: { type: String, default: 'General' },

  // Grounding context flags and summaries (NOT storing full resume analysis inside)
  groundingContext: {
    resumeLoaded: { type: Boolean, default: false },
    projectLoaded: { type: Boolean, default: false },
    jobLoaded: { type: Boolean, default: false },
    summary: { type: String, default: '' }
  },

  // Context loaded at interview start
  focus: { type: String, default: 'Distributed Systems' },
  targetLevel: { type: String, default: 'Senior (L5)' },
  detectedSkills: [String],
  
  status: { 
    type: String, 
    enum: ['IN_PROGRESS', 'COMPLETED', 'ABANDONED'],
    default: 'IN_PROGRESS'
  },
  
  turns: [{
    questionId: { type: String },
    question: { type: String, required: true },
    questionContext: { type: String },
    answer: { type: String },
    evaluation: {
      status: { 
        type: String, 
        enum: ['VALID', 'PARTIAL', 'INSUFFICIENT', 'IRRELEVANT'],
        default: 'VALID'
      },
      relevance: { type: Number, min: 0, max: 10, default: 0 },
      technical_accuracy: { type: Number, min: 0, max: 10, default: 0 },
      problem_solving: { type: Number, min: 0, max: 10, default: 0 },
      depth: { type: Number, min: 0, max: 10, default: 0 },
      communication: { type: Number, min: 0, max: 10, default: 0 },
      evidence: [{ type: String }],
      strengths: [{ type: String }],
      weaknesses: [{ type: String }],
      feedback: { type: String, default: '' },
      next_question_reason: { type: String, default: '' },
      
      // Backward-compatible fields
      score: { type: Number, min: 0, max: 10, default: 0 },
      technicalAccuracy: { type: Number, min: 0, max: 10, default: 0 },
      problemSolving: { type: Number, min: 0, max: 10, default: 0 },
      evidenceGrounding: { type: Number, min: 0, max: 10, default: 0 },
      domainKeywords: [{ type: String }],
      missingConcepts: [{ type: String }],
      recommendation: { type: String, default: '' },
      reasoning: { type: String, default: '' },
      improvements: [{ type: String }]
    },
    answeredAt: { type: Date }
  }],
  
  // Final report
  finalReport: {
    overallScore: { type: Number, min: 0, max: 100 },
    status: { type: String, default: 'SUFFICIENT' }, // 'SUFFICIENT' | 'INSUFFICIENT INTERVIEW EVIDENCE'
    technicalKnowledge: {
      score: { type: Number, default: 0 },
      evidence: { type: String, default: '' },
      explanation: { type: String, default: '' }
    },
    problemSolving: {
      score: { type: Number, default: 0 },
      evidence: { type: String, default: '' },
      explanation: { type: String, default: '' }
    },
    communication: {
      score: { type: Number, default: 0 },
      evidence: { type: String, default: '' },
      explanation: { type: String, default: '' }
    },
    architecture: {
      score: { type: Number, default: 0 },
      evidence: { type: String, default: '' },
      explanation: { type: String, default: '' }
    },
    depth: {
      score: { type: Number, default: 0 },
      evidence: { type: String, default: '' },
      explanation: { type: String, default: '' }
    },
    evidenceGrounding: {
      score: { type: Number, default: 0 },
      evidence: { type: String, default: '' },
      explanation: { type: String, default: '' }
    },
    strongAreas: [{ type: String }],
    weakAreas: [{ type: String }],
    unansweredQuestions: [{ type: String }],
    recommendedTopics: [{ type: String }],
    summary: { type: String, default: '' },
    generatedAt: { type: Date }
  },
  
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date }
}, { timestamps: true });

interviewSessionSchema.index({ candidate: 1, createdAt: -1 });
interviewSessionSchema.index({ candidateId: 1, createdAt: -1 });

export default mongoose.model('InterviewSession', interviewSessionSchema);
