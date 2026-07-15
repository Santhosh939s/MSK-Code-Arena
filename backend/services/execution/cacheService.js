const crypto = require('crypto');
const statsService = require('./statsService');

const MAX_CACHE_SIZE = parseInt(process.env.MAX_CACHE_SIZE || '100', 10);
const CACHE_TTL_MS = parseInt(process.env.CACHE_TTL_MS || '1800000', 10); // 30 minutes
const WRAPPER_VERSION = process.env.WRAPPER_VERSION || 'v1';

class CacheService {
  constructor() {
    this.cache = new Map();
    // Sweep expired entries every 5 minutes
    setInterval(() => this.cleanupExpired(), 300000);
  }

  generateKey(userCode, testCases, language) {
    const hashInput = userCode + JSON.stringify(testCases) + language + WRAPPER_VERSION;
    return crypto.createHash('sha256').update(hashInput).digest('hex');
  }

  get(key) {
    if (!this.cache.has(key)) {
      statsService.recordMiss();
      return null;
    }

    const entry = this.cache.get(key);
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      statsService.recordMiss();
      return null;
    }

    // Refresh key order (LRU)
    this.cache.delete(key);
    this.cache.set(key, entry);
    statsService.recordHit();
    return entry.val;
  }

  set(key, val) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= MAX_CACHE_SIZE) {
      // Evict oldest (first key in map)
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      val,
      expiresAt: Date.now() + CACHE_TTL_MS
    });
  }

  cleanupExpired() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  size() {
    return this.cache.size;
  }
}

module.exports = new CacheService();
