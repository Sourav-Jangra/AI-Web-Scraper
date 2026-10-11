const crypto = require('crypto');

/**
 * Safe In-Memory Summary Cache with configurable short TTL (default: 5 minutes / 300 seconds).
 * Caches normalized public URL summaries to reduce latency and duplicate AI request load.
 * Note: Instance-local, temporary in-memory storage. Failed requests are never cached.
 */
class SummaryCache {
  constructor(ttlMs = 5 * 60 * 1000, maxItems = 100) {
    this.ttlMs = ttlMs;
    this.maxItems = maxItems;
    this.cache = new Map();
  }

  /**
   * Normalizes URL string to prevent cache key fragmentation (e.g. trailing slashes, case).
   */
  normalizeUrl(urlString) {
    try {
      const parsed = new URL(urlString.trim());
      // Remove trailing slash if path is /
      let cleanUrl = `${parsed.protocol}//${parsed.hostname.toLowerCase()}${parsed.port ? ':' + parsed.port : ''}${parsed.pathname}`;
      if (cleanUrl.endsWith('/') && cleanUrl.length > 8) {
        cleanUrl = cleanUrl.slice(0, -1);
      }
      if (parsed.search) {
        cleanUrl += parsed.search;
      }
      return cleanUrl;
    } catch (e) {
      return urlString.trim().toLowerCase();
    }
  }

  get(url) {
    const key = this.normalizeUrl(url);
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  set(url, data) {
    if (!url || !data) return;

    // Enforce max item eviction (FIFO)
    if (this.cache.size >= this.maxItems) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    const key = this.normalizeUrl(url);
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + this.ttlMs
    });
  }

  clear() {
    this.cache.clear();
  }
}

// Export singleton instance with 5 min TTL
module.exports = new SummaryCache();
