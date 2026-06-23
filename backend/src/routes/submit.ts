import { Router } from 'express';
import { SubmitSchema } from '../schemas/validation';
import { problemStore } from '../store/problemStore';
import { runTestCases } from '../services/executionService';
import { TestCase } from '../types';

export const submitRouter = Router();

submitRouter.post('/', async (req, res) => {
  try {
    const parsed = SubmitSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
    }

    const { problemId, code, language } = parsed.data;

    const stored = problemStore.get(problemId);
    if (!stored) {
      return res.status(404).json({ error: 'Problem not found. Please re-generate the problem.' });
    }

    // Filter out __COMPUTED__ hidden tests (generic fallback placeholders)
    const validHidden = stored.hiddenTests.filter(t => t.output !== '__COMPUTED__');

    const allTests: TestCase[] = [
      ...stored.visibleTests,
      ...validHidden.map(t => ({ ...t, isHidden: true })),
    ];

    const result = await runTestCases(code, language, stored.signature, allTests);

    // Sanitize: don't leak hidden test inputs in response
    const sanitizedResults = result.results.map(r => {
      if (r.isHidden) {
        return { ...r, input: '[Hidden Test Case]' };
      }
      return r;
    });

    return res.json({
      ...result,
      results: sanitizedResults,
      visibleTotal: stored.visibleTests.length,
      hiddenTotal: validHidden.length,
    });
  } catch (err: any) {
    console.error('Submit error:', err);
    if (err.message?.includes('JUDGE0_API_KEY')) {
      return res.status(503).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Submission failed. Please try again.' });
  }
});
