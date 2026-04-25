import express from 'express';
import { chatWithAI, getAIStatus } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public status check
router.get('/status', getAIStatus);

// Protected chat endpoint
router.post('/chat', protect, chatWithAI);

export default router;

