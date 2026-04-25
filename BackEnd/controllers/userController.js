import mongoose from 'mongoose';
import User from '../models/User.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';
import { uploadImage } from '../utils/cloudinary.js';

/**
 * @desc    Get all users
 * @route   GET /api/users
 * @access  Private/Admin
 */
export const getUsers = asyncHandler(async (req, res) => {
  const { role, search, isActive } = req.query;

  // Build query
  const query = {};
  if (role) query.role = role;
  if (isActive !== undefined) query.isActive = isActive === 'true';
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const users = await User.find(query)
    .select('-password')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: users.length,
    data: users,
  });
});

/**
 * @desc    Get single user
 * @route   GET /api/users/:id
 * @access  Private
 */
export const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

/**
 * @desc    Update user profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, location, farmDetails, expertise } = req.body;

  const updateData = {};
  if (name) updateData.name = name;
  if (phone) updateData.phone = phone;
  if (location) updateData.location = location;
  if (farmDetails && req.user.role === 'farmer') {
    updateData.farmDetails = farmDetails;
  }
  if (expertise && req.user.role === 'expert') {
    updateData.expertise = expertise;
  }

  const user = await User.findByIdAndUpdate(
    req.user.id,
    updateData,
    { new: true, runValidators: true }
  ).select('-password');

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: user,
  });
});

/**
 * @desc    Upload avatar
 * @route   PUT /api/users/avatar
 * @access  Private
 */
export const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file && !req.body.image) {
    return res.status(400).json({
      success: false,
      message: 'Please provide an image',
    });
  }

  let imageUrl;
  try {
    if (req.file) {
      const result = await uploadImage(req.file.path, 'agriSmart/avatars');
      imageUrl = result.url;
    } else {
      // Base64 upload
      const result = await uploadImage(req.body.image, 'agriSmart/avatars');
      imageUrl = result.url;
    }
  } catch (error) {
    console.error('[UserController] Avatar upload failed:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Image upload failed. Please try again.',
    });
  }

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { avatar: imageUrl },
    { new: true }
  ).select('-password');

  res.status(200).json({
    success: true,
    message: 'Avatar updated successfully',
    data: user,
  });
});

/**
 * @desc    Update user (admin only)
 * @route   PUT /api/users/:id
 * @access  Private/Admin
 */
export const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).select('-password');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  res.status(200).json({
    success: true,
    message: 'User updated successfully',
    data: user,
  });
});

/**
 * @desc    Delete user (admin only)
 * @route   DELETE /api/users/:id
 * @access  Private/Admin
 */
export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  // Soft delete - deactivate instead of remove
  user.isActive = false;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'User deactivated successfully',
  });
});

/**
 * @desc    Get user stats
 * @route   GET /api/users/stats
 * @access  Private
 */
export const getUserStats = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  try {
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const stats = await User.aggregate([
      { $match: { _id: userObjectId } },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: 'farmer',
          as: 'products',
        },
      },
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'farmer',
          as: 'orders',
        },
      },
      {
        $project: {
          totalProducts: { $size: '$products' },
          totalOrders: { $size: '$orders' },
          completedOrders: {
            $size: {
              $filter: {
                input: '$orders',
                cond: { $eq: ['$$this.status', 'delivered'] },
              },
            },
          },
          totalRevenue: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: '$orders',
                    cond: { $eq: ['$$this.status', 'delivered'] },
                  },
                },
                as: 'order',
                in: '$$order.totalAmount',
              },
            },
          },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: stats[0] || {
        totalProducts: 0,
        totalOrders: 0,
        completedOrders: 0,
        totalRevenue: 0,
      },
    });
  } catch (error) {
    console.error('[UserController] Stats aggregation error:', error.message);
    res.status(200).json({
      success: true,
      data: {
        totalProducts: 0,
        totalOrders: 0,
        completedOrders: 0,
        totalRevenue: 0,
      },
    });
  }
});

