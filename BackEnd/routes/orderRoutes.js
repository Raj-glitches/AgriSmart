import express from 'express';
import {
  createOrder,
  getMyOrders,
  getFarmerOrders,
  getOrder,
  updateOrderStatus,
  getOrderAnalytics,
} from '../controllers/orderController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);

// Buyer routes
router.post('/', createOrder);
router.get('/my-orders', getMyOrders);
router.get('/:id', getOrder);

// Farmer routes
router.get('/farmer/orders', authorize('farmer', 'admin'), getFarmerOrders);
router.get('/farmer/analytics', authorize('farmer', 'admin'), getOrderAnalytics);
router.put('/:id/status', authorize('farmer', 'admin'), updateOrderStatus);

export default router;

