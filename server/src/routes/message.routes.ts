import { Router } from 'express';
import { getConversations, getMessages, sendMessage, getUnreadCount } from '../controllers/message.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();
router.use(protect);

// GET /api/messaging — return conversations (frontend compat alias)
router.get('/', getConversations);
router.get('/conversations', getConversations);
router.get('/conversations/:conversationId/messages', getMessages);
router.get('/unread-count', getUnreadCount);
router.post('/messages', sendMessage);
router.post('/', sendMessage);

export default router;
