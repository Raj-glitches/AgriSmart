import mongoose from 'mongoose';

/**
 * Consultation Schema
 * Expert consultation Q&A system
 */
const consultationSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    expert: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    title: {
      type: String,
      required: [true, 'Please provide a title'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please provide a description'],
      maxlength: [5000, 'Description too long'],
    },
    category: {
      type: String,
      enum: [
        'crop_disease',
        'soil_management',
        'irrigation',
        'pest_control',
        'fertilizer',
        'harvesting',
        'market_price',
        'weather',
        'general',
      ],
      default: 'general',
    },
    images: [String], // Cloudinary URLs for disease/condition images
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed'],
      default: 'open',
    },
    responses: [
      {
        expert: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        content: { type: String, required: true },
        attachments: [String],
        isAccepted: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    rating: {
      score: { type: Number, min: 1, max: 5, default: null },
      feedback: { type: String, default: '' },
    },
    isPublic: {
      type: Boolean,
      default: false, // If true, other farmers can view this Q&A
    },
    views: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

consultationSchema.index({ status: 1, category: 1 });
consultationSchema.index({ farmer: 1 });
consultationSchema.index({ title: 'text', description: 'text' });

const Consultation = mongoose.model('Consultation', consultationSchema);
export default Consultation;

