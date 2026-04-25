import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { chatAPI } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../hooks/useSocket.js';
import Loader from '../components/common/Loader.jsx';

/**
 * Chat Page
 * Real-time messaging between users using Socket.io
 */

const ChatPage = () => {
  const { chatId } = useParams();
  const { user } = useAuth();
  const { joinChat, leaveChat, sendMessage, onNewMessage, markAsRead } = useSocket();
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchChats();
  }, []);

  useEffect(() => {
    if (chatId) {
      loadChat(chatId);
    }
  }, [chatId]);

  useEffect(() => {
    const cleanup = onNewMessage((message) => {
      setMessages((prev) => [...prev, message]);
      scrollToBottom();
    });
    return cleanup;
  }, [onNewMessage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChats = async () => {
    try {
      const response = await chatAPI.getMyChats();
      setChats(response.data.data);
    } catch (err) {
      console.error('Chats fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadChat = async (id) => {
    try {
      const chatRes = await chatAPI.getMessages(id);
      setMessages(chatRes.data.data);
      
      const chat = chats.find((c) => c._id === id);
      if (chat) {
        setActiveChat(chat);
      }
      
      joinChat(id);
      markAsRead(id);
      
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      console.error('Chat load error:', err);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;

    sendMessage(activeChat._id, newMessage);
    setNewMessage('');
  };

  const startNewChat = async (userId) => {
    try {
      const response = await chatAPI.createChat({ userId });
      const newChat = response.data.data;
      setChats((prev) => [newChat, ...prev]);
      loadChat(newChat._id);
    } catch (err) {
      console.error('Create chat error:', err);
    }
  };

  const searchUsers = async (query) => {
    if (!query) {
      setUsers([]);
      return;
    }
    try {
      const response = await chatAPI.getChatUsers({ search: query });
      setUsers(response.data.data);
    } catch (err) {
      console.error('Users search error:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-earth-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
          <div className="grid grid-cols-1 md:grid-cols-3 h-full">
            {/* Chat List */}
            <div className="border-r border-earth-200 flex flex-col">
              <div className="p-4 border-b border-earth-200">
                <h2 className="text-lg font-bold text-earth-900 mb-3">Messages</h2>
                <input
                  type="text"
                  placeholder="Search users..."
                  onChange={(e) => searchUsers(e.target.value)}
                  className="w-full px-3 py-2 border border-earth-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                />
                
                {/* Search Results */}
                {users.length > 0 && (
                  <div className="mt-2 bg-white border border-earth-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {users.map((u) => (
                      <button
                        key={u._id}
                        onClick={() => { startNewChat(u._id); setUsers([]); }}
                        className="w-full text-left px-3 py-2 hover:bg-earth-50 flex items-center gap-2"
                      >
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-xs font-bold text-primary-700">
                          {u.name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{u.name}</p>
                          <p className="text-xs text-earth-400 capitalize">{u.role}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto">
                {chats.length === 0 ? (
                  <div className="p-4 text-center text-earth-500 text-sm">No conversations yet</div>
                ) : (
                  chats.map((chat) => {
                    const otherUser = chat.participants?.find((p) => p._id !== user?._id);
                    return (
                      <button
                        key={chat._id}
                        onClick={() => loadChat(chat._id)}
                        className={`w-full text-left p-4 hover:bg-earth-50 transition-colors border-b border-earth-100 ${
                          activeChat?._id === chat._id ? 'bg-primary-50 border-l-4 border-l-primary-500' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold">
                            {otherUser?.name?.[0] || '?'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-earth-900 truncate">{otherUser?.name || 'Unknown'}</p>
                            <p className="text-sm text-earth-500 truncate">
                              {chat.lastMessage?.content || 'No messages yet'}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className="md:col-span-2 flex flex-col">
              {activeChat ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-earth-200 flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold">
                      {activeChat.participants?.find((p) => p._id !== user?._id)?.name?.[0] || '?'}
                    </div>
                    <div>
                      <p className="font-semibold text-earth-900">
                        {activeChat.participants?.find((p) => p._id !== user?._id)?.name || 'Unknown'}
                      </p>
                      <p className="text-xs text-green-600">Online</p>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 ? (
                      <div className="text-center text-earth-400 py-20">
                        <div className="text-4xl mb-2">💬</div>
                        <p>Start a conversation</p>
                      </div>
                    ) : (
                      messages.map((msg, idx) => {
                        const isMe = msg.sender?._id === user?._id || msg.sender === user?._id;
                        return (
                          <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div
                              className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                                isMe
                                  ? 'bg-primary-600 text-white rounded-br-none'
                                  : 'bg-earth-100 text-earth-900 rounded-bl-none'
                              }`}
                            >
                              <p>{msg.content}</p>
                              <p className={`text-xs mt-1 ${isMe ? 'text-primary-200' : 'text-earth-400'}`}>
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <form onSubmit={handleSend} className="p-4 border-t border-earth-200 flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-3 border border-earth-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-earth-400">
                  <div className="text-center">
                    <div className="text-6xl mb-4">💬</div>
                    <p className="text-lg">Select a conversation to start messaging</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;

