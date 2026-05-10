// controllers/productController.js

import mongoose from 'mongoose';

import Product from '../models/Product.js';

import { asyncHandler } from '../middleware/errorMiddleware.js';

import { uploadMultipleImages } from '../utils/cloudinary.js';

/**
 * =========================================
 * GET ALL PRODUCTS
 * =========================================
 * @route   GET /api/products
 * @access  Public
 */
export const getProducts = asyncHandler(async (req, res) => {
  try {
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

    // Safe pagination
    const pageNumber = Math.max(
      1,
      parseInt(page) || 1
    );

    const limitNumber = Math.min(
      100,
      Math.max(1, parseInt(limit) || 12)
    );

    // Build query
    const query = {
      isAvailable: true,
    };

    // Category
    if (category) {
      query.category = category;
    }

    // Organic filter
    if (organic !== undefined) {
      query.organic = organic === 'true';
    }

    // City filter
    if (city) {
      query['location.city'] = {
        $regex: city,
        $options: 'i',
      };
    }

    // Price filter
    if (minPrice || maxPrice) {
      query.price = {};

      if (minPrice) {
        query.price.$gte = Number(minPrice);
      }

      if (maxPrice) {
        query.price.$lte = Number(maxPrice);
      }
    }

    // Text search
    if (search) {
      query.$text = {
        $search: search,
      };
    }

    // Pagination
    const skip =
      (pageNumber - 1) * limitNumber;

    const products = await Product.find(query)
      .populate(
        'farmer',
        'name location rating avatar'
      )
      .sort(sort)
      .skip(skip)
      .limit(limitNumber)
      .lean();

    const total = await Product.countDocuments(
      query
    );

    return res.status(200).json({
      success: true,
      count: products.length,
      total,
      totalPages: Math.ceil(
        total / limitNumber
      ),
      currentPage: pageNumber,
      data: products,
    });
  } catch (error) {
    console.error(
      '[getProducts] Error:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message,
    });
  }
});

/**
 * =========================================
 * GET SINGLE PRODUCT
 * =========================================
 * @route   GET /api/products/:id
 * @access  Public
 */
export const getProduct = asyncHandler(
  async (req, res) => {
    try {
      // Validate ObjectId
      if (
        !mongoose.Types.ObjectId.isValid(
          req.params.id
        )
      ) {
        return res.status(400).json({
          success: false,
          message: 'Invalid product ID',
        });
      }

      const product =
        await Product.findById(req.params.id)
          .populate(
            'farmer',
            'name location rating avatar phone farmDetails'
          )
          .lean();

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found',
        });
      }

      return res.status(200).json({
        success: true,
        data: product,
      });
    } catch (error) {
      console.error(
        '[getProduct] Error:',
        error
      );

      return res.status(500).json({
        success: false,
        message: 'Failed to fetch product',
        error: error.message,
      });
    }
  }
);

/**
 * =========================================
 * CREATE PRODUCT
 * =========================================
 * @route   POST /api/products
 * @access  Private/Farmer
 */
export const createProduct = asyncHandler(
  async (req, res) => {
    try {
      // Role protection
      if (
        req.user.role !== 'farmer' &&
        req.user.role !== 'admin'
      ) {
        return res.status(403).json({
          success: false,
          message:
            'Only farmers can create products',
        });
      }

      // Assign farmer
      req.body.farmer = req.user.id;

      /**
       * =========================================
       * IMAGE UPLOAD
       * =========================================
       */

      try {
        // Uploaded files
        if (
          req.files &&
          Array.isArray(req.files) &&
          req.files.length > 0
        ) {
          const uploadResults =
            await uploadMultipleImages(
              req.files.map(
                (file) => file.path
              ),
              'agriSmart/products'
            );

          req.body.images =
            uploadResults.map(
              (result) => result.url
            );
        }

        // Direct image URLs/base64
        else if (
          req.body.images &&
          Array.isArray(req.body.images)
        ) {
          const uploadResults =
            await uploadMultipleImages(
              req.body.images,
              'agriSmart/products'
            );

          req.body.images =
            uploadResults.map(
              (result) => result.url
            );
        }

        // Default images fallback
        else {
          req.body.images = [];
        }
      } catch (uploadError) {
        console.error(
          '[createProduct] Image upload failed:',
          uploadError.message
        );

        req.body.images = [];
      }

      // Safe defaults
      req.body.reviews =
        req.body.reviews || [];

      req.body.tags =
        req.body.tags || [];

      // Create product
      const product =
        await Product.create(req.body);

      return res.status(201).json({
        success: true,
        message:
          'Product created successfully',
        data: product,
      });
    } catch (error) {
      console.error(
        '[createProduct] Error:',
        error
      );

      return res.status(500).json({
        success: false,
        message: 'Failed to create product',
        error: error.message,
      });
    }
  }
);

/**
 * =========================================
 * UPDATE PRODUCT
 * =========================================
 * @route   PUT /api/products/:id
 * @access  Private/Farmer
 */
export const updateProduct = asyncHandler(
  async (req, res) => {
    try {
      // Validate ObjectId
      if (
        !mongoose.Types.ObjectId.isValid(
          req.params.id
        )
      ) {
        return res.status(400).json({
          success: false,
          message: 'Invalid product ID',
        });
      }

      let product =
        await Product.findById(
          req.params.id
        );

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found',
        });
      }

      // Ownership check
      if (
        product.farmer?.toString() !==
          req.user.id &&
        req.user.role !== 'admin'
      ) {
        return res.status(403).json({
          success: false,
          message:
            'Not authorized to update this product',
        });
      }

      /**
       * =========================================
       * HANDLE IMAGE UPLOADS
       * =========================================
       */

      try {
        if (
          req.files &&
          Array.isArray(req.files) &&
          req.files.length > 0
        ) {
          const uploadResults =
            await uploadMultipleImages(
              req.files.map(
                (file) => file.path
              ),
              'agriSmart/products'
            );

          req.body.images = [
            ...(Array.isArray(
              product.images
            )
              ? product.images
              : []),

            ...uploadResults.map(
              (result) => result.url
            ),
          ];
        }
      } catch (uploadError) {
        console.error(
          '[updateProduct] Upload failed:',
          uploadError.message
        );
      }

      // Prevent farmer overwrite
      delete req.body.farmer;

      // Safe arrays
      if (
        req.body.images &&
        !Array.isArray(req.body.images)
      ) {
        req.body.images = [];
      }

      if (
        req.body.tags &&
        !Array.isArray(req.body.tags)
      ) {
        req.body.tags = [];
      }

      // Update product
      product =
        await Product.findByIdAndUpdate(
          req.params.id,
          req.body,
          {
            new: true,
            runValidators: true,
          }
        ).lean();

      return res.status(200).json({
        success: true,
        message:
          'Product updated successfully',
        data: product,
      });
    } catch (error) {
      console.error(
        '[updateProduct] Error:',
        error
      );

      return res.status(500).json({
        success: false,
        message: 'Failed to update product',
        error: error.message,
      });
    }
  }
);

/**
 * =========================================
 * DELETE PRODUCT
 * =========================================
 * @route   DELETE /api/products/:id
 * @access  Private/Farmer
 */
export const deleteProduct = asyncHandler(
  async (req, res) => {
    try {
      // Validate ObjectId
      if (
        !mongoose.Types.ObjectId.isValid(
          req.params.id
        )
      ) {
        return res.status(400).json({
          success: false,
          message: 'Invalid product ID',
        });
      }

      const product =
        await Product.findById(
          req.params.id
        );

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found',
        });
      }

      // Ownership check
      if (
        product.farmer?.toString() !==
          req.user.id &&
        req.user.role !== 'admin'
      ) {
        return res.status(403).json({
          success: false,
          message:
            'Not authorized to delete this product',
        });
      }

      await product.deleteOne();

      return res.status(200).json({
        success: true,
        message:
          'Product deleted successfully',
      });
    } catch (error) {
      console.error(
        '[deleteProduct] Error:',
        error
      );

      return res.status(500).json({
        success: false,
        message: 'Failed to delete product',
        error: error.message,
      });
    }
  }
);

/**
 * =========================================
 * ADD REVIEW
 * =========================================
 * @route   POST /api/products/:id/reviews
 * @access  Private
 */
export const addReview = asyncHandler(
  async (req, res) => {
    try {
      const { rating, comment } =
        req.body;

      // Validate ObjectId
      if (
        !mongoose.Types.ObjectId.isValid(
          req.params.id
        )
      ) {
        return res.status(400).json({
          success: false,
          message: 'Invalid product ID',
        });
      }

      const product =
        await Product.findById(
          req.params.id
        );

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found',
        });
      }

      // Safe reviews
      if (
        !Array.isArray(product.reviews)
      ) {
        product.reviews = [];
      }

      // Prevent duplicate review
      const alreadyReviewed =
        product.reviews.find(
          (review) =>
            review.user?.toString() ===
            req.user.id
        );

      if (alreadyReviewed) {
        return res.status(400).json({
          success: false,
          message:
            'You already reviewed this product',
        });
      }

      // Add review
      product.reviews.push({
        user: req.user.id,
        rating: Number(rating),
        comment:
          typeof comment === 'string'
            ? comment.trim()
            : '',
      });

      // Recalculate rating
      const validRatings =
        product.reviews.filter(
          (review) =>
            typeof review.rating ===
            'number'
        );

      if (validRatings.length > 0) {
        product.rating =
          validRatings.reduce(
            (acc, review) =>
              acc + review.rating,
            0
          ) / validRatings.length;
      }

      await product.save();

      return res.status(201).json({
        success: true,
        message:
          'Review added successfully',
        data: product,
      });
    } catch (error) {
      console.error(
        '[addReview] Error:',
        error
      );

      return res.status(500).json({
        success: false,
        message: 'Failed to add review',
        error: error.message,
      });
    }
  }
);

/**
 * =========================================
 * GET MY PRODUCTS
 * =========================================
 * @route   GET /api/products/my-products
 * @access  Private/Farmer
 */
export const getMyProducts = asyncHandler(
  async (req, res) => {
    try {
      // Farmer only
      if (
        req.user.role !== 'farmer' &&
        req.user.role !== 'admin'
      ) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }

      const products =
        await Product.find({
          farmer: req.user.id,
        })
          .sort('-createdAt')
          .lean();

      return res.status(200).json({
        success: true,
        count: products.length,
        data: products,
      });
    } catch (error) {
      console.error(
        '[getMyProducts] Error:',
        error
      );

      return res.status(500).json({
        success: false,
        message:
          'Failed to fetch farmer products',
        error: error.message,
      });
    }
  }
);

/**
 * =========================================
 * GET CATEGORIES
 * =========================================
 * @route   GET /api/products/categories
 * @access  Public
 */
export const getCategories = asyncHandler(
  async (req, res) => {
    try {
      const categories =
        await Product.distinct(
          'category'
        );

      return res.status(200).json({
        success: true,
        data: categories,
      });
    } catch (error) {
      console.error(
        '[getCategories] Error:',
        error
      );

      return res.status(500).json({
        success: false,
        message:
          'Failed to fetch categories',
        error: error.message,
      });
    }
  }
);