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

    const stored = problemStore.get(problemId);
    if (!stored) {
      return res.status(404).json({ error: 'Problem not found. Please re-generate the problem.' });
    }

    const result = await executeTests(code, stored.signature, stored.visibleTests);

    return res.json(result);
  } catch (err) {
    console.error('[run]', err);
    return res.status(500).json({ error: 'Execution failed. Please try again.' });
  }
}

module.exports = { runController };
