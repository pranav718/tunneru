'use client';

import React from 'react';
import { Trash2 } from 'lucide-react';
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
    <header className="h-11 border-b border-[var(--border-normal)] bg-[var(--card-panel)] px-5 flex items-center justify-between select-none shrink-0">
      <div className="flex items-center gap-3">
        <span className="text-[13px] font-semibold text-[var(--text-primary)] tracking-tight">
          tunneru
        </span>
        <span className="text-[10px] text-[var(--text-dim)]">/</span>
        <span className="text-[11px] text-[var(--text-secondary)]">inspector</span>
        <span className="text-[10px] text-[var(--text-dim)]">/</span>
        <span className="text-[11px] text-[var(--text-dim)]">
          {connected ? 'ws:connected' : 'ws:connecting'}
        </span>
      </div>

      <div className="flex items-center gap-5">
        <div className="hidden sm:flex items-center gap-4 text-[11px] text-[var(--text-dim)]">
          <span>{total} reqs</span>
          <span className="text-[var(--status-success)]">{okCount} ok</span>
          <span className="text-[var(--status-error)]">{errCount} err</span>
          <span>{avgLatency}ms avg</span>
        </div>

        <button
          onClick={onClear}
          disabled={requests.length === 0}
          className="flex items-center gap-1 px-2 py-1 text-[10px] rounded border border-[var(--border-normal)] text-[var(--text-dim)] hover:text-[var(--status-error)] hover:border-[var(--status-error)] transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Trash2 size={11} />
          <span>clear</span>
        </button>
      </div>
    </header>
  );
};
