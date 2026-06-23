import { Router } from 'express';
import { ParseProblemSchema } from '../schemas/validation';
import { parseProblem } from '../services/problemParser';
import { generateSignature } from '../services/signatureGenerator';
import { generateHiddenTests } from '../utils/hiddenTestGen';
import { problemStore } from '../store/problemStore';
import { TestCase } from '../types';

export const parseProblemRouter = Router();

parseProblemRouter.post('/', (req, res) => {
  try {
    const parsed = ParseProblemSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
    }

    const problem = parseProblem(parsed.data.rawText);
    const { signature, signatures } = generateSignature(problem);

    const visibleTests: TestCase[] = problem.examples.map(ex => ({
      input: ex.input,
      output: ex.output,
    }));
    const hiddenTests = generateHiddenTests(problem);

    problemStore.set(problem.id, {
      parsed: problem,
      signature,
      signatures,
      visibleTests,
      hiddenTests,
      createdAt: new Date(),
    });

    // Return everything except hidden tests
    return res.json({
      id: problem.id,
      title: problem.title,
      description: problem.description,
      examples: problem.examples,
      constraints: problem.constraints,
      signatures,
      visibleTests,
    });
  } catch (err) {
    console.error('Parse error:', err);
    return res.status(500).json({ error: 'Failed to parse problem' });
  }
});
