// ── MSK Code Arena — Comparison Engine ──────────────────────────────────────────
// Generates assertion blocks to compare and output test results.

class CppComparisonEngine {
  constructor(literalGenerator) {
    this.literalGenerator = literalGenerator;
  }

  generateComparisonCode(returnType, callExpr, expected, caseNum) {
    const expLit = this.literalGenerator.generate(expected, returnType);
    const cleaned = returnType
      .replace(/\b(public|private|protected)\s*:/gi, '')
      .replace(/\bconst\b/g, '')
      .replace(/[&*]/g, '')
      .replace(/\s+/g, '');

    if (cleaned === 'void') {
      return `
    {
        ${callExpr};
        cout << "PASS\\n";
    }`;
    }

    const baseType = returnType.replace(/&/g, '').trim();

    let compExpr = `(__res${caseNum} == __exp${caseNum})`;
    if (cleaned === 'ListNode') {
      compExpr = `compareList(__res${caseNum}, __exp${caseNum})`;
    } else if (cleaned === 'TreeNode') {
      compExpr = `compareTree(__res${caseNum}, __exp${caseNum})`;
    }

    return `
    {
        auto __res${caseNum} = ${callExpr};
        const ${baseType} __exp${caseNum} = ${expLit};
        bool __ok${caseNum} = ${compExpr};
        cout << (__ok${caseNum} ? "PASS" : "FAIL") << "\\n";
        if (!__ok${caseNum}) {
            printValue(__exp${caseNum}); cout << "\\n";
            printValue(__res${caseNum}); cout << "\\n";
        }
    }`;
  }
}

module.exports = { CppComparisonEngine };
