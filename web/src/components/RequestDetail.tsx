'use client';

import React, { useState } from 'react';
import { Play, Copy, Check, Clock } from 'lucide-react';
import { RequestRecord } from '@/types';
import { JsonViewer } from './JsonViewer';

interface RequestDetailProps {
  request: RequestRecord | null;
  onReplay: (id: string) => Promise<void>;
  isReplaying: boolean;
}

type TabType = 'payload' | 'headers' | 'response' | 'raw';

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

export const RequestDetail: React.FC<RequestDetailProps> = ({
  request,
  onReplay,
  isReplaying,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('payload');
  const [copiedUrl, setCopiedUrl] = useState(false);

  if (!request) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center p-12 text-center select-none">
        <p className="text-[13px] text-[var(--text-secondary)] mb-1">no request selected</p>
        <p className="text-[11px] text-[var(--text-dim)]">
          select a request from the sidebar to inspect it
        </p>
      </main>
    );
  }

  const copyUrl = () => {
    navigator.clipboard.writeText(request.path + (request.query ? `?${request.query}` : ''));
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const formatHeaders = (headers: Record<string, string[]>) => {
    if (!headers || Object.keys(headers).length === 0) {
      return (
        <div className="p-4 text-center text-[var(--text-dim)] text-[11px]">
          no headers
        </div>
      );
    }

    return (
      <div className="border border-[var(--border-subtle)] rounded overflow-hidden">
        <table className="w-full text-left text-[11px]">
          <thead className="bg-[var(--card-panel)] text-[var(--text-dim)] text-[10px] uppercase tracking-wider">
            <tr>
              <th className="px-3 py-1.5 font-medium w-1/3">header</th>
              <th className="px-3 py-1.5 font-medium">value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {Object.entries(headers).map(([key, values]) => (
              <tr key={key} className="hover:bg-[var(--card-hover)] transition-colors">
                <td className="px-3 py-1.5 text-[var(--text-secondary)] align-top">{key}</td>
                <td className="px-3 py-1.5 text-[var(--text-primary)] break-all select-text">{values.join(', ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const rawHttp = `${request.method} ${request.path}${request.query ? '?' + request.query : ''} ${request.proto || 'HTTP/1.1'}\n` +
    Object.entries(request.request_headers || {})
      .map(([k, v]) => `${k}: ${v.join(', ')}`)
      .join('\n') +
    (request.request_body ? `\n\n${request.request_body}` : '');

  const tabs: { key: TabType; label: string }[] = [
    { key: 'payload', label: 'request' },
    { key: 'headers', label: 'headers' },
    { key: 'response', label: 'response' },
    { key: 'raw', label: 'raw' },
  ];

  return (
    <main className="flex-1 flex flex-col overflow-hidden bg-[var(--canvas-bg)]">
      <div className="px-5 py-3 border-b border-[var(--border-normal)] bg-[var(--card-panel)] shrink-0">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[11px] shrink-0" style={{ color: methodColor(request.method) }}>
              {request.method}
            </span>
            <span className="text-[13px] text-[var(--text-primary)] truncate" title={request.path}>
              {request.path}
              {request.query && <span className="text-[var(--text-dim)]">?{request.query}</span>}
            </span>
            <button
              onClick={copyUrl}
              className="p-0.5 text-[var(--text-dim)] hover:text-[var(--text-primary)] cursor-pointer transition-colors shrink-0"
            >
              {copiedUrl ? <Check size={12} className="text-[var(--status-success)]" /> : <Copy size={12} />}
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] tabular-nums" style={{ color: statusColor(request.status_code) }}>
              {request.status_code} {request.status_text}
            </span>

            <button
              onClick={() => onReplay(request.id)}
              disabled={isReplaying}
              className="flex items-center gap-1 px-2 py-0.5 text-[10px] rounded border border-[var(--border-normal)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-accent)] transition-all cursor-pointer disabled:opacity-40"
            >
              <Play size={10} fill="currentColor" />
              <span>{isReplaying ? 'replaying' : 'replay'}</span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-[10px] text-[var(--text-dim)]">
            <Clock size={10} />
            <span suppressHydrationWarning>{new Date(request.timestamp).toLocaleString()}</span>
            <span className="ml-2">{request.latency_ms}ms</span>
          </div>

          <div className="flex items-center gap-0">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-2.5 py-0.5 text-[10px] rounded transition-all cursor-pointer ${
                  activeTab === tab.key
                    ? 'bg-[var(--card-hover)] text-[var(--text-primary)]'
                    : 'text-[var(--text-dim)] hover:text-[var(--text-secondary)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {activeTab === 'payload' && (
          <div className="space-y-2">
            <h3 className="text-[10px] text-[var(--text-dim)] uppercase tracking-wider">request payload</h3>
            <JsonViewer data={request.request_body} />
          </div>
        )}

        {activeTab === 'headers' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-[10px] text-[var(--text-dim)] uppercase tracking-wider">request headers</h3>
              {formatHeaders(request.request_headers)}
            </div>
            <div className="space-y-2">
              <h3 className="text-[10px] text-[var(--text-dim)] uppercase tracking-wider">response headers</h3>
              {formatHeaders(request.response_headers)}
            </div>
          </div>
        )}

        {activeTab === 'response' && (
          <div className="space-y-2">
            <h3 className="text-[10px] text-[var(--text-dim)] uppercase tracking-wider">response payload</h3>
            <JsonViewer data={request.response_body} />
          </div>
        )}

        {activeTab === 'raw' && (
          <div className="space-y-2">
            <h3 className="text-[10px] text-[var(--text-dim)] uppercase tracking-wider">raw http</h3>
            <div className="p-3 rounded border border-[var(--border-subtle)] bg-[var(--card-alt)] text-[11px] text-[var(--text-primary)] overflow-x-auto whitespace-pre leading-relaxed select-text">
              {rawHttp}
            </div>
          </div>
        )}
      </div>
    </main>
  );
};
