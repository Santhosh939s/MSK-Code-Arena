// ── MSK Code Arena — Wrapper Generator ──────────────────────────────────────────
// Assembles the final runnable C++ source combining user solution and testcases.

class CppWrapperGenerator {
  constructor(printHelpers, comparisonEngine, literalGenerator) {
    this.printHelpers = printHelpers;
    this.comparisonEngine = comparisonEngine;
    this.literalGenerator = literalGenerator;
  }

  generateWrapper(userCode, signature, testCases) {
    const { functionName, returnType, params } = signature;

    const declarations = testCases.map((tc, idx) => {
      const vals = this.parseParamValues(tc.input, params);
      return params.map((p, pi) => {
        const lit = this.literalGenerator.generate(vals[pi] ?? '0', p.type);
        const cleanedType = p.type.replace(/\s+/g, '');
        
        if (cleanedType.startsWith('vector')) {
          return `        ${p.type} __${p.name}_${idx} = ${p.type}${lit};`;
        }
        return `        ${p.type} __${p.name}_${idx} = ${lit};`;
      }).join('\n');
    });

    const calls = testCases.map((tc, idx) => {
      const args = params.map(p => `__${p.name}_${idx}`).join(', ');
      const callExpr = `sol.${functionName}(${args})`;
      return this.comparisonEngine.generateComparisonCode(returnType, callExpr, tc.output.trim(), idx);
    });

    return `#include <bits/stdc++.h>
using namespace std;

${this.printHelpers.getHelpersCode()}

#line 1 "solution.cpp"
${userCode}

#line 1 "main.cpp"
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

  parseParamValues(input, params) {
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
}

module.exports = { CppWrapperGenerator };
