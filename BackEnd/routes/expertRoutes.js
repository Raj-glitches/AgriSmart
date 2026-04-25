import express from 'express';
import {
  createConsultation,
  getConsultations,
  getConsultation,
  respondToConsultation,
  updateConsultationStatus,
  rateConsultation,
  getExperts,
} from '../controllers/expertController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Public routes
router.get('/list', getExperts);

// Protected routes
router.use(protect);

router.get('/consultations', getConsultations);
router.post('/consultations', authorize('farmer', 'admin'), createConsultation);
router.get('/consultations/:id', getConsultation);
router.post('/consultations/:id/respond', authorize('expert', 'admin'), respondToConsultation);
router.put('/consultations/:id/status', updateConsultationStatus);
router.post('/consultations/:id/rate', authorize('farmer', 'admin'), rateConsultation);

export default router;

