const problemStore = require('../utils/problemStore');
const { executeTests } = require('../services/executionService');

async function submitController(req, res) {
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

    // Combine visible + hidden tests
    const allTests = [
      ...stored.visibleTests,
      ...stored.hiddenTests.map(t => ({ ...t, isHidden: true })),
    ];

    const result = await executeTests(code, stored.signature, allTests);

    // Sanitize: hide inputs for hidden test cases
    if (result.results) {
      result.results = result.results.map(r =>
        r.isHidden ? { ...r, input: '[Hidden Test Case]' } : r
      );
    }

    return res.json({
      ...result,
      visibleTotal: stored.visibleTests.length,
      hiddenTotal: stored.hiddenTests.length,
    });
  } catch (err) {
    console.error('[submit]', err);
    return res.status(500).json({ error: 'Submission failed. Please try again.' });
  }
}

module.exports = { submitController };
