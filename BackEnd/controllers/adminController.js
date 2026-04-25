import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Consultation from '../models/Consultation.js';
import Crop from '../models/Crop.js';
import Notification from '../models/Notification.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';

/**
 * @desc    Get dashboard statistics
 * @route   GET /api/admin/stats
 * @access  Private/Admin
 */
export const getDashboardStats = asyncHandler(async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalFarmers = await User.countDocuments({ role: 'farmer' });
    const totalBuyers = await User.countDocuments({ role: 'buyer' });
    const totalExperts = await User.countDocuments({ role: 'expert' });
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();

    let totalRevenue = [{ total: 0 }];
    try {
      totalRevenue = await Order.aggregate([
        { $match: { status: 'delivered' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]);
    } catch (aggError) {
      console.error('[AdminController] Revenue aggregation error:', aggError.message);
    }

    const recentOrders = await Order.find()
      .populate('buyer', 'name')
      .populate('farmer', 'name')
      .sort('-createdAt')
      .limit(5);

    const recentUsers = await User.find()
      .select('name email role createdAt')
      .sort('-createdAt')
      .limit(5);

    // Monthly order stats
    let monthlyOrders = [];
    try {
      monthlyOrders = await Order.aggregate([
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            orders: { $sum: 1 },
            revenue: { $sum: '$totalAmount' },
          },
        },
        { $sort: { _id: 1 } },
      ]);
    } catch (aggError) {
      console.error('[AdminController] Monthly orders aggregation error:', aggError.message);
    }

    res.status(200).json({
      success: true,
      data: {
        counts: {
          totalUsers,
          totalFarmers,
          totalBuyers,
          totalExperts,
          totalProducts,
          totalOrders,
          totalRevenue: totalRevenue[0]?.total || 0,
        },
        recentOrders,
        recentUsers,
        monthlyOrders,
      },
    });
  } catch (error) {
    console.error('[AdminController] Dashboard stats error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to load dashboard statistics',
    });
  }
});

/**
 * @desc    Get all users (admin view)
 * @route   GET /api/admin/users
 * @access  Private/Admin
 */
export const getAllUsers = asyncHandler(async (req, res) => {
  const { role, status, page = 1, limit = 20, search } = req.query;

  const query = {};
  if (role) query.role = role;
  if (status !== undefined) query.isActive = status === 'active';
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const users = await User.find(query)
    .select('-password')
    .sort('-createdAt')
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  const total = await User.countDocuments(query);

  res.status(200).json({
    success: true,
    count: users.length,
    total,
    data: users,
  });
});

/**
 * @desc    Toggle user status (activate/deactivate)
 * @route   PUT /api/admin/users/:id/toggle-status
 * @access  Private/Admin
 */
export const toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  user.isActive = !user.isActive;
  await user.save();

  res.status(200).json({
    success: true,
    message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
    data: user,
  });
});

/**
 * @desc    Get all products (admin view)
 * @route   GET /api/admin/products
 * @access  Private/Admin
 */
export const getAllProducts = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  const query = {};
  if (status) query.isAvailable = status === 'available';

  const products = await Product.find(query)
    .populate('farmer', 'name email')
    .sort('-createdAt')
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  const total = await Product.countDocuments(query);

  res.status(200).json({
    success: true,
    count: products.length,
    total,
    data: products,
  });
});

/**
 * @desc    Get all orders (admin view)
 * @route   GET /api/admin/orders
 * @access  Private/Admin
 */
export const getAllOrders = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  const query = {};
  if (status) query.status = status;

  const orders = await Order.find(query)
    .populate('buyer', 'name email')
    .populate('farmer', 'name email')
    .sort('-createdAt')
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  const total = await Order.countDocuments(query);

  res.status(200).json({
    success: true,
    count: orders.length,
    total,
    data: orders,
  });
});

/**
 * @desc    Send notification to users
 * @route   POST /api/admin/notifications
 * @access  Private/Admin
 */
export const sendNotification = asyncHandler(async (req, res) => {
  const { userIds, type, title, message, link } = req.body;

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Please provide an array of userIds',
    });
  }

  if (!title || !message) {
    return res.status(400).json({
      success: false,
      message: 'Please provide title and message',
    });
  }

  const notifications = [];

  for (const userId of userIds) {
    try {
      const notification = await Notification.create({
        user: userId,
        type: type || 'system',
        title,
        message,
        link: link || '',
      });
      notifications.push(notification);

      // Emit real-time notification (non-blocking)
      try {
        const io = req.app.get('io');
        if (io) {
          io.emit('notification_sent', { userId, notification });
        }
      } catch (socketError) {
        console.error('[AdminController] Socket emit error:', socketError.message);
      }
    } catch (dbError) {
      console.error(`[AdminController] Failed to create notification for ${userId}:`, dbError.message);
    }
  }

  res.status(201).json({
    success: true,
    message: 'Notifications sent successfully',
    count: notifications.length,
  });
});

/**
 * @desc    Get platform reports
 * @route   GET /api/admin/reports
 * @access  Private/Admin
 */
export const getReports = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const dateFilter = {};
  if (startDate || endDate) {
    dateFilter.createdAt = {};
    if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
    if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
  }

  let userGrowth = [];
  let orderStats = [];
  let topProducts = [];

  try {
    userGrowth = await User.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          users: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  } catch (error) {
    console.error('[AdminController] User growth aggregation error:', error.message);
  }

  try {
    orderStats = await Order.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
        },
      },
    ]);
  } catch (error) {
    console.error('[AdminController] Order stats aggregation error:', error.message);
  }

  try {
    topProducts = await Order.aggregate([
      { $match: dateFilter },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalSold: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
    ]);
  } catch (error) {
    console.error('[AdminController] Top products aggregation error:', error.message);
  }

  res.status(200).json({
    success: true,
    data: {
      userGrowth,
      orderStats,
      topProducts,
    },
  });
});

