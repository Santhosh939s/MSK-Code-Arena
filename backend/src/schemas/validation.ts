import { z } from 'zod';

export const ParseProblemSchema = z.object({
  rawText: z.string().min(10, 'Problem text too short').max(50000, 'Problem text too long'),
});

export const GenerateSignatureSchema = z.object({
  title: z.string().min(1),
  description: z.string(),
  examples: z.array(z.object({
    input: z.string(),
    output: z.string(),
    explanation: z.string().optional(),
  })),
  constraints: z.array(z.string()),
});

export const RunSchema = z.object({
  problemId: z.string().uuid(),
  code: z.string().min(1).max(50000),
  language: z.enum(['cpp', 'python', 'java']),
  testCases: z.array(z.object({
    input: z.string(),
    output: z.string(),
  })).min(1).max(10),
});

export const SubmitSchema = z.object({
  problemId: z.string().uuid(),
  code: z.string().min(1).max(50000),
  language: z.enum(['cpp', 'python', 'java']),
});

export type ParseProblemInput = z.infer<typeof ParseProblemSchema>;
export type GenerateSignatureInput = z.infer<typeof GenerateSignatureSchema>;
export type RunInput = z.infer<typeof RunSchema>;
export type SubmitInput = z.infer<typeof SubmitSchema>;
