'use client';

import { useState, useCallback } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import Link from 'next/link';
import LeftPanel from './LeftPanel';
import RightPanel from './RightPanel';
import BottomPanel from './BottomPanel';
import { ParsedProblem, RunResult, SubmitResult } from '@/lib/types';
import { runCode, submitCode } from '@/lib/api';
import { useOnlineCount } from '@/hooks/useOnlineCount';

interface Props {
  problem: ParsedProblem;
}

function getStatusLabel(progress: { status: string; position?: number; estimatedWait?: number }): string {
  switch (progress.status) {
    case 'queued':
      if (progress.position !== undefined) {
        const waitText = progress.estimatedWait ? `, Est. Wait: ${progress.estimatedWait}s` : '';
        return `Queued (#${progress.position}${waitText})`;
      }
      return 'Queued...';
    case 'compiling':
      return 'Compiling...';
    case 'running_tests':
      return 'Running Tests...';
    case 'comparing_outputs':
      return 'Comparing Outputs...';
    default:
      return 'Processing...';
  }
}

export default function ProblemLayout({ problem }: Props) {
  const onlineCount = useOnlineCount();
  const [code, setCode] = useState(problem.cppCode);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [runningText, setRunningText] = useState('Running...');
  const [submittingText, setSubmittingText] = useState('Submitting...');
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);

  const handleRun = useCallback(async () => {
    setRunning(true);
    setRunningText('Running...');
    setRunResult(null);
    setSubmitResult(null);
    try {
      const result = await runCode(problem.id, code, (progress) => {
        setRunningText(getStatusLabel(progress));
      });
      setRunResult(result);
    } catch (err: any) {
      setRunResult({
        success: false,
        errorType: 'runtime_error',
        errorMessage: err?.response?.data?.error || 'Request failed',
        results: [],
        totalPassed: 0,
        total: problem.visibleTests.length,
      });
    } finally {
      setRunning(false);
    }
  }, [code, problem]);

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    setSubmittingText('Submitting...');
    setRunResult(null);
    setSubmitResult(null);
    try {
      const result = await submitCode(problem.id, code, (progress) => {
        setSubmittingText(getStatusLabel(progress));
      });
      setSubmitResult(result);
    } catch (err: any) {
      setSubmitResult({
        success: false,
        errorType: 'runtime_error',
        errorMessage: err?.response?.data?.error || 'Request failed',
        results: [],
        totalPassed: 0,
        total: 0,
        visibleTotal: problem.visibleTests.length,
        hiddenTotal: 0,
      });
    } finally {
      setSubmitting(false);
    }
  }, [code, problem]);

  const [activeMobileTab, setActiveMobileTab] = useState<'description' | 'code'>('description');

  return (
    <div className="flex flex-col h-screen bg-arena-bg overflow-hidden">
      {/* Top navigation bar */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-arena-border bg-arena-panel flex-shrink-0 z-10">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-arena-primary to-arena-primary-dim flex items-center justify-center shadow-sm">
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-arena-bg" stroke="currentColor" strokeWidth="2.5">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
            </div>
            <span className="text-sm font-bold">
              <span className="text-arena-primary">MSK</span>
              <span className="text-arena-text"> Code Arena</span>
            </span>
          </Link>
          <div className="hidden sm:flex items-center gap-1 text-arena-muted">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" /></svg>
            <span className="text-xs text-arena-text truncate max-w-xs">{problem.title}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:flex items-center gap-1.5 text-xs text-arena-muted bg-arena-bg border border-arena-border rounded-lg px-3 py-1.5">
            <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 text-arena-success animate-spin-slow" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              <circle cx="12" cy="12" r="4" />
            </svg>
            Engine ready
          </span>
          <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-arena-secondary/10 border border-arena-secondary/30 text-arena-secondary">
            <span className="w-1.5 h-1.5 rounded-full bg-arena-success animate-pulse" />
            {onlineCount} Online
          </span>
          <Link href="/" className="btn-secondary px-3 py-1.5 rounded-lg text-xs font-medium">
            ← New Problem
          </Link>
        </div>
      </header>

      {/* ── MOBILE WORKSPACE (Tabbed view for mobile) ────────────────────────── */}
      <div className="flex-1 flex flex-col md:hidden overflow-hidden">
        {/* Mobile Tab Switcher */}
        <div className="flex border-b border-arena-border bg-arena-panel flex-shrink-0">
          <button
            onClick={() => setActiveMobileTab('description')}
            className={`flex-1 py-3 text-xs font-semibold text-center border-b-2 transition-all ${
              activeMobileTab === 'description'
                ? 'border-arena-primary text-arena-primary bg-arena-primary/5'
                : 'border-transparent text-arena-muted hover:text-arena-text'
            }`}
          >
            Description
          </button>
          <button
            onClick={() => setActiveMobileTab('code')}
            className={`flex-1 py-3 text-xs font-semibold text-center border-b-2 transition-all ${
              activeMobileTab === 'code'
                ? 'border-arena-primary text-arena-primary bg-arena-primary/5'
                : 'border-transparent text-arena-muted hover:text-arena-text'
            }`}
          >
            Code & Run
          </button>
        </div>

        {/* Mobile Tab Content */}
        <div className="flex-1 overflow-hidden relative">
          {activeMobileTab === 'description' ? (
            <div className="h-full overflow-hidden">
              <LeftPanel problem={problem} />
            </div>
          ) : (
            <div className="h-full flex flex-col overflow-hidden">
              <div className="flex-1 min-h-[250px] overflow-hidden">
                <RightPanel
                  code={code}
                  onChange={setCode}
                  onRun={handleRun}
                  onSubmit={handleSubmit}
                  running={running}
                  submitting={submitting}
                  runningText={runningText}
                  submittingText={submittingText}
                />
              </div>
              <div className="h-[220px] border-t border-arena-border overflow-hidden flex flex-col flex-shrink-0">
                <BottomPanel
                  visibleTests={problem.visibleTests}
                  runResult={runResult}
                  submitResult={submitResult}
                  running={running}
                  submitting={submitting}
                  runningText={runningText}
                  submittingText={submittingText}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── DESKTOP WORKSPACE (Resizable split panel view) ──────────────────── */}
      <div className="hidden md:block flex-1 overflow-hidden">
        <PanelGroup direction="horizontal" className="h-full">
          {/* Left panel */}
          <Panel defaultSize={38} minSize={20} maxSize={60} id="left-panel" order={1}>
            <LeftPanel problem={problem} />
          </Panel>

          <PanelResizeHandle className="w-1 bg-arena-border hover:bg-arena-primary transition-colors cursor-col-resize" />

          {/* Right: editor + bottom panel */}
          <Panel defaultSize={62} minSize={30} id="right-panel" order={2}>
            <PanelGroup direction="vertical" className="h-full">
              <Panel defaultSize={65} minSize={25} id="editor-panel" order={1}>
                <RightPanel
                  code={code}
                  onChange={setCode}
                  onRun={handleRun}
                  onSubmit={handleSubmit}
                  running={running}
                  submitting={submitting}
                  runningText={runningText}
                  submittingText={submittingText}
                />
              </Panel>

              <PanelResizeHandle className="h-1 bg-arena-border hover:bg-arena-primary transition-colors cursor-row-resize" />

              <Panel defaultSize={35} minSize={15} maxSize={60} id="bottom-panel" order={2}>
                <BottomPanel
                  visibleTests={problem.visibleTests}
                  runResult={runResult}
                  submitResult={submitResult}
                  running={running}
                  submitting={submitting}
                  runningText={runningText}
                  submittingText={submittingText}
                />
              </Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}
