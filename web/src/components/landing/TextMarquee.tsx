'use client';

import React from 'react';

const ITEMS = [
  'custom 9-byte binary multiplexer',
  '< 1ms frame latency',
  'zero cloud lock-in',
  'bubble tea terminal tui',
  'instant 1-key webhook replay',
  'custom subdomains',
  'shared token authentication',
  '100% private self-hosted',
  'dual stream telemetry',
  '0 allocation fast-path',
];

export const TextMarquee: React.FC = () => {
  const combined = [...ITEMS, ...ITEMS];

  return (
    <div className="relative w-full border-y border-[var(--border-subtle)] bg-[var(--card-alt)] py-3.5 overflow-hidden select-none">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[var(--bg-main)] to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[var(--bg-main)] to-transparent z-10" />

      <div className="animate-marquee flex items-center gap-8 font-mono text-[12px] text-[var(--text-secondary)]">
        {combined.map((item, idx) => (
          <div key={idx} className="flex items-center gap-8 whitespace-nowrap">
            <span className="hover:text-[var(--teal)] transition-colors duration-150">{item}</span>
            <span className="text-[var(--teal)] opacity-40">/</span>
          </div>
        ))}
      </div>
    </div>
  );
};
