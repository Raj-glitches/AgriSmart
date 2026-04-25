import mongoose from 'mongoose';

/**
 * Message Schema
 * Individual messages within a chat conversation
 */
const messageSchema = new mongoose.Schema(
  {
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Message content is required'],
      maxlength: [2000, 'Message too long'],
    },
    messageType: {
      type: String,
      enum: ['text', 'image', 'file', 'location'],
      default: 'text',
    },
    fileUrl: {
      type: String,
      default: '', // For image/file messages (Cloudinary)
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ chat: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });

const Message = mongoose.model('Message', messageSchema);
export default Message;

