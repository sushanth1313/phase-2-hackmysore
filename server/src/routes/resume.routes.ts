import { Router } from 'express';
import multer from 'multer';
import { 
  uploadResume, 
  getLatestResume, 
  getResumeById, 
  getResumeVersions, 
  setPrimaryResume,
  deleteResume,
  getLatestResumeAnalysis,
  getResumeAnalysisById
} from '../controllers/resume.controller';
import { protect } from '../middleware/auth.middleware';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

const router = Router();

// NOTE: Static named routes MUST come before /:id wildcard
router.post('/upload', protect, upload.single('resume'), uploadResume);
router.get('/latest', protect, getLatestResume);
router.get('/analysis', protect, getLatestResumeAnalysis);
router.get('/versions', protect, getResumeVersions);
router.get('/reports', protect, getResumeVersions);  // alias for frontend compat
router.put('/:id/primary', protect, setPrimaryResume);
router.delete('/:id', protect, deleteResume);
router.get('/:id/analysis', protect, getResumeAnalysisById);
router.get('/:id', protect, getResumeById);

export default router;
