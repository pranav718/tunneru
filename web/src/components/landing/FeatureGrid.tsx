'use client';

import React from 'react';
import { Layers, Terminal, RotateCcw, Key, Server, ShieldCheck, Cpu } from 'lucide-react';

interface FeatureCard {
  icon: React.ReactNode;
  tag: string;
  title: string;
  description: string;
  metric?: string;
  codeSnippet?: string;
  colSpan?: string;
}

export const FeatureGrid: React.FC = () => {
  return (
    <section id="features" className="border-t border-[var(--border-subtle)] py-24 bg-[var(--bg-main)]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-[11px] text-[var(--teal)] uppercase tracking-wider font-mono">
            engineering highlights
          </span>
          <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-[var(--text-primary)] mt-2">
            built for developers who value speed & privacy
          </h2>
          <p className="text-[14px] text-[var(--text-secondary)] mt-3 max-w-xl mx-auto">
            every layer engineered from the ground up without third-party cloud lock-in or heavy runtime overhead.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="md:col-span-2 rounded-xl border border-[var(--border-normal)] bg-[var(--card-panel)] p-7 flex flex-col justify-between hover:border-[var(--border-accent)] transition-all duration-200 group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-9 h-9 rounded-lg border border-[var(--border-subtle)] bg-[var(--card-alt)] flex items-center justify-center text-[var(--teal)]">
                  <Cpu size={18} />
                </div>
                <span className="text-[10px] font-mono text-[var(--text-dim)] uppercase tracking-wider">
                  high performance
                </span>
              </div>

              <h3 className="text-[18px] font-semibold text-[var(--text-primary)] mb-2">
                custom 9-byte binary multiplexer
              </h3>
              <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed max-w-xl">
                multiplex hundreds of concurrent http streams over a single persistent tcp socket.
                framing is achieved with an ultra-compact 9-byte binary header, eliminating websocket and http/2 protocol overhead.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-[var(--border-subtle)] grid grid-cols-3 gap-3 font-mono text-center">
              <div className="rounded border border-[var(--border-subtle)] bg-[var(--card-alt)] py-2">
                <div className="text-[16px] font-bold text-[var(--teal)]">&lt; 1ms</div>
                <div className="text-[10px] text-[var(--text-dim)]">multiplex latency</div>
              </div>
              <div className="rounded border border-[var(--border-subtle)] bg-[var(--card-alt)] py-2">
                <div className="text-[16px] font-bold text-[var(--blush)]">9 bytes</div>
                <div className="text-[10px] text-[var(--text-dim)]">frame overhead</div>
              </div>
              <div className="rounded border border-[var(--border-subtle)] bg-[var(--card-alt)] py-2">
                <div className="text-[16px] font-bold text-[var(--status-success)]">0 allocs</div>
                <div className="text-[10px] text-[var(--text-dim)]">fast-path parsing</div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border-normal)] bg-[var(--card-panel)] p-7 flex flex-col justify-between hover:border-[var(--border-accent)] transition-all duration-200 group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-9 h-9 rounded-lg border border-[var(--border-subtle)] bg-[var(--card-alt)] flex items-center justify-center text-[var(--blush)]">
                  <RotateCcw size={18} />
                </div>
                <span className="text-[10px] font-mono text-[var(--text-dim)] uppercase tracking-wider">
                  debugging
                </span>
              </div>

              <h3 className="text-[18px] font-semibold text-[var(--text-primary)] mb-2">
                1-click webhook replay
              </h3>
              <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
                fixed a bug in your webhook handler? replay the captured payload directly from the inspector without triggering external stripe or github events again.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-[var(--border-subtle)]">
              <div className="rounded border border-[var(--border-subtle)] bg-[var(--card-alt)] p-2.5 font-mono text-[11px] flex items-center justify-between">
                <span className="text-[var(--text-dim)]">POST /api/webhook</span>
                <span className="text-[var(--teal)] font-medium text-[10px] px-2 py-0.5 rounded bg-[var(--teal)]/10">
                  replay
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border-normal)] bg-[var(--card-panel)] p-7 flex flex-col justify-between hover:border-[var(--border-accent)] transition-all duration-200 group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-9 h-9 rounded-lg border border-[var(--border-subtle)] bg-[var(--card-alt)] flex items-center justify-center text-[var(--status-warning)]">
                  <Terminal size={18} />
                </div>
                <span className="text-[10px] font-mono text-[var(--text-dim)] uppercase tracking-wider">
                  dual telemetry
                </span>
              </div>

              <h3 className="text-[18px] font-semibold text-[var(--text-primary)] mb-2">
                bubble tea tui & web ui
              </h3>
              <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
                rich terminal interface with live requests and latency metrics, paired with a web inspector for formatted json diffs and raw headers.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-[var(--border-subtle)] font-mono text-[11px] text-[var(--text-dim)] flex items-center justify-between">
              <span>terminal: live tui</span>
              <span>web: localhost:4040</span>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border-normal)] bg-[var(--card-panel)] p-7 flex flex-col justify-between hover:border-[var(--border-accent)] transition-all duration-200 group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-9 h-9 rounded-lg border border-[var(--border-subtle)] bg-[var(--card-alt)] flex items-center justify-center text-[var(--status-success)]">
                  <Key size={18} />
                </div>
                <span className="text-[10px] font-mono text-[var(--text-dim)] uppercase tracking-wider">
                  security
                </span>
              </div>

              <h3 className="text-[18px] font-semibold text-[var(--text-primary)] mb-2">
                subdomains & token auth
              </h3>
              <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
                claim predictable subdomains with <code className="text-[var(--teal)] font-mono">--subdomain</code>. lock down access with shared token authentication.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-[var(--border-subtle)] font-mono text-[10px] text-[var(--text-dim)]">
              <span className="text-[var(--text-secondary)]">$ tunneru 3000 -s myapp -t token</span>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border-normal)] bg-[var(--card-panel)] p-7 flex flex-col justify-between hover:border-[var(--border-accent)] transition-all duration-200 group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-9 h-9 rounded-lg border border-[var(--border-subtle)] bg-[var(--card-alt)] flex items-center justify-center text-[var(--teal)]">
                  <ShieldCheck size={18} />
                </div>
                <span className="text-[10px] font-mono text-[var(--text-dim)] uppercase tracking-wider">
                  privacy
                </span>
              </div>

              <h3 className="text-[18px] font-semibold text-[var(--text-primary)] mb-2">
                zero signup & 100% private
              </h3>
              <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
                no email required, no cloud accounts, and no request logs stored on external servers. pure open source developer infrastructure.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-[var(--border-subtle)] font-mono text-[11px] text-[var(--text-dim)] flex items-center justify-between">
              <span>open source</span>
              <span>mit licensed</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
