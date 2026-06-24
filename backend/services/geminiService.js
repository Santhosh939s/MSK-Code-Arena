// ── MSK Code Arena — Gemini AI Integration Service ──────────────────────────────
// Utilizes Google Gemini 2.5 Flash to generate or clean up coding problems.

const MODEL_NAME = 'gemini-2.5-flash';

async function generateProblemWithGemini(rawText) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('[Gemini] GEMINI_API_KEY environment variable is not defined.');
    return null;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`;

  const prompt = `
User Input:
"""
${rawText}
"""

Instructions:
1. Parse the User Input.
2. If it is a short title (e.g. "sum of two numbers") or a short description, write a clean LeetCode-style description, 2-3 examples, and 2-4 constraints.
3. If it is a full but messy copy-paste, extract the elements, clean them up, and organize them.
4. For all examples:
   - Format the input field like "paramName1 = value1, paramName2 = value2" (e.g. "n1 = 5, n2 = 10" or "arr = [3, 1, 2]").
   - Format the output field clearly (e.g. "15" or "[1, 2, 3]").
   - Include a brief explanation.
5. For constraints, use standard notations (e.g. "1 <= n1, n2 <= 1000", "1 <= arr.length <= 10^5").
`;

  const payload = {
    contents: [
      {
        parts: [
          { text: prompt }
        ]
      }
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          title: { type: 'STRING' },
          description: { type: 'STRING' },
          examples: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                input: { type: 'STRING' },
                output: { type: 'STRING' },
                explanation: { type: 'STRING' }
              },
              required: ['input', 'output']
            }
          },
          constraints: {
            type: 'ARRAY',
            items: { type: 'STRING' }
          }
        },
        required: ['title', 'description', 'examples', 'constraints']
      }
    }
  };

  const retries = 2;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[Gemini] Sending request to Gemini (Attempt ${attempt}/${retries})...`);
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errText = await res.text();
        console.warn(`[Gemini API Error] Attempt ${attempt} failed with status: ${res.status}. Error: ${errText.slice(0, 150)}`);
        if (attempt < retries) {
          console.log('[Gemini] Retrying in 1.5 seconds...');
          await new Promise(r => setTimeout(r, 1500));
          continue;
        }
        return null;
      }

      const data = await res.json();
      const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!textResponse) {
        console.warn(`[Gemini] Attempt ${attempt} returned empty response content.`);
        if (attempt < retries) {
          await new Promise(r => setTimeout(r, 1500));
          continue;
        }
        return null;
      }

      return JSON.parse(textResponse);
    } catch (err) {
      console.error(`[Gemini Error] Attempt ${attempt} caught exception:`, err.message);
      if (attempt < retries) {
        console.log('[Gemini] Retrying in 1.5 seconds...');
        await new Promise(r => setTimeout(r, 1500));
        continue;
      }
      return null;
    }
  }
  return null;
}

module.exports = { generateProblemWithGemini };
