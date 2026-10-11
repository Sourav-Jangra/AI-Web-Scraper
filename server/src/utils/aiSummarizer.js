const { GoogleGenAI } = require('@google/genai');
const OpenAI = require('openai');

/**
 * Helper to extract status code and message from various Google GenAI SDK & API error structures:
 */
function extractErrorInfo(err) {
  if (!err) return { status: 500, message: '', rawText: '' };

  let status = err.status || err.statusCode || err.code || (err.response && (err.response.status || err.response.statusCode));
  let message = err.message || '';
  let rawText = (message + ' ' + (err.errorDetails || '')).toLowerCase();

  // Try parsing JSON embedded in err.message
  if (message && typeof message === 'string' && message.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(message);
      if (parsed && parsed.error) {
        if (parsed.error.code) status = parsed.error.code;
        if (parsed.error.message) message = parsed.error.message;
        if (parsed.error.status) rawText += ' ' + parsed.error.status.toLowerCase();
      }
    } catch (e) {
      // Ignore JSON parse failure and proceed with string matching
    }
  }

  if (typeof status === 'string' && !isNaN(Number(status))) {
    status = Number(status);
  }

  return { status, message, rawText };
}

/**
 * Helper to determine if an error qualifies for Groq Fallback:
 */
function isFallbackEligibleError(err) {
  if (!err) return false;

  const { status, rawText } = extractErrorInfo(err);

  // Explicit Auth / Invalid Key checks -> Fail fast
  if (
    status === 401 ||
    status === 403 ||
    rawText.includes('invalid api key') ||
    rawText.includes('api_key_invalid') ||
    rawText.includes('unauthorized') ||
    rawText.includes('permission_denied')
  ) {
    return false;
  }

  // Explicit Bad Client Input checks -> Fail fast
  if (
    status === 400 &&
    !rawText.includes('model') &&
    !rawText.includes('not found') &&
    !rawText.includes('unavailable')
  ) {
    return false;
  }

  // Eligible status codes for fallback
  if (status === 429 || status === 503 || status === 504 || status === 404) {
    return true;
  }

  // Eligible keyword / status string matches
  if (
    rawText.includes('unavailable') ||
    rawText.includes('high demand') ||
    rawText.includes('quota') ||
    rawText.includes('rate limit') ||
    rawText.includes('resource_exhausted') ||
    rawText.includes('overloaded') ||
    rawText.includes('model not found') ||
    rawText.includes('not_found') ||
    rawText.includes('try again later')
  ) {
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

  const systemPrompt = `You are a professional AI web content analyst.
Summarize the provided webpage content into clear, well-structured Markdown.

Format your output into the following sections when applicable:
### Executive Overview
Provide a concise 2-3 sentence summary capturing the core premise or main takeaway.

### Key Takeaways
Use a bulleted list to highlight 3-5 primary points or major findings.

### Important Details
Highlight essential facts, names, figures, key data points, or dates mentioned in the source content. Avoid fluff.

### Practical Conclusions
Provide a 1-2 sentence concluding synthesis or practical implication.

Rules:
- Base facts strictly on the provided text. Never invent facts or make unsupported claims.
- Keep the language crisp, direct, and professional.
- Do not add meta-commentary like "Here is the summary". Start directly with ### Executive Overview.`;

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
      const isGroqConfigured = groqApiKey && groqApiKey.trim() !== '' && groqApiKey !== 'your_groq_api_key_here';
      
      if (isFallbackEligibleError(primaryErr)) {
        if (isGroqConfigured) {
          try {
            return await callGroq();
          } catch (fallbackErr) {
            const err = new Error('AI service is currently experiencing high demand. Both primary and fallback AI providers failed.');
            err.status = 503;
            err.isSanitized = true;
            throw err;
          }
        } else {
          const err = new Error('The primary AI model is currently experiencing high demand (HTTP 503). Please try again in a few moments, or configure GROQ_API_KEY in server/.env for automatic fallback.');
          err.status = 503;
          err.isSanitized = true;
          throw err;
        }
      }

      const { status } = extractErrorInfo(primaryErr);
      if (status === 401 || status === 403) {
        const err = new Error('AI Provider authentication failed. Please check backend API key configuration.');
        err.status = 401;
        err.isSanitized = true;
        throw err;
      }

      const err = new Error(primaryErr.isSanitized ? primaryErr.message : `AI Provider Error: ${primaryErr.message}`);
      err.status = status || 500;
      err.isSanitized = true;
      throw err;
    }
  } else if (primaryProvider === 'groq') {
    try {
      return await callGroq();
    } catch (err) {
      const sanitizedErr = new Error(`Groq AI Provider Error: ${err.message}`);
      sanitizedErr.status = err.status || 500;
      sanitizedErr.isSanitized = true;
      throw sanitizedErr;
    }
  } else {
    throw new Error(`Unsupported AI_PROVIDER: ${primaryProvider}`);
  }
}

module.exports = {
  generateSummary,
  isFallbackEligibleError,
  extractErrorInfo
};
