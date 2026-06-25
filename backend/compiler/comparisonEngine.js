// ── MSK Code Arena — Comparison Engine ──────────────────────────────────────────
// Generates assertion blocks to compare and output test results.

class CppComparisonEngine {
  constructor(literalGenerator) {
    this.literalGenerator = literalGenerator;
  }

  generateComparisonCode(returnType, callExpr, expected, caseNum) {
    const expLit = this.literalGenerator.generate(expected, returnType);
    const cleaned = returnType.replace(/\s+/g, '');

    if (cleaned === 'void') {
      return `
    {
        ${callExpr};
        cout << "PASS\\n";
    }`;
    }

    return `
    {
        auto __res${caseNum} = ${callExpr};
        ${returnType} __exp${caseNum} = ${expLit};
        bool __ok${caseNum} = (__res${caseNum} == __exp${caseNum});
        cout << (__ok${caseNum} ? "PASS" : "FAIL") << "\\n";
        if (!__ok${caseNum}) {
            printValue(__exp${caseNum}); cout << "\\n";
            printValue(__res${caseNum}); cout << "\\n";
        }
    }`;
  }
}

module.exports = { CppComparisonEngine };
