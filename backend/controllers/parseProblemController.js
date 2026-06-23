const { parseProblem } = require('../services/parserService');
const { generateTemplate } = require('../services/templateService');
const { generateHiddenTests } = require('../utils/hiddenTestGen');
const problemStore = require('../utils/problemStore');

async function parseProblemController(req, res) {
  try {
    const { rawText } = req.body;
    if (!rawText || typeof rawText !== 'string' || rawText.trim().length < 10) {
      return res.status(400).json({ error: 'rawText is required (min 10 characters)' });
    }
    if (rawText.length > 50000) {
      return res.status(400).json({ error: 'rawText too long (max 50000 characters)' });
    }

    const parsed = parseProblem(rawText);
    const { functionName, params, returnType, cppCode } = generateTemplate(parsed);
    const visibleTests = parsed.examples.map(ex => ({ input: ex.input, output: ex.output }));
    const hiddenTests = generateHiddenTests(parsed);

    const id = problemStore.generateId();
    problemStore.set(id, {
      parsed,
      signature: { functionName, params, returnType },
      cppCode,
      visibleTests,
      hiddenTests,
    });

    return res.json({
      id,
      title: parsed.title,
      description: parsed.description,
      examples: parsed.examples,
      constraints: parsed.constraints,
      cppCode,
      visibleTests,
    });
  } catch (err) {
    console.error('[parseProblem]', err);
    return res.status(500).json({ error: 'Failed to parse problem. Please try again.' });
  }
}

module.exports = { parseProblemController };
