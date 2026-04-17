import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { postWeeklyInsight } from '../controllers/aiController.js';
import askHandler from '../../../api/ai/ask.js';

const router = Router();

router.post('/weekly-insight', authenticateToken, postWeeklyInsight);

// ask reuses the same handler as the Vercel serverless function
// it does its own auth internally via Bearer header
router.post('/ask', askHandler);

export default router;
