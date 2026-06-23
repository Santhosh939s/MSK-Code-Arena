import { FunctionSignature, Param, ParamType, TestCase, TestCaseResult, RunResult } from '../types';
import { executeCode } from './judge0Service';
import { toCppType, toPythonType, toJavaType } from './signatureGenerator';

// ── Code wrapper generators ───────────────────────────────────────────────────

function serializeValueCpp(val: string, type: ParamType): string {
  const v = val.trim();
  switch (type) {
    case 'string': return v.startsWith('"') ? v : `"${v}"`;
    case 'bool': return v;
    case 'int[]':
    case 'long[]': {
      const inner = v.replace(/^\[|\]$/g, '').trim();
      return `{${inner}}`;
    }
    case 'string[]': {
      const inner = v.replace(/^\[|\]$/g, '').trim();
      return `{${inner}}`;
    }
    case 'int[][]': {
      return v.replace(/\[/g, '{').replace(/\]/g, '}');
    }
    default: return v;
  }
}

function cppTypeInit(type: ParamType, value: string): string {
  const cType = toCppType(type);
  const ser = serializeValueCpp(value, type);
  if (type === 'int[]' || type === 'long[]' || type === 'string[]') {
    return `${cType} {${ser}}`;
  }
  if (type === 'int[][]') {
    return `${cType} ${ser}`;
  }
  return ser;
}

function formatOutputCpp(type: ParamType): string {
  switch (type) {
    case 'int[]':
    case 'long[]':
      return `auto res = sol.__FUNC__(__ARGS__);\nfor(size_t i=0;i<res.size();i++){if(i)cout<<",";\ncout<<res[i];}cout<<"\\n";`;
    case 'string[]':
      return `auto res = sol.__FUNC__(__ARGS__);\nfor(size_t i=0;i<res.size();i++){if(i)cout<<",";\ncout<<res[i];}cout<<"\\n";`;
    case 'bool':
      return `cout<<(sol.__FUNC__(__ARGS__)?"true":"false")<<"\\n";`;
    default:
      return `cout<<sol.__FUNC__(__ARGS__)<<"\\n";`;
  }
}

function buildCppRunner(userCode: string, sig: FunctionSignature, testCases: TestCase[]): string {
  const declarations: string[] = [];
  const argNames: string[] = [];

  testCases.forEach((tc, idx) => {
    const paramValues = parseParamValues(tc.input, sig.params);
    sig.params.forEach((p, pi) => {
      const varName = `${p.name}_${idx}`;
      const cType = toCppType(p.type);
      const val = paramValues[pi] ?? '0';
      const ser = serializeValueCpp(val, p.type);
      if (['int[]', 'long[]', 'string[]'].includes(p.type)) {
        declarations.push(`    ${cType} ${varName} = ${cType}{${ser}};`);
      } else if (p.type === 'int[][]') {
        declarations.push(`    ${cType} ${varName} = ${ser};`);
      } else if (p.type === 'string') {
        declarations.push(`    ${cType} ${varName} = ${ser};`);
      } else {
        declarations.push(`    ${cType} ${varName} = ${ser};`);
      }
    });
    argNames.push(sig.params.map(p => `${p.name}_${idx}`).join(', '));
  });

  const callLines = testCases.map((tc, idx) => {
    const expectedSer = serializeValueCpp(tc.output.trim(), sig.returnType);
    const args = argNames[idx];
    let callLine = '';
    if (['int[]', 'long[]', 'string[]'].includes(sig.returnType)) {
      callLine = `    {\n        auto r = sol.${sig.functionName}(${args});\n        string rs;\n        for(size_t i=0;i<r.size();i++){if(i)rs+=",";\n            rs+=to_string(r[i]);}\n        string exp = string("${tc.output.trim().replace(/[\[\]]/g, '').trim()}");\n        if(rs==exp)cout<<"PASS\\n";\n        else cout<<"FAIL\\n"<<exp<<"\\n"<<rs<<"\\n";\n    }`;
    } else if (sig.returnType === 'bool') {
      callLine = `    {\n        bool r = sol.${sig.functionName}(${args});\n        string rs = r?"true":"false";\n        string exp = "${tc.output.trim()}";\n        if(rs==exp)cout<<"PASS\\n";\n        else cout<<"FAIL\\n"<<exp<<"\\n"<<rs<<"\\n";\n    }`;
    } else if (sig.returnType === 'string') {
      callLine = `    {\n        string r = sol.${sig.functionName}(${args});\n        string exp = string("${tc.output.trim().replace(/"/g, '')}");\n        if(r==exp)cout<<"PASS\\n";\n        else cout<<"FAIL\\n"<<exp<<"\\n"<<r<<"\\n";\n    }`;
    } else {
      callLine = `    {\n        auto r = sol.${sig.functionName}(${args});\n        if(r==${expectedSer})cout<<"PASS\\n";\n        else cout<<"FAIL\\n"<<"${tc.output.trim()}"<<"\\n"<<r<<"\\n";\n    }`;
    }
    return callLine;
  }).join('\n');

  return `#include <bits/stdc++.h>
using namespace std;

${userCode}

int main(){
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    Solution sol;
${declarations.join('\n')}
${callLines}
    return 0;
}`;
}

function buildPythonRunner(userCode: string, sig: FunctionSignature, testCases: TestCase[]): string {
  const cases = testCases.map((tc, idx) => {
    const paramValues = parseParamValues(tc.input, sig.params);
    const args = sig.params.map((p, i) => {
      const v = paramValues[i] ?? '0';
      return p.type === 'string' ? (v.startsWith('"') ? v : `"${v}"`) : v;
    }).join(', ');
    const expectedRaw = tc.output.trim();
    const expected = sig.returnType === 'string'
      ? (expectedRaw.startsWith('"') ? expectedRaw : `"${expectedRaw}"`)
      : expectedRaw;
    return `
result = sol.${sig.functionName}(${args})
expected = ${expected}
if result == expected:
    print("PASS")
else:
    print("FAIL")
    print(expected)
    print(result)`;
  }).join('\n');

  return `from typing import List, Optional

${userCode}

sol = Solution()
${cases}
`;
}

function buildJavaRunner(userCode: string, sig: FunctionSignature, testCases: TestCase[]): string {
  const callLines = testCases.map((tc) => {
    const paramValues = parseParamValues(tc.input, sig.params);
    const args = sig.params.map((p, i) => {
      const v = paramValues[i] ?? '0';
      if (p.type === 'int[]') return `new int[]{${v.replace(/[\[\]]/g, '')}}`;
      if (p.type === 'string') return v.startsWith('"') ? v : `"${v}"`;
      return v;
    }).join(', ');
    const exp = tc.output.trim();
    const retT = toJavaType(sig.returnType);
    if (sig.returnType === 'string') {
      return `        { ${retT} r = sol.${sig.functionName}(${args}); String e="${exp.replace(/"/g,'')}"; if(r.equals(e)) System.out.println("PASS"); else { System.out.println("FAIL"); System.out.println(e); System.out.println(r); } }`;
    } else if (sig.returnType === 'bool') {
      return `        { boolean r = sol.${sig.functionName}(${args}); boolean e=${exp}; if(r==e) System.out.println("PASS"); else { System.out.println("FAIL"); System.out.println(e); System.out.println(r); } }`;
    } else {
      return `        { ${retT} r = sol.${sig.functionName}(${args}); if(r==${exp}) System.out.println("PASS"); else { System.out.println("FAIL"); System.out.println("${exp}"); System.out.println(r); } }`;
    }
  }).join('\n');

  return `${userCode}

class Main {
    public static void main(String[] args) {
        Solution sol = new Solution();
${callLines}
    }
}`;
}

// ── Parse param values from input string ──────────────────────────────────────
function parseParamValues(input: string, params: Param[]): string[] {
  const values: string[] = [];
  // Try to extract each param's value
  for (const param of params) {
    // Match: paramName = value (handles arrays, strings, numbers)
    const regex = new RegExp(`${param.name}\\s*=\\s*(\\[[^\\]]*(?:\\[[^\\]]*\\])*[^\\]]*\\]|"[^"]*"|'[^']*'|-?[\\d.]+(?:e\\d+)?|true|false)`, 'i');
    const m = input.match(regex);
    if (m) {
      values.push(m[1].trim());
    } else {
      // Fallback: positional
      const tokens = input.split(/,\s*(?=[a-zA-Z])/);
      const token = tokens[values.length];
      if (token) {
        const eqIdx = token.indexOf('=');
        values.push(eqIdx !== -1 ? token.substring(eqIdx + 1).trim() : token.trim());
      } else {
        values.push('0');
      }
    }
  }
  return values;
}

// ── Parse stdout into results ─────────────────────────────────────────────────
function parseOutput(stdout: string, testCases: TestCase[]): TestCaseResult[] {
  const lines = stdout.split('\n');
  const results: TestCaseResult[] = [];
  let lineIdx = 0;

  for (let i = 0; i < testCases.length; i++) {
    const verdict = lines[lineIdx]?.trim();
    lineIdx++;
    if (verdict === 'PASS') {
      results.push({ caseNumber: i + 1, passed: true, input: testCases[i].input, expected: testCases[i].output, received: testCases[i].output });
    } else if (verdict === 'FAIL') {
      const expected = lines[lineIdx]?.trim() ?? '';
      lineIdx++;
      const received = lines[lineIdx]?.trim() ?? '';
      lineIdx++;
      results.push({ caseNumber: i + 1, passed: false, input: testCases[i].input, expected, received });
    } else {
      results.push({ caseNumber: i + 1, passed: false, input: testCases[i].input, expected: testCases[i].output, received: '(no output)' });
    }
  }
  return results;
}

// ── Main execution service ────────────────────────────────────────────────────
export async function runTestCases(
  userCode: string,
  language: string,
  sig: FunctionSignature,
  testCases: TestCase[]
): Promise<RunResult> {
  let fullCode: string;

  if (language === 'cpp') fullCode = buildCppRunner(userCode, sig, testCases);
  else if (language === 'python') fullCode = buildPythonRunner(userCode, sig, testCases);
  else if (language === 'java') fullCode = buildJavaRunner(userCode, sig, testCases);
  else throw new Error(`Unsupported language: ${language}`);

  const result = await executeCode(fullCode, language);

  // Compilation/runtime error
  if (result.compileError) {
    return { results: [], allPassed: false, totalPassed: 0, total: testCases.length, compilationError: result.compileError };
  }
  if (result.statusId === 6) {
    return { results: [], allPassed: false, totalPassed: 0, total: testCases.length, compilationError: result.compileError || 'Compilation Error' };
  }
  if (result.statusId >= 7 && result.statusId <= 12) {
    return { results: [], allPassed: false, totalPassed: 0, total: testCases.length, runtimeError: result.stderr || result.statusDesc };
  }

  const results = parseOutput(result.stdout, testCases);
  const totalPassed = results.filter(r => r.passed).length;

  return {
    results,
    allPassed: totalPassed === testCases.length,
    totalPassed,
    total: testCases.length,
  };
}
