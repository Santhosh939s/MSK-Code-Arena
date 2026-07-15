// ── Regression Test Suite Problems Database ────────────────────────────────────────

// 1. Classic problems for each category
const classicProblems = [
  {
    name: "Two Sum",
    category: "Array",
    signature: {
      functionName: "twoSum",
      returnType: "vector<int>",
      params: [
        { name: "nums", type: "vector<int>&" },
        { name: "target", type: "int" }
      ]
    },
    code: `
class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> m;
        for (int i = 0; i < nums.size(); ++i) {
            int comp = target - nums[i];
            if (m.count(comp)) return {m[comp], i};
            m[nums[i]] = i;
        }
        return {};
    }
};
`,
    testcases: [
      { input: 'nums=[2,7,11,15], target=9', output: '[0,1]' },
      { input: 'nums=[3,2,4], target=6', output: '[1,2]' }
    ]
  },
  {
    name: "Reverse String",
    category: "String",
    signature: {
      functionName: "reverseString",
      returnType: "string",
      params: [
        { name: "s", type: "string" }
      ]
    },
    code: `
class Solution {
public:
    string reverseString(string s) {
        reverse(s.begin(), s.end());
        return s;
    }
};
`,
    testcases: [
      { input: 's="hello"', output: '"olleh"' },
      { input: 's="Hannah"', output: '"hannaH"' }
    ]
  },
  {
    name: "Bubble Sort Verification",
    category: "Sort",
    signature: {
      functionName: "bubbleSort",
      returnType: "vector<int>",
      params: [
        { name: "arr", type: "vector<int>&" }
      ]
    },
    code: `
class Solution {
public:
    vector<int> bubbleSort(vector<int>& arr) {
        int n = arr.size();
        for (int i = 0; i < n-1; i++) {
            for (int j = 0; j < n-i-1; j++) {
                if (arr[j] > arr[j+1]) swap(arr[j], arr[j+1]);
            }
        }
        return arr;
    }
};
`,
    testcases: [
      { input: 'arr=[5,1,4,2,8]', output: '[1,2,4,5,8]' },
      { input: 'arr=[3,2,1]', output: '[1,2,3]' }
    ]
  },
  {
    name: "Fibonacci Number",
    category: "Recursion",
    signature: {
      functionName: "fib",
      returnType: "int",
      params: [
        { name: "n", type: "int" }
      ]
    },
    code: `
class Solution {
public:
    int fib(int n) {
        if (n <= 1) return n;
        return fib(n - 1) + fib(n - 2);
    }
};
`,
    testcases: [
      { input: 'n=2', output: '1' },
      { input: 'n=4', output: '3' }
    ]
  },
  {
    name: "Reverse Linked List",
    category: "List",
    signature: {
      functionName: "reverseList",
      returnType: "ListNode*",
      params: [
        { name: "head", type: "ListNode*" }
      ]
    },
    code: `
class Solution {
public:
    ListNode* reverseList(ListNode* head) {
        ListNode* prev = nullptr;
        ListNode* curr = head;
        while (curr) {
            ListNode* nextNode = curr->next;
            curr->next = prev;
            prev = curr;
            curr = nextNode;
        }
        return prev;
    }
};
`,
    testcases: [
      { input: 'head=[1,2,3,4]', output: '[4,3,2,1]' },
      { input: 'head=[]', output: '[]' }
    ]
  },
  {
    name: "Invert Binary Tree",
    category: "Tree",
    signature: {
      functionName: "invertTree",
      returnType: "TreeNode*",
      params: [
        { name: "root", type: "TreeNode*" }
      ]
    },
    code: `
class Solution {
public:
    TreeNode* invertTree(TreeNode* root) {
        if (!root) return nullptr;
        TreeNode* temp = root->left;
        root->left = invertTree(root->right);
        root->right = invertTree(temp);
        return root;
    }
};
`,
    testcases: [
      { input: 'root=[4,2,7,1,3,6,9]', output: '[4,7,2,9,6,3,1]' },
      { input: 'root=[]', output: '[]' }
    ]
  },
  {
    name: "Number of Islands",
    category: "Graph",
    signature: {
      functionName: "numIslands",
      returnType: "int",
      params: [
        { name: "grid", type: "vector<vector<char>>&" }
      ]
    },
    code: `
class Solution {
private:
    void dfs(vector<vector<char>>& grid, int r, int c) {
        int nr = grid.size();
        int nc = grid[0].size();
        grid[r][c] = '0';
        if (r - 1 >= 0 && grid[r-1][c] == '1') dfs(grid, r-1, c);
        if (r + 1 < nr && grid[r+1][c] == '1') dfs(grid, r+1, c);
        if (c - 1 >= 0 && grid[r][c-1] == '1') dfs(grid, r, c-1);
        if (c + 1 < nc && grid[r][c+1] == '1') dfs(grid, r, c+1);
    }
public:
    int numIslands(vector<vector<char>>& grid) {
        int nr = grid.size();
        if (!nr) return 0;
        int nc = grid[0].size();
        int num_islands = 0;
        for (int r = 0; r < nr; ++r) {
            for (int c = 0; c < nc; ++c) {
                if (grid[r][c] == '1') {
                    ++num_islands;
                    dfs(grid, r, c);
                }
            }
        }
        return num_islands;
    }
};
`,
    testcases: [
      { input: 'grid=[["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]', output: '1' },
      { input: 'grid=[["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]', output: '3' }
    ]
  },
  {
    name: "Climbing Stairs",
    category: "DP",
    signature: {
      functionName: "climbStairs",
      returnType: "int",
      params: [
        { name: "n", type: "int" }
      ]
    },
    code: `
class Solution {
public:
    int climbStairs(int n) {
        if (n <= 2) return n;
        int a = 1, b = 2;
        for (int i = 3; i <= n; i++) {
            int temp = a + b;
            a = b;
            b = temp;
        }
        return b;
    }
};
`,
    testcases: [
      { input: 'n=2', output: '2' },
      { input: 'n=3', output: '3' },
      { input: 'n=5', output: '8' }
    ]
  }
];

// 2. Generator function to scale up the suite to hundreds of tests
function generateProblemSuite() {
  const list = [...classicProblems];

  // Helper categories to pick from
  const categories = ["Array", "String", "Sort", "Recursion", "List", "Tree", "Graph", "DP"];

  // Generate 120 dynamic test problems
  for (let i = 1; i <= 120; i++) {
    const category = categories[i % categories.length];
    
    // Define problem based on index to cover various signatures & containers
    if (category === "Array") {
      list.push({
        name: `Dynamic Array Test #${i}`,
        category: "Array",
        signature: {
          functionName: `sumElements_${i}`,
          returnType: "int",
          params: [
            { name: "nums", type: "vector<int>&" },
            { name: "multiplier", type: "int" }
          ]
        },
        code: `
class Solution {
public:
    int sumElements_${i}(vector<int>& nums, int multiplier) {
        int sum = 0;
        for (int x : nums) sum += x;
        return sum * multiplier;
    }
};
`,
        testcases: [
          { input: `nums=[1,2,3], multiplier=${i}`, output: `${6 * i}` },
          { input: `nums=[10,-5], multiplier=${i}`, output: `${5 * i}` }
        ]
      });
    } else if (category === "String") {
      list.push({
        name: `Dynamic String Test #${i}`,
        category: "String",
        signature: {
          functionName: `repeatChar_${i}`,
          returnType: "string",
          params: [
            { name: "ch", type: "char" },
            { name: "count", type: "int" }
          ]
        },
        code: `
class Solution {
public:
    string repeatChar_${i}(char ch, int count) {
        return string(count, ch);
    }
};
`,
        testcases: [
          { input: `ch='a', count=${i % 10 + 1}`, output: `"${"a".repeat(i % 10 + 1)}"` }
        ]
      });
    } else if (category === "Sort") {
      list.push({
        name: `Dynamic Pair/Map Sorting #${i}`,
        category: "Sort",
        signature: {
          functionName: `mapVal_${i}`,
          returnType: "pair<int, int>",
          params: [
            { name: "k", type: "int" },
            { name: "v", type: "int" }
          ]
        },
        code: `
class Solution {
public:
    pair<int, int> mapVal_${i}(int k, int v) {
        return make_pair(k + ${i}, v * 2);
    }
};
`,
        testcases: [
          { input: `k=10, v=20`, output: `[${10 + i}, 40]` }
        ]
      });
    } else if (category === "Recursion") {
      list.push({
        name: `Dynamic Recursion sum #${i}`,
        category: "Recursion",
        signature: {
          functionName: `recSum_${i}`,
          returnType: "int",
          params: [
            { name: "n", type: "int" }
          ]
        },
        code: `
class Solution {
public:
    int recSum_${i}(int n) {
        if (n <= 0) return 0;
        return n + recSum_${i}(n - 1);
    }
};
`,
        testcases: [
          { input: `n=5`, output: `15` },
          { input: `n=10`, output: `55` }
        ]
      });
    } else if (category === "List") {
      list.push({
        name: `Dynamic List mapping #${i}`,
        category: "List",
        signature: {
          functionName: `incrementList_${i}`,
          returnType: "ListNode*",
          params: [
            { name: "head", type: "ListNode*" }
          ]
        },
        code: `
class Solution {
public:
    ListNode* incrementList_${i}(ListNode* head) {
        ListNode* curr = head;
        while (curr) {
            curr->val += ${i};
            curr = curr->next;
        }
        return head;
    }
};
`,
        testcases: [
          { input: `head=[1,2,3]`, output: `[${1 + i},${2 + i},${3 + i}]` }
        ]
      });
    } else if (category === "Tree") {
      list.push({
        name: `Dynamic Tree doubling #${i}`,
        category: "Tree",
        signature: {
          functionName: `doubleTree_${i}`,
          returnType: "TreeNode*",
          params: [
            { name: "root", type: "TreeNode*" }
          ]
        },
        code: `
class Solution {
public:
    TreeNode* doubleTree_${i}(TreeNode* root) {
        if (!root) return nullptr;
        root->val *= 2;
        doubleTree_${i}(root->left);
        doubleTree_${i}(root->right);
        return root;
    }
};
`,
        testcases: [
          { input: `root=[1,2,3]`, output: `[2,4,6]` }
        ]
      });
    } else if (category === "Graph") {
      list.push({
        name: `Dynamic Graph connections #${i}`,
        category: "Graph",
        signature: {
          functionName: `hasEdge_${i}`,
          returnType: "bool",
          params: [
            { name: "graph", type: "map<int, vector<int>>&" },
            { name: "u", type: "int" },
            { name: "v", type: "int" }
          ]
        },
        code: `
class Solution {
public:
    bool hasEdge_${i}(map<int, vector<int>>& graph, int u, int v) {
        if (graph.count(u)) {
            for (int adj : graph[u]) {
                if (adj == v) return true;
            }
        }
        return false;
    }
};
`,
        testcases: [
          { input: `graph=[[1, [2, 3]], [2, [3]]], u=1, v=3`, output: `true` },
          { input: `graph=[[1, [2, 3]], [2, [3]]], u=2, v=1`, output: `false` }
        ]
      });
    } else if (category === "DP") {
      list.push({
        name: `Dynamic DP fib multiplication #${i}`,
        category: "DP",
        signature: {
          functionName: `fibDP_${i}`,
          returnType: "long long",
          params: [
            { name: "n", type: "int" }
          ]
        },
        code: `
class Solution {
public:
    long long fibDP_${i}(int n) {
        if (n <= 0) return 0;
        vector<long long> dp(n + 1, 0);
        dp[1] = 1;
        for (int j = 2; j <= n; j++) {
            dp[j] = dp[j-1] + dp[j-2];
        }
        return dp[n] * ${i};
    }
};
`,
        testcases: [
          { input: `n=5`, output: `${5 * i}` }
        ]
      });
    }
  }

  return list;
}

module.exports = { getProblems: generateProblemSuite };
