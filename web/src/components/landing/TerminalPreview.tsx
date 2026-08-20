'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface SimulatedRequest {
  id: string;
  time: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  status: number;
  statusText: string;
  latency: number;
}

const INITIAL_REQUESTS: SimulatedRequest[] = [
  {
    id: 'req-1',
    time: '18:24:02',
    method: 'POST',
    path: '/api/webhooks/stripe',
    status: 200,
    statusText: '200 ok',
    latency: 14,
  },
  {
    id: 'req-2',
    time: '18:24:08',
    method: 'GET',
    path: '/api/v1/user/profile',
    status: 200,
    statusText: '200 ok',
    latency: 8,
  },
  {
    id: 'req-3',
    time: '18:24:15',
    method: 'POST',
    path: '/webhooks/github/push',
    status: 200,
    statusText: '200 ok',
    latency: 19,
  },
  {
    id: 'req-4',
    time: '18:24:22',
    method: 'POST',
    path: '/api/auth/token',
    status: 401,
    statusText: '401 unauthorized',
    latency: 12,
  },
];

const POOL: Omit<SimulatedRequest, 'id' | 'time'>[] = [
  { method: 'POST', path: '/api/webhooks/stripe', status: 200, statusText: '200 ok', latency: 13 },
  { method: 'GET', path: '/api/v1/session', status: 200, statusText: '200 ok', latency: 6 },
  { method: 'POST', path: '/webhooks/discord', status: 200, statusText: '200 ok', latency: 24 },
  { method: 'PUT', path: '/api/sync/inventory', status: 200, statusText: '200 ok', latency: 38 },
  { method: 'GET', path: '/healthz', status: 200, statusText: '200 ok', latency: 3 },
  { method: 'POST', path: '/api/checkout/pay', status: 201, statusText: '201 created', latency: 42 },
  { method: 'POST', path: '/api/telemetry', status: 204, statusText: '204 no content', latency: 9 },
  { method: 'DELETE', path: '/api/cache/flush', status: 200, statusText: '200 ok', latency: 15 },
  { method: 'GET', path: '/api/v1/notifications', status: 304, statusText: '304 not modified', latency: 7 },
  { method: 'POST', path: '/api/webhook/twilio', status: 500, statusText: '500 server error', latency: 84 },
];

export const TerminalPreview: React.FC = () => {
  const [requests, setRequests] = useState<SimulatedRequest[]>(INITIAL_REQUESTS);
  const [isLive, setIsLive] = useState(true);
  const counterRef = useRef(5);

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET':
        return 'text-[var(--method-get)]';
      case 'POST':
        return 'text-[var(--method-post)]';
      case 'PUT':
        return 'text-[var(--method-put)]';
      case 'DELETE':
        return 'text-[var(--method-delete)]';
      default:
        return 'text-[var(--text-dim)]';
    }
  };

  const getStatusColor = (code: number) => {
    if (code >= 200 && code < 300) return 'text-[var(--status-success)]';
    if (code >= 300 && code < 400) return 'text-[var(--status-warning)]';
    return 'text-[var(--status-error)]';
  };

  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      const template = POOL[Math.floor(Math.random() * POOL.length)];
      const now = new Date();
      const timeStr = [
        String(now.getHours()).padStart(2, '0'),
        String(now.getMinutes()).padStart(2, '0'),
        String(now.getSeconds()).padStart(2, '0'),
      ].join(':');

      const jitter = Math.floor(Math.random() * 8) - 4;
      const newReq: SimulatedRequest = {
        id: `req-${counterRef.current++}`,
        time: timeStr,
        ...template,
        latency: Math.max(2, template.latency + jitter),
      };

      setRequests((prev) => [newReq, ...prev.slice(0, 7)]);
    }, 2200);

    return () => clearInterval(interval);
  }, [isLive]);

  const handleClear = () => {
    setRequests([]);
  };

  const total = requests.length;
  const okCount = requests.filter((r) => r.status >= 200 && r.status < 400).length;
  const errCount = requests.filter((r) => r.status >= 400).length;
  const avgLatency = total > 0 ? Math.round(requests.reduce((a, b) => a + b.latency, 0) / total) : 0;

  return (
    <section id="terminal-preview" className="border-t border-[var(--border-subtle)] py-20">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-10">
          <span className="text-[11px] text-[var(--teal)] uppercase tracking-wider font-mono">
            live terminal inspection
          </span>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--text-primary)] mt-2">
            real-time telemetry without leaving your shell
          </h2>
          <p className="text-[14px] text-[var(--text-secondary)] mt-2 max-w-lg mx-auto">
            every webhook and http request streaming through your multiplexed tunnel, right in bubble tea tui.
          </p>
        </div>

        <div className="rounded-xl border border-[var(--border-normal)] bg-[#120f11] shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden font-mono text-[12px]">
          <div className="h-9 bg-[#1e1a1c] border-b border-[var(--border-subtle)] px-4 flex items-center justify-between select-none">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E98389]/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#FBCA89]/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#B7F1E0]/80" />
              <span className="ml-3 text-[11px] text-[var(--text-dim)]">tunneru 3000</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsLive(!isLive)}
                className="flex items-center gap-1 text-[10px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-2 py-0.5 rounded border border-[var(--border-subtle)] bg-[var(--card-panel)] cursor-pointer active:scale-[0.96] transition-all"
              >
                {isLive ? <Pause size={10} /> : <Play size={10} />}
                <span>{isLive ? 'pause' : 'resume'}</span>
              </button>

              <button
                onClick={handleClear}
                className="flex items-center gap-1 text-[10px] text-[var(--text-dim)] hover:text-[var(--text-primary)] px-2 py-0.5 rounded border border-[var(--border-subtle)] bg-[var(--card-panel)] cursor-pointer active:scale-[0.96] transition-all"
              >
                <RotateCcw size={10} />
                <span>clear</span>
              </button>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <div className="rounded-lg border border-[var(--border-subtle)] bg-[#1e1a1c] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px]">
              <div className="space-y-1.5">
                <div className="flex items-center gap-3">
                  <span className="text-[var(--text-dim)] w-20">tunnel:</span>
                  <span className="text-[var(--teal)] font-medium">https://myapp.tunneru.dev</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[var(--text-dim)] w-20">forwarding:</span>
                  <span className="text-[var(--text-primary)]">http://localhost:3000</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[var(--text-dim)] w-20">inspect:</span>
                  <span className="text-[var(--text-secondary)]">http://localhost:4040</span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center px-2.5 py-1 rounded border border-[var(--border-subtle)] bg-[#141012]">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-success)] animate-pulse" />
                <span className="text-[10px] text-[var(--status-success)] font-medium">connected</span>
              </div>
            </div>

            <div className="rounded-lg border border-[var(--border-subtle)] bg-[#141012] overflow-hidden">
              <div className="grid grid-cols-12 px-4 py-2 border-b border-[var(--border-subtle)] text-[10px] text-[var(--text-dim)] tracking-wider">
                <div className="col-span-2">time</div>
                <div className="col-span-2">method</div>
                <div className="col-span-4 sm:col-span-5">path</div>
                <div className="col-span-2 sm:col-span-2">status</div>
                <div className="col-span-2 sm:col-span-1 text-right">lat</div>
              </div>

              <div className="divide-y divide-[var(--border-subtle)]/40 min-h-[220px]">
                {requests.length === 0 ? (
                  <div className="py-12 text-center text-[var(--text-dim)] text-[11px]">
                    waiting for incoming traffic...
                  </div>
                ) : (
                  requests.map((req) => (
                    <div
                      key={req.id}
                      className="grid grid-cols-12 px-4 py-2.5 items-center text-[11px] hover:bg-[#1e1a1c]/60 transition-colors duration-100 animate-in fade-in slide-in-from-top-1"
                    >
                      <div className="col-span-2 text-[var(--text-dim)] text-[10px]">{req.time}</div>
                      <div className={`col-span-2 font-semibold ${getMethodColor(req.method)}`}>
                        {req.method}
                      </div>
                      <div className="col-span-4 sm:col-span-5 text-[var(--text-primary)] truncate pr-2">
                        {req.path}
                      </div>
                      <div className={`col-span-2 sm:col-span-2 ${getStatusColor(req.status)} text-[10px]`}>
                        {req.statusText}
                      </div>
                      <div className="col-span-2 sm:col-span-1 text-right text-[var(--text-dim)] text-[10px]">
                        {req.latency}ms
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-lg border border-[var(--border-subtle)] bg-[#1e1a1c] px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-[10px] text-[var(--text-dim)]">
              <div className="flex items-center gap-4">
                <span className="text-[var(--text-primary)]">{total} requests</span>
                <span className="text-[var(--status-success)]">{okCount} ok</span>
                <span className="text-[var(--status-error)]">{errCount} err</span>
                <span>{avgLatency}ms avg</span>
              </div>
              <div className="flex items-center gap-3 text-[9px]">
                <span>[c] clear</span>
                <span>[↑/↓] scroll</span>
                <span>[q] quit</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
