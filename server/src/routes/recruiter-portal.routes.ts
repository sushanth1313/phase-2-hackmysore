import { Router } from 'express';
import { 
  createJob, 
  getJobs, 
  updateJob, 
  deleteJob, 
  addToShortlist, 
  getShortlist, 
  removeFromShortlist, 
  getCandidateProfile,
  getJobApplications,
  updateApplicationStage
} from '../controllers/jobs.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();
router.use(protect);
router.use(authorize('RECRUITER', 'ADMIN'));

// Jobs
router.get('/jobs', getJobs);
router.post('/jobs', createJob);
router.put('/jobs/:id', updateJob);
router.delete('/jobs/:id', deleteJob);

// Hiring Pipeline & Applications
router.get('/applications', getJobApplications);
router.patch('/applications/:id/stage', updateApplicationStage);

// Shortlists
router.get('/shortlists', getShortlist);
router.post('/shortlists', addToShortlist);
router.delete('/shortlists/:id', removeFromShortlist);

// Candidate profiles
router.get('/candidates/:candidateId', getCandidateProfile);

export default router;
