const { extractSignatureFromUserCode } = require('../../compiler/signatureExtractor');
const { CppPrintHelpers } = require('../../compiler/printHelpers');
const { CppComparisonEngine } = require('../../compiler/comparisonEngine');
const { CppLiteralGenerator } = require('../../compiler/literalGenerator');
const { CppWrapperGenerator } = require('../../compiler/wrapperGenerator');
const { CppTestcaseRunner } = require('../../compiler/testcaseRunner');

const cacheService = require('./cacheService');
const queueService = require('./queueService');
const submissionService = require('./submissionService');
const statsService = require('./statsService');

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

async function executeTests(userCode, sig, testCases, language = 'cpp', metadata = {}) {
  const runner = runners[language];
  if (!runner) {
    return {
      status: 'completed',
      result: {
        success: false,
        status: 'Runtime Error',
        errorType: 'runtime_error',
        errorMessage: `Unsupported language execution: "${language}"`,
        results: [],
        totalPassed: 0,
        total: testCases.length,
        allPassed: false
      }
    };
  }

  // 1. Generate Cache Key using SHA-256 (includes Wrapper Version)
  const cacheKey = cacheService.generateKey(userCode, testCases, language);

  // 2. Check LRU Cache
  const cachedResult = cacheService.get(cacheKey);
  if (cachedResult) {
    return {
      status: 'completed',
      result: cachedResult
    };
  }

  // 3. Cache Miss: generate submission ID & return immediately
  const submissionId = require('uuid').v4();

  // Spawn enqueued task in background
  const taskFn = async () => {
    const activeSignature = extractSignatureFromUserCode(userCode, sig);
    
    // Callback to update status inside compiler execution
    const onCompilerStatus = (compilerStatus) => {
      submissionService.updateStatus(submissionId, compilerStatus);
    };

    const runResult = await runner.run(submissionId, userCode, activeSignature, testCases, onCompilerStatus);

    // Sanitize hidden test inputs
    if (runResult && Array.isArray(runResult.results)) {
      runResult.results = runResult.results.map(r =>
        r.isHidden ? { ...r, input: '[Hidden Test Case]' } : r
      );
    }

    // Merge metadata
    Object.assign(runResult, metadata);
    return runResult;
  };

  // Run async queue process
  const queuePromise = queueService.enqueue(taskFn, submissionId);
  const submission = submissionService.createSubmission(submissionId);

  queuePromise
    .then((runResult) => {
      // Record verdict statistics
      statsService.recordVerdict(runResult.status);

      // Cache only appropriate results (Not compilation errors)
      const isCacheable = runResult.success === true ||
        ['time_limit', 'runtime_error'].includes(runResult.errorType);

      if (isCacheable) {
        cacheService.set(cacheKey, runResult);
      }

      submissionService.updateStatus(submissionId, 'completed', { result: runResult });
    })
    .catch((err) => {
      const errResponse = {
        success: false,
        status: err.statusCode === 429 ? 'Server Busy' : (err.statusCode === 504 ? 'Queue Timeout' : 'Internal Error'),
        errorType: err.statusCode === 429 ? 'server_busy' : (err.statusCode === 504 ? 'queue_timeout' : 'internal_error'),
        errorMessage: err.message,
        results: [],
        totalPassed: 0,
        total: testCases.length,
        allPassed: false
      };

      Object.assign(errResponse, metadata);

      if (err.statusCode === 504) {
        statsService.recordVerdict('Time Limit Exceeded');
      }

      submissionService.updateStatus(submissionId, 'failed', { error: errResponse });
    });

  return {
    status: 'queued',
    submissionId,
    position: submission.position,
    estimatedWait: submission.estimatedWait
  };
}

function getSubmissionStatus(submissionId) {
  return submissionService.getSubmission(submissionId);
}

function addSubmissionListener(submissionId, listenerFn) {
  submissionService.addListener(submissionId, listenerFn);
}

function removeSubmissionListener(submissionId, listenerFn) {
  submissionService.removeListener(submissionId, listenerFn);
}

function getStats() {
  return statsService.getStatsReport(cacheService.size(), queueService.getStatus());
}

module.exports = {
  executeTests,
  getSubmissionStatus,
  addSubmissionListener,
  removeSubmissionListener,
  getStats
};
