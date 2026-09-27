import { Router } from 'express';
import { uploadProject, getProjectStatus, getProjects, getProjectById, getProjectAnalysis } from '../controllers/project.controller';
import { protect } from '../middleware/auth.middleware';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB max
});

const router = Router();

router.get('/', protect, getProjects);
router.post('/upload', protect, upload.single('projectZip'), uploadProject);
router.get('/:id/analysis', protect, getProjectAnalysis);
router.get('/:id/status', protect, getProjectStatus);
router.get('/:id/analysis-status', protect, getProjectStatus);
router.get('/:id', protect, getProjectById);

export default router;

