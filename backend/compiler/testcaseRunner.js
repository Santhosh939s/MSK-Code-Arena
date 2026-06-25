// ── MSK Code Arena — Testcase Runner ─────────────────────────────────────────────
// Coordinates sandbox execution and converts system statuses to online judge verdicts.

const { compileAndRun } = require('./cppCompiler');

class CppTestcaseRunner {
  constructor(wrapperGenerator) {
    this.wrapperGenerator = wrapperGenerator;
  }

  async run(id, userCode, signature, testCases) {
    const fullSource = this.wrapperGenerator.generateWrapper(userCode, signature, testCases);
    const runResult = await compileAndRun(id, fullSource);

    if (!runResult.ok) {
      let status = 'Runtime Error';
      let errorType = 'runtime_error';
      if (runResult.type === 'compile_error') {
        status = 'Compilation Error';
        errorType = 'compile_error';
      }
      if (runResult.type === 'time_limit') {
        status = 'Time Limit Exceeded';
        errorType = 'time_limit';
      }

      return {
        success: false,
        status,
        errorType,
        errorMessage: runResult.message,
        results: [],
        totalPassed: 0,
        total: testCases.length,
      };
    }

    const results = this.parseOutput(runResult.stdout, testCases);
    const totalPassed = results.filter(r => r.passed).length;
    const allPassed = totalPassed === testCases.length;

    return {
      success: true,
      status: allPassed ? 'Accepted' : 'Wrong Answer',
      results,
      totalPassed,
      total: testCases.length,
      allPassed,
    };
  }

  parseOutput(stdout, testCases) {
    const lines = stdout.split('\n');
    const results = [];
    let li = 0;

    for (let i = 0; i < testCases.length; i++) {
      const verdict = lines[li]?.trim();
      li++;
      if (verdict === 'PASS') {
        results.push({
          caseNumber: i + 1,
          passed: true,
          input: testCases[i].input,
          expected: testCases[i].output,
          received: testCases[i].output,
          isHidden: testCases[i].isHidden
        });
      } else if (verdict === 'FAIL') {
        const expected = lines[li]?.trim() ?? testCases[i].output;
        li++;
        const received = lines[li]?.trim() ?? '(no output)';
        li++;
        results.push({
          caseNumber: i + 1,
          passed: false,
          input: testCases[i].input,
          expected,
          received,
          isHidden: testCases[i].isHidden
        });
      } else {
        results.push({
          caseNumber: i + 1,
          passed: false,
          input: testCases[i].input,
          expected: testCases[i].output,
          received: '(no output)',
          isHidden: testCases[i].isHidden
        });
      }
    }
    return results;
  }
}

module.exports = { CppTestcaseRunner };
