// ── MSK Code Arena — Literal Generator ──────────────────────────────────────────
// Generates C++ literals from JavaScript values.

class CppLiteralGenerator {
  generate(val, type) {
    const v = String(val).trim();
    const cleaned = type.replace(/\s+/g, '');

    if (cleaned === 'string' || cleaned === 'conststring&' || cleaned === 'conststring') {
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
    if (cleaned === 'ListNode*' || cleaned === 'TreeNode*') {
      const inner = v.replace(/^\[|^\{|\]$|\}$/g, '').trim();
      return `create${cleaned.replace('*', '')}({${inner}})`;
    }
    return v; // int, long long, double, float
  }
}

module.exports = { CppLiteralGenerator };
