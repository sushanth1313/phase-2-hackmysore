import { Router } from 'express';
import { 
  getChallenges,
  getChallengeById,
  acceptChallenge, 
  startChallenge, 
  submitChallenge, 
  getChallengeSubmissions 
} from '../controllers/challenge.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();
router.use(protect);

router.get('/', getChallenges);
router.get('/submissions', getChallengeSubmissions);
router.get('/:challengeId', getChallengeById);
router.post('/:challengeId/accept', acceptChallenge);
router.post('/:challengeId/start', startChallenge);
router.post('/:challengeId/submit', submitChallenge);

export default router;
