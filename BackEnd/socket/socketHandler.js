import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import Notification from '../models/Notification.js';

/**
 * Socket.io Handler
 * Manages real-time connections for chat and notifications
 * 
 * Why Socket.io?
 * - Enables bidirectional real-time communication
 * - Fallbacks to polling if WebSockets unavailable
 * - Essential for live chat and instant notifications
 * 
 * Integration with MERN:
 * - Initialized in server.js alongside Express HTTP server
 * - Clients connect from React frontend
 * - Events: join_chat, send_message, typing, new_notification
 */

const socketHandler = (io) => {
  // Store connected users: { userId: socketId }
  const connectedUsers = new Map();

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    /**
     * User joins with their userId
     * Used to map user to socket for targeted messaging
     */
    socket.on('join', (userId) => {
      connectedUsers.set(userId, socket.id);
      socket.userId = userId;
      console.log(`User ${userId} joined with socket ${socket.id}`);
      
      // Broadcast user's online status to their chat participants
      socket.broadcast.emit('user_online', userId);
    });

    /**
     * Join a specific chat room
     */
    socket.on('join_chat', (chatId) => {
      socket.join(chatId);
      console.log(`Socket ${socket.id} joined chat ${chatId}`);
    });

    /**
     * Leave a chat room
     */
    socket.on('leave_chat', (chatId) => {
      socket.leave(chatId);
      console.log(`Socket ${socket.id} left chat ${chatId}`);
    });

    /**
     * Handle new message
     */
    socket.on('send_message', async (data) => {
      try {
        const { chatId, content, senderId, messageType = 'text', fileUrl = '' } = data;

        // Save message to database
        const message = await Message.create({
          chat: chatId,
          sender: senderId,
          content,
          messageType,
          fileUrl,
        });

        // Populate sender info
        await message.populate('sender', 'name avatar');

        // Update chat's last message
        await Chat.findByIdAndUpdate(chatId, {
          lastMessage: message._id,
        });

        // Broadcast message to chat room
        io.to(chatId).emit('receive_message', message);

        // Send notification to offline participants
        const chat = await Chat.findById(chatId).populate('participants', '_id');
        chat.participants.forEach((participant) => {
          const participantId = participant._id.toString();
          if (participantId !== senderId && connectedUsers.has(participantId)) {
            const recipientSocketId = connectedUsers.get(participantId);
            io.to(recipientSocketId).emit('new_message_notification', {
              chatId,
              message: message.content.substring(0, 50),
              sender: message.sender.name,
            });
          }
        });
      } catch (error) {
        console.error('Socket message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    /**
     * Typing indicator
     */
    socket.on('typing', (data) => {
      const { chatId, userId, userName } = data;
      socket.to(chatId).emit('user_typing', { chatId, userId, userName });
    });

    socket.on('stop_typing', (data) => {
      const { chatId, userId } = data;
      socket.to(chatId).emit('user_stop_typing', { chatId, userId });
    });

    /**
     * Mark messages as read
     */
    socket.on('mark_read', async (data) => {
      try {
        const { chatId, userId } = data;
        
        await Message.updateMany(
          { chat: chatId, sender: { $ne: userId }, isRead: false },
          { isRead: true, readAt: new Date() }
        );

        io.to(chatId).emit('messages_read', { chatId, userId });
      } catch (error) {
        console.error('Mark read error:', error);
      }
    });

    /**
     * Send notification to specific user
     */
    socket.on('send_notification', async (data) => {
      try {
        const { userId, notification } = data;
        
        // Save to database
        const savedNotification = await Notification.create({
          user: userId,
          ...notification,
        });

        // Send if user is online
        if (connectedUsers.has(userId)) {
          const socketId = connectedUsers.get(userId);
          io.to(socketId).emit('new_notification', savedNotification);
        }
      } catch (error) {
        console.error('Notification error:', error);
      }
    });

    /**
     * Disconnect handler
     */
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      
      // Remove from connected users
      if (socket.userId) {
        connectedUsers.delete(socket.userId);
        socket.broadcast.emit('user_offline', socket.userId);
      }
    });
  });
};

export default socketHandler;

