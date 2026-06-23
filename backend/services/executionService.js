const { v4: uuidv4 } = require('uuid');
const { compileAndRun } = require('../compiler/cppCompiler');

// ── Value serialiser → C++ literal ────────────────────────────────────────────
function toCppLiteral(val, type) {
  const v = String(val).trim();
  if (type === 'string') return v.startsWith('"') ? v : `"${v.replace(/"/g, '\\"')}"`;
  if (type === 'bool') return v === 'true' ? 'true' : 'false';
  if (type === 'vector<int>' || type === 'vector<long long>') {
    const inner = v.replace(/^\[|^\{|\]$|\}$/g, '').trim();
    return `{${inner}}`;
  }
  if (type === 'vector<string>') {
    const inner = v.replace(/^\[|^\{|\]$|\}$/g, '').trim();
    return `{${inner}}`;
  }
  if (type === 'vector<vector<int>>') {
    return v.replace(/\[/g, '{').replace(/\]/g, '}');
  }
  return v; // int, long long, double
}

// ── Parse test case input into param values ───────────────────────────────────
function parseParamValues(input, params) {
  const result = [];
  for (const p of params) {
    const re = new RegExp(`${p.name}(?:\\[\\])?\\s*=\\s*(\\[(?:[^\\[\\]]*|\\[[^\\[\\]]*\\])*\\]|\\{(?:[^\\{\\}]*|\\{[^\\{\\}]*\\})*\\}|"[^"]*"|'[^']*'|-?[\\d.]+|true|false)`, 'i');
    const m = input.match(re);
    if (m) {
      result.push(m[1].trim());
    } else {
      // positional fallback
      const tokens = input.split(/,\s*(?=[a-zA-Z_])/);
      const token = tokens[result.length] || '';
      const eq = token.indexOf('=');
      result.push(eq !== -1 ? token.substring(eq + 1).trim() : token.trim() || '0');
    }
  }
  return result;
}

// ── Generate output comparison code ──────────────────────────────────────────
function genComparison(returnType, callExpr, expected, caseNum) {
  const expLit = toCppLiteral(expected, returnType);
  const varDecl = returnType.startsWith('vector')
    ? `${returnType} __res${caseNum} = ${callExpr};`
    : `${returnType} __res${caseNum} = ${callExpr};`;

  if (returnType.startsWith('vector<int>') || returnType.startsWith('vector<long long>')) {
    return `
    {
        ${varDecl}
        ${returnType} __exp${caseNum} = ${expLit};
        bool __ok${caseNum} = __res${caseNum} == __exp${caseNum};
        cout << (__ok${caseNum} ? "PASS" : "FAIL") << "\\n";
        if (!__ok${caseNum}) {
            cout << "${expected.replace(/"/g, '\\"')}" << "\\n";
            for(size_t i=0;i<__res${caseNum}.size();i++){if(i)cout<<",";cout<<__res${caseNum}[i];}cout<<"\\n";
        }
    }`;
  }
  if (returnType === 'bool') {
    return `
    {
        ${varDecl}
        bool __exp${caseNum} = ${expLit};
        bool __ok${caseNum} = __res${caseNum} == __exp${caseNum};
        cout << (__ok${caseNum} ? "PASS" : "FAIL") << "\\n";
        if (!__ok${caseNum}) {
            cout << (__exp${caseNum}?"true":"false") << "\\n";
            cout << (__res${caseNum}?"true":"false") << "\\n";
        }
    }`;
  }
  if (returnType === 'string') {
    return `
    {
        ${varDecl}
        ${returnType} __exp${caseNum} = ${expLit};
        bool __ok${caseNum} = __res${caseNum} == __exp${caseNum};
        cout << (__ok${caseNum} ? "PASS" : "FAIL") << "\\n";
        if (!__ok${caseNum}) {
            cout << __exp${caseNum} << "\\n";
            cout << __res${caseNum} << "\\n";
        }
    }`;
  }
  // Default: numeric types
  return `
    {
        ${varDecl}
        ${returnType} __exp${caseNum} = ${expLit};
        bool __ok${caseNum} = __res${caseNum} == __exp${caseNum};
        cout << (__ok${caseNum} ? "PASS" : "FAIL") << "\\n";
        if (!__ok${caseNum}) {
            cout << __exp${caseNum} << "\\n";
            cout << __res${caseNum} << "\\n";
        }
    }`;
}

// ── Helper to extract defined function name inside class Solution ─────────────
function extractFunctionName(userCode, defaultName) {
  const classSolRegex = /class\s+Solution\s*\{([\s\S]*?)\};?/i;
  const match = userCode.match(classSolRegex);
  if (match) {
    const classBody = match[1];
    const methodRegex = /\b(?:int|void|string|vector\s*<[^>]+>|double|bool|long\s+long)\s+([a-zA-Z_]\w*)\s*\(/g;
    let m;
    while ((m = methodRegex.exec(classBody)) !== null) {
      const name = m[1];
      if (!['if', 'for', 'while', 'switch', 'return'].includes(name)) {
        return name;
      }
    }
  }
  return defaultName;
}

// ── Build full C++ source with test harness ───────────────────────────────────
function buildCppSource(userCode, sig, testCases) {
  const { params, returnType } = sig;
  const functionName = extractFunctionName(userCode, sig.functionName);

  const declarations = testCases.map((tc, idx) => {
    const vals = parseParamValues(tc.input, params);
    return params.map((p, pi) => {
      const lit = toCppLiteral(vals[pi] ?? '0', p.type);
      if (p.type.startsWith('vector')) {
        return `        ${p.type} __${p.name}_${idx} = ${p.type}${lit};`;
      }
      return `        ${p.type} __${p.name}_${idx} = ${lit};`;
    }).join('\n');
  });

  const calls = testCases.map((tc, idx) => {
    const args = params.map(p => `__${p.name}_${idx}`).join(', ');
    const callExpr = `sol.${functionName}(${args})`;
    return genComparison(returnType, callExpr, tc.output.trim(), idx);
  });

  return `#include <bits/stdc++.h>
using namespace std;

${userCode}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    Solution sol;
${declarations.join('\n')}
${calls.join('\n')}
    return 0;
}
`;
}

// ── Parse stdout into per-case results ────────────────────────────────────────
function parseOutput(stdout, testCases) {
  const lines = stdout.split('\n');
  const results = [];
  let li = 0;

  for (let i = 0; i < testCases.length; i++) {
    const verdict = lines[li]?.trim();
    li++;
    if (verdict === 'PASS') {
      results.push({ caseNumber: i + 1, passed: true, input: testCases[i].input, expected: testCases[i].output, received: testCases[i].output, isHidden: testCases[i].isHidden });
    } else if (verdict === 'FAIL') {
      const expected = lines[li]?.trim() ?? testCases[i].output;
      li++;
      const received = lines[li]?.trim() ?? '(no output)';
      li++;
      results.push({ caseNumber: i + 1, passed: false, input: testCases[i].input, expected, received, isHidden: testCases[i].isHidden });
    } else {
      results.push({ caseNumber: i + 1, passed: false, input: testCases[i].input, expected: testCases[i].output, received: '(no output)', isHidden: testCases[i].isHidden });
    }
  }
  return results;
}

// ── Main execution service ────────────────────────────────────────────────────
async function executeTests(userCode, sig, testCases) {
  const id = uuidv4();
  const fullSource = buildCppSource(userCode, sig, testCases);

  const result = await compileAndRun(id, fullSource);

  if (!result.ok) {
    return {
      success: false,
      errorType: result.type,
      errorMessage: result.message,
      results: [],
      totalPassed: 0,
      total: testCases.length,
    };
  }

  const results = parseOutput(result.stdout, testCases);
  const totalPassed = results.filter(r => r.passed).length;

  return {
    success: true,
    results,
    totalPassed,
    total: testCases.length,
    allPassed: totalPassed === testCases.length,
  };
}

module.exports = { executeTests, buildCppSource };
