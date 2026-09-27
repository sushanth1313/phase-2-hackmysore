import { Router } from 'express';
import { 
  startInterview, 
  respondToTurn, 
  getInterviewHistory, 
  getInterviewSessionById 
} from '../controllers/interview.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();
router.use(protect);

router.get('/', getInterviewHistory);
router.get('/history', getInterviewHistory);
router.get('/:id', getInterviewSessionById);
router.post('/start', startInterview);
router.post('/:id/respond', respondToTurn);

export default router;
