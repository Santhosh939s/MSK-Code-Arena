'use client';

import { Example } from '@/lib/types';

interface Props {
  title: string;
  description: string;
  examples: Example[];
  constraints: string[];
}

export default function DescriptionTab({ title, description, examples, constraints }: Props) {
  return (
    <div className="h-full overflow-y-auto text-sm text-arena-text">
      {/* ── Title block ───────────────────────────────────────────────── */}
      <div className="px-5 pt-5 pb-4 border-b border-arena-border">
        <h1 className="text-xl font-bold text-white mb-3 leading-snug">{title}</h1>
        <div className="flex flex-wrap gap-2">
          <span className="text-xs px-3 py-1 rounded border border-arena-primary/40 text-arena-primary bg-arena-primary/5 font-medium">
            C++
          </span>
          <span className="text-xs px-3 py-1 rounded border border-arena-border text-arena-muted bg-arena-bg">
            DSA
          </span>
        </div>
      </div>

      <div className="px-5 py-5 space-y-6">
        {/* ── Problem description ───────────────────────────────────────── */}
        {description && (
          <div className="leading-7 text-[13.5px] text-arena-text space-y-3">
            {description.split('\n\n').map((para, i) => (
              <p key={i}>{formatInline(para.trim())}</p>
            ))}
          </div>
        )}

        {/* ── Examples ─────────────────────────────────────────────────── */}
        {examples.length > 0 && (
          <div className="space-y-5">
            {examples.map((ex, i) => (
              <div key={i}>
                <h3 className="font-semibold text-white text-[13.5px] mb-2">
                  Example {i + 1}
                </h3>
                <div className="border border-arena-border rounded-lg overflow-hidden">
                  <div 
                    className="bg-[#0d0f14] px-4 py-3 space-y-1.5 font-mono text-xs leading-relaxed border-l-2 border-arena-primary"
                    style={{ fontVariantLigatures: 'none', fontFeatureSettings: '"liga" 0, "clig" 0' }}
                  >
                    {/* Input */}
                    <div className="flex flex-col md:flex-row items-start gap-x-1">
                      <span className="font-bold text-white flex-shrink-0">Input:</span>
                      <span className="text-arena-text-secondary whitespace-pre-wrap">{ex.input}</span>
                    </div>
                    {/* Output */}
                    <div className="flex flex-col md:flex-row items-start gap-x-1">
                      <span className="font-bold text-white flex-shrink-0">Output:</span>
                      <span className="text-arena-text-secondary whitespace-pre-wrap">{ex.output}</span>
                    </div>
                    {/* Explanation */}
                    {ex.explanation && (
                      <div className="pt-1 border-t border-arena-border/60 mt-1 flex flex-col md:flex-row items-start gap-x-1">
                        <span className="font-bold text-white flex-shrink-0">Explanation:</span>
                        <span className="text-arena-text-secondary whitespace-pre-wrap">{ex.explanation}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Constraints ───────────────────────────────────────────────── */}
        {constraints.length > 0 && (
          <div>
            <h3 className="font-semibold text-white text-[13.5px] mb-3">Constraints</h3>
            <div className="border border-arena-border rounded-lg bg-[#0d0f14] px-4 py-3">
              <ul className="space-y-2">
                {constraints.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 font-mono text-xs text-arena-text-secondary">
                    <span className="text-arena-primary mt-0.5 flex-shrink-0">•</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Inline bold formatter (wraps **text** or bold keywords) ───────────────────
function formatInline(text: string): React.ReactNode {
  // Split on **bold** markers
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}
