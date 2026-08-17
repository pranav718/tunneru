'use client';

import React, { useState } from 'react';
import { Play, Copy, Check, Clock, Server, FileText, Send } from 'lucide-react';
import { RequestRecord } from '@/types';
import { JsonViewer } from './JsonViewer';

interface RequestDetailProps {
  request: RequestRecord | null;
  onReplay: (id: string) => Promise<void>;
  isReplaying: boolean;
}

type TabType = 'headers' | 'payload' | 'response' | 'raw';

export const RequestDetail: React.FC<RequestDetailProps> = ({
  request,
  onReplay,
  isReplaying,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('payload');
  const [copiedUrl, setCopiedUrl] = useState(false);

  if (!request) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center p-12 text-center text-[var(--text-dim)] font-mono text-sm select-none">
        <Server size={36} className="mb-3 opacity-30 text-[var(--text-secondary)]" />
        <p className="text-base text-[var(--text-secondary)] font-medium mb-1">
          No request selected
        </p>
        <p className="text-xs">
          Select a request from the sidebar to inspect its payload, headers, and response.
        </p>
      </main>
    );
  }

  const copyUrl = () => {
    navigator.clipboard.writeText(request.path + (request.query ? `?${request.query}` : ''));
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const getStatusBadge = (code: number, text: string) => {
    let color = 'text-[var(--status-success)] border-[var(--status-success)] bg-[rgba(183,241,224,0.06)]';
    if (code >= 300 && code < 400) {
      color = 'text-[var(--status-warning)] border-[var(--status-warning)] bg-[rgba(251,202,137,0.06)]';
    } else if (code >= 400) {
      color = 'text-[var(--status-error)] border-[var(--status-error)] bg-[rgba(233,131,137,0.06)]';
    }

    return (
      <span className={`px-2.5 py-1 text-xs font-mono font-semibold rounded border ${color}`}>
        {code} {text}
      </span>
    );
  };

  const formatHeadersTable = (headers: Record<string, string[]>) => {
    if (!headers || Object.keys(headers).length === 0) {
      return (
        <div className="p-6 text-center text-[var(--text-dim)] font-mono text-xs">
          No headers recorded
        </div>
      );
    }

    return (
      <div className="rounded-lg border border-[var(--border-normal)] bg-[var(--card-alt)] overflow-hidden font-mono text-xs">
        <table className="w-full text-left divide-y divide-[var(--border-subtle)]">
          <thead className="bg-[var(--card-panel)] text-[var(--text-secondary)] uppercase text-[10px] tracking-wider">
            <tr>
              <th className="px-4 py-2.5 font-semibold w-1/3">Header</th>
              <th className="px-4 py-2.5 font-semibold">Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {Object.entries(headers).map(([key, values]) => (
              <tr key={key} className="hover:bg-[var(--card-hover)] transition-colors">
                <td className="px-4 py-2 text-[var(--text-secondary)] font-medium align-top">
                  {key}
                </td>
                <td className="px-4 py-2 text-[var(--text-primary)] break-all select-text">
                  {values.join(', ')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const rawHttpRequest = `${request.method} ${request.path}${request.query ? '?' + request.query : ''} ${request.proto || 'HTTP/1.1'}\n` +
    Object.entries(request.request_headers || {})
      .map(([k, v]) => `${k}: ${v.join(', ')}`)
      .join('\n') +
    (request.request_body ? `\n\n${request.request_body}` : '');

  return (
    <main className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] overflow-y-auto bg-[var(--bg-main)]">
      <div className="p-6 border-b border-[var(--border-normal)] bg-[var(--card-panel)]">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2.5">
              <span className="px-2 py-0.5 text-xs font-mono font-bold rounded bg-[var(--card-alt)] border border-[var(--border-subtle)] text-[var(--method-get)]">
                {request.method}
              </span>
              <h2 className="text-base font-mono font-semibold text-[var(--text-primary)] truncate" title={request.path}>
                {request.path}
                {request.query && <span className="text-[var(--text-dim)]">?{request.query}</span>}
              </h2>
              <button
                onClick={copyUrl}
                title="Copy Path"
                className="p-1 text-[var(--text-dim)] hover:text-[var(--text-primary)] rounded cursor-pointer transition-colors"
              >
                {copiedUrl ? <Check size={14} className="text-[var(--status-success)]" /> : <Copy size={14} />}
              </button>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono text-[var(--text-secondary)]">
              <div className="flex items-center gap-1.5">
                <Clock size={13} className="text-[var(--text-dim)]" />
                <span>{new Date(request.timestamp).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[var(--text-dim)]">Latency:</span>
                <span className="text-[var(--text-primary)]">{request.latency_ms}ms</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {getStatusBadge(request.status_code, request.status_text)}

            <button
              onClick={() => onReplay(request.id)}
              disabled={isReplaying}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono font-semibold rounded bg-[var(--text-primary)] text-[var(--bg-main)] hover:bg-[#fff] transition-all cursor-pointer disabled:opacity-50 shadow-[0_0_12px_rgba(231,208,200,0.2)]"
            >
              <Play size={12} fill="currentColor" />
              <span>{isReplaying ? 'Replaying...' : 'Replay'}</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] -mb-6 pt-2">
          {(['payload', 'headers', 'response', 'raw'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2 text-xs font-mono capitalize transition-all border-b-2 cursor-pointer ${
                activeTab === tab
                  ? 'border-[var(--border-accent)] text-[var(--text-primary)] font-semibold'
                  : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tab === 'payload' ? 'Request Body' : tab === 'response' ? 'Response Body' : tab}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 flex-1 space-y-6">
        {activeTab === 'payload' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono text-[var(--text-secondary)] uppercase tracking-wider font-semibold">
                Request Payload
              </h3>
            </div>
            <JsonViewer data={request.request_body} />
          </div>
        )}

        {activeTab === 'headers' && (
          <div className="space-y-6">
            <div className="space-y-2.5">
              <h3 className="text-xs font-mono text-[var(--text-secondary)] uppercase tracking-wider font-semibold">
                Request Headers
              </h3>
              {formatHeadersTable(request.request_headers)}
            </div>

            <div className="space-y-2.5">
              <h3 className="text-xs font-mono text-[var(--text-secondary)] uppercase tracking-wider font-semibold">
                Response Headers
              </h3>
              {formatHeadersTable(request.response_headers)}
            </div>
          </div>
        )}

        {activeTab === 'response' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono text-[var(--text-secondary)] uppercase tracking-wider font-semibold">
                Response Payload
              </h3>
            </div>
            <JsonViewer data={request.response_body} />
          </div>
        )}

        {activeTab === 'raw' && (
          <div className="space-y-3">
            <h3 className="text-xs font-mono text-[var(--text-secondary)] uppercase tracking-wider font-semibold">
              Raw HTTP Request
            </h3>
            <div className="p-4 rounded-lg border border-[var(--border-normal)] bg-[var(--card-alt)] font-mono text-xs text-[var(--text-primary)] overflow-x-auto whitespace-pre leading-relaxed select-text">
              {rawHttpRequest}
            </div>
          </div>
        )}
      </div>
    </main>
  );
};
