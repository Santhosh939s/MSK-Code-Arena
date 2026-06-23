// Shared TypeScript types for MSK Code Arena frontend

export interface Example {
  input: string;
  output: string;
  explanation?: string;
}

export interface ParsedProblem {
  id: string;
  title: string;
  description: string;
  examples: Example[];
  constraints: string[];
  cppCode: string;
  visibleTests: TestCase[];
}

export interface TestCase {
  input: string;
  output: string;
  isHidden?: boolean;
}

export interface TestCaseResult {
  caseNumber: number;
  passed: boolean;
  input: string;
  expected: string;
  received: string;
  isHidden?: boolean;
}

export interface RunResult {
  success: boolean;
  errorType?: 'compile_error' | 'runtime_error' | 'time_limit';
  errorMessage?: string;
  results: TestCaseResult[];
  totalPassed: number;
  total: number;
  allPassed?: boolean;
}

export interface SubmitResult extends RunResult {
  visibleTotal: number;
  hiddenTotal: number;
}

export type Language = 'cpp';

export type ActiveTab = 'description' | 'editorial' | 'submissions' | 'discussion';
export type BottomTab = 'testcases' | 'output';
