const axios = require('axios');
const cheerio = require('cheerio');
const { validateUrlSecurity } = require('./urlSecurity');

const DEFAULT_TIMEOUT_MS = 10000; // 10 seconds timeout
const MAX_BYTE_SIZE = 2 * 1024 * 1024; // 2 MB max response size
const MAX_TEXT_LENGTH = 6000; // ~6000 character limit for summary extraction
const MAX_REDIRECTS = 3;

/**
 * Fetches HTML from target URL with redirect re-validation, timeout, size limits, and Cheerio text extraction.
 * @param {string} targetUrl 
 * @returns {Promise<{ title: string, text: string, url: string }>}
 */
async function scrapeWebpage(targetUrl) {
  let currentUrl = targetUrl;
  let redirectCount = 0;

  while (redirectCount <= MAX_REDIRECTS) {
    // 1. Validate security of the current URL (SSRF & DNS check)
    const securityCheck = await validateUrlSecurity(currentUrl);
    if (!securityCheck.isValid) {
      throw new Error(securityCheck.error || 'Security check failed for URL.');
    }

    try {
      // 2. Perform HTTP request with custom options
      const response = await axios({
        method: 'get',
        url: currentUrl,
        timeout: DEFAULT_TIMEOUT_MS,
        maxContentLength: MAX_BYTE_SIZE,
        maxBodyLength: MAX_BYTE_SIZE,
        maxRedirects: 0, // Handle redirects manually for security re-validation
        validateStatus: (status) => (status >= 200 && status < 300) || (status >= 300 && status < 400),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 AI-Web-Scraper/1.0',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5'
        },
        responseType: 'text'
      });

      // Handle Redirects (3xx)
      if (response.status >= 300 && response.status < 400) {
        const redirectLocation = response.headers['location'];
        if (!redirectLocation) {
          throw new Error('Target server returned redirect status without Location header.');
        }

        redirectCount++;
        if (redirectCount > MAX_REDIRECTS) {
          throw new Error(`Exceeded maximum allowed redirects (${MAX_REDIRECTS}).`);
        }

        // Resolve relative redirect paths
        currentUrl = new URL(redirectLocation, currentUrl).toString();
        continue;
      }

      // Check Content-Type header to ensure response is HTML
      const contentType = response.headers['content-type'] || '';
      if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
        throw new Error('Target page is not an HTML webpage (received content-type: ' + (contentType.split(';')[0] || 'unknown') + ').');
      }

      const htmlContent = response.data;
      if (!htmlContent || typeof htmlContent !== 'string' || htmlContent.trim().length === 0) {
        throw new Error('Target webpage returned empty response.');
      }

      // 3. Parse with Cheerio
      const $ = cheerio.load(htmlContent);

      // Extract document title
      const pageTitle = $('title').text().trim() || $('h1').first().text().trim() || 'Untitled Webpage';

      // Remove non-content elements
      $('script, style, noscript, iframe, svg, nav, footer, header, form, button, [role="navigation"], [role="banner"]').remove();

      // Extract text content from main elements or body
      let mainText = $('main, article, #content, .content, body').text();

      // Normalize whitespace
      mainText = mainText
        .replace(/[\r\n\t]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (mainText.length < 50) {
        throw new Error('Webpage contains insufficient readable text content to generate a summary.');
      }

      // Truncate text to limit token usage and latency
      const truncatedText = mainText.length > MAX_TEXT_LENGTH
        ? mainText.substring(0, MAX_TEXT_LENGTH) + '...'
        : mainText;

      return {
        title: pageTitle,
        text: truncatedText,
        url: currentUrl
      };

    } catch (err) {
      if (err.message && err.message.startsWith('Security check failed')) {
        throw err;
      }

      if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
        throw new Error('Request timed out while trying to fetch the webpage (limit: 10 seconds).');
      }

      if (err.response) {
        const status = err.response.status;
        if (status === 401 || status === 403) {
          throw new Error('Access denied by target website (HTTP ' + status + '). Automated request blocked.');
        }
        if (status === 404) {
          throw new Error('Webpage not found (HTTP 404). Please check the URL.');
        }
        if (status === 429) {
          throw new Error('Target website rate-limited automated requests (HTTP 429).');
        }
        if (status >= 500) {
          throw new Error(`Target website server error (HTTP ${status}).`);
        }
      }

      if (err.message && (err.message.includes('maxContentLength') || err.message.includes('maxBodyLength'))) {
        throw new Error('Webpage content exceeds maximum allowed size limit of 2MB.');
      }

      throw new Error(err.message || 'Failed to fetch webpage content.');
    }
  }

  throw new Error('Failed to resolve URL after maximum redirects.');
}

module.exports = {
  scrapeWebpage
};
