import { Router } from 'express';
import { GenerateSignatureSchema } from '../schemas/validation';
import { generateSignature } from '../services/signatureGenerator';
import { parseProblem } from '../services/problemParser';

export const generateSignatureRouter = Router();

generateSignatureRouter.post('/', (req, res) => {
  try {
    const parsed = GenerateSignatureSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
    }

    const mockProblem = {
      id: '',
      ...parsed.data,
    };

    const { signature, signatures } = generateSignature(mockProblem);

    return res.json({ signature, signatures });
  } catch (err) {
    console.error('Signature generation error:', err);
    return res.status(500).json({ error: 'Failed to generate signature' });
  }
});
