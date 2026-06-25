// ── MSK Code Arena — Signature Extractor ──────────────────────────────────────────
// Extracts C++ class Solution method return type, name, and parameters.

function extractSignatureFromUserCode(userCode, defaultSig) {
  const classSolRegex = /class\s+Solution\s*\{([\s\S]*?)\};?/i;
  const match = userCode.match(classSolRegex);
  if (!match) return defaultSig;

  const classBody = match[1];
  // Regex to extract method signature: return_type name ( params )
  // Matches templates, pointers (*), references (&), namespaces (::), const modifiers
  const methodRegex = /\b([a-zA-Z0-9_:\s*&<>]+)\s+([a-zA-Z_]\w*)\s*\(([^)]*)\)/g;
  let m;
  while ((m = methodRegex.exec(classBody)) !== null) {
    let returnType = m[1].trim();
    const name = m[2].trim();
    const paramsText = m[3].trim();

    // Skip control structures and C++ keywords
    if (['if', 'for', 'while', 'switch', 'return', 'class', 'public', 'private', 'protected', 'using', 'namespace', 'const'].includes(name)) {
      continue;
    }

    // Clean access modifiers from returnType
    returnType = returnType
      .replace(/\b(public|private|protected)\s*:/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!returnType || ['public', 'private', 'protected'].includes(returnType)) {
      continue;
    }

    const params = [];
    if (paramsText) {
      const paramTokens = paramsText.split(',');
      for (const token of paramTokens) {
        const cleanedToken = token.trim();
        if (!cleanedToken) continue;

        const words = cleanedToken.split(/\s+/);
        let paramName = words[words.length - 1];

        // Strip leading reference and pointer markers from variable name
        paramName = paramName.replace(/^[&*]+/, '');

        let paramType = cleanedToken.substring(0, cleanedToken.lastIndexOf(words[words.length - 1])).trim();
        
        // Preserve const/ref/pointer markers in paramType if appropriate, but keep it clean
        paramType = paramType
          .replace(/\bconst\b/g, '')
          .replace(/[&*]/g, '')
          .replace(/\s+/g, ' ')
          .trim();

        params.push({
          name: paramName,
          type: paramType,
          originalDecl: cleanedToken
        });
      }
    }

    return { functionName: name, returnType, params };
  }

  return defaultSig;
}

module.exports = { extractSignatureFromUserCode };
