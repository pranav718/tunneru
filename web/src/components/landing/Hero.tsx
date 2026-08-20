'use client';

import React from 'react';
import { ParticleTunnel } from './ParticleTunnel';
import { CopyPill } from './CopyPill';

export const Hero: React.FC = () => {
  return (
    <section id="hero" className="pt-14">
      <div className="max-w-6xl mx-auto px-6 py-24 md:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--border-normal)] bg-[var(--card-alt)] mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-success)] animate-pulse" />
              <span className="text-[11px] text-[var(--text-dim)]">v0.1.0 — self-hostable tunnel</span>
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.15] text-[var(--text-primary)]">
              your localhost,
              <br />
              <span className="text-[var(--teal)]">on the public internet.</span>
            </h1>

            <p className="mt-5 text-[15px] md:text-[16px] leading-relaxed text-[var(--text-secondary)] max-w-lg">
              zero-dependency tunneling with a custom 9-byte binary multiplexer,
              interactive terminal tui, and instant request replay.
              fast, private, self-hosted.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-start gap-4">
              <CopyPill command="curl -fsSL https://tunneru.dev/install.sh | sh" />
            </div>

            <div className="mt-8 flex items-center gap-5 text-[11px] text-[var(--text-dim)]">
              <span className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-[var(--teal)]" />
                zero config
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-[var(--blush)]" />
                no signup
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-[var(--status-success)]" />
                100% private
              </span>
            </div>
          </div>

          <div className="hidden lg:flex items-center justify-center">
            <div className="w-full aspect-square max-w-[480px] rounded-xl border border-[var(--border-subtle)] bg-[var(--card-alt)] overflow-hidden">
              <ParticleTunnel />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
