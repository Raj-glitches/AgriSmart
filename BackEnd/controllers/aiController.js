import { getAIResponse } from '../utils/aiService.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';

/**
 * @desc    Chat with AI Agriculture Assistant
 * @route   POST /api/ai/chat
 * @access  Private (any authenticated user)
 *
 * Request body:
 *   {
 *     message: string,        // User's question
 *     history: Array<{role, content}>  // Optional conversation history
 *   }
 *
 * Response:
 *   {
 *     success: true,
 *     reply: string,          // AI's response
 *     isAgriculture: boolean, // Whether the query was agriculture-related
 *     timestamp: string
 *   }
 */
export const chatWithAI = asyncHandler(async (req, res) => {
  const { message, history = [] } = req.body;

  // Validate input
  if (!message || typeof message !== 'string' || message.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'Please provide a message',
    });
  }

  if (message.length > 2000) {
    return res.status(400).json({
      success: false,
      message: 'Message too long. Maximum 2000 characters allowed.',
    });
  }

  // Call AI service
  const result = await getAIResponse(message.trim(), history);

  res.status(200).json({
    success: true,
    reply: result.reply,
    isAgriculture: result.isAgriculture,
    timestamp: new Date().toISOString(),
  });
});

/**
 * @desc    Get AI service status
 * @route   GET /api/ai/status
 * @access  Public
 *
 * Returns whether the AI service is configured and available.
 */
export const getAIStatus = asyncHandler(async (req, res) => {
  const hasApiKey = !!process.env.OPENAI_API_KEY;

  res.status(200).json({
    success: true,
    data: {
      available: true,
      model: hasApiKey ? 'gpt-3.5-turbo' : 'fallback',
      configured: hasApiKey,
      message: hasApiKey
        ? 'AI assistant is fully operational'
        : 'AI assistant running in fallback mode (no OpenAI API key)',
    },
  });
});

