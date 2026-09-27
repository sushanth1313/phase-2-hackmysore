import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import authRoutes from './routes/auth.routes';
import projectRoutes from './routes/project.routes';
import resumeRoutes from './routes/resume.routes';
import candidateRoutes from './routes/candidate.routes';
import recruiterRoutes from './routes/recruiter.routes';
import recruiterPortalRoutes from './routes/recruiter-portal.routes';
import challengeRoutes from './routes/challenge.routes';
import messageRoutes from './routes/message.routes';
import interviewRoutes from './routes/interview.routes';
import technicalPracticeRoutes from './routes/technicalPractice.routes';
import expertRoutes from './routes/expert.routes';
import path from 'path';
import { errorHandler } from './middleware/error.middleware';

dotenv.config();

const app = express();

const allowedOrigins = process.env.FRONTEND_URL 
  ? [process.env.FRONTEND_URL]
  : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'];

const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', async (_req, res) => {
  const mongoState = mongoose.connection.readyState;
  // 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
  const mongoStatus = mongoState === 1 ? 'healthy' : mongoState === 2 ? 'connecting' : 'disconnected';

  let pythonStatus = 'unknown';
  try {
    const axios = await import('axios');
    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';
    const resp = await axios.default.get(`${pythonServiceUrl}/health`, { timeout: 2000 });
    pythonStatus = resp.data?.status === 'ok' ? 'healthy' : 'degraded';
  } catch {
    pythonStatus = 'unavailable';
  }

  const llmConfigured = !!(process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.GROQ_API_KEY);
  const githubConfigured = !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);

  const overall = mongoStatus === 'healthy' ? 'healthy' : 'degraded';

  res.status(overall === 'healthy' ? 200 : 503).json({
    status: overall,
    timestamp: new Date().toISOString(),
    services: {
      api: 'healthy',
      mongodb: mongoStatus,
      analyzer: pythonStatus,
      llm: llmConfigured ? 'configured' : 'not_configured',
      github: githubConfigured ? 'configured' : 'not_configured'
    }
  });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/project', projectRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/candidate', candidateRoutes);
app.use('/api/recruiter', recruiterRoutes);
app.use('/api/recruiter', recruiterPortalRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/candidate/challenges', challengeRoutes);
app.use('/api/practice', technicalPracticeRoutes);
app.use('/api/messaging', messageRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/expert', expertRoutes);

// ─── Error Handler ────────────────────────────────────────────────────────────
app.use(errorHandler);

export { app };
export default app;
