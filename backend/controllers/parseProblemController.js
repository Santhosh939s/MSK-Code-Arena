const { parseProblem } = require('../services/parserService');
const { generateTemplate } = require('../services/templateService');
const { generateHiddenTests } = require('../utils/hiddenTestGen');
const { generateProblemWithGemini } = require('../services/geminiService');
const problemStore = require('../utils/problemStore');

async function parseProblemController(req, res) {
  try {
    const { rawText } = req.body;
    if (!rawText || typeof rawText !== 'string' || rawText.trim().length < 5) {
      return res.status(400).json({ error: 'rawText is required (min 5 characters)' });
    }
    if (rawText.length > 50000) {
      return res.status(400).json({ error: 'rawText too long (max 50000 characters)' });
    }

    const cleanText = rawText.trim();
    // A query is considered "short/title-only" if it's less than 150 chars or has no input/output markers
    const isShort = cleanText.length < 150 || !/input/i.test(cleanText) || !/output/i.test(cleanText);

    let parsed = null;
    let usedGemini = false;

    if (isShort) {
      console.log(`[Parser] Routing short query to Gemini: "${cleanText.slice(0, 40)}..."`);
      parsed = await generateProblemWithGemini(cleanText);
      if (parsed) {
        usedGemini = true;
      } else {
        console.log('[Parser] Gemini failed to generate problem for short query.');
        return res.status(503).json({ error: 'AI generation service is temporarily busy. Please click "Generate Problem" again.' });
      }
    } else {
      // Full text copy-paste
      console.log(`[Parser] Running regex-based parser on copy-paste input.`);
      parsed = parseProblem(cleanText);

      // If regex parser found no examples, it's a messy input. Fallback to Gemini!
      if (parsed.examples.length === 0) {
        console.log('[Parser] Regex failed to parse any examples. Invoking Gemini fallback.');
        const geminiParsed = await generateProblemWithGemini(cleanText);
        if (geminiParsed) {
          parsed = geminiParsed;
          usedGemini = true;
        }
      }
    }

    // Generate C++ signature template
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

    console.log(`[Parser] Problem "${parsed.title}" generated successfully. Gemini used: ${usedGemini}`);

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
