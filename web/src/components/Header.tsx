'use client';

import React from 'react';
import { Activity, Trash2, Zap } from 'lucide-react';
import { RequestRecord } from '@/types';

interface HeaderProps {
  connected: boolean;
  requests: RequestRecord[];
  onClear: () => void;
}

export const Header: React.FC<HeaderProps> = ({ connected, requests, onClear }) => {
  const total = requests.length;
  const okCount = requests.filter((r) => r.status_code >= 200 && r.status_code < 400).length;
  const errCount = requests.filter((r) => r.status_code >= 400).length;
  const avgLatency =
    total > 0
      ? Math.round(requests.reduce((acc, r) => acc + r.latency_ms, 0) / total)
      : 0;

  return (
    <header className="h-14 border-b border-[var(--border-normal)] bg-[var(--card-panel)] px-6 flex items-center justify-between select-none">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[var(--text-primary)] shadow-[0_0_8px_rgba(231,208,200,0.5)]" />
          <span className="font-bold text-base tracking-tight text-[var(--text-primary)]">
            tunneru
          </span>
          <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--card-alt)] border border-[var(--border-subtle)] text-[var(--text-secondary)] font-mono">
            inspector
          </span>
        </div>

        <div className="h-4 w-[1px] bg-[var(--border-subtle)]" />

        <div className="flex items-center gap-2">
          <span
            className={`inline-block w-2 h-2 rounded-full ${
              connected ? 'bg-[var(--status-success)] shadow-[0_0_8px_#B7F1E0]' : 'bg-[var(--status-warning)] animate-pulse'
            }`}
          />
          <span className="text-xs font-mono text-[var(--text-secondary)]">
            {connected ? 'connected (ws:4040)' : 'connecting...'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden sm:flex items-center gap-5 text-xs font-mono text-[var(--text-secondary)]">
          <div className="flex items-center gap-1.5">
            <span className="text-[var(--text-dim)]">total:</span>
            <span className="font-semibold text-[var(--text-primary)]">{total}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[var(--text-dim)]">ok:</span>
            <span className="text-[var(--status-success)]">{okCount}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[var(--text-dim)]">errors:</span>
            <span className="text-[var(--status-error)]">{errCount}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Zap size={12} className="text-[var(--status-warning)]" />
            <span className="text-[var(--text-dim)]">avg:</span>
            <span className="text-[var(--text-primary)]">{avgLatency}ms</span>
          </div>
        </div>

        <button
          onClick={onClear}
          disabled={requests.length === 0}
          title="Clear Request History"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded border border-[var(--border-normal)] bg-[var(--card-alt)] hover:bg-[var(--card-hover)] text-[var(--text-secondary)] hover:text-[var(--status-error)] hover:border-[var(--status-error)] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Trash2 size={13} />
          <span>Clear</span>
        </button>
      </div>
    </header>
  );
};
