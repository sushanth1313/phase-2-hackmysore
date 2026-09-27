import mongoose, { Document, Schema } from 'mongoose';

export interface IParameter {
  name: string;
  type: string;
}

export interface ITestCase {
  _id?: mongoose.Types.ObjectId;
  label?: string;
  args: any[];
  expectedReturn: any;
  isHidden?: boolean;
  explanation?: string;
}

export interface ICodingChallenge extends Document {
  title: string;
  slug: string;
  description: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  category: 'DSA' | 'BACKEND' | 'SYSTEMS' | 'CONCURRENCY' | 'ALGORITHMS';
  allowedLanguages: string[];
  functionName: string;
  parameters: IParameter[];
  returnType: string;
  starterCode: {
    java?: string;
    python?: string;
    javascript?: string;
    cpp?: string;
    [key: string]: string | undefined;
  };
  constraints: string[];
  hints: string[];
  testCases: ITestCase[];
  timeLimitMs: number;
  memoryLimitMb: number;
  status: 'ACTIVE' | 'ARCHIVED';
  createdBy?: mongoose.Types.ObjectId;
  verifiedSubmissions: number;
  createdAt: Date;
  updatedAt: Date;
}

const testCaseSchema = new Schema<ITestCase>({
  label: { type: String, default: '' },
  args: { type: Schema.Types.Mixed, default: [] },
  expectedReturn: { type: Schema.Types.Mixed, required: true },
  isHidden: { type: Boolean, default: false },
  explanation: { type: String, default: '' }
}, { _id: true });

const codingChallengeSchema = new Schema<ICodingChallenge>({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  difficulty: { 
    type: String, 
    enum: ['EASY', 'MEDIUM', 'HARD'], 
    required: true 
  },
  category: { 
    type: String, 
    enum: ['DSA', 'BACKEND', 'SYSTEMS', 'CONCURRENCY', 'ALGORITHMS'],
    default: 'DSA' 
  },
  allowedLanguages: { 
    type: [String], 
    default: ['java', 'python', 'javascript', 'cpp'] 
  },
  functionName: { type: String, required: true },
  parameters: [{
    name: { type: String, required: true },
    type: { type: String, required: true }
  }],
  returnType: { type: String, required: true },
  starterCode: { 
    type: Map, 
    of: String,
    default: {} 
  },
  constraints: { type: [String], default: [] },
  hints: { type: [String], default: [] },
  testCases: [testCaseSchema],
  timeLimitMs: { type: Number, default: 5000 },
  memoryLimitMb: { type: Number, default: 256 },
  status: { 
    type: String, 
    enum: ['ACTIVE', 'ARCHIVED'], 
    default: 'ACTIVE' 
  },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  verifiedSubmissions: { type: Number, default: 0 }
}, { timestamps: true });

codingChallengeSchema.index({ status: 1, difficulty: 1 });

export default mongoose.model<ICodingChallenge>('CodingChallenge', codingChallengeSchema);
