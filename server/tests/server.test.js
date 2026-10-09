const request = require('supertest');
const app = require('../src/index');
const { isPrivateIp, validateUrlSecurity } = require('../src/utils/urlSecurity');
const { isFallbackEligibleError } = require('../src/utils/aiSummarizer');

describe('Full-Stack AI Web Scraper Backend Test Suite', () => {

  describe('1. SSRF & URL Security Tests', () => {
    test('should correctly identify private and loopback IP addresses', () => {
      expect(isPrivateIp('127.0.0.1')).toBe(true);
      expect(isPrivateIp('10.0.0.5')).toBe(true);
      expect(isPrivateIp('172.16.0.1')).toBe(true);
      expect(isPrivateIp('192.168.1.1')).toBe(true);
      expect(isPrivateIp('169.254.169.254')).toBe(true);
      expect(isPrivateIp('::1')).toBe(true);
      expect(isPrivateIp('0.0.0.0')).toBe(true);
      expect(isPrivateIp('8.8.8.8')).toBe(false);
      expect(isPrivateIp('1.1.1.1')).toBe(false);
    });

    test('should reject non-HTTP protocols', async () => {
      const result = await validateUrlSecurity('ftp://files.example.com');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Only HTTP and HTTPS');
    });

    test('should reject localhost and internal hostnames', async () => {
      const localResult = await validateUrlSecurity('http://localhost:5000/api');
      expect(localResult.isValid).toBe(false);

      const loopbackResult = await validateUrlSecurity('http://127.0.0.1:8080');
      expect(loopbackResult.isValid).toBe(false);
    });
  });

  describe('2. AI Fallback Eligibility Logic Tests', () => {
    test('should trigger fallback for 429 rate limit errors', () => {
      const err = new Error('Rate limit reached');
      err.status = 429;
      expect(isFallbackEligibleError(err)).toBe(true);
    });

    test('should trigger fallback for 503 service unavailable errors', () => {
      const err = new Error('Service Unavailable');
      err.status = 503;
      expect(isFallbackEligibleError(err)).toBe(true);
    });

    test('should trigger fallback for 404 model not found errors', () => {
      const err = new Error('Model not found');
      err.status = 404;
      expect(isFallbackEligibleError(err)).toBe(true);
    });

    test('should NOT trigger fallback for 401/403 invalid API key errors', () => {
      const err = new Error('Invalid API key provided');
      err.status = 401;
      expect(isFallbackEligibleError(err)).toBe(false);
    });

    test('should NOT trigger fallback for general 400 bad client requests', () => {
      const err = new Error('Bad request parameters');
      err.status = 400;
      expect(isFallbackEligibleError(err)).toBe(false);
    });
  });

  describe('3. API Endpoint Input Validation & Error Masking', () => {
    test('GET /api/health should return ok', async () => {
      const res = await request(app).get('/api/health');
      expect(res.statusCode).toEqual(200);
      expect(res.body.status).toEqual('ok');
    });

    test('POST /api/summarize without URL should return 400', async () => {
      const res = await request(app)
        .post('/api/summarize')
        .send({});
      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('valid webpage URL');
    });

    test('POST /api/summarize with SSRF forbidden URL should return 400 without internal details', async () => {
      const res = await request(app)
        .post('/api/summarize')
        .send({ url: 'http://169.254.169.254/latest/meta-data' });
      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('forbidden');
      expect(res.body.stack).toBeUndefined();
    });
  });

});
