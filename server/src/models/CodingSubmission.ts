import mongoose, { Document, Schema } from 'mongoose';

export type TestCaseFailureReason = 'passed' | 'compile' | 'timeout' | 'crash' | 'wrong_output' | 'memory';

export interface ITestCaseResult {
  testCaseId?: string;
  label?: string;
  args?: any[];
  expectedReturn?: any;
  actualOutput?: string;
  stderr?: string;
  exitCode?: number;
  passed: boolean;
  failureReason: TestCaseFailureReason;
  executionTimeMs: number;
}

export interface ICodingSubmission extends Document {
  candidate: mongoose.Types.ObjectId;
  challenge: mongoose.Types.ObjectId;
  language: 'java' | 'python' | 'javascript' | 'cpp';
  code: string;
  status: 'PASSED' | 'FAILED' | 'ERROR';
  passedTests: number;
  totalTests: number;
  executionTimeMs: number;
  testResults: ITestCaseResult[];
  evidenceGenerated: boolean;
  evidenceId?: mongoose.Types.ObjectId;
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const testCaseResultSchema = new Schema<ITestCaseResult>({
  testCaseId: { type: String },
  label: { type: String, default: '' },
  args: { type: [Schema.Types.Mixed], default: [] },
  expectedReturn: { type: Schema.Types.Mixed },
  actualOutput: { type: String, default: '' },
  stderr: { type: String, default: '' },
  exitCode: { type: Number, default: 0 },
  passed: { type: Boolean, required: true },
  failureReason: { 
    type: String, 
    enum: ['passed', 'compile', 'timeout', 'crash', 'wrong_output', 'memory'], 
    default: 'passed' 
  },
  executionTimeMs: { type: Number, default: 0 }
}, { _id: false });

const codingSubmissionSchema = new Schema<ICodingSubmission>({
  candidate: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  challenge: { type: Schema.Types.ObjectId, ref: 'CodingChallenge', required: true },
  language: { 
    type: String, 
    enum: ['java', 'python', 'javascript', 'cpp'], 
    required: true 
  },
  code: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['PASSED', 'FAILED', 'ERROR'], 
    required: true 
  },
  passedTests: { type: Number, required: true, default: 0 },
  totalTests: { type: Number, required: true, default: 0 },
  executionTimeMs: { type: Number, default: 0 },
  testResults: [testCaseResultSchema],
  evidenceGenerated: { type: Boolean, default: false },
  evidenceId: { type: Schema.Types.ObjectId, ref: 'TechnicalPracticeEvidence' },
  submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });

codingSubmissionSchema.index({ candidate: 1, challenge: 1 });
codingSubmissionSchema.index({ candidate: 1, createdAt: -1 });

export default mongoose.model<ICodingSubmission>('CodingSubmission', codingSubmissionSchema);
