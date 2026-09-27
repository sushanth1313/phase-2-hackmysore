import os

base_dir = "server"

# Create directories
dirs = [
    "src/config",
    "src/controllers",
    "src/routes",
    "src/services",
    "src/models",
    "src/middleware",
    "src/validators",
    "src/utils",
    "src/jobs",
    "src/integrations"
]

for d in dirs:
    os.makedirs(os.path.join(base_dir, d), exist_ok=True)

files = {
    "package.json": """{
  "name": "proofhire-backend",
  "version": "1.0.0",
  "description": "ProofHire Node.js Express Backend",
  "main": "dist/server.js",
  "scripts": {
    "start": "node dist/server.js",
    "dev": "ts-node-dev --respawn --transpile-only src/server.ts",
    "build": "tsc"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "mongoose": "^8.2.1",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "multer": "^1.4.5-lts.1",
    "axios": "^1.6.8"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/jsonwebtoken": "^9.0.6",
    "@types/bcryptjs": "^2.4.6",
    "@types/multer": "^1.4.11",
    "@types/node": "^20.11.24",
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.4.2"
  }
}""",
    "tsconfig.json": """{
  "compilerOptions": {
    "target": "es2022",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}""",
    "src/server.ts": """import { app } from './app';
import { connectDB } from './config/db';

const PORT = process.env.PORT || 8080;

const startServer = async () => {
  await connectDB();
  
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
""",
    "src/app.ts": """import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import projectRoutes from './routes/project.routes';
import { errorHandler } from './middleware/error.middleware';

dotenv.config();

const app = express();

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);

// Error Handler
app.use(errorHandler);

export { app };
""",
    "src/config/db.ts": """import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/proofhire';
    await mongoose.connect(mongoUri);
    console.log('MongoDB Connected...');
  } catch (err: any) {
    console.error('Database connection error:', err.message);
    process.exit(1);
  }
};
""",
    "src/middleware/error.middleware.ts": """import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};
""",
    "src/routes/auth.routes.ts": """import { Router } from 'express';
import { register, login, logout, getMe } from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', protect, getMe);

export default router;
""",
    "src/routes/project.routes.ts": """import { Router } from 'express';
import { uploadProject, getProjectStatus } from '../controllers/project.controller';
import { protect } from '../middleware/auth.middleware';
import multer from 'multer';

const upload = multer({ dest: '/tmp/proofhire/uploads/' });
const router = Router();

router.post('/upload', protect, upload.single('projectZip'), uploadProject);
router.get('/:id/analysis-status', protect, getProjectStatus);

export default router;
""",
    "src/middleware/auth.middleware.ts": """import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      (req as any).user = await User.findById(decoded.id).select('-password');
      next();
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};
""",
    "src/models/User.ts": """import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['CANDIDATE', 'RECRUITER', 'ADMIN'], default: 'CANDIDATE' },
}, { timestamps: true });

export default mongoose.model('User', userSchema);
""",
    "src/models/Project.ts": """import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  projectName: { type: String, required: true },
  description: { type: String },
  problemStatement: { type: String },
  candidateRole: { type: String },
  claimedTechnologies: [String],
  githubUrl: { type: String },
  liveDemoUrl: { type: String },
  status: { type: String, enum: ['QUEUED', 'VALIDATING', 'ANALYZING', 'EXTRACTING_EVIDENCE', 'AI_ASSESSMENT', 'COMPLETED', 'FAILED'], default: 'QUEUED' },
  uploadPath: { type: String },
  analysisJobId: { type: String }
}, { timestamps: true });

export default mongoose.model('Project', projectSchema);
""",
    "src/controllers/auth.controller.ts": """import { Request, Response } from 'express';
import User from '../models/User';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });
};

export const register = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const user = await User.create({ firstName, lastName, email, password: hashedPassword, role });
    res.status(201).json({
      success: true,
      data: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        token: generateToken(user._id.toString())
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        success: true,
        data: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          token: generateToken(user._id.toString())
        }
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const logout = (req: Request, res: Response) => {
  // In a stateless JWT auth, logout is primarily a frontend action, 
  // but we can clear cookies if we were using them.
  res.json({ success: true, message: 'Logged out successfully' });
};

export const getMe = async (req: Request, res: Response) => {
  const user = (req as any).user;
  res.json({
    success: true,
    data: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role
    }
  });
};
""",
    "src/controllers/project.controller.ts": """import { Request, Response } from 'express';
import Project from '../models/Project';
import axios from 'axios';
import fs from 'fs';

export const uploadProject = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { projectName, description, problemStatement, candidateRole, claimedTechnologies, githubUrl, liveDemoUrl } = req.body;
    
    // File uploaded via multer is available at req.file
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: 'No project zip file uploaded' });
    }

    const project = await Project.create({
      user: user._id,
      projectName,
      description,
      problemStatement,
      candidateRole,
      claimedTechnologies: claimedTechnologies ? claimedTechnologies.split(',') : [],
      githubUrl,
      liveDemoUrl,
      status: 'QUEUED',
      uploadPath: file.path
    });
    
    // Asynchronously call Python service to analyze the project
    triggerAnalysis(project._id.toString(), file.path, user._id.toString());

    res.status(201).json({
      success: true,
      data: project
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getProjectStatus = async (req: Request, res: Response) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    
    res.json({
      success: true,
      data: {
        status: project.status
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

async function triggerAnalysis(projectId: string, filePath: string, userId: string) {
  try {
    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';
    
    // Inform Python service to start analysis
    await axios.post(`${pythonServiceUrl}/api/analyze`, {
      projectId,
      filePath,
      userId
    });
    
  } catch (error) {
    console.error(`Failed to trigger analysis for project ${projectId}:`, error);
    await Project.findByIdAndUpdate(projectId, { status: 'FAILED' });
  }
}
""",
    ".env": """PORT=8080
MONGO_URI=mongodb://localhost:27017/proofhire
JWT_SECRET=supersecretkey_proofhire
PYTHON_SERVICE_URL=http://localhost:8000
"""
}

for path, content in files.items():
    full_path = os.path.join(base_dir, path)
    with open(full_path, 'w', encoding='utf-8') as f:
        f.write(content)

