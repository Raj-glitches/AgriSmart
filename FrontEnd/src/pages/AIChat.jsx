import { useState, useRef, useEffect } from 'react';
import { aiAPI } from '../services/api.js';
import ChatMessage from '../components/ChatMessage.jsx';

/**
 * AIChat Page
 * AI-powered Agriculture Chatbot interface
 * Replaces the Expert Consultation Q&A forum
 */

const SUGGESTED_QUESTIONS = [
  'Which crop should I grow in sandy soil during monsoon?',
  'How to control aphids in tomato plants?',
  'What is the best organic fertilizer for wheat?',
  'How much water does rice need daily?',
  'What are the symptoms of early blight in potato?',
  'Which government schemes help small farmers?',
];

const AIChat = () => {
  const [messages, setMessages] = useState(() => {
    // Load from localStorage on mount
    try {
      const saved = localStorage.getItem('aiChatHistory');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore parse errors
    }
    return [
      {
        role: 'assistant',
        content: 'Namaste! I am KrishiMitra, your AI agriculture assistant. Ask me anything about crops, soil, irrigation, fertilizers, pests, or farming practices.',
        timestamp: new Date().toISOString(),
      },
    ];
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Persist chat history to localStorage
  useEffect(() => {
    localStorage.setItem('aiChatHistory', JSON.stringify(messages));
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = async (text = input) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMessage = {
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      // Build history for context (last 6 messages)
      const history = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await aiAPI.chat({ message: trimmed, history });
      const { reply, isAgriculture } = response.data;

      const aiMessage = {
        role: 'assistant',
        content: reply,
        timestamp: new Date().toISOString(),
        isAgriculture,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error('AI chat error:', err);
      setError('Failed to get a response. Please try again.');

      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, I am having trouble responding right now. Please check your connection and try again.',
        timestamp: new Date().toISOString(),
        isError: true,
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    if (window.confirm('Clear all chat history?')) {
      const welcome = {
        role: 'assistant',
        content: 'Namaste! I am KrishiMitra, your AI agriculture assistant. Ask me anything about crops, soil, irrigation, fertilizers, pests, or farming practices.',
        timestamp: new Date().toISOString(),
      };
      setMessages([welcome]);
      localStorage.removeItem('aiChatHistory');
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-earth-50">
      {/* Header */}
      <div className="bg-white border-b border-earth-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-earth-900">KrishiMitra AI</h1>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-earth-500">Online</span>
            </div>
          </div>
        </div>
        <button
          onClick={clearChat}
          className="text-sm text-earth-500 hover:text-red-600 px-3 py-1 rounded-lg hover:bg-red-50 transition-colors"
          title="Clear chat"
        >
          Clear
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {messages.map((msg, idx) => (
          <ChatMessage key={idx} message={msg} />
        ))}

        {isLoading && (
          <ChatMessage
            message={{ role: 'assistant', isTyping: true, content: '' }}
          />
        )}

        <div ref={messagesEndRef} />

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm text-center mx-auto max-w-md">
            {error}
          </div>
        )}
      </div>

      {/* Suggested Questions (show only when few messages) */}
      {messages.length <= 2 && !isLoading && (
        <div className="bg-white border-t border-earth-200 px-4 py-3">
          <p className="text-xs text-earth-500 mb-2 font-medium">Suggested questions:</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_QUESTIONS.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSend(q)}
                className="text-xs bg-earth-100 text-earth-700 px-3 py-1.5 rounded-full hover:bg-primary-100 hover:text-primary-700 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="bg-white border-t border-earth-200 px-4 py-3">
        <div className="flex items-end gap-2 max-w-4xl mx-auto">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about crops, soil, irrigation, pests..."
            rows={1}
            className="flex-1 resize-none px-4 py-3 bg-earth-50 border border-earth-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white text-sm max-h-32"
            disabled={isLoading}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className={`p-3 rounded-2xl transition-colors ${
              input.trim() && !isLoading
                ? 'bg-primary-600 text-white hover:bg-primary-700'
                : 'bg-earth-200 text-earth-400 cursor-not-allowed'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        <p className="text-center text-xs text-earth-400 mt-2">
          KrishiMitra AI can make mistakes. Verify critical advice with local agricultural experts.
        </p>
      </div>
    </div>
  );
};

export default AIChat;

