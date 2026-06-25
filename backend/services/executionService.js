// ── MSK Code Arena — Execution Service (Orchestrator) ─────────────────────────
// Orchestrates multi-language parsing, wrapper generation, compiling, and testing.

const { extractSignatureFromUserCode } = require('../compiler/signatureExtractor');
const { CppPrintHelpers } = require('../compiler/printHelpers');
const { CppComparisonEngine } = require('../compiler/comparisonEngine');
const { CppLiteralGenerator } = require('../compiler/literalGenerator');
const { CppWrapperGenerator } = require('../compiler/wrapperGenerator');
const { CppTestcaseRunner } = require('../compiler/testcaseRunner');

// Multi-language runner registry
const runners = {
  cpp: (() => {
    const literalGen = new CppLiteralGenerator();
    const printHelpers = new CppPrintHelpers();
    const comparisonEng = new CppComparisonEngine(literalGen);
    const wrapperGen = new CppWrapperGenerator(printHelpers, comparisonEng, literalGen);
    return new CppTestcaseRunner(wrapperGen);
  })()
  // Extensible: support for python, java, etc. can be registered here.
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

  // 1. Dynamically extract function name, return type, and params from the user's submitted code
  const activeSignature = extractSignatureFromUserCode(userCode, sig);

  // 2. Delegate execution to the registered testcase runner
  const id = require('uuid').v4();
  const runResult = await runner.run(id, userCode, activeSignature, testCases);

  return runResult;
}

module.exports = { executeTests };
