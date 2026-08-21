'use client';

import React, { useState } from 'react';
import { SectionBadge } from './SectionBadge';

interface Step {
  number: string;
  title: string;
  tag: string;
  description: string;
  badge: string;
  detail: {
    label: string;
    value: string;
  }[];
}

const STEPS: Step[] = [
  {
    number: '01',
    title: 'public ingress & routing',
    tag: 'edge',
    badge: 'https://myapp.tunneru.dev',
    description:
      'external traffic hits the public edge. the reverse proxy inspects the host header, looks up the active client session in the concurrent registry, and locks a stream.',
    detail: [
      { label: 'protocol', value: 'http/1.1 & https' },
      { label: 'subdomain', value: 'myapp.tunneru.dev' },
      { label: 'lookup', value: '< 1ms registry match' },
    ],
  },
  {
    number: '02',
    title: '9-byte binary multiplexer',
    tag: 'mux',
    badge: 'persistent tcp stream',
    description:
      'raw http requests are framed into 9-byte header binary frames (type, stream id, length, payload) and streamed over a single persistent tcp socket with zero backpressure delays.',
    detail: [
      { label: 'frame header', value: '1B type + 4B id + 4B len' },
      { label: 'session', value: 'bidirectional full-duplex' },
      { label: 'framing', value: 'zero serialization overhead' },
    ],
  },
  {
    number: '03',
    title: 'local dispatch & telemetry',
    tag: 'client',
    badge: 'localhost:3000 + :4040',
    description:
      'the local tunneru daemon unwraps the frames, forwards the http request to your local dev server, and simultaneously broadcasts the request record to the tui and web dashboard.',
    detail: [
      { label: 'target', value: 'http://localhost:3000' },
      { label: 'terminal', value: 'bubble tea live telemetry' },
      { label: 'inspector', value: 'websocket event hub (:4040)' },
    ],
  },
];

export const HowItWorks: React.FC = () => {
  const [activeStep, setActiveStep] = useState(1);

  return (
    <section id="how-it-works" className="border-t border-[var(--border-subtle)] py-24 bg-[var(--bg-main)]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <SectionBadge text="architecture & data flow" />
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--text-primary)] mt-4">
            how tunneru routes traffic in microseconds
          </h2>
          <p className="text-[14px] text-[var(--text-secondary)] mt-3 max-w-xl mx-auto">
            a custom binary multiplexing protocol built from scratch in go for zero latency and minimal cpu overhead.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {STEPS.map((step, idx) => {
            const isActive = activeStep === idx;
            return (
              <div
                key={step.number}
                onClick={() => setActiveStep(idx)}
                className={`relative rounded-xl border p-6 flex flex-col justify-between transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'border-[var(--border-accent)] bg-[var(--card-panel)] shadow-[0_8px_30px_rgba(231,208,200,0.06)]'
                    : 'border-[var(--border-normal)] bg-[var(--card-alt)] hover:border-[var(--border-accent)]/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[11px] font-mono text-[var(--teal)] px-2 py-0.5 rounded border border-[var(--border-subtle)] bg-[var(--card-alt)]">
                      step {step.number}
                    </span>
                    <span className="text-[10px] text-[var(--text-dim)] font-mono uppercase tracking-wider">
                      {step.tag}
                    </span>
                  </div>

                  <h3 className="text-[16px] font-semibold text-[var(--text-primary)] mb-2">
                    {step.title}
                  </h3>

                  <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed mb-6">
                    {step.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-[var(--border-subtle)] space-y-2">
                  {step.detail.map((d) => (
                    <div key={d.label} className="flex items-center justify-between text-[11px]">
                      <span className="text-[var(--text-dim)] font-mono">{d.label}</span>
                      <span className="text-[var(--text-primary)] font-mono text-[10px]">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 rounded-xl border border-[var(--border-normal)] bg-[var(--card-panel)] p-6">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--teal)]" />
              <span className="text-[12px] font-mono text-[var(--text-primary)] font-semibold">
                wire format: 9-byte multiplexer frame header
              </span>
            </div>
            <span className="text-[10px] font-mono text-[var(--text-dim)]">binary protocol spec</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 font-mono text-[11px]">
            <div className="rounded border border-[var(--border-subtle)] bg-[var(--card-alt)] p-3">
              <div className="text-[var(--text-dim)] text-[10px] mb-1">offset 0x00 (1 byte)</div>
              <div className="text-[var(--teal)] font-bold">frame type</div>
              <div className="text-[10px] text-[var(--text-secondary)] mt-1">
                0x01 data / 0x02 ping / 0x04 close
              </div>
            </div>

            <div className="rounded border border-[var(--border-subtle)] bg-[var(--card-alt)] p-3">
              <div className="text-[var(--text-dim)] text-[10px] mb-1">offset 0x01 (4 bytes)</div>
              <div className="text-[var(--blush)] font-bold">stream id (uint32)</div>
              <div className="text-[10px] text-[var(--text-secondary)] mt-1">
                odd: server, even: client
              </div>
            </div>

            <div className="rounded border border-[var(--border-subtle)] bg-[var(--card-alt)] p-3">
              <div className="text-[var(--text-dim)] text-[10px] mb-1">offset 0x05 (4 bytes)</div>
              <div className="text-[var(--status-warning)] font-bold">payload length (uint32)</div>
              <div className="text-[10px] text-[var(--text-secondary)] mt-1">
                big-endian byte count
              </div>
            </div>

            <div className="rounded border border-[var(--border-subtle)] bg-[var(--card-alt)] p-3">
              <div className="text-[var(--text-dim)] text-[10px] mb-1">offset 0x09 (variable)</div>
              <div className="text-[var(--status-success)] font-bold">payload data</div>
              <div className="text-[10px] text-[var(--text-secondary)] mt-1">
                raw http stream slice
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
