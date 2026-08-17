'use client';

import React from 'react';
import { Search, Radio } from 'lucide-react';
import { RequestRecord, MethodFilter, StatusFilter } from '@/types';

interface RequestListProps {
  requests: RequestRecord[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  search: string;
  onSearchChange: (s: string) => void;
  methodFilter: MethodFilter;
  onMethodFilterChange: (m: MethodFilter) => void;
}

const getMethodColor = (method: string) => {
  switch (method) {
    case 'GET':
      return 'text-[var(--method-get)] border-[var(--method-get)]';
    case 'POST':
      return 'text-[var(--method-post)] border-[var(--method-post)]';
    case 'PUT':
      return 'text-[var(--method-put)] border-[var(--method-put)]';
    case 'DELETE':
      return 'text-[var(--method-delete)] border-[var(--method-delete)]';
    case 'PATCH':
      return 'text-[var(--method-patch)] border-[var(--method-patch)]';
    default:
      return 'text-[var(--text-dim)] border-[var(--text-dim)]';
  }
};

const getStatusColor = (code: number) => {
  if (code >= 200 && code < 300) {
    return 'text-[var(--status-success)] bg-[rgba(183,241,224,0.08)]';
  }
  if (code >= 300 && code < 400) {
    return 'text-[var(--status-warning)] bg-[rgba(251,202,137,0.08)]';
  }
  return 'text-[var(--status-error)] bg-[rgba(233,131,137,0.08)] font-semibold';
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
    <aside className="w-96 border-r border-[var(--border-normal)] bg-[var(--card-panel)] flex flex-col h-[calc(100vh-3.5rem)] select-none">
      <div className="p-3 border-b border-[var(--border-subtle)] space-y-2.5">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-2.5 text-[var(--text-dim)]" />
          <input
            type="text"
            placeholder="Filter requests (path, status)..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs font-mono rounded bg-[var(--card-alt)] border border-[var(--border-normal)] text-[var(--text-primary)] placeholder-[var(--text-dim)] focus:outline-none focus:border-[var(--border-accent)] transition-colors"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
          {methods.map((m) => (
            <button
              key={m}
              onClick={() => onMethodFilterChange(m)}
              className={`px-2 py-1 text-[11px] font-mono rounded border transition-all cursor-pointer ${
                methodFilter === m
                  ? 'bg-[var(--card-hover)] border-[var(--border-accent)] text-[var(--text-primary)] font-semibold'
                  : 'bg-[var(--card-alt)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-normal)]'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-[var(--border-subtle)]">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-[var(--text-dim)] font-mono text-xs flex flex-col items-center justify-center h-full gap-2">
            <Radio size={24} className="animate-pulse opacity-40" />
            <p>Waiting for incoming requests...</p>
            <p className="text-[10px]">Send requests through your tunnel</p>
          </div>
        ) : (
          filtered.map((req) => {
            const isSelected = req.id === selectedId;
            const timeStr = new Date(req.timestamp).toLocaleTimeString();

            return (
              <div
                key={req.id}
                onClick={() => onSelect(req.id)}
                className={`p-3 cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-[var(--card-hover)] border-l-2 border-l-[var(--border-accent)]'
                    : 'hover:bg-[var(--card-alt)]'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${getMethodColor(
                        req.method
                      )}`}
                    >
                      {req.method}
                    </span>
                    <span
                      className="text-xs font-mono font-medium text-[var(--text-primary)] truncate"
                      title={req.path}
                    >
                      {req.path || '/'}
                    </span>
                  </div>

                  <span
                    className={`text-[11px] font-mono px-1.5 py-0.5 rounded shrink-0 ${getStatusColor(
                      req.status_code
                    )}`}
                  >
                    {req.status_code}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-dim)]">
                  <span>{timeStr}</span>
                  <span className={req.latency_ms > 200 ? 'text-[var(--status-error)]' : req.latency_ms > 50 ? 'text-[var(--status-warning)]' : 'text-[var(--text-secondary)]'}>
                    {req.latency_ms}ms
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
