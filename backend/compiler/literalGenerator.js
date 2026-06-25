// ── MSK Code Arena — Literal Generator ──────────────────────────────────────────
// Generates C++ literals from JavaScript values.

class CppLiteralGenerator {
  generate(val, type) {
    const v = String(val).trim();
    // Clean type string: remove const, pointers/references, access labels, and all whitespace
    const cleaned = type
      .replace(/\b(public|private|protected)\s*:/gi, '')
      .replace(/\bconst\b/g, '')
      .replace(/[&*]/g, '')
      .replace(/\s+/g, '');

    if (cleaned === 'string') {
      return v.startsWith('"') ? v : `"${v.replace(/"/g, '\\"')}"`;
    }
    if (cleaned === 'char') {
      const charVal = v.replace(/^['"]|['"]$/g, '');
      return `'${charVal}'`;
    }
    if (cleaned === 'bool') {
      return (v === 'true' || v === '1') ? 'true' : 'false';
    }
    if (cleaned.startsWith('vector<vector<')) {
      return v.replace(/\[/g, '{').replace(/\]/g, '}');
    }
    if (cleaned.startsWith('vector<')) {
      const inner = v.replace(/^\[|^\{|\]$|\}$/g, '').trim();
      return `{${inner}}`;
    }
    if (cleaned === 'ListNode' || cleaned === 'TreeNode') {
      const inner = v.replace(/^\[|^\{|\]$|\}$/g, '').trim();
      return `create${cleaned}({${inner}})`;
    }
    return v; // int, long long, double, float
  }
}

module.exports = { CppLiteralGenerator };
