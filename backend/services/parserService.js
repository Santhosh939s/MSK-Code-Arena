// ── MSK Code Arena — Robust Problem Parser ────────────────────────────────────
// Handles: LeetCode · Striver TUF · GeeksforGeeks · Coding Ninjas · HackerRank

// ──────────────────────────────────────────────────────────────────────────────
// Step 1: Clean and strip noise from raw text
// ──────────────────────────────────────────────────────────────────────────────
function stripNoise(text) {
  let t = text.replace(/\r/g, '');

  // 1. Strip Striver "Now your turn!" blocks that are before Constraints
  // Usually format: "Now your turn!\n\nInput: ... Output: ... Pick your answer ... 12\n6\n1\n9"
  t = t.replace(/\bNow\s+your\s+turn![\s\S]*?(?=\bConstraints?\b|$)/gi, '');
  t = t.replace(/\bPick\s+your\s+answer[\s\S]*?(?=\bConstraints?\b|$)/gi, '');

  // 2. Strip trailing sections (Frequently Occurring Doubts, Interview Follow-ups, Extras)
  // These are always at the very end of the text.
  const trailingPatterns = [
    /\bFrequently\s+Occurring\s+Doubts?[\s\S]*$/i,
    /\bInterview\s+Follow[\s-]?ups?[\s\S]*$/i,
    /\bExtras?[\s\S]*$/i,
  ];

  for (const p of trailingPatterns) {
    t = t.replace(p, '');
  }

  // 3. Strip trailing "Hints" block (only if it comes after Constraints or Examples)
  // We identify it by looking for "Hints\n\nHint 1" or "Hints\nHint 1" or "Hints" at the end of text
  const hintIndex = t.search(/\bHints?\s*\n\s*\n?\s*Hint\s+\d/i);
  if (hintIndex > 100) {
    t = t.substring(0, hintIndex);
  }

  // 4. Strip specific noise lines (case-insensitive, whole line)
  const noiseLines = [
    /^\s*Subscribe\s+to\s+TUF\+?\s*$/gim,
    /^\s*Premium\s*$/gim,
    /^\s*Company\s*$/gim,
    /^\s*Tags?\s*$/gim,
    /^\s*Related\s+Topics?\s*$/gim,
    /^\s*Similar\s+Questions?\s*$/gim,
    /^\s*Follow\s+Up\s*$/gim,
    /^\s*Discussion\s*$/gim,
    /^\s*Editorial\s*$/gim,
    /^\s*Pick\s+your\s+answer\s*$/gim,
    /^\s*Hints?\s*$/gim, // Strip standalone "Hints" or "Hint" line if it didn't get stripped by trailing rule (e.g. at the top)
    /^\s*Want\s+to\s+see\s+real\s+doubts\?\s*$/gim,
    /^\s*Interested\s+in\s+interview\s+prep\?\s*$/gim,
    /^\s*🔒\s*$/gim,
    /^\s*\d+\s*(?:ms|MB)\s*beats?.*$/gim,
    /^\s*(?:Like|Dislike)\s*\d+\s*$/gim,
  ];

  for (const p of noiseLines) {
    t = t.replace(p, '');
  }

  return t.replace(/\n{3,}/g, '\n\n').trim();
}

// ──────────────────────────────────────────────────────────────────────────────
// Step 2: Extract title
// ──────────────────────────────────────────────────────────────────────────────
const TITLE_SKIP = /^(?:example|input|output|constraint|description|note|given|you\s+are|problem|the\s+greatest|subscribe|pick|now\s+your)/i;

function extractTitle(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  for (const line of lines.slice(0, 6)) {
    if (
      line.length >= 2 &&
      line.length <= 120 &&
      !TITLE_SKIP.test(line) &&
      !/^\d+$/.test(line) &&
      !/^[^a-zA-Z]*$/.test(line)  // skip lines with no letters
    ) {
      return line
        .replace(/^\d+\.\s*/, '')
        .replace(/\s*(Easy|Medium|Hard)\s*$/, '')
        .trim();
    }
  }
  return lines[0] || 'Untitled Problem';
}

// ──────────────────────────────────────────────────────────────────────────────
// Step 3: Extract examples — handles both LeetCode (:) and TUF (no colon) formats
// ──────────────────────────────────────────────────────────────────────────────
function parseExampleBlock(block) {
  const inp = block.match(/\bInput\s*[:.]\s*([\s\S]*?)(?=\bOutput\s*[:.]\s*|$)/i);
  const out = block.match(/\bOutput\s*[:.]\s*([\s\S]*?)(?=\bExplanation\s*[:.]\s*|\bExample\b|\bConstraints?\b|\bNote\b|$)/i);
  const exp = block.match(/\bExplanation\s*[:.]\s*([\s\S]*?)(?=\bExample\b|\bConstraints?\b|\bNote\b|$)/i);

  if (!inp || !out) return null;

  const inputVal = inp[1].replace(/\n+/g, ' ').trim();
  const outputVal = out[1].split('\n')[0].trim(); // only first line of output

  if (!inputVal || !outputVal) return null;

  return {
    input: inputVal,
    output: outputVal,
    explanation: exp ? exp[1].replace(/\n+/g, ' ').trim() : undefined,
  };
}

function extractExamples(text) {
  const examples = [];

  // ── Strategy A: "Example 1:" or "Example 1." (LeetCode, GFG, CN) ──────────
  const reA = /\bExample\s*\d*\s*[:.]\s*\n?([\s\S]*?)(?=\bExample\s*\d|\bConstraints?\b|\bNote[s]?\b|$)/gi;
  let m;
  while ((m = reA.exec(text)) !== null) {
    const ex = parseExampleBlock(m[1]);
    if (ex) examples.push(ex);
  }
  if (examples.length > 0) return examples;

  // ── Strategy B: "Example 1" alone on a line (TUF format) ──────────────────
  const reB = /\bExample\s+\d+\s*\n\s*\n?([\s\S]*?)(?=\bExample\s+\d|\bConstraints?\b|\bNote[s]?\b|$)/gi;
  while ((m = reB.exec(text)) !== null) {
    const ex = parseExampleBlock(m[1]);
    if (ex) examples.push(ex);
  }
  if (examples.length > 0) return examples;

  // ── Strategy C: Raw "Input:" / "Output:" pairs (no Example headers) ────────
  const reC = /\bInput\s*[:.]\s*([\s\S]*?)\bOutput\s*[:.]\s*([\s\S]*?)(?=\bInput\s*[:.]\s*|\bConstraints?\b|$)/gi;
  while ((m = reC.exec(text)) !== null) {
    const ex = {
      input: m[1].replace(/\n+/g, ' ').trim(),
      output: m[2].split('\n')[0].trim(),
    };
    if (ex.input && ex.output) examples.push(ex);
  }

  return examples;
}

// ──────────────────────────────────────────────────────────────────────────────
// Step 4: Extract constraints
// ──────────────────────────────────────────────────────────────────────────────
function extractConstraints(text) {
  const m = text.match(/\bConstraints?\s*[:.]\s*\n?([\s\S]*?)(?=\n\n[A-Z]|\bNote[s]?\b|\bHint|\b$)/i)
    || text.match(/\bConstraints?\s*\n([\s\S]*?)(?=\n\n[A-Z]|$)/i);
  if (!m) return [];
  return m[1]
    .split('\n')
    .map(l => {
      let temp = l.trim();
      temp = temp.replace(/^\d+\.\s+/, '');
      temp = temp.replace(/^[•*·→\s]+/, '');
      temp = temp.replace(/^-\s+/, '');
      return temp.trim();
    })
    .filter(l => l.length > 0 && /[\d<>=≤≥^]/.test(l));
}

// ──────────────────────────────────────────────────────────────────────────────
// Main export
// ──────────────────────────────────────────────────────────────────────────────
function parseProblem(rawText) {
  const clean = stripNoise(rawText);

  // Extract title
  const title = extractTitle(clean);
  const titleIdx = clean.indexOf(title);
  const afterTitle = clean.substring(titleIdx + title.length).trim();

  // Find boundary between description and examples
  const examplesStart = (() => {
    const candidates = [
      afterTitle.search(/\bExample\s*\d*\s*[:.]/i),  // "Example 1:"
      afterTitle.search(/\bExample\s+\d+\s*\n/i),    // "Example 1\n" (TUF)
      afterTitle.search(/\bInput\s*[:.]/i),           // raw "Input:"
    ].filter(n => n > 0);
    return candidates.length ? Math.min(...candidates) : -1;
  })();

  let description = '';
  let exSection = '';

  if (examplesStart > 0) {
    description = afterTitle.substring(0, examplesStart).trim();
    exSection = afterTitle.substring(examplesStart);
  } else {
    description = afterTitle;
    exSection = '';
  }

  const examples = extractExamples(exSection || afterTitle);
  const constraints = extractConstraints(clean);

  return { title, description, examples, constraints };
}

module.exports = { parseProblem };
