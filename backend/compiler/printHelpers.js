// ── MSK Code Arena — Print Helpers ──────────────────────────────────────────────
// Delivers generic, recursive value printing code for testing wrappers.

class CppPrintHelpers {
  getHelpersCode() {
    return `
// ── LeetCode Node Struct Declarations ──
struct ListNode {
    int val;
    ListNode *next;
    ListNode() : val(0), next(nullptr) {}
    ListNode(int x) : val(x), next(nullptr) {}
    ListNode(int x, ListNode *next) : val(x), next(next) {}
};

struct TreeNode {
    int val;
    TreeNode *left;
    TreeNode *right;
    TreeNode() : val(0), left(nullptr), right(nullptr) {}
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
    TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}
};

// ── Node Builder Functions ──
inline ListNode* createListNode(const vector<int>& vals) {
    if (vals.empty()) return nullptr;
    ListNode* head = new ListNode(vals[0]);
    ListNode* curr = head;
    for (size_t i = 1; i < vals.size(); ++i) {
        curr->next = new ListNode(vals[i]);
        curr = curr->next;
    }
    return head;
}

inline TreeNode* createTreeNode(const vector<string>& vals) {
    if (vals.empty() || vals[0] == "null" || vals[0] == "nullptr") return nullptr;
    TreeNode* root = new TreeNode(stoi(vals[0]));
    queue<TreeNode*> q;
    q.push(root);
    size_t i = 1;
    while (!q.empty() && i < vals.size()) {
        TreeNode* curr = q.front();
        q.pop();
        
        // Left child
        if (i < vals.size()) {
            if (vals[i] != "null" && vals[i] != "nullptr") {
                curr->left = new TreeNode(stoi(vals[i]));
                q.push(curr->left);
            }
            i++;
        }
        
        // Right child
        if (i < vals.size()) {
            if (vals[i] != "null" && vals[i] != "nullptr") {
                curr->right = new TreeNode(stoi(vals[i]));
                q.push(curr->right);
            }
            i++;
        }
}

inline bool compareList(ListNode* l1, ListNode* l2) {
    while (l1 && l2) {
        if (l1->val != l2->val) return false;
        l1 = l1->next;
        l2 = l2->next;
    }
    return l1 == nullptr && l2 == nullptr;
}

inline bool compareTree(TreeNode* t1, TreeNode* t2) {
    if (!t1 && !t2) return true;
    if (!t1 || !t2) return false;
    return t1->val == t2->val && compareTree(t1->left, t2->left) && compareTree(t1->right, t2->right);
}

// ── Forward declarations of printValue templates ──
template<typename T>
void printValue(const T& val);

inline void printValue(bool val);
inline void printValue(const string& val);
inline void printValue(char val);

template<typename T1, typename T2>
void printValue(const pair<T1, T2>& val);

template<typename T>
void printValue(const vector<T>& val);

template<typename K, typename V>
void printValue(const map<K, V>& val);

template<typename K, typename V>
void printValue(const unordered_map<K, V>& val);

template<typename T>
void printValue(const set<T>& val);

template<typename T>
void printValue(const unordered_set<T>& val);

inline void printValue(ListNode* val);
inline void printValue(TreeNode* val);

// ── Implementations of printValue templates ──
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

template<typename T1, typename T2>
void printValue(const pair<T1, T2>& val) {
    cout << "[";
    printValue(val.first);
    cout << ",";
    printValue(val.second);
    cout << "]";
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

template<typename K, typename V>
void printValue(const map<K, V>& val) {
    cout << "[";
    bool first = true;
    for (const auto& kv : val) {
        if (!first) cout << ",";
        first = false;
        printValue(kv);
    }
    cout << "]";
}

template<typename K, typename V>
void printValue(const unordered_map<K, V>& val) {
    cout << "[";
    bool first = true;
    for (const auto& kv : val) {
        if (!first) cout << ",";
        first = false;
        printValue(kv);
    }
    cout << "]";
}

template<typename T>
void printValue(const set<T>& val) {
    cout << "[";
    bool first = true;
    for (const auto& x : val) {
        if (!first) cout << ",";
        first = false;
        printValue(x);
    }
    cout << "]";
}

template<typename T>
void printValue(const unordered_set<T>& val) {
    cout << "[";
    bool first = true;
    for (const auto& x : val) {
        if (!first) cout << ",";
        first = false;
        printValue(x);
    }
    cout << "]";
}

inline void printValue(ListNode* val) {
    cout << "[";
    ListNode* curr = val;
    bool first = true;
    while (curr) {
        if (!first) cout << ",";
        first = false;
        cout << curr->val;
        curr = curr->next;
    }
    cout << "]";
}

inline void printValue(TreeNode* val) {
    if (!val) {
        cout << "[]";
        return;
    }
    vector<string> res;
    queue<TreeNode*> q;
    q.push(val);
    while (!q.empty()) {
        TreeNode* curr = q.front();
        q.pop();
        if (curr) {
            res.push_back(to_string(curr->val));
            q.push(curr->left);
            q.push(curr->right);
        } else {
            res.push_back("null");
        }
    }
    while (!res.empty() && res.back() == "null") {
        res.pop_back();
    }
    cout << "[";
    for (size_t i = 0; i < res.size(); ++i) {
        if (i > 0) cout << ",";
        if (res[i] == "null") {
            cout << "null";
        } else {
            cout << res[i];
        }
    }
    cout << "]";
}
`;
  }
}

module.exports = { CppPrintHelpers };
