'use client';

import dynamic from 'next/dynamic';

// Monaco must be dynamically imported (no SSR)
const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

interface Props {
  code: string;
  onChange: (value: string) => void;
  language?: string;
}

const MONACO_OPTIONS = {
  fontSize: 14,
  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
  fontLigatures: true,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  lineNumbers: 'on' as const,
  renderLineHighlight: 'line' as const,
  wordWrap: 'on' as const,
  automaticLayout: true,
  tabSize: 4,
  insertSpaces: true,
  padding: { top: 16, bottom: 16 },
  cursorBlinking: 'smooth' as const,
  smoothScrolling: true,
  contextmenu: true,
  folding: true,
  glyphMargin: false,
  overviewRulerBorder: false,
  scrollbar: {
    verticalScrollbarSize: 6,
    horizontalScrollbarSize: 6,
  },
};

export default function CodeEditor({ code, onChange, language = 'cpp' }: Props) {
  return (
    <div className="h-full w-full monaco-container">
      <Editor
        height="100%"
        language={language}
        value={code}
        onChange={val => onChange(val ?? '')}
        theme="vs-dark"
        options={MONACO_OPTIONS}
        loading={
          <div className="flex items-center justify-center h-full bg-[#1e1e1e]">
            <div className="flex flex-col items-center gap-3">
              <span className="spinner" />
              <span className="text-sm text-arena-muted">Loading editor...</span>
            </div>
          </div>
        }
      />
    </div>
  );
}
