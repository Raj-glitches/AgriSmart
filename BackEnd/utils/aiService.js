/**
 * ============================================================================
 * AI Service - OpenAI Integration
 * ============================================================================
 *
 * Why OpenAI (GPT-3.5-turbo / GPT-4)?
 * - Best-in-class natural language understanding
 * - Strong performance on domain-specific questions with proper system prompts
 * - Reliable API with good documentation and error handling
 * - Supports long context for multi-turn agricultural conversations
 *
 * How API key is used:
 * - Stored in .env as OPENAI_API_KEY
 * - Loaded via process.env at runtime
 * - Never exposed to frontend or logged
 * - Fallback response if key is missing or API fails
 */

/**
 * System prompt that defines the AI's personality and domain constraints.
 * This is sent with every request to keep the AI focused on agriculture.
 */
const SYSTEM_PROMPT = `You are KrishiMitra, an expert agricultural advisor for Indian farmers. 

Your areas of expertise:
- Crop selection based on soil type, season, and climate
- Plant disease identification and treatment
- Fertilizer recommendations (organic and chemical)
- Irrigation methods and water management
- Weather impact on farming
- Pest control strategies
- Market trends and pricing
- Government schemes related to agriculture

Rules:
1. Answer ONLY agriculture-related questions. If asked about politics, entertainment, coding, finance, or other non-agriculture topics, respond: "I can only help with agriculture-related queries. Please ask about crops, soil, irrigation, fertilizers, pests, or farming practices."
2. Give practical, actionable advice that farmers can implement.
3. Use simple language. Avoid jargon unless explained.
4. When relevant, mention both traditional Indian methods and modern techniques.
5. Keep responses concise (2-4 paragraphs) but informative.
6. If you don't know something specific, say so honestly and suggest where the farmer might find help.`;

/**
 * Keywords to check if a message is agriculture-related.
 * Used for quick client-side filtering before API call.
 */
const AGRI_KEYWORDS = [
  'crop', 'seed', 'soil', 'fertilizer', 'pest', 'disease', 'irrigation', 'water',
  'harvest', 'farm', 'farming', 'agriculture', 'wheat', 'rice', 'maize', 'cotton',
  'sugarcane', 'vegetable', 'fruit', 'grain', 'pulse', 'organic', 'chemical',
  'insect', 'weed', 'spray', 'drip', 'canal', 'rain', 'monsoon', 'weather',
  'climate', 'temperature', 'humidity', 'season', 'kharif', 'rabi', 'zaid',
  'plough', 'tractor', 'yield', 'production', 'market', 'mandi', 'price',
  'government', 'scheme', 'subsidy', 'loan', 'kisan', 'krishi', 'plant',
  'tree', 'garden', 'livestock', 'dairy', 'milk', 'cow', 'buffalo',
  'goat', 'poultry', 'chicken', 'fish', 'pond', 'mulch', 'compost',
  'vermicompost', 'manure', 'nitrogen', 'phosphorus', 'potassium', 'npk',
  'greenhouse', 'polyhouse', 'solar', 'pump', 'borewell', 'well',
];

/**
 * Check if a user message is agriculture-related.
 * Returns true if any agricultural keyword is found.
 */
export const isAgricultureRelated = (message) => {
  const lower = message.toLowerCase();
  return AGRI_KEYWORDS.some((kw) => lower.includes(kw));
};

/**
 * Call OpenAI Chat Completions API
 * @param {string} userMessage - The farmer's question
 * @param {Array} history - Previous messages for context [{role, content}]
 * @returns {Promise<{reply: string, isAgriculture: boolean}>}
 */
export const getAIResponse = async (userMessage, history = []) => {
  // Check if message is agriculture-related
  if (!isAgricultureRelated(userMessage)) {
    return {
      reply: 'I can only help with agriculture-related queries. Please ask about crops, soil, irrigation, fertilizers, pests, or farming practices.',
      isAgriculture: false,
    };
  }

  const apiKey = process.env.OPENAI_API_KEY;

  // Fallback if no API key configured
  if (!apiKey) {
    console.warn('[aiService] OPENAI_API_KEY not set. Using fallback response.');
    return {
      reply: getFallbackResponse(userMessage),
      isAgriculture: true,
    };
  }

  try {
    // Build messages array with system prompt + history + current message
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.slice(-6).map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      })),
      { role: 'user', content: userMessage },
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages,
        temperature: 0.7,
        max_tokens: 800,
        top_p: 0.9,
        frequency_penalty: 0.2,
        presence_penalty: 0.1,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[aiService] OpenAI API error:', response.status, errorData);
      throw new Error(errorData.error?.message || `OpenAI API returned ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      throw new Error('Empty response from OpenAI');
    }

    return {
      reply,
      isAgriculture: true,
    };
  } catch (error) {
    console.error('[aiService] Error:', error.message);
    return {
      reply: 'Sorry, the AI assistant is temporarily unavailable. Please try again later.',
      isAgriculture: true,
      error: true,
    };
  }
};

/**
 * Generate a fallback response when OpenAI API key is not configured.
 * Uses simple rule-based matching for common agricultural queries.
 */
function getFallbackResponse(message) {
  const lower = message.toLowerCase();

  if (lower.includes('rice')) {
    return 'For rice cultivation in India, choose varieties like Basmati or Sona Masoori based on your region. Rice needs clay-loam soil with good water retention. Transplant seedlings after 25-30 days in the nursery. Apply NPK fertilizer in splits. Keep the field flooded during the vegetative stage.';
  }
  if (lower.includes('wheat')) {
    return 'Wheat is a Rabi crop sown from October to December. It grows best in loamy soil with moderate rainfall. Use high-yielding varieties like HD-2967 or PBW-343. Apply 120kg N, 60kg P, 40kg K per hectare. Irrigate at crown root initiation and flowering stages.';
  }
  if (lower.includes('tomato')) {
    return 'Tomatoes need well-drained sandy loam soil with pH 6.0-7.0. Start seeds in a nursery and transplant after 4-5 weeks. Maintain 60-70cm spacing. Apply compost and NPK fertilizer. Watch for early blight and tomato leaf curl virus. Stake plants for better yield.';
  }
  if (lower.includes('pest') || lower.includes('insect')) {
    return 'For pest control, try integrated pest management (IPM): 1) Use neem-based bio-pesticides, 2) Install pheromone traps, 3) Release beneficial insects like Trichogramma, 4) Practice crop rotation, 5) Use resistant varieties. For severe infestations, consult your local KVK before using chemical pesticides.';
  }
  if (lower.includes('fertilizer')) {
    return 'Fertilizer choice depends on soil test results. Generally: NPK 10-26-26 for basal application, Urea for top dressing. Consider organic options like farmyard manure (FYM), vermicompost, and green manure. Use biofertilizers like Rhizobium and Azotobacter to reduce chemical dependency.';
  }
  if (lower.includes('irrigation') || lower.includes('water')) {
    return 'Efficient irrigation methods: Drip irrigation saves 40-60% water compared to flood irrigation. Sprinkler suits most field crops. For water-scarce areas, consider micro-sprinklers or pitcher irrigation. Schedule irrigation based on crop growth stage - critical stages need maximum water.';
  }
  if (lower.includes('disease')) {
    return 'For disease management: 1) Use certified disease-free seeds, 2) Practice crop rotation, 3) Maintain proper spacing for airflow, 4) Remove and destroy infected plants, 5) Apply Bordeaux mixture or copper fungicides as preventive sprays. For specific diseases, send photos to your nearest KVK for identification.';
  }
  if (lower.includes('organic')) {
    return 'Organic farming tips: Use compost and vermicompost as manure, practice green manuring with dhaincha or sunhemp, use bio-pesticides (neem, trichoderma), adopt crop rotation, and use biocontrol agents. Get organic certification from APEDA or your state organic board for better market prices.';
  }

  return 'Thank you for your question. For the best advice, please provide more details about your crop type, soil condition, and location. You can also visit your nearest Krishi Vigyan Kendra (KVK) for personalized guidance.';
}

export default { getAIResponse, isAgricultureRelated };

