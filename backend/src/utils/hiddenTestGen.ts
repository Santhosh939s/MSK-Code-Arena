import { ParsedProblem, TestCase } from '../types';

// ── Constraint-based value generator ─────────────────────────────────────────
function extractIntRange(constraints: string[]): { min: number; max: number } {
  let min = 1, max = 1000;
  for (const c of constraints) {
    const m = c.match(/(\d+)\s*<=?\s*\w+\s*<=?\s*(\d+)/);
    if (m) {
      min = parseInt(m[1]);
      max = parseInt(m[2]);
    }
  }
  return { min, max };
}

function gcd(a: number, b: number): number {
  while (b) { const t = b; b = a % b; a = t; }
  return a;
}

// ── Generate hidden tests for a problem ──────────────────────────────────────
export function generateHiddenTests(problem: ParsedProblem): TestCase[] {
  const { min, max } = extractIntRange(problem.constraints);
  const firstEx = problem.examples[0];

  // Detect 2-param integer problems (e.g., GCD)
  const twoIntParams = firstEx?.input.match(/(\w+)\s*=\s*(\d+),?\s*(\w+)\s*=\s*(\d+)/);

  if (twoIntParams) {
    // Generate edge cases for two-integer problems
    const cases: Array<[number, number]> = [
      [max, max],            // both at max
      [min, min],            // both at min
      [max, 1],              // one at max, other at 1
      [1, max],              // inverse
      [min + 1, max],        // near min with max
      [Math.floor(max / 2), Math.floor(max / 3)], // arbitrary mid
      [17, 31],              // co-prime small numbers
      [100, 75],             // common divisor
    ];

    const title = problem.title.toLowerCase();

    if (title.includes('gcd') || title.includes('greatest common')) {
      return cases.map(([a, b]) => ({
        input: `${twoIntParams[1]} = ${a}, ${twoIntParams[3]} = ${b}`,
        output: String(gcd(a, b)),
        isHidden: true,
      }));
    }

    if (title.includes('sum') || title.includes('add')) {
      return cases.map(([a, b]) => ({
        input: `${twoIntParams[1]} = ${a}, ${twoIntParams[3]} = ${b}`,
        output: String(a + b),
        isHidden: true,
      }));
    }

    // Generic fallback: return placeholder (backend validates against user output)
    return cases.slice(0, 5).map(([a, b]) => ({
      input: `${twoIntParams[1]} = ${a}, ${twoIntParams[3]} = ${b}`,
      output: '__COMPUTED__',
      isHidden: true,
    }));
  }

  // Generic edge cases from existing examples
  return problem.examples.map(ex => ({
    input: ex.input,
    output: ex.output,
    isHidden: true,
  }));
}
