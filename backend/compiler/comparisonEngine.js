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
      const escapedExpected = expected.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
      return `
    {
        std::stringstream ss;
        std::streambuf* old_buf = std::cout.rdbuf(ss.rdbuf());
        ${callExpr};
        std::cout.rdbuf(old_buf);
        std::string user_out = ss.str();
        
        auto trim = [](std::string s) {
            if (s.empty()) return s;
            size_t start = 0;
            while (start < s.length() && (s[start] == ' ' || s[start] == '\t' || s[start] == '\n' || s[start] == '\r')) {
                start++;
            }
            if (start == s.length()) return std::string("");
            size_t end = s.length() - 1;
            while (end > start && (s[end] == ' ' || s[end] == '\t' || s[end] == '\n' || s[end] == '\r')) {
                end--;
            }
            return s.substr(start, end - start + 1);
        };
        
        auto normalize = [](std::string s) {
            std::string res;
            bool space = false;
            for (size_t i = 0; i < s.length(); i++) {
                char c = s[i];
                if (c == ' ' || c == '\t' || c == '\n' || c == '\r') {
                    if (!space) {
                        res += ' ';
                        space = true;
                    }
                } else {
                    res += c;
                    space = false;
                }
            }
            return res;
        };
        
        std::string clean_user = trim(user_out);
        std::string clean_exp = trim("${escapedExpected}");
        bool __ok${caseNum} = (normalize(clean_user) == normalize(clean_exp));
        
        std::cout << (__ok${caseNum} ? "PASS" : "FAIL") << "\\n";
        if (!__ok${caseNum}) {
            std::cout << clean_exp << "\\n";
            std::cout << (clean_user.empty() ? "(no output)" : clean_user) << "\\n";
        }
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
        std::stringstream ss;
        std::streambuf* old_buf = std::cout.rdbuf(ss.rdbuf());
        auto __res${caseNum} = ${callExpr};
        std::cout.rdbuf(old_buf);
        
        const ${baseType} __exp${caseNum} = ${expLit};
        bool __ok${caseNum} = ${compExpr};
        std::cout << (__ok${caseNum} ? "PASS" : "FAIL") << "\\n";
        if (!__ok${caseNum}) {
            printValue(__exp${caseNum}); std::cout << "\\n";
            printValue(__res${caseNum}); std::cout << "\\n";
        }
    }`;
  }
}

module.exports = { CppComparisonEngine };
