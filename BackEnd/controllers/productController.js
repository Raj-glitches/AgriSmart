import Product from '../models/Product.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';
import { uploadMultipleImages } from '../utils/cloudinary.js';

/**
 * @desc    Get all products
 * @route   GET /api/products
 * @access  Public
 */
export const getProducts = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 12,
    category,
    minPrice,
    maxPrice,
    search,
    sort = '-createdAt',
    organic,
    city,
  } = req.query;

  // Build query
  const query = { isAvailable: true };

  if (category) query.category = category;
  if (organic !== undefined) query.organic = organic === 'true';
  if (city) query['location.city'] = { $regex: city, $options: 'i' };

  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  if (search) {
    query.$text = { $search: search };
  }

  // Pagination
  const skip = (Number(page) - 1) * Number(limit);

  const products = await Product.find(query)
    .populate('farmer', 'name location rating avatar')
    .sort(sort)
    .skip(skip)
    .limit(Number(limit));

  const total = await Product.countDocuments(query);

  res.status(200).json({
    success: true,
    count: products.length,
    total,
    totalPages: Math.ceil(total / Number(limit)),
    currentPage: Number(page),
    data: products,
  });
});

/**
 * @desc    Get single product
 * @route   GET /api/products/:id
 * @access  Public
 */
export const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate('farmer', 'name location rating avatar phone farmDetails');

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found',
    });
  }

  res.status(200).json({
    success: true,
    data: product,
  });
});

/**
 * @desc    Create new product
 * @route   POST /api/products
 * @access  Private/Farmer
 */
export const createProduct = asyncHandler(async (req, res) => {
  req.body.farmer = req.user.id;

  // Handle image uploads
  try {
    if (req.files && req.files.length > 0) {
      const uploadResults = await uploadMultipleImages(
        req.files.map((f) => f.path),
        'agriSmart/products'
      );
      req.body.images = uploadResults.map((r) => r.url);
    } else if (req.body.images && Array.isArray(req.body.images)) {
      const uploadResults = await uploadMultipleImages(req.body.images, 'agriSmart/products');
      req.body.images = uploadResults.map((r) => r.url);
    }
  } catch (uploadError) {
    console.error('[ProductController] Image upload failed:', uploadError.message);
    // Continue without images - product can still be created
    req.body.images = req.body.images || [];
  }

  const product = await Product.create(req.body);

  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data: product,
  });
});

/**
 * @desc    Update product
 * @route   PUT /api/products/:id
 * @access  Private/Farmer
 */
export const updateProduct = asyncHandler(async (req, res) => {
  let product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found',
    });
  }

  // Check ownership
  if (product.farmer.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this product',
    });
  }

  // Handle new image uploads
  try {
    if (req.files && req.files.length > 0) {
      const uploadResults = await uploadMultipleImages(
        req.files.map((f) => f.path),
        'agriSmart/products'
      );
      req.body.images = [...(product.images || []), ...uploadResults.map((r) => r.url)];
    }
  } catch (uploadError) {
    console.error('[ProductController] Image upload failed during update:', uploadError.message);
  }

  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    message: 'Product updated successfully',
    data: product,
  });
});

/**
 * @desc    Delete product
 * @route   DELETE /api/products/:id
 * @access  Private/Farmer
 */
export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found',
    });
  }

  if (product.farmer.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this product',
    });
  }

  await product.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Product deleted successfully',
  });
});

/**
 * @desc    Add review to product
 * @route   POST /api/products/:id/reviews
 * @access  Private
 */
export const addReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;

  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found',
    });
  }

  // Check if user already reviewed
  const alreadyReviewed = product.reviews.find(
    (r) => r.user?.toString() === req.user.id
  );

  if (alreadyReviewed) {
    return res.status(400).json({
      success: false,
      message: 'You have already reviewed this product',
    });
  }

  product.reviews.push({
    user: req.user.id,
    rating: Number(rating),
    comment,
  });

  // Recalculate rating
  product.rating =
    product.reviews.reduce((acc, item) => item.rating + acc, 0) /
    product.reviews.length;

  await product.save();

  res.status(201).json({
    success: true,
    message: 'Review added successfully',
    data: product,
  });
});

/**
 * @desc    Get farmer's products
 * @route   GET /api/products/my-products
 * @access  Private/Farmer
 */
export const getMyProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ farmer: req.user.id }).sort('-createdAt');

  res.status(200).json({
    success: true,
    count: products.length,
    data: products,
  });
});

/**
 * @desc    Get product categories
 * @route   GET /api/products/categories
 * @access  Public
 */
export const getCategories = asyncHandler(async (req, res) => {
  const categories = await Product.distinct('category');

  res.status(200).json({
    success: true,
    data: categories,
  });
});

