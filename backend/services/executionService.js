// ── MSK Code Arena — Execution Service (Orchestrator) ─────────────────────────
// Orchestrates multi-language parsing, wrapper generation, compiling, and testing.

const crypto = require('crypto');
const { extractSignatureFromUserCode } = require('../compiler/signatureExtractor');
const { CppPrintHelpers } = require('../compiler/printHelpers');
const { CppComparisonEngine } = require('../compiler/comparisonEngine');
const { CppLiteralGenerator } = require('../compiler/literalGenerator');
const { CppWrapperGenerator } = require('../compiler/wrapperGenerator');
const { CppTestcaseRunner } = require('../compiler/testcaseRunner');

// Configuration from env variables
const MAX_CONCURRENT_COMPILATIONS = parseInt(process.env.MAX_CONCURRENT_COMPILATIONS || '2', 10);
const MAX_CACHE_SIZE = parseInt(process.env.MAX_CACHE_SIZE || '100', 10);
const MAX_QUEUE_LENGTH = parseInt(process.env.MAX_QUEUE_LENGTH || '20', 10);
const QUEUE_TIMEOUT_MS = parseInt(process.env.QUEUE_TIMEOUT_MS || '30000', 10);

// Global Stats Tracker
const stats = {
  cacheHits: 0,
  cacheMisses: 0,
  totalExecutions: 0,
  queueRejections: 0,
  queueTimeouts: 0
};

class SimpleLRUCache {
  constructor(maxSize) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) return null;
    const val = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, val);
    return val;
  }

  set(key, val) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    this.cache.set(key, val);
  }

  size() {
    return this.cache.size;
  }
}

class ExecutionQueue {
  constructor(maxConcurrent, maxQueueLength, timeoutMs) {
    this.maxConcurrent = maxConcurrent;
    this.maxQueueLength = maxQueueLength;
    this.timeoutMs = timeoutMs;
    this.running = 0;
    this.queue = [];
  }

  enqueue(taskFn) {
    if (this.queue.length >= this.maxQueueLength) {
      stats.queueRejections++;
      const err = new Error('Server busy. Too many submissions in queue. Please try again.');
      err.statusCode = 429;
      return Promise.reject(err);
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        const index = this.queue.findIndex(item => item.resolve === resolve);
        if (index !== -1) {
          this.queue.splice(index, 1);
          stats.queueTimeouts++;
          const err = new Error('Request timed out in compilation queue. Please try again.');
          err.statusCode = 504;
          reject(err);
        }
      }, this.timeoutMs);

      this.queue.push({ taskFn, resolve, reject, timeout });
      this.processNext();
    });
  }

  async processNext() {
    if (this.running >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    this.running++;
    const { taskFn, resolve, reject, timeout } = this.queue.shift();
    clearTimeout(timeout);

    try {
      const result = await taskFn();
      resolve(result);
    } catch (err) {
      reject(err);
    } finally {
      this.running--;
      this.processNext();
    }
  }

  getQueueStatus() {
    return {
      activeRunning: this.running,
      queuedTasks: this.queue.length
    };
  }
}

const compilationCache = new SimpleLRUCache(MAX_CACHE_SIZE);
const executionQueue = new ExecutionQueue(MAX_CONCURRENT_COMPILATIONS, MAX_QUEUE_LENGTH, QUEUE_TIMEOUT_MS);

// Multi-language runner registry
const runners = {
  cpp: (() => {
    const literalGen = new CppLiteralGenerator();
    const printHelpers = new CppPrintHelpers();
    const comparisonEng = new CppComparisonEngine(literalGen);
    const wrapperGen = new CppWrapperGenerator(printHelpers, comparisonEng, literalGen);
    return new CppTestcaseRunner(wrapperGen);
  })()
};

async function executeTests(userCode, sig, testCases, language = 'cpp') {
  const runner = runners[language];
  if (!runner) {
    return {
      success: false,
      status: 'Runtime Error',
      errorType: 'runtime_error',
      errorMessage: `Unsupported language execution: "${language}"`,
      results: [],
      totalPassed: 0,
      total: testCases.length,
      allPassed: false
    };
  }

  // 1. Generate Cache Key using SHA-256
  const hashInput = userCode + JSON.stringify(testCases) + language;
  const cacheKey = crypto.createHash('sha256').update(hashInput).digest('hex');

  // 2. Check LRU Cache
  const cachedResult = compilationCache.get(cacheKey);
  if (cachedResult) {
    stats.cacheHits++;
    return cachedResult;
  }
  stats.cacheMisses++;

  // 3. Queue execution
  const taskFn = async () => {
    stats.totalExecutions++;
    const activeSignature = extractSignatureFromUserCode(userCode, sig);
    const id = require('uuid').v4();
    return await runner.run(id, userCode, activeSignature, testCases);
  };

  try {
    const runResult = await executionQueue.enqueue(taskFn);

    // 4. Cache only appropriate deterministic results
    const isCacheable = runResult.success === true ||
      ['compile_error', 'time_limit', 'runtime_error'].includes(runResult.errorType);

    if (isCacheable) {
      compilationCache.set(cacheKey, runResult);
    }

    return runResult;
  } catch (err) {
    if (err.statusCode) {
      return {
        success: false,
        status: err.statusCode === 429 ? 'Server Busy' : 'Queue Timeout',
        errorType: err.statusCode === 429 ? 'server_busy' : 'queue_timeout',
        errorMessage: err.message,
        results: [],
        totalPassed: 0,
        total: testCases.length,
        allPassed: false
      };
    }
    throw err;
  }
}

function getStats() {
  const queueStatus = executionQueue.getQueueStatus();
  return {
    cacheHits: stats.cacheHits,
    cacheMisses: stats.cacheMisses,
    cacheSize: compilationCache.size(),
    totalExecutions: stats.totalExecutions,
    queueRejections: stats.queueRejections,
    queueTimeouts: stats.queueTimeouts,
    activeRunning: queueStatus.activeRunning,
    queuedTasks: queueStatus.queuedTasks,
    config: {
      maxConcurrent: MAX_CONCURRENT_COMPILATIONS,
      maxCacheSize: MAX_CACHE_SIZE,
      maxQueueLength: MAX_QUEUE_LENGTH,
      queueTimeoutMs: QUEUE_TIMEOUT_MS
    }
  };
}

module.exports = {
  executeTests,
  getStats
};
