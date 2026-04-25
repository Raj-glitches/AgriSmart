import express from 'express';
import {
  getMyCrops,
  getCrop,
  createCrop,
  updateCrop,
  deleteCrop,
  addExpense,
  getRecommendations,
  getCropAnalytics,
} from '../controllers/cropController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Public/crop recommendation (needs location)
router.get('/recommendations', protect, getRecommendations);

// Protected farmer routes
router.use(protect, authorize('farmer', 'admin'));

router.get('/', getMyCrops);
router.get('/analytics', getCropAnalytics);
router.post('/', createCrop);
router.get('/:id', getCrop);
router.put('/:id', updateCrop);
router.delete('/:id', deleteCrop);
router.post('/:id/expenses', addExpense);

export default router;

