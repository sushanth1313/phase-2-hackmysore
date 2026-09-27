import mongoose from 'mongoose';

const practiceQuestionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  difficulty: { 
    type: String, 
    enum: ['EASY', 'MEDIUM', 'HARD'],
    required: true 
  },
  category: { 
    type: String, 
    enum: ['DSA', 'BACKEND', 'FRONTEND', 'DATABASE', 'SYSTEM_DESIGN', 'ML', 'DEVOPS', 'DEBUGGING', 'REAL_WORLD'],
    required: true 
  },
  skills: [String],
  constraints: [String],
  examples: [{
    input: String,
    output: String,
    explanation: String
  }],
  starterCode: { type: mongoose.Schema.Types.Mixed }, // { language: code }
  hints: [String],
  status: { type: String, enum: ['ACTIVE', 'ARCHIVED'], default: 'ACTIVE' }
}, { timestamps: true });

practiceQuestionSchema.index({ category: 1, difficulty: 1 });
practiceQuestionSchema.index({ skills: 1 });

const practiceAttemptSchema = new mongoose.Schema({
  question: { type: mongoose.Schema.Types.ObjectId, ref: 'PracticeQuestion', required: true },
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  code: { type: String },
  language: { type: String },
  
  status: { 
    type: String, 
    enum: ['IN_PROGRESS', 'SUBMITTED', 'PASSED', 'FAILED'],
    default: 'IN_PROGRESS'
  },
  
  // Execution results (if sandbox is available)
  executionResult: {
    status: String,
    output: String,
    error: String,
    executionTime: Number,
    memoryUsed: Number
  },
  
  // Analytical feedback (non-execution)
  analysisFeedback: { type: String },
  
  submittedAt: { type: Date }
}, { timestamps: true });

practiceAttemptSchema.index({ candidate: 1, question: 1 });
practiceAttemptSchema.index({ candidate: 1 });

export const PracticeQuestion = mongoose.model('PracticeQuestion', practiceQuestionSchema);
export const PracticeAttempt = mongoose.model('PracticeAttempt', practiceAttemptSchema);
