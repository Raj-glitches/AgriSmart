import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';
import { sendOrderConfirmation } from '../utils/emailService.js';

/**
 * @desc    Create new order
 * @route   POST /api/orders
 * @access  Private
 */
export const createOrder = asyncHandler(async (req, res) => {
  const { items, shippingAddress, paymentMethod = 'cod' } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No order items provided',
    });
  }

  // Validate items and calculate totals
  let totalAmount = 0;
  const orderItems = [];

  for (const item of items) {
    if (!item.productId) {
      return res.status(400).json({
        success: false,
        message: 'Each item must have a productId',
      });
    }

    const product = await Product.findById(item.productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product not found: ${item.productId}`,
      });
    }

    if (product.quantity < (item.quantity || 0)) {
      return res.status(400).json({
        success: false,
        message: `Insufficient quantity for ${product.name}. Available: ${product.quantity}`,
      });
    }

    totalAmount += product.price * item.quantity;
    orderItems.push({
      product: product._id,
      name: product.name,
      price: product.price,
      quantity: item.quantity,
      unit: product.unit,
      image: product.images?.[0] || '',
    });

    // Update product quantity
    product.quantity -= item.quantity;
    if (product.quantity === 0) product.isAvailable = false;
    await product.save();
  }

  // Create order
  const order = await Order.create({
    buyer: req.user.id,
    farmer: items[0]?.farmerId || product.farmer,
    items: orderItems,
    totalAmount,
    paymentMethod,
    shippingAddress,
    status: 'pending',
    trackingUpdates: [
      {
        status: 'pending',
        message: 'Order placed successfully',
        timestamp: new Date(),
      },
    ],
  });

  // Send confirmation email (non-blocking)
  try {
    await sendOrderConfirmation(req.user.email, order, req.user.name);
  } catch (error) {
    console.error('[OrderController] Failed to send order confirmation email:', error.message);
  }

  // Emit notification to farmer (non-blocking)
  try {
    const io = req.app.get('io');
    if (io) {
      io.emit('new_order', { farmerId: order.farmer, order });
    }
  } catch (error) {
    console.error('[OrderController] Failed to emit socket event:', error.message);
  }

  res.status(201).json({
    success: true,
    message: 'Order placed successfully',
    data: order,
  });
});

/**
 * @desc    Get buyer orders
 * @route   GET /api/orders/my-orders
 * @access  Private
 */
export const getMyOrders = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;

  const query = { buyer: req.user.id };
  if (status) query.status = status;

  const orders = await Order.find(query)
    .populate('farmer', 'name avatar')
    .populate('items.product', 'name images')
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
 * @desc    Get farmer orders
 * @route   GET /api/orders/farmer-orders
 * @access  Private/Farmer
 */
export const getFarmerOrders = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;

  const query = { farmer: req.user.id };
  if (status) query.status = status;

  const orders = await Order.find(query)
    .populate('buyer', 'name avatar phone')
    .populate('items.product', 'name images')
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
 * @desc    Get single order
 * @route   GET /api/orders/:id
 * @access  Private
 */
export const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('buyer', 'name email phone avatar')
    .populate('farmer', 'name email phone avatar farmDetails')
    .populate('items.product', 'name images category');

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found',
    });
  }

  // Check authorization
  const buyerId = order.buyer?._id?.toString();
  const farmerId = order.farmer?._id?.toString();
  const userId = req.user.id.toString();

  if (buyerId !== userId && farmerId !== userId && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to view this order',
    });
  }

  res.status(200).json({
    success: true,
    data: order,
  });
});

/**
 * @desc    Update order status
 * @route   PUT /api/orders/:id/status
 * @access  Private/Farmer or Admin
 */
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, message } = req.body;

  const order = await Order.findById(req.params.id);
  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found',
    });
  }

  // Only farmer or admin can update
  if (order.farmer.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this order',
    });
  }

  order.status = status;
  order.trackingUpdates.push({
    status,
    message: message || `Order ${status}`,
    timestamp: new Date(),
  });

  if (status === 'delivered') {
    order.deliveryDate = new Date();
  }

  await order.save();

  // Notify buyer (non-blocking)
  try {
    const io = req.app.get('io');
    if (io) {
      io.emit('order_updated', { buyerId: order.buyer, order });
    }
  } catch (error) {
    console.error('[OrderController] Failed to emit order update:', error.message);
  }

  res.status(200).json({
    success: true,
    message: 'Order status updated',
    data: order,
  });
});

/**
 * @desc    Get order analytics
 * @route   GET /api/orders/analytics
 * @access  Private/Farmer
 */
export const getOrderAnalytics = asyncHandler(async (req, res) => {
  const farmerId = req.user.id;

  try {
    const farmerObjectId = new mongoose.Types.ObjectId(farmerId);

    const analytics = await Order.aggregate([
      { $match: { farmer: farmerObjectId } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          avgOrderValue: { $avg: '$totalAmount' },
          pendingOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
          },
          completedOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] },
          },
          cancelledOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] },
          },
        },
      },
    ]);

    // Monthly revenue
    const monthlyRevenue = await Order.aggregate([
      { $match: { farmer: farmerObjectId, status: 'delivered' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary: analytics[0] || {},
        monthlyRevenue,
      },
    });
  } catch (error) {
    console.error('[OrderController] Analytics error:', error.message);
    // Return empty analytics instead of crashing
    res.status(200).json({
      success: true,
      data: {
        summary: {},
        monthlyRevenue: [],
      },
    });
  }
});

