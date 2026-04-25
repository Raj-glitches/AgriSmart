import express from 'express';
import {
  getUsers,
  getUser,
  updateProfile,
  uploadAvatar,
  updateUser,
  deleteUser,
  getUserStats,
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect); // All user routes require authentication

router.get('/profile', getUser);
router.put('/profile', updateProfile);
router.put('/avatar', uploadAvatar);
router.get('/stats', getUserStats);

// Admin only routes
router.get('/', authorize('admin'), getUsers);
router.get('/:id', authorize('admin'), getUser);
router.put('/:id', authorize('admin'), updateUser);
router.delete('/:id', authorize('admin'), deleteUser);

export default router;

