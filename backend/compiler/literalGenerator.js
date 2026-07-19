// ── MSK Code Arena — Literal Generator ──────────────────────────────────────────
// Generates C++ literals from JavaScript values.

function parseCppLikeJson(valStr) {
  const trimmed = valStr.trim();
  let jsonStr = '';
  let inString = false;
  let escape = false;
  for (let i = 0; i < trimmed.length; i++) {
    const c = trimmed[i];
    if (escape) {
      jsonStr += c;
      escape = false;
      continue;
    }
    if (c === '\\') {
      jsonStr += c;
      escape = true;
      continue;
    }
    if (c === '"' || c === "'") {
      inString = !inString;
      jsonStr += '"';
      continue;
    }
    if (!inString) {
      if (c === '{') {
        jsonStr += '[';
      } else if (c === '}') {
        jsonStr += ']';
      } else {
        jsonStr += c;
      }
    } else {
      jsonStr += c;
    }
  }

  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    return trimmed;
  }
}

function parseTemplateArgs(str) {
  const args = [];
  let current = '';
  let depth = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char === '<') depth++;
    else if (char === '>') depth--;

    if (char === ',' && depth === 0) {
      args.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  if (current.trim()) {
    args.push(current.trim());
  }
  return args;
}

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
      const stripped = v.replace(/^["']|["']$/g, '');
      return `"${stripped.replace(/"/g, '\\"')}"`;
    }
    if (cleaned === 'char') {
      const charVal = v.replace(/^['"]|['"]$/g, '');
      return `'${charVal}'`;
    }
    if (cleaned === 'bool') {
      return (v === 'true' || v === '1') ? 'true' : 'false';
    }

    // Dynamic STL container matching: Name<Args>
    const match = cleaned.match(/^([a-zA-Z0-9_:]+)<(.*)>$/);
    if (match) {
      const templateName = match[1];
      const templateArgsStr = match[2];
      const parsedVal = parseCppLikeJson(v);

      if (templateName === 'pair') {
        const args = parseTemplateArgs(templateArgsStr);
        const kType = args[0] || 'int';
        const vType = args[1] || 'int';

        let kVal = '0';
        let vVal = '0';
        if (Array.isArray(parsedVal)) {
          kVal = parsedVal[0] ?? '0';
          vVal = parsedVal[1] ?? '0';
        }
        return `{${this.generate(kVal, kType)}, ${this.generate(vVal, vType)}}`;
      }

      if (templateName === 'map' || templateName === 'unordered_map') {
        const args = parseTemplateArgs(templateArgsStr);
        const kType = args[0] || 'int';
        const vType = args[1] || 'int';

        let pairs = [];
        if (Array.isArray(parsedVal)) {
          for (const item of parsedVal) {
            let kVal = '0';
            let vVal = '0';
            if (Array.isArray(item)) {
              kVal = item[0] ?? '0';
              vVal = item[1] ?? '0';
            }
            pairs.push(`{${this.generate(kVal, kType)}, ${this.generate(vVal, vType)}}`);
          }
        }
        return `{${pairs.join(', ')}}`;
      }

      if (templateName === 'set' || templateName === 'unordered_set' || templateName === 'vector') {
        const args = parseTemplateArgs(templateArgsStr);
        const itemType = args[0] || 'int';

        let items = [];
        if (Array.isArray(parsedVal)) {
          for (const item of parsedVal) {
            items.push(this.generate(item, itemType));
          }
        }
        return `{${items.join(', ')}}`;
      }
    }

    if (cleaned === 'ListNode') {
      const parsedVal = parseCppLikeJson(v);
      let items = [];
      if (Array.isArray(parsedVal)) {
        items = parsedVal.map(x => String(x));
      } else {
        const inner = v.replace(/^\[|^\{|\]$|\}$/g, '').trim();
        items = inner ? inner.split(',').map(x => x.trim()) : [];
      }
      return `createListNode({${items.join(', ')}})`;
    }

    if (cleaned === 'TreeNode') {
      const parsedVal = parseCppLikeJson(v);
      let items = [];
      if (Array.isArray(parsedVal)) {
        items = parsedVal.map(x => (x === null || x === undefined) ? '"null"' : `"${x}"`);
      } else {
        const inner = v.replace(/^\[|^\{|\]$|\}$/g, '').trim();
        items = inner ? inner.split(',').map(x => {
          const t = x.trim();
          return t.startsWith('"') ? t : `"${t}"`;
        }) : [];
      }
      return `createTreeNode({${items.join(', ')}})`;
    }

    const isInt = ['int', 'short', 'longlong', 'unsigned', 'unsignedint', 'unsignedlonglong', 'long'].includes(cleaned);
    const isFloat = ['double', 'float'].includes(cleaned);

    if (isInt) {
      const match = v.match(/-?\d+/);
      return match ? match[0] : '0';
    }
    if (isFloat) {
      const match = v.match(/-?\d+(?:\.\d+)?/);
      return match ? match[0] : '0.0';
    }

    return v; // fallback
  }
}

module.exports = { CppLiteralGenerator };
