// ── Type inference from example values ───────────────────────────────────────
function inferType(val) {
  const v = val.trim();
  if (/^\[\[/.test(v) || /^\{\{/.test(v)) return 'vector<vector<int>>';
  if (/^\[/.test(v) || /^\{/.test(v)) {
    const inner = v.slice(1, -1).trim();
    if (/^"/.test(inner)) return 'vector<string>';
    return 'vector<int>';
  }
  if (/^"/.test(v) || /^'/.test(v)) return 'string';
  if (v === 'true' || v === 'false') return 'bool';
  if (/^-?\d+$/.test(v) && Math.abs(parseInt(v)) > 2e9) return 'long long';
  if (/^-?\d+$/.test(v)) return 'int';
  if (/^-?\d+\.\d+$/.test(v)) return 'double';
  return 'string';
}

// ── Parse params from example input ──────────────────────────────────────────
function parseParams(exampleInput) {
  const params = [];
  const seen = new Set();
  const re = /(\w+(?:\[\])?)\s*=\s*(\[[^\]]*\]|\{[^\}]*\}|"[^"]*"|-?\d+(?:\.\d+)?|true|false)/g;
  let m;
  while ((m = re.exec(exampleInput)) !== null) {
    let name = m[1].trim();
    if (name.endsWith('[]')) {
      name = name.slice(0, -2);
    }
    if (!seen.has(name)) {
      seen.add(name);
      params.push({ name: name, type: inferType(m[2]) });
    }
  }

  // FALLBACK: if regex matches nothing, parse as raw values
  if (params.length === 0 && exampleInput && exampleInput.trim().length > 0) {
    const parts = [];
    let current = '';
    let bracketDepth = 0;
    
    for (let i = 0; i < exampleInput.length; i++) {
      const char = exampleInput[i];
      if (char === '[' || char === '{' || char === '(') {
        bracketDepth++;
        current += char;
      } else if (char === ']' || char === '}' || char === ')') {
        bracketDepth--;
        current += char;
      } else if ((char === ',' || char === '\n') && bracketDepth === 0) {
        if (current.trim().length > 0) {
          parts.push(current.trim());
        }
        current = '';
      } else {
        current += char;
      }
    }
    if (current.trim().length > 0) {
      parts.push(current.trim());
    }
    
    parts.forEach((part, index) => {
      let name = '';
      let valStr = part;
      const eqIdx = part.indexOf('=');
      if (eqIdx !== -1) {
        name = part.substring(0, eqIdx).replace(/[^a-zA-Z0-9_]/g, '').trim();
        valStr = part.substring(eqIdx + 1).trim();
      }
      
      const inferred = inferType(valStr);
      if (!name) {
        const cleanType = inferred.replace(/\s+/g, '');
        if (cleanType.includes('vector<vector')) {
          name = `grid${index > 0 ? index + 1 : ''}`;
        } else if (cleanType.includes('vector')) {
          name = `arr${index > 0 ? index + 1 : ''}`;
        } else if (cleanType.includes('string')) {
          name = `s${index > 0 ? index + 1 : ''}`;
        } else if (cleanType.includes('bool')) {
          name = `flag${index > 0 ? index + 1 : ''}`;
        } else if (cleanType.includes('long')) {
          name = `num${index > 0 ? index + 1 : ''}`;
        } else if (cleanType.includes('double') || cleanType.includes('float')) {
          name = `val${index > 0 ? index + 1 : ''}`;
        } else {
          name = index === 0 ? 'n' : `val${index + 1}`;
        }
      }
      
      if (!seen.has(name)) {
        seen.add(name);
        params.push({ name, type: inferred });
      }
    });
  }

  return params;
}

// ── Function name from title ──────────────────────────────────────────────────
function toFunctionName(title) {
  const words = title.replace(/[^a-zA-Z0-9 ]/g, '').split(/\s+/).filter(Boolean);
  return words.map((w, i) => i === 0 ? w[0].toUpperCase() + w.slice(1) : w[0].toUpperCase() + w.slice(1)).join('');
}

// ── C++ template generator ────────────────────────────────────────────────────
function generateCppTemplate(title, params, returnType) {
  const fnName = toFunctionName(title);
  const paramList = params.map(p => `${p.type} ${p.name}`).join(', ');
  return `class Solution {\npublic:\n    ${returnType} ${fnName}(${paramList}) {\n        // Write your solution here\n        \n    }\n};`;
}

// ── Signature extraction ──────────────────────────────────────────────────────
function generateTemplate(parsed) {
  const { title, examples } = parsed;
  const firstEx = examples[0];

  let params = firstEx ? parseParams(firstEx.input) : [{ name: 'n', type: 'int' }];
  if (params.length === 0) params = [{ name: 'n', type: 'int' }];

  const returnType = firstEx ? inferType(firstEx.output) : 'int';
  const functionName = toFunctionName(title);
  const cppCode = generateCppTemplate(title, params, returnType);

  return {
    functionName,
    params,
    returnType,
    cppCode,
  };
}

module.exports = { generateTemplate, inferType, toFunctionName };
