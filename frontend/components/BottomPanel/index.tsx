'use client';

import { useState } from 'react';
import { RunResult, SubmitResult, TestCase, BottomTab } from '@/lib/types';

interface Props {
  visibleTests: TestCase[];
  runResult: RunResult | null;
  submitResult: SubmitResult | null;
  running: boolean;
  submitting: boolean;
  runningText?: string;
  submittingText?: string;
}

export default function BottomPanel({ visibleTests, runResult, submitResult, running, submitting, runningText, submittingText }: Props) {
  const [activeTab, setActiveTab] = useState<BottomTab>('testcases');
  const [selectedCase, setSelectedCase] = useState(0);

  const result = submitResult ?? runResult;
  const isSubmit = !!submitResult;

  return (
    <div className="flex flex-col h-full bg-arena-panel overflow-hidden border-t border-arena-border">
      {/* Tab bar */}
      <div className="flex items-center border-b border-arena-border px-2 flex-shrink-0">
        {(['testcases', 'output'] as BottomTab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors relative ${
              activeTab === tab ? 'tab-active' : 'text-arena-muted hover:text-arena-text'
            }`}
          >
            {tab === 'testcases' ? 'Test Cases' : 'Output'}
          </button>
        ))}

        {/* Status badge */}
        {result && (
          <div className="ml-auto mr-3">
            {result.success && result.allPassed ? (
              <span className="badge-pass text-xs px-2.5 py-1 rounded-full font-medium">
                ✓ {isSubmit ? 'Accepted' : 'All Passed'}
              </span>
            ) : result.success && !result.allPassed ? (
              <span className="badge-fail text-xs px-2.5 py-1 rounded-full font-medium">
                ✗ Wrong Answer
              </span>
            ) : (
              <span className="badge-fail text-xs px-2.5 py-1 rounded-full font-medium">
                ✗ {result.errorType === 'compile_error' ? 'Compilation Error' : result.errorType === 'time_limit' ? 'TLE' : 'Runtime Error'}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'testcases' && (
          <div className="flex h-full">
            {/* Case tabs */}
            <div className="border-r border-arena-border p-3 space-y-1.5 flex-shrink-0 min-w-[110px]">
              {visibleTests.map((_, i) => {
                const caseResult = result?.results?.find(r => r.caseNumber === i + 1);
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedCase(i)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 ${
                      selectedCase === i ? 'bg-arena-hover text-arena-text' : 'text-arena-muted hover:text-arena-text hover:bg-arena-hover/50'
                    }`}
                  >
                    {caseResult ? (
                      caseResult.passed
                        ? <span className="w-2 h-2 rounded-full bg-arena-success flex-shrink-0" />
                        : <span className="w-2 h-2 rounded-full bg-arena-error flex-shrink-0" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-arena-border flex-shrink-0" />
                    )}
                    Case {i + 1}
                  </button>
                );
              })}
            </div>

            {/* Case detail */}
            <div 
              className="flex-1 p-4 space-y-3 font-mono text-xs overflow-y-auto"
              style={{ fontVariantLigatures: 'none', fontFeatureSettings: '"liga" 0, "clig" 0' }}
            >
              {visibleTests[selectedCase] && (
                <>
                  <div>
                    <div className="text-arena-muted mb-1">Input</div>
                    <div className="bg-arena-bg rounded-lg p-3 text-arena-text border border-arena-border whitespace-pre-wrap">
                      {visibleTests[selectedCase].input}
                    </div>
                  </div>
                  <div>
                    <div className="text-arena-muted mb-1">Expected Output</div>
                    <div className="bg-arena-bg rounded-lg p-3 text-arena-success border border-arena-border whitespace-pre-wrap">
                      {visibleTests[selectedCase].output}
                    </div>
                  </div>
                  {result?.results?.[selectedCase] && (
                    <div>
                      <div className="text-arena-muted mb-1">Your Output</div>
                      <div className={`bg-arena-bg rounded-lg p-3 border whitespace-pre-wrap ${
                        result.results[selectedCase].passed
                          ? 'text-arena-success border-arena-success/30'
                          : 'text-arena-error border-arena-error/30'
                      }`}>
                        {result.results[selectedCase].received}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'output' && (
          <div className="p-4 font-mono text-xs h-full overflow-y-auto">
            {(running || submitting) && (
              <div className="flex items-center gap-2 text-arena-muted animate-pulse">
                <span className="spinner" />
                {running ? (runningText || 'Running test cases...') : (submittingText || 'Submitting solution...')}
              </div>
            )}

            {!running && !submitting && !result && (
              <p className="text-arena-muted">Click <span className="text-arena-text">Run</span> or <span className="text-arena-primary">Submit</span> to see output.</p>
            )}

            {result && !result.success && (
              <div className="space-y-3">
                <div className="badge-fail px-3 py-2 rounded-lg text-sm font-semibold">
                  {result.errorType === 'compile_error' ? '⚠ Compilation Error' :
                   result.errorType === 'time_limit' ? '⏱ Time Limit Exceeded' :
                   '💥 Runtime Error'}
                </div>
                {result.errorMessage && (
                  <pre className="bg-arena-bg border border-arena-border rounded-lg p-4 text-arena-error text-xs overflow-x-auto whitespace-pre-wrap">
                    {result.errorMessage}
                  </pre>
                )}
              </div>
            )}

            {result?.success && (
              <div className="space-y-3">
                {/* Summary */}
                <div className={`px-3 py-2 rounded-lg text-sm font-bold ${
                  result.allPassed ? 'badge-pass' : 'badge-fail'
                }`}>
                  {isSubmit && result.allPassed && '🎉 Accepted — '}
                  {isSubmit && !result.allPassed && '✗ Wrong Answer — '}
                  {!isSubmit && result.allPassed && '✓ All Visible Tests Passed — '}
                  {!isSubmit && !result.allPassed && '✗ Some Tests Failed — '}
                  {result.totalPassed} / {result.total} Passed
                </div>

                {/* Per-case results */}
                <div 
                  className="space-y-2"
                  style={{ fontVariantLigatures: 'none', fontFeatureSettings: '"liga" 0, "clig" 0' }}
                >
                  {result.results.map((r) => (
                    <div key={r.caseNumber} className={`rounded-lg border p-3 ${
                      r.passed ? 'border-arena-success/20 bg-arena-success/5' : 'border-arena-error/20 bg-arena-error/5'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={r.passed ? 'text-arena-success' : 'text-arena-error'}>
                          {r.passed ? '✓' : '✗'}
                        </span>
                        <span className="text-arena-text">
                          {r.isHidden ? `Hidden Test #${r.caseNumber}` : `Case ${r.caseNumber}`}
                        </span>
                      </div>
                      {!r.passed && (
                        <div className="ml-4 space-y-1 text-arena-muted">
                          <div className="flex flex-col items-start">
                            <span>Expected:</span>
                            <span className="text-arena-success whitespace-pre-wrap pl-2 border-l border-arena-border mt-0.5">{r.expected}</span>
                          </div>
                          <div className="flex flex-col items-start mt-1">
                            <span>Received:</span>
                            <span className="text-arena-error whitespace-pre-wrap pl-2 border-l border-arena-border mt-0.5">{r.received}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
