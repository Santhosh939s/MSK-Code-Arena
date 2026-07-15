require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const routes = require('./routes/index');

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Ensure tmp directory exists for compilation
const tmpDir = path.join(__dirname, 'tmp');
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(cors({
  origin: [
    FRONTEND_URL,
    /\.vercel\.app$/,
    'http://localhost:3000',
    'http://localhost:3001',
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: true,
}));

// ── Online count tracking (Bypasses rate limiting) ──────────────────────────────
const activeClients = {};

app.post('/online-count', (req, res) => {
  const { clientId } = req.body;
  if (clientId) {
    activeClients[clientId] = Date.now();
  }

  const now = Date.now();
  for (const cid in activeClients) {
    if (now - activeClients[cid] > 7000) {
      delete activeClients[cid];
    }
  }

  const count = Object.keys(activeClients).length;
  res.json({ count });
});

// ── Execution Stats Route (Bypasses rate limiting) ──────────────────────────────
const { getStats, getSubmissionStatus, addSubmissionListener, removeSubmissionListener } = require('./services/executionService');
app.get('/execution-stats', (req, res) => {
  res.json(getStats());
});

// ── SSE Submission Status Route (Bypasses rate limiting) ────────────────────────
app.get('/submission-status/:submissionId', (req, res) => {
  const { submissionId } = req.params;

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  res.write('\n');

  const sub = getSubmissionStatus(submissionId);
  if (!sub) {
    res.write(`data: ${JSON.stringify({ status: 'not_found' })}\n\n`);
    return res.end();
  }

  res.write(`data: ${JSON.stringify(sub)}\n\n`);

  if (sub.status === 'completed' || sub.status === 'failed') {
    return res.end();
  }

  const onStatusChange = (update) => {
    res.write(`data: ${JSON.stringify(update)}\n\n`);
    if (update.status === 'completed' || update.status === 'failed') {
      res.end();
    }
  };

  addSubmissionListener(submissionId, onStatusChange);

  req.on('close', () => {
    removeSubmissionListener(submissionId, onStatusChange);
  });
});

// Global rate limit
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests. Please slow down.' },
}));

// Execution-specific rate limit (run/submit)
const execLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: 'Too many code executions. Wait a moment.' },
});

// ── Health check ───────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the MSK Coding Area Backend API. Use /health to check status.',
    docs: 'https://github.com/Santhosh939s/MSK-Code-Arena',
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'MSK Code Arena API',
    timestamp: new Date().toISOString(),
    engine: 'custom-g++',
  });
});



// ── API Routes ─────────────────────────────────────────────────────────────────
app.use('/parse-problem', routes.parse);
app.use('/generate-template', routes.template);
app.use('/run', execLimiter, routes.run);
app.use('/submit', execLimiter, routes.submit);

// ── 404 ────────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

// ── Error handler ──────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 MSK Code Arena backend running on port ${PORT}`);
  console.log(`   CORS allowed: ${FRONTEND_URL}`);
  console.log(`   Execution engine: custom g++`);
});
