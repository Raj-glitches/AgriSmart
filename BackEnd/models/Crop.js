import mongoose from 'mongoose';

/**
 * Crop Schema
 * Farmer's crop management and tracking
 */
const cropSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide crop name'],
      trim: true,
    },
    variety: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      enum: ['grains', 'vegetables', 'fruits', 'pulses', 'oilseeds', 'cash_crops', 'other'],
      required: true,
    },
    season: {
      type: String,
      enum: ['kharif', 'rabi', 'zaid', 'year_round'],
      required: true,
    },
    status: {
      type: String,
      enum: ['planned', 'planted', 'growing', 'harvested', 'sold'],
      default: 'planned',
    },
    fieldArea: {
      type: Number, // in acres
      default: 0,
    },
    plantingDate: {
      type: Date,
      default: null,
    },
    expectedHarvestDate: {
      type: Date,
      default: null,
    },
    actualHarvestDate: {
      type: Date,
      default: null,
    },
    yield: {
      expected: { type: Number, default: 0 },
      actual: { type: Number, default: 0 },
      unit: { type: String, default: 'kg' },
    },
    soilRequirements: {
      type: String,
      default: '',
    },
    waterRequirements: {
      type: String,
      default: '',
    },
    fertilizerUsed: [
      {
        name: String,
        quantity: Number,
        unit: String,
        date: Date,
      },
    ],
    expenses: [
      {
        category: { type: String, enum: ['seeds', 'fertilizer', 'labor', 'equipment', 'irrigation', 'other'] },
        amount: Number,
        date: { type: Date, default: Date.now },
        description: String,
      },
    ],
    images: [String], // Cloudinary URLs
    notes: {
      type: String,
      default: '',
    },
    weatherImpact: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

cropSchema.index({ farmer: 1, status: 1 });
cropSchema.index({ name: 'text' });

const Crop = mongoose.model('Crop', cropSchema);
export default Crop;

