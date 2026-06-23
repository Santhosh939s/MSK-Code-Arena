/**
 * Generates hidden edge-case test cases from constraints + examples.
 * Hidden tests are NEVER sent to the frontend.
 */

function gcd(a, b) {
  while (b) { const t = b; b = a % b; a = t; }
  return a;
}

function extractRange(constraints) {
  let min = 1, max = 1000;
  for (const c of constraints) {
    const m = c.match(/(\d+)\s*<=?\s*\w+\s*<=?\s*(\d+)/);
    if (m) { min = parseInt(m[1]); max = parseInt(m[2]); }
  }
  return { min, max };
}

function detectTwoIntProblem(examples) {
  if (!examples[0]) return null;
  const m = examples[0].input.match(/(\w+)\s*=\s*(\d+)[,\s]+(\w+)\s*=\s*(\d+)/);
  return m ? { p1: m[1], p2: m[3] } : null;
}

function generateHiddenTests(parsed) {
  const { title, examples, constraints } = parsed;
  const { min, max } = extractRange(constraints);
  const twoInt = detectTwoIntProblem(examples);
  const t = title.toLowerCase();

  if (twoInt) {
    const pairs = [
      [max, max], [min, min], [max, 1], [1, max],
      [Math.floor(max * 0.75), Math.floor(max * 0.5)],
      [17, 31], [100, 75], [999, 333],
    ];

    let compute;
    if (t.includes('gcd') || t.includes('greatest common')) {
      compute = (a, b) => gcd(a, b);
    } else if (t.includes('lcm') || t.includes('least common')) {
      compute = (a, b) => (a * b) / gcd(a, b);
    } else if (t.includes('sum') || t.includes('add')) {
      compute = (a, b) => a + b;
    } else if (t.includes('product') || t.includes('multiply')) {
      compute = (a, b) => a * b;
    } else if (t.includes('max') || t.includes('maximum')) {
      compute = (a, b) => Math.max(a, b);
    } else if (t.includes('min') || t.includes('minimum')) {
      compute = (a, b) => Math.min(a, b);
    } else {
      // Generic: re-use visible examples as hidden (best-effort)
      return examples.map(ex => ({ ...ex, isHidden: true }));
    }

    return pairs.map(([a, b]) => ({
      input: `${twoInt.p1} = ${a}, ${twoInt.p2} = ${b}`,
      output: String(compute(a, b)),
      isHidden: true,
    }));
  }

  // Fallback: clone visible examples as hidden
  return examples.slice(0, 3).map(ex => ({ ...ex, isHidden: true }));
}

module.exports = { generateHiddenTests };
