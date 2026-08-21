'use client';

import React from 'react';
import { ParticleTunnel } from './ParticleTunnel';
import { CopyPill } from './CopyPill';
import { InteractiveLink } from './InteractiveLink';

export const Hero: React.FC = () => {
  return (
    <section id="hero" className="pt-14 relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <ParticleTunnel />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-24 md:py-32">
        <div className="max-w-lg">
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

          <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <CopyPill command="curl -fsSL https://tunneru.dev/install.sh | sh" />
            <InteractiveLink href="#docs" label="read docs" />
          </div>

          <div className="mt-8 flex items-center gap-6 text-[12px] text-[var(--text-dim)] font-mono">
            <span>zero config</span>
            <span>no signup</span>
            <span>100% private</span>
          </div>
        </div>
      </div>
    </section>
  );
};
