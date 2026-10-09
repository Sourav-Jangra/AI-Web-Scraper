const { GoogleGenAI } = require('@google/genai');
const OpenAI = require('openai');

/**
 * Helper to determine if an error qualifies for Groq Fallback:
 * - Rate limit (429)
 * - Service unavailable / timeout (503 / 504)
 * - Model not found / access denied (404 / specific model error)
 * 
 * Must NOT trigger fallback for:
 * - Bad API keys (401 / 403)
 * - Malformed client input / bad prompt (400)
 */
function isFallbackEligibleError(err) {
  if (!err) return false;

  const status = err.status || (err.response && err.response.status);
  const msg = (err.message || '').toLowerCase();

  // Explicit Auth / Invalid Key checks -> Fail fast
  if (status === 401 || status === 403 || msg.includes('invalid api key') || msg.includes('api_key_invalid') || msg.includes('unauthorized')) {
    return false;
  }

  // Explicit Bad Client Input checks -> Fail fast
  if (status === 400 && !msg.includes('model') && !msg.includes('not found')) {
    return false;
  }

  // Eligible errors for fallback
  if (status === 429 || status === 503 || status === 504 || status === 404) {
    return true;
  }

  if (msg.includes('quota') || msg.includes('rate limit') || msg.includes('resource_exhausted') || msg.includes('overloaded') || msg.includes('model not found') || msg.includes('not_found')) {
    return true;
  }

  return false;
}

/**
 * Summarizes extracted text using Google Gemini API with fallback to Groq API.
 * @param {string} text 
 * @param {string} pageTitle 
 * @returns {Promise<{ summary: string, providerUsed: string, modelUsed: string }>}
 */
async function generateSummary(text, pageTitle = '') {
  const primaryProvider = process.env.AI_PROVIDER || 'gemini';
  const primaryModel = process.env.AI_MODEL || 'gemini-3.8-flash';
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const groqApiKey = process.env.GROQ_API_KEY;
  const groqModel = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

  const systemPrompt = `You are a professional AI web content summarizer. 
Summarize the provided webpage text concisely.
Format your output cleanly into:
1. A 2-3 sentence Executive Overview.
2. 3-5 key bullet point takeaways.
Keep the tone informative, neutral, and direct.`;

  const userContent = `Page Title: "${pageTitle}"\n\nWebpage Text:\n${text}`;

  // Helper for Gemini call
  async function callGemini() {
    if (!geminiApiKey || geminiApiKey.trim() === '' || geminiApiKey === 'your_google_ai_studio_api_key_here') {
      const err = new Error('Gemini API key is missing or unconfigured.');
      err.status = 401;
      throw err;
    }

    const ai = new GoogleGenAI({ apiKey: geminiApiKey });
    const response = await ai.models.generateContent({
      model: primaryModel,
      contents: [
        { role: 'user', parts: [{ text: `${systemPrompt}\n\n${userContent}` }] }
      ]
    });

    const summaryText = response.text || (response.candidates && response.candidates[0]?.content?.parts[0]?.text);
    if (!summaryText) {
      throw new Error('Gemini API returned empty response.');
    }

    return {
      summary: summaryText.trim(),
      providerUsed: 'Google Gemini',
      modelUsed: primaryModel
    };
  }

  // Helper for Groq call
  async function callGroq() {
    if (!groqApiKey || groqApiKey.trim() === '' || groqApiKey === 'your_groq_api_key_here') {
      const err = new Error('Groq API key is missing or unconfigured.');
      err.status = 401;
      throw err;
    }

    const groqClient = new OpenAI({
      apiKey: groqApiKey,
      baseURL: 'https://api.groq.com/openai/v1'
    });

    const completion = await groqClient.chat.completions.create({
      model: groqModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent }
      ],
      temperature: 0.5,
      max_tokens: 800
    });

    const summaryText = completion.choices[0]?.message?.content;
    if (!summaryText) {
      throw new Error('Groq API returned empty response.');
    }

    return {
      summary: summaryText.trim(),
      providerUsed: 'Groq AI (Fallback)',
      modelUsed: groqModel
    };
  }

  // Execution Flow
  if (primaryProvider === 'gemini') {
    try {
      return await callGemini();
    } catch (primaryErr) {
      // Check if eligible for fallback
      if (isFallbackEligibleError(primaryErr) && groqApiKey && groqApiKey !== 'your_groq_api_key_here') {
        try {
          return await callGroq();
        } catch (fallbackErr) {
          // Both failed -> throw sanitized double-failure error
          const err = new Error('AI service is currently unavailable. Both primary and fallback AI providers failed.');
          err.isSanitized = true;
          throw err;
        }
      }

      // If auth failed, bad request, or fallback not available / not eligible
      if (primaryErr.status === 401 || primaryErr.status === 403) {
        const err = new Error('AI Provider authentication failed. Please check backend API key configuration.');
        err.isSanitized = true;
        throw err;
      }

      const err = new Error(primaryErr.isSanitized ? primaryErr.message : `AI Provider Error: ${primaryErr.message}`);
      err.isSanitized = true;
      throw err;
    }
  } else if (primaryProvider === 'groq') {
    try {
      return await callGroq();
    } catch (err) {
      const sanitizedErr = new Error(`Groq AI Provider Error: ${err.message}`);
      sanitizedErr.isSanitized = true;
      throw sanitizedErr;
    }
  } else {
    throw new Error(`Unsupported AI_PROVIDER: ${primaryProvider}`);
  }
}

module.exports = {
  generateSummary,
  isFallbackEligibleError
};
