import axios from 'axios';

const JUDGE0_URL = process.env.JUDGE0_API_URL || 'https://judge0-ce.p.rapidapi.com';
const JUDGE0_KEY = process.env.JUDGE0_API_KEY || '';

// Judge0 language IDs
export const LANGUAGE_IDS: Record<string, number> = {
  cpp: 54,    // C++ (GCC 9.2.0)
  python: 71, // Python 3 (3.8.1)
  java: 62,   // Java (OpenJDK 13.0.1)
};

interface Judge0Submission {
  source_code: string;
  language_id: number;
  stdin?: string;
  expected_output?: string;
}

interface Judge0Result {
  status: { id: number; description: string };
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  time: string | null;
  memory: number | null;
}

const HEADERS = {
  'Content-Type': 'application/json',
  'X-RapidAPI-Key': JUDGE0_KEY,
  'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
};

async function createSubmission(submission: Judge0Submission): Promise<string> {
  const response = await axios.post(
    `${JUDGE0_URL}/submissions?base64_encoded=false&wait=false`,
    submission,
    { headers: HEADERS, timeout: 10000 }
  );
  return response.data.token;
}

async function pollSubmission(token: string, maxAttempts = 10): Promise<Judge0Result> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, 1000));
    const response = await axios.get(
      `${JUDGE0_URL}/submissions/${token}?base64_encoded=false`,
      { headers: HEADERS, timeout: 10000 }
    );
    const data: Judge0Result = response.data;
    // Status IDs: 1=In Queue, 2=Processing, 3=Accepted, 4+=Error
    if (data.status.id > 2) return data;
  }
  throw new Error('Execution timed out');
}

export async function executeCode(
  sourceCode: string,
  language: string,
  stdin?: string
): Promise<{ stdout: string; stderr: string; compileError: string; statusId: number; statusDesc: string }> {
  if (!JUDGE0_KEY) {
    throw new Error('JUDGE0_API_KEY is not configured. Please set it in your environment variables.');
  }

  const languageId = LANGUAGE_IDS[language];
  if (!languageId) throw new Error(`Unsupported language: ${language}`);

  const token = await createSubmission({
    source_code: sourceCode,
    language_id: languageId,
    stdin: stdin || '',
  });

  const result = await pollSubmission(token);

  return {
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    compileError: result.compile_output || '',
    statusId: result.status.id,
    statusDesc: result.status.description,
  };
}
