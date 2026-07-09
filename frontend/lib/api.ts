import axios from 'axios';
import { ParsedProblem, RunResult, SubmitResult } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

export async function parseProblem(rawText: string): Promise<ParsedProblem> {
  const res = await api.post('/parse-problem', { rawText });
  return res.data;
}

export async function runCode(problemId: string, code: string): Promise<RunResult> {
  const res = await api.post('/run', { problemId, code });
  return res.data;
}

export async function submitCode(problemId: string, code: string): Promise<SubmitResult> {
  const res = await api.post('/submit', { problemId, code });
  return res.data;
}

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await api.get('/health');
    return res.data.status === 'ok';
  } catch {
    return false;
  }
}

export async function getOnlineCount(clientId: string): Promise<number> {
  try {
    const res = await api.post('/online-count', { clientId });
    return res.data.count;
  } catch {
    return 1;
  }
}
