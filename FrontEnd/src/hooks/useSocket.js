import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * useSocket Hook
 * Manages Socket.io connection for real-time features
 * Returns socket instance and helper functions
 */

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const useSocket = () => {
  const { user, isAuthenticated } = useAuth();
  const socketRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    // Initialize socket connection
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      socket.emit('join', user._id);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [isAuthenticated, user]);

  const joinChat = useCallback((chatId) => {
    if (socketRef.current) {
      socketRef.current.emit('join_chat', chatId);
    }
  }, []);

  const leaveChat = useCallback((chatId) => {
    if (socketRef.current) {
      socketRef.current.emit('leave_chat', chatId);
    }
  }, []);

  const sendMessage = useCallback((chatId, content, messageType = 'text', fileUrl = '') => {
    if (socketRef.current && user) {
      socketRef.current.emit('send_message', {
        chatId,
        content,
        senderId: user._id,
        messageType,
        fileUrl,
      });
    }
  }, [user]);

  const sendTyping = useCallback((chatId, isTyping) => {
    if (socketRef.current && user) {
      const event = isTyping ? 'typing' : 'stop_typing';
      socketRef.current.emit(event, {
        chatId,
        userId: user._id,
        userName: user.name,
      });
    }
  }, [user]);

  const markAsRead = useCallback((chatId) => {
    if (socketRef.current && user) {
      socketRef.current.emit('mark_read', {
        chatId,
        userId: user._id,
      });
    }
  }, [user]);

  const onNewMessage = useCallback((callback) => {
    if (socketRef.current) {
      socketRef.current.on('receive_message', callback);
      return () => socketRef.current.off('receive_message', callback);
    }
  }, []);

  const onUserTyping = useCallback((callback) => {
    if (socketRef.current) {
      socketRef.current.on('user_typing', callback);
      return () => socketRef.current.off('user_typing', callback);
    }
  }, []);

  const onNotification = useCallback((callback) => {
    if (socketRef.current) {
      socketRef.current.on('new_notification', callback);
      return () => socketRef.current.off('new_notification', callback);
    }
  }, []);

  return {
    socket: socketRef.current,
    joinChat,
    leaveChat,
    sendMessage,
    sendTyping,
    markAsRead,
    onNewMessage,
    onUserTyping,
    onNotification,
  };
};

export default useSocket;

