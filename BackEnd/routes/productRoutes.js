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
import { protect, optionalAuth } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', optionalAuth, getProducts);
router.get('/categories', getCategories);
router.get('/:id', getProduct);

// Protected routes
router.post('/:id/reviews', protect, addReview);
router.get('/my/products', protect, authorize('farmer', 'admin'), getMyProducts);
router.post('/', protect, authorize('farmer', 'admin'), createProduct);
router.put('/:id', protect, authorize('farmer', 'admin'), updateProduct);
router.delete('/:id', protect, authorize('farmer', 'admin'), deleteProduct);

export default router;

