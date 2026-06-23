'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { parseProblem } from '@/lib/api';
import { ParsedProblem } from '@/lib/types';

const PLACEHOLDER = `Paste any coding problem here...

Example: LeetCode, Striver TUF, GeeksforGeeks, Coding Ninjas, HackerRank, or any DSA problem.

GCD of Two Numbers

Given two integers n1 and n2, find the Greatest Common Divisor (GCD).

Example 1:
Input: n1 = 4, n2 = 6
Output: 2

Example 2:
Input: n1 = 9, n2 = 8
Output: 1

Constraints:
1 <= n1, n2 <= 1000`;

// Floating particles animation component
function Particles() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-arena-primary opacity-20"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `float ${4 + Math.random() * 6}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 4}s`,
          }}
        />
      ))}
    </div>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  async function handleGenerate() {
    const trimmed = text.trim();
    if (!trimmed || trimmed.length < 10) {
      setError('Please paste a coding problem first.');
      textareaRef.current?.focus();
      return;
    }
    setError('');
    setLoading(true);
    try {
      const problem: ParsedProblem = await parseProblem(trimmed);
      sessionStorage.setItem(`problem_${problem.id}`, JSON.stringify(problem));
      router.push(`/problem/${problem.id}`);
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Failed to parse problem. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleGenerate();
    }
  }

  return (
    <div className="min-h-screen bg-arena-bg bg-grid relative flex flex-col">
      {/* Gradient overlays */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-arena-primary opacity-5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-arena-secondary opacity-5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-arena-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo */}
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-arena-primary to-arena-primary-dim flex items-center justify-center shadow-lg shadow-arena-primary/20">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-arena-bg" stroke="currentColor" strokeWidth="2.5">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight">
              <span className="text-arena-primary">MSK</span>{' '}
              <span className="text-arena-text">Code Arena</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 rounded-full border border-arena-border text-arena-muted font-mono">
              v1.0
            </span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-arena-success/10 border border-arena-success/30 text-arena-success">
              C++ Engine
            </span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-3xl animate-slide-up">
          {/* Hero text */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-arena-primary/10 border border-arena-primary/30 text-arena-primary text-sm font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-arena-primary animate-pulse" />
              AI-Powered Coding Practice Platform
            </div>
            <h1 className="text-5xl font-bold mb-4 leading-tight">
              Paste Any Problem,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-arena-primary to-amber-400">
                Code Instantly
              </span>
            </h1>
            <p className="text-arena-text-secondary text-lg max-w-xl mx-auto">
              Supports LeetCode · Striver TUF · GeeksforGeeks · Coding Ninjas · HackerRank and any DSA problem.
            </p>
          </div>

          {/* Paste area */}
          <div className="glass-card rounded-2xl overflow-hidden shadow-2xl shadow-black/40">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-arena-border bg-arena-panel/50">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
              </div>
              <span className="text-xs text-arena-muted font-mono ml-2">problem.txt</span>
            </div>
            <textarea
              ref={textareaRef}
              id="problem-input"
              value={text}
              onChange={e => { setText(e.target.value); setError(''); }}
              onKeyDown={handleKeyDown}
              placeholder={PLACEHOLDER}
              rows={14}
              className="textarea-glow w-full bg-transparent p-5 font-mono text-sm text-arena-text placeholder:text-arena-muted/50 resize-none border-0 outline-none leading-relaxed"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="mt-3 flex items-center gap-2 text-sm text-arena-error animate-fade-in">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="mt-5 flex items-center justify-between">
            <p className="text-xs text-arena-muted">
              Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-arena-panel border border-arena-border font-mono text-xs">Ctrl+Enter</kbd> to generate
            </p>
            <div className="flex gap-3">
              {text && (
                <button
                  onClick={() => setText('')}
                  className="btn-secondary px-4 py-2.5 rounded-xl text-sm font-medium"
                >
                  Clear
                </button>
              )}
              <button
                id="generate-btn"
                onClick={handleGenerate}
                disabled={loading}
                className="btn-primary px-6 py-2.5 rounded-xl text-sm flex items-center gap-2.5 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <span className="spinner" />
                    Parsing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Generate Problem
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-10 grid grid-cols-3 gap-4">
            {[
              { label: 'Problem Sources', value: '6+', icon: '📄' },
              { label: 'Execution Engine', value: 'C++', icon: '⚡' },
              { label: 'Test Coverage', value: 'Hidden', icon: '🔒' },
            ].map(s => (
              <div key={s.label} className="glass-card rounded-xl p-4 text-center">
                <div className="text-2xl mb-1">{s.icon}</div>
                <div className="text-arena-primary font-bold text-lg">{s.value}</div>
                <div className="text-arena-muted text-xs mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
      `}</style>
    </div>
  );
}
