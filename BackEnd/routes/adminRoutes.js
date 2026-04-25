import express from 'express';
import {
  getDashboardStats,
  getAllUsers,
  toggleUserStatus,
  getAllProducts,
  getAllOrders,
  sendNotification,
  getReports,
} from '../controllers/adminController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

// All admin routes require admin role
router.use(protect, authorize('admin'));

router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.put('/users/:id/toggle-status', toggleUserStatus);
router.get('/products', getAllProducts);
router.get('/orders', getAllOrders);
router.post('/notifications', sendNotification);
router.get('/reports', getReports);

export default router;

