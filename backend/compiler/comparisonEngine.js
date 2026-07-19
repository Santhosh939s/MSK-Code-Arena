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
            s.erase(s.begin(), std::find_if(s.begin(), s.end(), [](unsigned char ch) {
                return !std::isspace(ch);
            }));
            s.erase(std::find_if(s.rbegin(), s.rend(), [](unsigned char ch) {
                return !std::isspace(ch);
            }).base(), s.end());
            return s;
        };
        
        auto normalize = [](std::string s) {
            std::string res;
            bool space = false;
            for (char c : s) {
                if (std::isspace(c)) {
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
