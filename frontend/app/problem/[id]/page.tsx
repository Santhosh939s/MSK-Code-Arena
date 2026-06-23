'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProblemLayout from '@/components/ProblemLayout';
import { ParsedProblem } from '@/lib/types';

export default function ProblemPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [problem, setProblem] = useState<ParsedProblem | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    const stored = sessionStorage.getItem(`problem_${id}`);
    if (stored) {
      try {
        setProblem(JSON.parse(stored));
      } catch {
        setError('Failed to load problem data.');
      }
    } else {
      setError('Problem not found. Please generate a new problem.');
    }
  }, [id]);

  if (error) {
    return (
      <div className="min-h-screen bg-arena-bg flex items-center justify-center">
        <div className="text-center space-y-4 glass-card p-10 rounded-2xl max-w-md mx-4">
          <div className="text-5xl">🔍</div>
          <h2 className="text-xl font-bold text-arena-text">Problem Not Found</h2>
          <p className="text-arena-muted text-sm">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="btn-primary px-6 py-2.5 rounded-xl text-sm font-medium mt-2"
          >
            ← Go Back Home
          </button>
        </div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="min-h-screen bg-arena-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="spinner !w-8 !h-8" />
          <p className="text-arena-muted text-sm">Loading workspace...</p>
        </div>
      </div>
    );
  }

  return <ProblemLayout problem={problem} />;
}
