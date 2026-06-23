'use client';

import { useState } from 'react';
import { ParsedProblem, ActiveTab } from '@/lib/types';
import DescriptionTab from './DescriptionTab';

const TABS: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
  {
    id: 'description',
    label: 'Description',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
      </svg>
    ),
  },
  {
    id: 'editorial',
    label: 'Editorial',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
  {
    id: 'submissions',
    label: 'Submissions',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    id: 'discussion',
    label: 'Discussion',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
];

interface Props {
  problem: ParsedProblem;
}

export default function LeftPanel({ problem }: Props) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('description');

  return (
    <div className="flex flex-col h-full bg-arena-panel overflow-hidden">
      {/* ── Tab bar (TUF-style) ─────────────────────────────────────────── */}
      <div className="flex border-b border-arena-border bg-arena-panel flex-shrink-0 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center gap-1.5 px-4 py-3 text-xs font-medium whitespace-nowrap
              transition-all duration-150 relative border-b-2
              ${activeTab === tab.id
                ? 'text-arena-primary border-arena-primary'
                : 'text-arena-muted border-transparent hover:text-arena-text hover:border-arena-border'
              }
            `}
          >
            <span className={activeTab === tab.id ? 'text-arena-primary' : 'text-arena-muted'}>
              {tab.icon}
            </span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab content ────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'description' && (
          <DescriptionTab
            title={problem.title}
            description={problem.description}
            examples={problem.examples}
            constraints={problem.constraints}
          />
        )}
        {activeTab === 'editorial' && (
          <PlaceholderTab
            icon={
              <svg className="w-10 h-10 text-arena-muted/40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            }
            title="Editorial"
            message="Editorial will be available after you attempt the problem."
          />
        )}
        {activeTab === 'submissions' && (
          <PlaceholderTab
            icon={
              <svg className="w-10 h-10 text-arena-muted/40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            }
            title="Submissions"
            message="Your submission history will appear here after you submit."
          />
        )}
        {activeTab === 'discussion' && (
          <PlaceholderTab
            icon={
              <svg className="w-10 h-10 text-arena-muted/40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            }
            title="Discussion"
            message="Community discussions coming soon."
          />
        )}
      </div>
    </div>
  );
}

function PlaceholderTab({ icon, title, message }: { icon: React.ReactNode; title: string; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 gap-4">
      <div className="p-4 rounded-full bg-arena-bg border border-arena-border">{icon}</div>
      <div>
        <h3 className="text-arena-text font-semibold mb-1">{title}</h3>
        <p className="text-arena-muted text-xs max-w-xs">{message}</p>
      </div>
    </div>
  );
}
