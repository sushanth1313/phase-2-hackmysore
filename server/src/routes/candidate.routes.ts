import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { 
  getDashboardStats, 
  getCapabilities, 
  getReviews, 
  getCandidateExpertReviews,
  submitReview, 
  updateProfile,
  uploadProfilePhoto,
  getCandidateOwnProfile,
  getProofOfWork,
  submitCandidateProofOfWork
} from '../controllers/candidate.controller';
import { 
  discoverJobs, 
  getCompanies,
  applyToJob, 
  getCandidateApplications 
} from '../controllers/jobs.controller';
import { protect } from '../middleware/auth.middleware';
import { proofOfWorkUpload } from '../middleware/proofOfWorkUpload';

// Ensure uploads/photos directory exists
const photosDir = path.join(process.cwd(), 'uploads', 'photos');
if (!fs.existsSync(photosDir)) {
  fs.mkdirSync(photosDir, { recursive: true });
}

const photoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, photosDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `photo-${uniqueSuffix}${ext}`);
  }
});

const photoUpload = multer({
  storage: photoStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (PNG, JPG, JPEG, WEBP) are allowed'));
    }
  }
});

const router = Router();
router.use(protect);

router.get('/dashboard', getDashboardStats);
router.get('/capabilities', getCapabilities);
router.get('/profile', getCandidateOwnProfile);
router.patch('/profile', updateProfile);
router.put('/profile', updateProfile);
router.post('/profile/photo', photoUpload.single('photo'), uploadProfilePhoto);
router.get('/reviews', getReviews);
router.get('/expert-reviews', getCandidateExpertReviews);
router.post('/reviews', submitReview);
router.get('/proof-of-work', getProofOfWork);
router.post('/proof-of-work', proofOfWorkUpload.single('artifactFile'), submitCandidateProofOfWork);

// Opportunities & Applications
router.get('/jobs', discoverJobs);
router.get('/companies', getCompanies);
router.post('/jobs/:id/apply', applyToJob);
router.get('/applications', getCandidateApplications);

export default router;

