const problemStore = require('../utils/problemStore');
const { executeTests } = require('../services/executionService');

async function runController(req, res) {
  try {
    const { problemId, code } = req.body;

    if (!problemId || !code) {
      return res.status(400).json({ error: 'problemId and code are required' });
    }
    if (code.length > 50000) {
      return res.status(400).json({ error: 'Code too long (max 50000 chars)' });
    }

    let stored = problemStore.get(problemId);
    if (!stored) {
      const { problem } = req.body;
      if (problem && problem.title && problem.examples) {
        const { generateTemplate } = require('../services/templateService');
        const { generateHiddenTests } = require('../utils/hiddenTestGen');
        
        const parsed = {
          title: problem.title,
          examples: problem.examples,
          constraints: problem.constraints || []
        };
        const { functionName, params, returnType } = generateTemplate(parsed);
        const visibleTests = parsed.examples.map(ex => ({ input: ex.input, output: ex.output }));
        const hiddenTests = generateHiddenTests(parsed);
        
        stored = {
          parsed,
          signature: { functionName, params, returnType },
          cppCode: problem.cppCode || '',
          visibleTests,
          hiddenTests
        };
        problemStore.set(problemId, stored);
      } else {
        return res.status(404).json({ error: 'Problem not found. Please re-generate the problem.' });
      }
    }

    const result = await executeTests(code, stored.signature, stored.visibleTests);

    return res.json(result);
  } catch (err) {
    console.error('[run]', err);
    return res.status(500).json({ error: 'Execution failed. Please try again.' });
  }
}

module.exports = { runController };
