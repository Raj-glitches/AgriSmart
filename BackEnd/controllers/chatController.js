import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';

/**
 * @desc    Get user's chats
 * @route   GET /api/chat
 * @access  Private
 */
export const getMyChats = asyncHandler(async (req, res) => {
  const chats = await Chat.find({ participants: req.user.id })
    .populate('participants', 'name avatar role')
    .populate({
      path: 'lastMessage',
      populate: { path: 'sender', select: 'name' },
    })
    .sort('-updatedAt');

  res.status(200).json({
    success: true,
    count: chats.length,
    data: chats,
  });
});

/**
 * @desc    Get or create chat with user
 * @route   POST /api/chat
 * @access  Private
 */
export const createChat = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: 'Please provide userId',
    });
  }

  // Check if chat already exists
  let chat = await Chat.findOne({
    participants: { $all: [req.user.id, userId] },
    isGroup: false,
  })
    .populate('participants', 'name avatar role')
    .populate('lastMessage');

  if (!chat) {
    // Create new chat
    chat = await Chat.create({
      participants: [req.user.id, userId],
      isGroup: false,
    });

    chat = await Chat.findById(chat._id).populate(
      'participants',
      'name avatar role'
    );
  }

  res.status(200).json({
    success: true,
    data: chat,
  });
});

/**
 * @desc    Get chat messages
 * @route   GET /api/chat/:chatId/messages
 * @access  Private
 */
export const getMessages = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;

  const chat = await Chat.findById(req.params.chatId);
  if (!chat) {
    return res.status(404).json({
      success: false,
      message: 'Chat not found',
    });
  }

  // Check if user is participant
  if (!chat.participants.includes(req.user.id)) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to view this chat',
    });
  }

  const messages = await Message.find({ chat: req.params.chatId })
    .populate('sender', 'name avatar')
    .sort('-createdAt')
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  const total = await Message.countDocuments({ chat: req.params.chatId });

  res.status(200).json({
    success: true,
    count: messages.length,
    total,
    data: messages.reverse(), // Return in chronological order
  });
});

/**
 * @desc    Send message (HTTP fallback)
 * @route   POST /api/chat/:chatId/messages
 * @access  Private
 */
export const sendMessage = asyncHandler(async (req, res) => {
  const { content, messageType = 'text', fileUrl = '' } = req.body;

  if (!content || content.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'Message content is required',
    });
  }

  const chat = await Chat.findById(req.params.chatId);
  if (!chat) {
    return res.status(404).json({
      success: false,
      message: 'Chat not found',
    });
  }

  if (!chat.participants.includes(req.user.id)) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to send messages in this chat',
    });
  }

  const message = await Message.create({
    chat: req.params.chatId,
    sender: req.user.id,
    content,
    messageType,
    fileUrl,
  });

  // Update last message
  chat.lastMessage = message._id;
  await chat.save();

  const populatedMessage = await Message.findById(message._id).populate(
    'sender',
    'name avatar'
  );

  // Emit via Socket.io (non-blocking)
  try {
    const io = req.app.get('io');
    if (io) {
      io.to(req.params.chatId).emit('receive_message', populatedMessage);
    }
  } catch (error) {
    console.error('[ChatController] Socket emit error:', error.message);
  }

  res.status(201).json({
    success: true,
    data: populatedMessage,
  });
});

/**
 * @desc    Get chat users (for starting new chat)
 * @route   GET /api/chat/users
 * @access  Private
 */
export const getChatUsers = asyncHandler(async (req, res) => {
  const { role, search } = req.query;

  const query = { _id: { $ne: req.user.id }, isActive: true };
  if (role) query.role = role;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const users = await User.find(query)
    .select('name avatar role location')
    .limit(20);

  res.status(200).json({
    success: true,
    count: users.length,
    data: users,
  });
});

/**
 * @desc    Mark messages as read
 * @route   PUT /api/chat/:chatId/read
 * @access  Private
 */
export const markAsRead = asyncHandler(async (req, res) => {
  await Message.updateMany(
    {
      chat: req.params.chatId,
      sender: { $ne: req.user.id },
      isRead: false,
    },
    { isRead: true, readAt: new Date() }
  );

  res.status(200).json({
    success: true,
    message: 'Messages marked as read',
  });
});

