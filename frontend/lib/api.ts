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

export async function runCode(
  problemId: string,
  code: string,
  problem?: ParsedProblem,
  onProgress?: (progress: { status: string; position?: number; estimatedWait?: number }) => void
): Promise<RunResult> {
  const res = await api.post('/run', { problemId, code, problem });
  return handleExecutionResponse(res.data, onProgress);
}

export async function submitCode(
  problemId: string,
  code: string,
  problem?: ParsedProblem,
  onProgress?: (progress: { status: string; position?: number; estimatedWait?: number }) => void
): Promise<SubmitResult> {
  const res = await api.post('/submit', { problemId, code, problem });
  return handleExecutionResponse(res.data, onProgress);
}

function handleExecutionResponse(
  data: any,
  onProgress?: (progress: { status: string; position?: number; estimatedWait?: number }) => void
): Promise<any> {
  return new Promise((resolve, reject) => {
    if (data.status === 'completed') {
      return resolve(data.result);
    }

    if (data.status !== 'queued') {
      return reject(new Error('Invalid response from server'));
    }

    const { submissionId } = data;
    if (onProgress) {
      onProgress({
        status: 'queued',
        position: data.position,
        estimatedWait: data.estimatedWait,
      });
    }

    const sseUrl = `${API_BASE}/submission-status/${submissionId}`;
    const eventSource = new EventSource(sseUrl);

    eventSource.onmessage = (event) => {
      try {
        const update = JSON.parse(event.data);
        if (onProgress) {
          onProgress(update);
        }

        if (update.status === 'completed') {
          eventSource.close();
          resolve(update.result);
        } else if (update.status === 'failed') {
          eventSource.close();
          const errData = update.error || {};
          const errObj = new Error(errData.errorMessage || 'Execution failed');
          (errObj as any).response = { data: { error: errData.errorMessage } };
          reject(errObj);
        }
      } catch (err) {
        eventSource.close();
        reject(err);
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      reject(new Error('Connection to execution service lost'));
    };
  });
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
