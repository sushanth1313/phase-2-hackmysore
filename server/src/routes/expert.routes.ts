import { Router } from 'express';
import {
  getExpertDashboard,
  getAssignedReviews,
  getReviewById,
  getEvidenceContext,
  submitReview,
  getReviewHistory,
  getHistoricalReview,
  getExpertProfile,
  updateExpertProfile,
  assignReview,
  assignMe,
  analyzeReviewEvidence,
  addReviewSuggestion,
  removeReviewSuggestion,
  updateReviewSuggestion,
  getUnassignedSubmissions,
  getAvailableSubmissions,
  // Legacy aliases
  getReviewQueue,
  getExpertHistory
} from '../controllers/expert.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

// All expert routes require authentication and EXPERT or ADMIN role
router.use(protect);
router.use(authorize('EXPERT', 'ADMIN'));

// ─── Dashboard ────────────────────────────────────────────────────────────────
router.get('/dashboard', getExpertDashboard);

// ─── Available Submissions (Phase 9 & 28) ────────────────────────────────────
router.get('/submissions', getAvailableSubmissions);
router.get('/submissions/available', getAvailableSubmissions);
router.get('/unassigned', getUnassignedSubmissions);
router.post('/submissions/:submissionId/assign-me', assignMe);
router.post('/assign-me', assignMe);

// ─── Assigned / Pending Reviews ───────────────────────────────────────────────
router.get('/reviews', getAssignedReviews);
router.get('/reviews/assigned', getAssignedReviews);
router.get('/reviews/:reviewId', getReviewById);
router.get('/reviews/:reviewId/context', getEvidenceContext);
router.get('/reviews/:reviewId/evidence', getEvidenceContext);
router.post('/reviews/:reviewId/analyze', analyzeReviewEvidence);
router.post('/reviews/:reviewId/suggestions', addReviewSuggestion);
router.delete('/reviews/:reviewId/suggestions/:suggestionId', removeReviewSuggestion);
router.patch('/reviews/:reviewId/suggestions/:suggestionId', updateReviewSuggestion);
router.post('/reviews/:reviewId/submit', submitReview);
router.post('/reviews/:reviewId/complete', submitReview);

// ─── Review History ───────────────────────────────────────────────────────────
router.get('/review-history', getReviewHistory);
router.get('/review-history/:reviewId', getHistoricalReview);

// ─── Expert Profile ───────────────────────────────────────────────────────────
router.get('/profile', getExpertProfile);
router.patch('/profile', updateExpertProfile);

// ─── Assignment (Admin/Expert) ────────────────────────────────────────────────
router.post('/assign', assignReview);

// ─── Legacy endpoints (kept for backward compat with old frontend) ─────────────
router.get('/queue', getReviewQueue);
router.get('/history', getExpertHistory);

export default router;
