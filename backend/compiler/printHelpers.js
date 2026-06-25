// ── MSK Code Arena — Print Helpers ──────────────────────────────────────────────
// Delivers generic, recursive value printing code for testing wrappers.

class CppPrintHelpers {
  getHelpersCode() {
    return `
// ── Helper templates for printing values ──
template<typename T>
void printValue(const T& val) {
    cout << val;
}

inline void printValue(bool val) {
    cout << (val ? "true" : "false");
}

inline void printValue(const string& val) {
    cout << val;
}

inline void printValue(char val) {
    cout << "'" << val << "'";
}

template<typename T>
void printValue(const vector<T>& val) {
    cout << "[";
    for (size_t i = 0; i < val.size(); ++i) {
        if (i > 0) cout << ",";
        printValue(val[i]);
    }
    cout << "]";
}
`;
  }
}

module.exports = { CppPrintHelpers };
