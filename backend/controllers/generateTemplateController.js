const { generateTemplate } = require('../services/templateService');

async function generateTemplateController(req, res) {
  try {
    const { title, examples, constraints } = req.body;
    if (!title) return res.status(400).json({ error: 'title is required' });

    const parsed = { title, examples: examples || [], constraints: constraints || [] };
    const { functionName, params, returnType, cppCode } = generateTemplate(parsed);

    return res.json({ functionName, params, returnType, cppCode });
  } catch (err) {
    console.error('[generateTemplate]', err);
    return res.status(500).json({ error: 'Failed to generate template' });
  }
}

module.exports = { generateTemplateController };
