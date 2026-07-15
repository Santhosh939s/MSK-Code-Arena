'use client';

interface Props {
  code: string;
  onChange: (code: string) => void;
  onRun: () => void;
  onSubmit: () => void;
  running: boolean;
  submitting: boolean;
  runningText?: string;
  submittingText?: string;
}

import CodeEditor from './CodeEditor';

export default function RightPanel({ code, onChange, onRun, onSubmit, running, submitting, runningText, submittingText }: Props) {
  return (
    <div className="flex flex-col h-full bg-arena-panel overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-arena-border flex-shrink-0">
        {/* Language selector — C++ only in V1 */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-arena-bg border border-arena-border rounded-lg px-3 py-1.5 text-sm">
            <span className="text-arena-primary font-mono font-medium text-xs">C++</span>
            <svg className="w-3.5 h-3.5 text-arena-muted" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          <span className="text-xs text-arena-muted hidden sm:block">Auto-compiled with g++</span>
        </div>

        {/* Run / Submit */}
        <div className="flex items-center gap-2">
          <button
            id="run-btn"
            onClick={onRun}
            disabled={running || submitting}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium border border-arena-border text-arena-text hover:border-arena-success hover:text-arena-success transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {running ? (
              <><span className="spinner !border-arena-success/30 !border-t-arena-success" />{runningText || 'Running...'}</>
            ) : (
              <><svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>Run</>
            )}
          </button>
          <button
            id="submit-btn"
            onClick={onSubmit}
            disabled={running || submitting}
            className="btn-primary flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <><span className="spinner !border-[#0f1117]/30 !border-t-[#0f1117]" />{submittingText || 'Submitting...'}</>
            ) : (
              <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>Submit</>
            )}
          </button>
        </div>
      </div>

      {/* Monaco Editor fills remaining space */}
      <div className="flex-1 overflow-hidden bg-[#1e1e1e]">
        <CodeEditor code={code} onChange={onChange} language="cpp" />
      </div>
    </div>
  );
}
