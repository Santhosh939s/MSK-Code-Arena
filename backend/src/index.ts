import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { parseProblemRouter } from './routes/parseProblem';
import { generateSignatureRouter } from './routes/generateSignature';
import { runRouter } from './routes/run';
import { submitRouter } from './routes/submit';

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(cors({
  origin: [FRONTEND_URL, 'https://*.vercel.app', /\.vercel\.app$/],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
});
const executionLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20,
  message: { error: 'Too many execution requests, please slow down.' },
});

app.use(limiter);

// ── Routes ────────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'MSK Coding Area API' });
});

app.use('/parse-problem', parseProblemRouter);
app.use('/generate-signature', generateSignatureRouter);
app.use('/run', executionLimiter, runRouter);
app.use('/submit', executionLimiter, submitRouter);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 MSK Coding Area API running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
});

export default app;
