import { Router } from 'express';
import {
  getPracticeChallenges,
  getPracticeChallengeById,
  runPracticeTests,
  submitPracticeSolution,
  getSubmissionHistory,
  getCandidatePracticeEvidence,
  getCandidatePracticeStats,
  createPracticeChallenge,
  updatePracticeChallenge,
  deletePracticeChallenge
} from '../controllers/technicalPractice.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

// All technical practice routes require authentication
router.use(protect);

// ─── Candidate & General Access ──────────────────────────────────────────────
router.get('/stats', getCandidatePracticeStats);
router.get('/challenges', getPracticeChallenges);
router.get('/challenges/:id', getPracticeChallengeById);
router.get('/challenges/:id/history', getSubmissionHistory);
router.post('/challenges/:id/run', authorize('CANDIDATE', 'ADMIN'), runPracticeTests);
router.post('/challenges/:id/submit', authorize('CANDIDATE', 'ADMIN'), submitPracticeSolution);

// Evidence routes
router.get('/evidence', getCandidatePracticeEvidence);
router.get('/evidence/:candidateId', authorize('CANDIDATE', 'RECRUITER', 'ADMIN'), getCandidatePracticeEvidence);

// ─── Admin Only Management ───────────────────────────────────────────────────
router.post('/challenges', authorize('ADMIN'), createPracticeChallenge);
router.put('/challenges/:id', authorize('ADMIN'), updatePracticeChallenge);
router.delete('/challenges/:id', authorize('ADMIN'), deletePracticeChallenge);

export default router;
