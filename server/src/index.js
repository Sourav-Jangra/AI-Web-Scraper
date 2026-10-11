const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { validateUrlSecurity } = require('./utils/urlSecurity');
const { scrapeWebpage } = require('./utils/scraper');
const { generateSummary } = require('./utils/aiSummarizer');
const summaryCache = require('./utils/summaryCache');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    return callback(new Error('CORS policy does not allow access from specified origin.'));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Healthcheck endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'AI Web Scraper API'
  });
});

// Primary summarize endpoint
app.post('/api/summarize', async (req, res, next) => {
  const startTime = Date.now();
  try {
    const { url } = req.body;

    // 1. Initial input validation
    if (!url || typeof url !== 'string' || url.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid webpage URL.'
      });
    }

    const trimmedUrl = url.trim();

    // 2. Check in-memory summary cache
    const cachedResult = summaryCache.get(trimmedUrl);
    if (cachedResult) {
      const cacheHitTime = Date.now() - startTime;
      console.log(`[CACHE HIT] Served summary for ${trimmedUrl} in ${cacheHitTime}ms`);
      return res.json({
        success: true,
        data: {
          ...cachedResult,
          cached: true,
          timing: { totalMs: cacheHitTime, cached: true }
        }
      });
    }

    // 3. SSRF Security pre-check
    const securityCheck = await validateUrlSecurity(trimmedUrl);
    if (!securityCheck.isValid) {
      return res.status(400).json({
        success: false,
        error: securityCheck.error || 'Invalid or forbidden URL.'
      });
    }

    // 4. Measure Web Scraping Time
    const fetchStart = Date.now();
    const scrapedData = await scrapeWebpage(trimmedUrl);
    const fetchTimeMs = Date.now() - fetchStart;

    // 5. Measure AI Generation Time
    const aiStart = Date.now();
    const summaryResult = await generateSummary(scrapedData.text, scrapedData.title);
    const aiTimeMs = Date.now() - aiStart;

    const totalTimeMs = Date.now() - startTime;

    // Safe backend logging (no API keys, sensitive content, or private IP details logged)
    console.log(`[METRICS] Scraped ${scrapedData.text.length} chars in ${fetchTimeMs}ms | Generated AI summary in ${aiTimeMs}ms | Total: ${totalTimeMs}ms`);

    const resultData = {
      url: scrapedData.url,
      title: scrapedData.title,
      summary: summaryResult.summary,
      provider: summaryResult.providerUsed,
      model: summaryResult.modelUsed,
      charCount: scrapedData.text.length,
      cached: false,
      timing: {
        fetchMs: fetchTimeMs,
        aiMs: aiTimeMs,
        totalMs: totalTimeMs
      }
    };

    // Store successful result in cache (5-minute TTL)
    summaryCache.set(trimmedUrl, resultData);

    // 6. Success Response
    res.json({
      success: true,
      data: resultData
    });

  } catch (err) {
    next(err);
  }
});

// Centralized error handling
app.use(errorHandler);

// Only start listening if executed directly (not required by tests)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
