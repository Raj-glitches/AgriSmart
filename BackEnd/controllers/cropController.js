import mongoose from 'mongoose';
import Crop from '../models/Crop.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';
import { getCropSuggestion } from '../utils/weatherAPI.js';

/**
 * @desc    Get all crops for a farmer
 * @route   GET /api/crops
 * @access  Private/Farmer
 */
export const getMyCrops = asyncHandler(async (req, res) => {
  const { status, season } = req.query;

  const query = { farmer: req.user.id };
  if (status) query.status = status;
  if (season) query.season = season;

  const crops = await Crop.find(query).sort('-createdAt');

  res.status(200).json({
    success: true,
    count: crops.length,
    data: crops,
  });
});

/**
 * @desc    Get single crop
 * @route   GET /api/crops/:id
 * @access  Private
 */
export const getCrop = asyncHandler(async (req, res) => {
  const crop = await Crop.findById(req.params.id);

  if (!crop) {
    return res.status(404).json({
      success: false,
      message: 'Crop not found',
    });
  }

  // Check ownership
  if (crop.farmer.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to access this crop',
    });
  }

  res.status(200).json({
    success: true,
    data: crop,
  });
});

/**
 * @desc    Create new crop
 * @route   POST /api/crops
 * @access  Private/Farmer
 */
export const createCrop = asyncHandler(async (req, res) => {
  req.body.farmer = req.user.id;

  const crop = await Crop.create(req.body);

  res.status(201).json({
    success: true,
    message: 'Crop added successfully',
    data: crop,
  });
});

/**
 * @desc    Update crop
 * @route   PUT /api/crops/:id
 * @access  Private/Farmer
 */
export const updateCrop = asyncHandler(async (req, res) => {
  let crop = await Crop.findById(req.params.id);

  if (!crop) {
    return res.status(404).json({
      success: false,
      message: 'Crop not found',
    });
  }

  if (crop.farmer.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this crop',
    });
  }

  crop = await Crop.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    message: 'Crop updated successfully',
    data: crop,
  });
});

/**
 * @desc    Delete crop
 * @route   DELETE /api/crops/:id
 * @access  Private/Farmer
 */
export const deleteCrop = asyncHandler(async (req, res) => {
  const crop = await Crop.findById(req.params.id);

  if (!crop) {
    return res.status(404).json({
      success: false,
      message: 'Crop not found',
    });
  }

  if (crop.farmer.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this crop',
    });
  }

  await crop.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Crop deleted successfully',
  });
});

/**
 * @desc    Add expense to crop
 * @route   POST /api/crops/:id/expenses
 * @access  Private/Farmer
 */
export const addExpense = asyncHandler(async (req, res) => {
  const crop = await Crop.findById(req.params.id);

  if (!crop) {
    return res.status(404).json({
      success: false,
      message: 'Crop not found',
    });
  }

  if (crop.farmer.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to add expenses to this crop',
    });
  }

  crop.expenses.push(req.body);
  await crop.save();

  res.status(201).json({
    success: true,
    message: 'Expense added successfully',
    data: crop,
  });
});

/**
 * @desc    Get crop recommendations
 * @route   GET /api/crops/recommendations
 * @access  Private
 * 
 * SAFE VERSION: Never throws errors, always returns valid JSON response
 */
export const getRecommendations = asyncHandler(async (req, res) => {
  console.log('[CropController] GET /recommendations - query:', req.query);

  let { lat, lon, soilType } = req.query;

  // Parse and validate lat/lon
  lat = Number(lat);
  lon = Number(lon);

  if (isNaN(lat) || isNaN(lon)) {
    console.warn('[CropController] Invalid lat/lon, using default India coordinates');
    lat = 20.5937;
    lon = 78.9629;
  }

  // Clamp valid coordinate ranges
  if (lat < -90 || lat > 90) lat = 20.5937;
  if (lon < -180 || lon > 180) lon = 78.9629;

  console.log(`[CropController] Calling getCropSuggestion with lat=${lat}, lon=${lon}`);

  // getCropSuggestion NEVER throws - always returns { success, data }
  const suggestions = await getCropSuggestion(lat, lon, soilType);

  console.log('[CropController] Suggestions result:', suggestions.success ? 'success' : 'fallback');

  // Always return 200 with data - never crash
  res.status(200).json({
    success: true,
    data: suggestions.data,
  });
});

/**
 * @desc    Get crop analytics
 * @route   GET /api/crops/analytics
 * @access  Private/Farmer
 */
export const getCropAnalytics = asyncHandler(async (req, res) => {
  const farmerId = req.user.id;

  try {
    const farmerObjectId = new mongoose.Types.ObjectId(farmerId);

    const analytics = await Crop.aggregate([
      { $match: { farmer: farmerObjectId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalArea: { $sum: '$fieldArea' },
        },
      },
    ]);

    const seasonDistribution = await Crop.aggregate([
      { $match: { farmer: farmerObjectId } },
      {
        $group: {
          _id: '$season',
          count: { $sum: 1 },
        },
      },
    ]);

    const totalExpenses = await Crop.aggregate([
      { $match: { farmer: farmerObjectId } },
      { $unwind: '$expenses' },
      {
        $group: {
          _id: '$expenses.category',
          total: { $sum: '$expenses.amount' },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        statusDistribution: analytics,
        seasonDistribution,
        totalExpenses,
      },
    });
  } catch (error) {
    console.error('[CropController] Analytics error:', error.message);
    // Return empty analytics instead of crashing
    res.status(200).json({
      success: true,
      data: {
        statusDistribution: [],
        seasonDistribution: [],
        totalExpenses: [],
      },
    });
  }
});

