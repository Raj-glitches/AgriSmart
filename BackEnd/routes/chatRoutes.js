import express from 'express';
import {
  getMyChats,
  createChat,
  getMessages,
  sendMessage,
  getChatUsers,
  markAsRead,
} from '../controllers/chatController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getMyChats);
router.post('/', createChat);
router.get('/users', getChatUsers);
router.get('/:chatId/messages', getMessages);
router.post('/:chatId/messages', sendMessage);
router.put('/:chatId/read', markAsRead);

export default router;

