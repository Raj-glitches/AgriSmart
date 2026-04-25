import mongoose from 'mongoose';

/**
 * Notification Schema
 * Real-time alerts for users
 */
const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'order',
        'message',
        'weather_alert',
        'price_alert',
        'consultation',
        'system',
        'promotion',
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
      // Additional payload data (orderId, chatId, etc.)
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    link: {
      type: String,
      default: '', // Frontend route to navigate to
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ user: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;

