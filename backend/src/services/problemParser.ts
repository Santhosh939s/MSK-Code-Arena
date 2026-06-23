import { v4 as uuidv4 } from 'uuid';
import { Example, ParsedProblem } from '../types';

// ── Noise section patterns to strip ──────────────────────────────────────────
const NOISE_PATTERNS = [
  /(?:^|\n)\s*(?:Subscribe|Premium|Unlock|Upgrade)[^\n]*/gi,
  /(?:^|\n)\s*Hint[s]?\s*\d*[^\n]*/gi,
  /(?:^|\n)\s*(?:Compan(?:y|ies)|Tags?)[^\n]*/gi,
  /(?:^|\n)\s*(?:Related Topics?|Similar Questions?|Similar Problems?)[^\n]*/gi,
  /(?:^|\n)\s*Follow[\s-]up[^\n]*/gi,
  /(?:^|\n)\s*(?:Frequently Occurring|Interview Follow)[^\n]*/gi,
  /(?:^|\n)\s*(?:Discussion|Editorial|Submissions?)[^\n]*/gi,
  /(?:^|\n)\s*(?:Like|Dislike|Share|Star)\s*\d*[^\n]*/gi,
  /(?:^|\n)\s*\d+\s*(?:ms|MB)\s*(?:Beats|beats)[^\n]*/gi,
  /(?:^|\n)\s*Accepted\s+\d[^\n]*/gi,
];

// ── Helper: find section boundary ────────────────────────────────────────────
function findIndex(text: string, patterns: RegExp[]): number {
  let min = -1;
  for (const p of patterns) {
    p.lastIndex = 0;
    const m = p.exec(text);
    if (m !== null && (min === -1 || m.index < min)) {
      min = m.index;
    }
  }
  return min;
}

// ── Helper: clean up whitespace ───────────────────────────────────────────────
function clean(s: string): string {
  return s.replace(/\r/g, '').replace(/\n{3,}/g, '\n\n').trim();
}

// ── Extract title ─────────────────────────────────────────────────────────────
function extractTitle(lines: string[]): { title: string; startIndex: number } {
  const skipWords = /^(example|input|output|constraint|description|note|explanation|follow|given|you are|problem|question)/i;
  for (let i = 0; i < Math.min(8, lines.length); i++) {
    const line = lines[i].trim();
    if (line.length >= 2 && line.length <= 120 && !skipWords.test(line)) {
      // Remove common prefixes like "1." or "Easy/Medium/Hard"
      const cleaned = line.replace(/^\d+\.\s*/, '').replace(/\s*(Easy|Medium|Hard)\s*$/, '').trim();
      if (cleaned.length >= 2) {
        return { title: cleaned, startIndex: i };
      }
    }
  }
  return { title: lines[0]?.trim() || 'Untitled Problem', startIndex: 0 };
}

// ── Extract examples ──────────────────────────────────────────────────────────
function extractExamples(text: string): Example[] {
  const examples: Example[] = [];
  // Match example blocks: "Example 1:", "Example 1.", "Example:", "Test Case 1:"
  const blockRegex = /(?:Example|Test\s+Case)\s*\d*\s*[:.]\s*\n?([\s\S]*?)(?=(?:Example|Test\s+Case)\s*\d*\s*[:.]\s*\n|Constraints?[:.]\s*\n|Note[s]?\s*[:.]\s*\n|$)/gi;

  let match: RegExpExecArray | null;
  while ((match = blockRegex.exec(text)) !== null) {
    const block = match[1];
    if (!block.trim()) continue;

    const inputMatch = block.match(/Input\s*[:.]\s*([\s\S]*?)(?=Output\s*[:.]\s*|$)/i);
    const outputMatch = block.match(/Output\s*[:.]\s*([\s\S]*?)(?=Explanation\s*[:.]\s*|Example|Constraint|Note|$)/i);
    const explanationMatch = block.match(/Explanation\s*[:.]\s*([\s\S]*?)(?=Example|Constraint|Note|$)/i);

    if (inputMatch && outputMatch) {
      examples.push({
        input: inputMatch[1].trim(),
        output: outputMatch[1].trim(),
        explanation: explanationMatch?.[1]?.trim(),
      });
    }
  }

  return examples;
}

// ── Extract constraints ───────────────────────────────────────────────────────
function extractConstraints(text: string): string[] {
  const constraintRegex = /Constraints?\s*[:.]\s*\n?([\s\S]*?)(?=\n\n[A-Z]|Note[s]?\s*[:.]\s*\n|Follow|$)/i;
  const match = text.match(constraintRegex);
  if (!match) return [];

  return match[1]
    .split('\n')
    .map(l => l.replace(/^[\s\-•*]+/, '').trim())
    .filter(l => l.length > 0 && /[\d≤≥<>^=]/.test(l));
}

// ── Main parser ───────────────────────────────────────────────────────────────
export function parseProblem(rawText: string): ParsedProblem {
  // 1. Strip noise
  let text = rawText;
  for (const pattern of NOISE_PATTERNS) {
    text = text.replace(pattern, '');
  }
  text = clean(text);

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // 2. Extract title
  const { title, startIndex } = extractTitle(lines);
  const textAfterTitle = lines.slice(startIndex + 1).join('\n');

  // 3. Find boundary between description and examples
  const examplePatterns = [/(?:^|\n)(?:Example|Test\s+Case)\s*\d*\s*[:.]/i];
  const exampleStart = findIndex(textAfterTitle, examplePatterns);

  let description: string;
  let examplesAndRest: string;

  if (exampleStart > 0) {
    description = clean(textAfterTitle.substring(0, exampleStart));
    examplesAndRest = textAfterTitle.substring(exampleStart);
  } else {
    // No "Example" label — try splitting at "Input:"
    const inputStart = findIndex(textAfterTitle, [/(?:^|\n)Input\s*[:.]/i]);
    if (inputStart > 0) {
      description = clean(textAfterTitle.substring(0, inputStart));
      examplesAndRest = textAfterTitle.substring(inputStart);
    } else {
      description = clean(textAfterTitle);
      examplesAndRest = '';
    }
  }

  // 4. Extract examples
  const examples = extractExamples(examplesAndRest || textAfterTitle);

  // 5. Extract constraints
  const constraints = extractConstraints(text);

  return {
    id: uuidv4(),
    title,
    description,
    examples,
    constraints,
  };
}
