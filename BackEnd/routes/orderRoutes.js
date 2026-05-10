// routes/orderRoutes.js

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

/**
 * =========================================
 * ALL ROUTES REQUIRE AUTHENTICATION
 * =========================================
 */
router.use(protect);

/**
 * =========================================
 * BUYER ROUTES
 * =========================================
 */

// Create new order
router.post(
  '/',
  authorize('buyer'),
  createOrder
);

// Get logged-in buyer orders
router.get(
  '/my-orders',
  authorize('buyer'),
  getMyOrders
);

/**
 * =========================================
 * FARMER ROUTES
 * =========================================
 */

// Get farmer orders
router.get(
  '/farmer/orders',
  authorize('farmer', 'admin'),
  getFarmerOrders
);

// Farmer analytics
router.get(
  '/farmer/analytics',
  authorize('farmer', 'admin'),
  getOrderAnalytics
);

// Update order status
router.put(
  '/:id/status',
  authorize('farmer', 'admin'),
  updateOrderStatus
);

/**
 * =========================================
 * SINGLE ORDER ROUTE
 * MUST ALWAYS BE LAST
 * =========================================
 */

router.get('/:id', getOrder);

export default router;