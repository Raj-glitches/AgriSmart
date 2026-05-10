// controllers/orderController.js

import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';
import { sendOrderConfirmation } from '../utils/emailService.js';

/**
 * =========================================
 * CREATE ORDER
 * =========================================
 * @route   POST /api/orders
 * @access  Private (Buyer)
 */
export const createOrder = asyncHandler(async (req, res) => {
  try {
    // Prevent experts from ordering
    if (req.user.role === 'expert') {
      return res.status(403).json({
        success: false,
        message: 'Experts cannot place marketplace orders',
      });
    }

    // Allow only buyers
    if (req.user.role !== 'buyer') {
      return res.status(403).json({
        success: false,
        message: 'Only buyers can place orders',
      });
    }

    const {
      items,
      shippingAddress,
      paymentMethod = 'cod',
    } = req.body;

    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No order items provided',
      });
    }

    // Validate shipping address
    if (
      !shippingAddress ||
      !shippingAddress.fullName ||
      !shippingAddress.phone ||
      !shippingAddress.address ||
      !shippingAddress.city ||
      !shippingAddress.state ||
      !shippingAddress.pincode
    ) {
      return res.status(400).json({
        success: false,
        message: 'Complete shipping address is required',
      });
    }

    let totalAmount = 0;
    let farmerId = null;

    const orderItems = [];

    // Process products safely
    for (const item of items) {
      if (!item.productId) {
        return res.status(400).json({
          success: false,
          message: 'Each item must contain productId',
        });
      }

      const product = await Product.findById(item.productId);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.productId}`,
        });
      }

      // First farmer assignment
      if (!farmerId) {
        farmerId = product.farmer;
      }

      // Prevent multi-farmer orders
      if (product.farmer.toString() !== farmerId.toString()) {
        return res.status(400).json({
          success: false,
          message:
            'All products in one order must belong to same farmer',
        });
      }

      // Validate quantity
      if (
        !item.quantity ||
        item.quantity <= 0 ||
        product.quantity < item.quantity
      ) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}`,
        });
      }

      // Safe stock update
      const updatedProduct = await Product.findOneAndUpdate(
        {
          _id: product._id,
          quantity: { $gte: item.quantity },
        },
        {
          $inc: {
            quantity: -item.quantity,
          },
        },
        {
          new: true,
        }
      );

      if (!updatedProduct) {
        return res.status(400).json({
          success: false,
          message: `Stock update failed for ${product.name}`,
        });
      }

      // Mark unavailable
      if (updatedProduct.quantity <= 0) {
        updatedProduct.isAvailable = false;
        await updatedProduct.save();
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
    }

    // Create order
    const order = await Order.create({
      buyer: req.user.id,
      farmer: farmerId,
      items: orderItems,
      totalAmount,
      paymentMethod,
      paymentStatus: 'pending',
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

    // Populate
    const populatedOrder = await Order.findById(order._id)
      .populate('buyer', 'name email phone')
      .populate('farmer', 'name email phone')
      .populate('items.product', 'name images price');

    // Email notification
    try {
      await sendOrderConfirmation(
        req.user.email,
        populatedOrder,
        req.user.name
      );
    } catch (error) {
      console.error(
        '[createOrder] Email error:',
        error.message
      );
    }

    // Socket notification
    try {
      const io = req.app.get('io');

      if (io) {
        io.emit('new_order', {
          farmerId,
          order: populatedOrder,
        });
      }
    } catch (error) {
      console.error(
        '[createOrder] Socket error:',
        error.message
      );
    }

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: populatedOrder,
    });
  } catch (error) {
    console.error('[createOrder] Error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message,
    });
  }
});

/**
 * =========================================
 * GET BUYER ORDERS
 * =========================================
 * @route   GET /api/orders/my-orders
 * @access  Private (Buyer)
 */
export const getMyOrders = asyncHandler(async (req, res) => {
  try {
    // Prevent expert access
    if (req.user.role === 'expert') {
      return res.status(403).json({
        success: false,
        message: 'Experts cannot access orders',
      });
    }

    // Only buyers
    if (req.user.role !== 'buyer') {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    const page = Math.max(
      1,
      parseInt(req.query.page) || 1
    );

    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.query.limit) || 10)
    );

    const query = {
      buyer: req.user.id,
    };

    if (req.query.status) {
      query.status = req.query.status;
    }

    const orders = await Order.find(query)
      .populate({
        path: 'farmer',
        select: 'name email avatar',
      })
      .populate({
        path: 'items.product',
        select: 'name images price',
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const total = await Order.countDocuments(query);

    return res.status(200).json({
      success: true,
      count: orders.length,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      data: orders,
    });
  } catch (error) {
    console.error('[getMyOrders] Error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message,
    });
  }
});

/**
 * =========================================
 * GET FARMER ORDERS
 * =========================================
 * @route   GET /api/orders/farmer/orders
 * @access  Private (Farmer/Admin)
 */
export const getFarmerOrders = asyncHandler(async (req, res) => {
  try {
    // Prevent expert access
    if (req.user.role === 'expert') {
      return res.status(403).json({
        success: false,
        message: 'Experts cannot access farmer orders',
      });
    }

    // Only farmer/admin
    if (
      req.user.role !== 'farmer' &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    const page = Math.max(
      1,
      parseInt(req.query.page) || 1
    );

    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.query.limit) || 10)
    );

    const query = {
      farmer: req.user.id,
    };

    if (req.query.status) {
      query.status = req.query.status;
    }

    const orders = await Order.find(query)
      .populate({
        path: 'buyer',
        select: 'name email phone avatar',
      })
      .populate({
        path: 'items.product',
        select: 'name images price',
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const total = await Order.countDocuments(query);

    return res.status(200).json({
      success: true,
      count: orders.length,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      data: orders,
    });
  } catch (error) {
    console.error('[getFarmerOrders] Error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch farmer orders',
      error: error.message,
    });
  }
});

/**
 * =========================================
 * GET SINGLE ORDER
 * =========================================
 * @route   GET /api/orders/:id
 * @access  Private
 */
export const getOrder = asyncHandler(async (req, res) => {
  try {
    // Prevent invalid ObjectId crash
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID',
      });
    }

    const order = await Order.findById(req.params.id)
      .populate('buyer', 'name email phone avatar')
      .populate(
        'farmer',
        'name email phone avatar farmDetails'
      )
      .populate(
        'items.product',
        'name images category price'
      );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    const userId = req.user.id.toString();

    const buyerId = order.buyer?._id?.toString();

    const farmerId = order.farmer?._id?.toString();

    // Authorization
    if (
      buyerId !== userId &&
      farmerId !== userId &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('[getOrder] Error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch order',
      error: error.message,
    });
  }
});

/**
 * =========================================
 * UPDATE ORDER STATUS
 * =========================================
 * @route   PUT /api/orders/:id/status
 * @access  Private (Farmer/Admin)
 */
export const updateOrderStatus = asyncHandler(async (req, res) => {
  try {
    // Prevent expert access
    if (req.user.role === 'expert') {
      return res.status(403).json({
        success: false,
        message: 'Experts cannot update orders',
      });
    }

    const { status, message } = req.body;

    const allowedStatuses = [
      'pending',
      'confirmed',
      'processing',
      'shipped',
      'delivered',
      'cancelled',
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order status',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID',
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Authorization
    if (
      !order.farmer ||
      (
        order.farmer.toString() !== req.user.id &&
        req.user.role !== 'admin'
      )
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
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
      order.paymentStatus = 'completed';
    }

    await order.save();

    // Socket notification
    try {
      const io = req.app.get('io');

      if (io) {
        io.emit('order_updated', {
          buyerId: order.buyer,
          order,
        });
      }
    } catch (error) {
      console.error(
        '[updateOrderStatus] Socket error:',
        error.message
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Order status updated',
      data: order,
    });
  } catch (error) {
    console.error('[updateOrderStatus] Error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      error: error.message,
    });
  }
});

/**
 * =========================================
 * ORDER ANALYTICS
 * =========================================
 * @route   GET /api/orders/farmer/analytics
 * @access  Private (Farmer/Admin)
 */
export const getOrderAnalytics = asyncHandler(async (req, res) => {
  try {
    // Prevent expert access
    if (req.user.role === 'expert') {
      return res.status(403).json({
        success: false,
        message: 'Experts cannot access analytics',
      });
    }

    // Only farmer/admin
    if (
      req.user.role !== 'farmer' &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    const farmerObjectId = new mongoose.Types.ObjectId(
      req.user.id
    );

    const analytics = await Order.aggregate([
      {
        $match: {
          farmer: farmerObjectId,
        },
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          avgOrderValue: { $avg: '$totalAmount' },

          pendingOrders: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'pending'] },
                1,
                0,
              ],
            },
          },

          completedOrders: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'delivered'] },
                1,
                0,
              ],
            },
          },

          cancelledOrders: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'cancelled'] },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    const monthlyRevenue = await Order.aggregate([
      {
        $match: {
          farmer: farmerObjectId,
          status: 'delivered',
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m',
              date: '$createdAt',
            },
          },
          revenue: {
            $sum: '$totalAmount',
          },
          orders: {
            $sum: 1,
          },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      data: {
        summary: analytics[0] || {},
        monthlyRevenue,
      },
    });
  } catch (error) {
    console.error('[getOrderAnalytics] Error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics',
      error: error.message,
    });
  }
});