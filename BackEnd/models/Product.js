// models/Product.js

import mongoose from 'mongoose';

/**
 * =========================================
 * PRODUCT SCHEMA
 * =========================================
 * Agricultural marketplace products
 */

const productSchema = new mongoose.Schema(
  {
    /**
     * =========================================
     * BASIC INFO
     * =========================================
     */

    name: {
      type: String,
      required: [true, 'Please provide a product name'],
      trim: true,
      maxlength: [100, 'Product name cannot exceed 100 characters'],
    },

    description: {
      type: String,
      required: [true, 'Please provide a description'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },

    category: {
      type: String,
      required: [true, 'Please provide a category'],
      enum: [
        'grains',
        'vegetables',
        'fruits',
        'dairy',
        'meat',
        'spices',
        'seeds',
        'fertilizers',
        'tools',
        'other',
      ],
    },

    /**
     * =========================================
     * PRICING & INVENTORY
     * =========================================
     */

    price: {
      type: Number,
      required: [true, 'Please provide a price'],
      min: [0, 'Price cannot be negative'],
    },

    quantity: {
      type: Number,
      required: [true, 'Please provide quantity'],
      min: [0, 'Quantity cannot be negative'],
      default: 0,
    },

    unit: {
      type: String,
      required: [true, 'Please provide a unit'],
      enum: [
        'kg',
        'g',
        'ton',
        'litre',
        'ml',
        'piece',
        'dozen',
        'bundle',
      ],
      default: 'kg',
    },

    /**
     * =========================================
     * IMAGES
     * =========================================
     */

    images: {
      type: [String],
      default: [],
    },

    /**
     * =========================================
     * FARMER RELATION
     * =========================================
     */

    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    /**
     * =========================================
     * LOCATION
     * =========================================
     */

    location: {
      address: {
        type: String,
        default: '',
      },

      city: {
        type: String,
        default: '',
      },

      state: {
        type: String,
        default: '',
      },

      coordinates: {
        lat: {
          type: Number,
          default: null,
        },

        lng: {
          type: Number,
          default: null,
        },
      },
    },

    /**
     * =========================================
     * RATINGS
     * =========================================
     */

    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    reviews: {
      type: [
        {
          user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
          },

          rating: {
            type: Number,
            min: 1,
            max: 5,
          },

          comment: {
            type: String,
            maxlength: 500,
          },

          createdAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],

      default: [],
    },

    /**
     * =========================================
     * STATUS
     * =========================================
     */

    isAvailable: {
      type: Boolean,
      default: true,
    },

    /**
     * =========================================
     * TAGS
     * =========================================
     */

    tags: {
      type: [String],
      default: [],
    },

    /**
     * =========================================
     * DATES
     * =========================================
     */

    harvestDate: {
      type: Date,
      default: null,
    },

    expiryDate: {
      type: Date,
      default: null,
    },

    /**
     * =========================================
     * ORGANIC FLAG
     * =========================================
     */

    organic: {
      type: Boolean,
      default: false,
    },
  },

  {
    timestamps: true,

    // Include virtuals
    toJSON: {
      virtuals: true,
    },

    toObject: {
      virtuals: true,
    },
  }
);

/**
 * =========================================
 * INDEXES
 * =========================================
 */

// Text search
productSchema.index({
  name: 'text',
  description: 'text',
  tags: 'text',
});

// Filter indexes
productSchema.index({
  category: 1,
  price: 1,
});

// Farmer products
productSchema.index({
  farmer: 1,
});

// Availability filter
productSchema.index({
  isAvailable: 1,
});

/**
 * =========================================
 * VIRTUALS
 * =========================================
 */

/**
 * Average Rating
 * Safe against undefined reviews
 */
productSchema.virtual('averageRating').get(function () {
  try {
    // Safe check
    if (
      !Array.isArray(this.reviews) ||
      this.reviews.length === 0
    ) {
      return 0;
    }

    // Valid ratings only
    const validReviews = this.reviews.filter(
      (review) =>
        review &&
        typeof review.rating === 'number'
    );

    if (validReviews.length === 0) {
      return 0;
    }

    const sum = validReviews.reduce(
      (acc, review) => acc + review.rating,
      0
    );

    return Number(
      (sum / validReviews.length).toFixed(1)
    );
  } catch (error) {
    console.error(
      '[ProductModel] averageRating virtual error:',
      error.message
    );

    return 0;
  }
});

/**
 * Main Product Image
 * Prevents undefined image crashes
 */
productSchema.virtual('mainImage').get(function () {
  try {
    if (
      !Array.isArray(this.images) ||
      this.images.length === 0
    ) {
      return '';
    }

    return this.images[0];
  } catch (error) {
    console.error(
      '[ProductModel] mainImage virtual error:',
      error.message
    );

    return '';
  }
});

/**
 * =========================================
 * PRE SAVE MIDDLEWARE
 * =========================================
 */

/**
 * Auto-disable unavailable products
 */
productSchema.pre('save', function (next) {
  try {
    if (
      typeof this.quantity === 'number' &&
      this.quantity <= 0
    ) {
      this.isAvailable = false;
    }

    next();
  } catch (error) {
    next(error);
  }
});

/**
 * =========================================
 * INSTANCE METHODS
 * =========================================
 */

/**
 * Safe stock check
 */
productSchema.methods.hasStock = function (quantity = 1) {
  return (
    typeof this.quantity === 'number' &&
    this.quantity >= quantity
  );
};

/**
 * =========================================
 * MODEL
 * =========================================
 */

const Product = mongoose.model(
  'Product',
  productSchema
);

export default Product;