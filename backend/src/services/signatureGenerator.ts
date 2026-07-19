import { Example, FunctionSignature, LanguageSignatures, Param, ParamType, ParsedProblem } from '../types';

// ── Type inference ─────────────────────────────────────────────────────────────
function inferType(value: string): ParamType {
  const v = value.trim();
  if (/^\[\[/.test(v)) return 'int[][]';
  if (/^\[/.test(v)) {
    const inner = v.slice(1, -1).trim();
    if (/^"/.test(inner) || /^'/.test(inner)) return 'string[]';
    return 'int[]';
  }
  if (/^"/.test(v) || /^'/.test(v)) return 'string';
  if (v === 'true' || v === 'false') return 'bool';
  if (/^\d+$/.test(v) && parseInt(v) > 2e9) return 'long';
  if (/^\d+$/.test(v)) return 'int';
  if (/^\d+\.\d+$/.test(v)) return 'double';
  return 'int';
}

// ── Parse params from "Input: n1 = 4, n2 = 6" ────────────────────────────────
function parseParams(exampleInput: string): Param[] {
  // Handle both "n1 = 4, n2 = 6" and "nums = [1,2,3]\ntarget = 9" formats
  const normalized = exampleInput.replace(/\n/g, ', ');

  // Match patterns like: name = value
  const paramRegex = /(\w+)\s*=\s*(\[[\s\S]*?\]|\[[^\]]*\]|"[^"]*"|'[^']*'|[\d.]+(?:e[\d]+)?|true|false)/g;
  const params: Param[] = [];
  const seen = new Set<string>();

  let match: RegExpExecArray | null;
  while ((match = paramRegex.exec(normalized)) !== null) {
    const name = match[1];
    if (seen.has(name)) continue;
    seen.add(name);
    params.push({ name, type: inferType(match[2]) });
  }

  // FALLBACK: if regex matches nothing, parse as raw values
  if (params.length === 0 && exampleInput && exampleInput.trim().length > 0) {
    const parts: string[] = [];
    let current = '';
    let bracketDepth = 0;
    
    for (let i = 0; i < exampleInput.length; i++) {
      const char = exampleInput[i];
      if (char === '[' || char === '{' || char === '(') {
        bracketDepth++;
        current += char;
      } else if (char === ']' || char === '}' || char === ')') {
        bracketDepth--;
        current += char;
      } else if ((char === ',' || char === '\n') && bracketDepth === 0) {
        if (current.trim().length > 0) {
          parts.push(current.trim());
        }
        current = '';
      } else {
        current += char;
      }
    }
    if (current.trim().length > 0) {
      parts.push(current.trim());
    }
    
    parts.forEach((part, index) => {
      let name = '';
      let valStr = part;
      const eqIdx = part.indexOf('=');
      if (eqIdx !== -1) {
        name = part.substring(0, eqIdx).replace(/[^a-zA-Z0-9_]/g, '').trim();
        valStr = part.substring(eqIdx + 1).trim();
      }
      
      const inferred = inferType(valStr);
      if (!name) {
        const cleanType = inferred.replace(/\s+/g, '');
        if (cleanType.includes('[]') && cleanType.includes('[]')) { // int[][] etc
          name = `grid${index > 0 ? index + 1 : ''}`;
        } else if (cleanType.includes('[]')) {
          name = `arr${index > 0 ? index + 1 : ''}`;
        } else if (cleanType.includes('string')) {
          name = `s${index > 0 ? index + 1 : ''}`;
        } else if (cleanType.includes('bool')) {
          name = `flag${index > 0 ? index + 1 : ''}`;
        } else if (cleanType.includes('long')) {
          name = `num${index > 0 ? index + 1 : ''}`;
        } else if (cleanType.includes('double') || cleanType.includes('float')) {
          name = `val${index > 0 ? index + 1 : ''}`;
        } else {
          name = index === 0 ? 'n' : `val${index + 1}`;
        }
      }
      
      if (!seen.has(name)) {
        seen.add(name);
        params.push({ name, type: inferred });
      }
    });
  }

  return params;
}

// ── Infer return type from output ─────────────────────────────────────────────
function inferReturnType(output: string): ParamType {
  return inferType(output.trim());
}

// ── Generate function name from title ─────────────────────────────────────────
function generateFunctionName(title: string): string {
  // Convert "GCD of Two Numbers" -> "gcdOfTwoNumbers"
  return title
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .split(' ')
    .filter(Boolean)
    .map((word, i) => i === 0 ? word.toLowerCase() : word[0].toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

// ── C++ type mapping ──────────────────────────────────────────────────────────
function toCppType(t: ParamType): string {
  switch (t) {
    case 'int': return 'int';
    case 'long': return 'long long';
    case 'double': return 'double';
    case 'string': return 'string';
    case 'bool': return 'bool';
    case 'int[]': return 'vector<int>';
    case 'long[]': return 'vector<long long>';
    case 'string[]': return 'vector<string>';
    case 'int[][]': return 'vector<vector<int>>';
  }
}

// ── Python type hint mapping ──────────────────────────────────────────────────
function toPythonType(t: ParamType): string {
  switch (t) {
    case 'int': return 'int';
    case 'long': return 'int';
    case 'double': return 'float';
    case 'string': return 'str';
    case 'bool': return 'bool';
    case 'int[]': return 'List[int]';
    case 'long[]': return 'List[int]';
    case 'string[]': return 'List[str]';
    case 'int[][]': return 'List[List[int]]';
  }
}

// ── Java type mapping ─────────────────────────────────────────────────────────
function toJavaType(t: ParamType): string {
  switch (t) {
    case 'int': return 'int';
    case 'long': return 'long';
    case 'double': return 'double';
    case 'string': return 'String';
    case 'bool': return 'boolean';
    case 'int[]': return 'int[]';
    case 'long[]': return 'long[]';
    case 'string[]': return 'String[]';
    case 'int[][]': return 'int[][]';
  }
}

// ── Generate C++ starter ──────────────────────────────────────────────────────
function generateCpp(sig: FunctionSignature): string {
  const paramList = sig.params.map(p => `${toCppType(p.type)} ${p.name}`).join(', ');
  const retType = toCppType(sig.returnType);
  return `class Solution {
public:
    ${retType} ${sig.functionName}(${paramList}) {
        // Write your solution here
        
    }
};`;
}

// ── Generate Python starter ───────────────────────────────────────────────────
function generatePython(sig: FunctionSignature): string {
  const paramList = ['self', ...sig.params.map(p => `${p.name}: ${toPythonType(p.type)}`)].join(', ');
  const retType = toPythonType(sig.returnType);
  return `from typing import List

class Solution:
    def ${sig.functionName}(${paramList}) -> ${retType}:
        # Write your solution here
        pass`;
}

// ── Generate Java starter ─────────────────────────────────────────────────────
function generateJava(sig: FunctionSignature): string {
  const paramList = sig.params.map(p => `${toJavaType(p.type)} ${p.name}`).join(', ');
  const retType = toJavaType(sig.returnType);
  return `class Solution {
    public ${retType} ${sig.functionName}(${paramList}) {
        // Write your solution here
        
    }
}`;
}

// ── Main export ───────────────────────────────────────────────────────────────
export function generateSignature(problem: ParsedProblem): { signature: FunctionSignature; signatures: LanguageSignatures } {
  const firstExample = problem.examples[0];

  let params: Param[] = [];
  let returnType: ParamType = 'int';

  if (firstExample) {
    params = parseParams(firstExample.input);
    returnType = inferReturnType(firstExample.output);
  }

  // Fallback: if params empty, create generic params
  if (params.length === 0) {
    params = [{ name: 'n', type: 'int' }];
  }

  const sig: FunctionSignature = {
    functionName: generateFunctionName(problem.title),
    params,
    returnType,
  };

  return {
    signature: sig,
    signatures: {
      cpp: generateCpp(sig),
      python: generatePython(sig),
      java: generateJava(sig),
    },
  };
}

export { toCppType, toPythonType, toJavaType };
