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
}

export type ParamType = 'int' | 'long' | 'double' | 'string' | 'bool' | 'int[]' | 'long[]' | 'string[]' | 'int[][]';

export interface Param {
  name: string;
  type: ParamType;
}

export interface FunctionSignature {
  functionName: string;
  params: Param[];
  returnType: ParamType;
}

export interface LanguageSignatures {
  cpp: string;
  python: string;
  java: string;
}

export interface TestCase {
  input: string;
  output: string;
  isHidden?: boolean;
}

export interface StoredProblem {
  parsed: ParsedProblem;
  signature: FunctionSignature;
  signatures: LanguageSignatures;
  visibleTests: TestCase[];
  hiddenTests: TestCase[];
  createdAt: Date;
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
  results: TestCaseResult[];
  allPassed: boolean;
  totalPassed: number;
  total: number;
  compilationError?: string;
  runtimeError?: string;
}
