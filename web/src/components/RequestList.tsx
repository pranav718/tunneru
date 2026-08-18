'use client';

import React from 'react';
import { Search } from 'lucide-react';
import { RequestRecord, MethodFilter } from '@/types';

interface RequestListProps {
  requests: RequestRecord[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  search: string;
  onSearchChange: (s: string) => void;
  methodFilter: MethodFilter;
  onMethodFilterChange: (m: MethodFilter) => void;
}

const methodColor = (method: string) => {
  const map: Record<string, string> = {
    GET: 'var(--method-get)',
    POST: 'var(--method-post)',
    PUT: 'var(--method-put)',
    DELETE: 'var(--method-delete)',
    PATCH: 'var(--method-patch)',
  };
  return map[method] || 'var(--text-dim)';
};

const statusColor = (code: number) => {
  if (code >= 200 && code < 300) return 'var(--status-success)';
  if (code >= 300 && code < 400) return 'var(--status-warning)';
  return 'var(--status-error)';
};

export const RequestList: React.FC<RequestListProps> = ({
  requests,
  selectedId,
  onSelect,
  search,
  onSearchChange,
  methodFilter,
  onMethodFilterChange,
}) => {
  const filtered = requests.filter((r) => {
    const matchesSearch =
      r.path.toLowerCase().includes(search.toLowerCase()) ||
      r.method.toLowerCase().includes(search.toLowerCase()) ||
      r.status_code.toString().includes(search);
    const matchesMethod = methodFilter === 'ALL' || r.method === methodFilter;
    return matchesSearch && matchesMethod;
  });

  const methods: MethodFilter[] = ['ALL', 'GET', 'POST', 'PUT', 'DELETE'];

  return (
    <aside className="w-[340px] border-r border-[var(--border-normal)] bg-[var(--canvas-bg)] flex flex-col shrink-0">
      <div className="p-3 border-b border-[var(--border-subtle)] space-y-2">
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-[7px] text-[var(--text-dim)]" />
          <input
            type="text"
            placeholder="filter..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-7 pr-3 py-1 text-[11px] rounded bg-[var(--card-alt)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder-[var(--text-dim)] focus:outline-none focus:border-[var(--border-accent)] transition-colors"
          />
        </div>

        <div className="flex items-center gap-0.5">
          {methods.map((m) => (
            <button
              key={m}
              onClick={() => onMethodFilterChange(m)}
              className={`px-2 py-0.5 text-[10px] rounded transition-all cursor-pointer ${
                methodFilter === m
                  ? 'bg-[var(--card-hover)] text-[var(--text-primary)]'
                  : 'text-[var(--text-dim)] hover:text-[var(--text-secondary)]'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-[var(--text-dim)] text-[11px] flex flex-col items-center justify-center h-full gap-1">
            <p>no requests yet</p>
            <p className="text-[10px]">send traffic through your tunnel</p>
          </div>
        ) : (
          filtered.map((req) => {
            const isSelected = req.id === selectedId;
            const timeStr = new Date(req.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

            return (
              <div
                key={req.id}
                onClick={() => onSelect(req.id)}
                className={`px-3 py-2 cursor-pointer border-b border-[var(--border-subtle)] transition-colors ${
                  isSelected
                    ? 'bg-[var(--card-hover)]'
                    : 'hover:bg-[var(--card-alt)]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="text-[10px] shrink-0 w-[42px]"
                      style={{ color: methodColor(req.method) }}
                    >
                      {req.method}
                    </span>
                    <span className="text-[11px] text-[var(--text-primary)] truncate" title={req.path}>
                      {req.path || '/'}
                    </span>
                  </div>

                  <span
                    className="text-[10px] shrink-0 tabular-nums"
                    style={{ color: statusColor(req.status_code) }}
                  >
                    {req.status_code}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-0.5 text-[10px] text-[var(--text-dim)]">
                  <span suppressHydrationWarning>{timeStr}</span>
                  <span className="tabular-nums">{req.latency_ms}ms</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
