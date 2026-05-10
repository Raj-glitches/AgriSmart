// routes/productRoutes.js

import express from 'express';

import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  addReview,
  getMyProducts,
  getCategories,
} from '../controllers/productController.js';

import {
  protect,
  optionalAuth,
} from '../middleware/authMiddleware.js';

import {
  authorize,
} from '../middleware/roleMiddleware.js';

const router = express.Router();

/**
 * =========================================
 * PUBLIC ROUTES
 * =========================================
 */

/**
 * Get all products
 * IMPORTANT:
 * Keep BEFORE /:id
 */
router.get(
  '/',
  optionalAuth,
  getProducts
);

/**
 * Product categories
 * IMPORTANT:
 * Keep BEFORE /:id
 */
router.get(
  '/categories',
  getCategories
);

/**
 * =========================================
 * PROTECTED ROUTES
 * =========================================
 */

/**
 * Get farmer's own products
 * IMPORTANT:
 * Must be BEFORE /:id
 * Otherwise "my" becomes :id
 */
router.get(
  '/my/products',
  protect,
  authorize('farmer', 'admin'),
  getMyProducts
);

/**
 * Create product
 */
router.post(
  '/',
  protect,
  authorize('farmer', 'admin'),
  createProduct
);

/**
 * Add review
 */
router.post(
  '/:id/reviews',
  protect,
  addReview
);

/**
 * Update product
 */
router.put(
  '/:id',
  protect,
  authorize('farmer', 'admin'),
  updateProduct
);

/**
 * Delete product
 */
router.delete(
  '/:id',
  protect,
  authorize('farmer', 'admin'),
  deleteProduct
);

/**
 * =========================================
 * SINGLE PRODUCT ROUTE
 * MUST ALWAYS BE LAST
 * =========================================
 */

router.get(
  '/:id',
  getProduct
);

export default router;