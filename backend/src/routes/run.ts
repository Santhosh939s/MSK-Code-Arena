import { Router } from 'express';
import { RunSchema } from '../schemas/validation';
import { problemStore } from '../store/problemStore';
import { runTestCases } from '../services/executionService';

export const runRouter = Router();

runRouter.post('/', async (req, res) => {
  try {
    const parsed = RunSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
    }

    const { problemId, code, language, testCases } = parsed.data;

    const stored = problemStore.get(problemId);
    if (!stored) {
      return res.status(404).json({ error: 'Problem not found. Please re-generate the problem.' });
    }

    const result = await runTestCases(code, language, stored.signature, testCases);

    return res.json(result);
  } catch (err: any) {
    console.error('Run error:', err);
    if (err.message?.includes('JUDGE0_API_KEY')) {
      return res.status(503).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Execution failed. Please try again.' });
  }
});
