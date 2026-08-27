'use client';

import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { ParticleTunnel } from './ParticleTunnel';
import { CopyPill } from './CopyPill';
import { InteractiveLink } from './InteractiveLink';

export const Hero: React.FC = () => {
  const [goCopied, setGoCopied] = useState(false);
  const goCommand = 'go install github.com/pranav718/tunneru/cmd/client@latest';

  const handleCopyGo = async () => {
    try {
      await navigator.clipboard.writeText(goCommand);
      setGoCopied(true);
      setTimeout(() => setGoCopied(false), 2000);
    } catch {
      const el = document.createElement('textarea');
      el.value = goCommand;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setGoCopied(true);
      setTimeout(() => setGoCopied(false), 2000);
    }
  };

  return (
    <section id="hero" className="pt-14 relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <ParticleTunnel />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-24 md:py-32">
        <div className="max-w-lg">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.15] text-[var(--text-primary)]">
            your localhost,
            <br />
            <span className="text-[var(--teal)]">on the public internet.</span>
          </h1>

          <p className="mt-5 text-[15px] md:text-[16px] leading-relaxed text-[var(--text-secondary)] max-w-lg">
            expose localhost to the internet instantly. inspect every request,
            replay it with one key. no account, no rate limits, self-hosted.
          </p>

          <div className="mt-8 space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <CopyPill command="curl -fsSL https://raw.githubusercontent.com/pranav718/tunneru/main/install.sh | sh" className="w-full sm:w-auto" />
              <InteractiveLink href="#docs" label="read docs" />
            </div>

            <div className="flex items-center gap-2 text-[12px] font-mono text-[var(--text-dim)] pl-1">
              <span>or</span>
              <button
                onClick={handleCopyGo}
                className="group inline-flex items-center gap-1.5 text-[var(--text-secondary)] hover:text-[var(--teal)] transition-colors duration-150 cursor-pointer"
              >
                <span>go install client@latest</span>
                {goCopied ? (
                  <Check size={11} className="text-[var(--status-success)]" />
                ) : (
                  <span className="text-[10px] px-1 py-0.5 rounded border border-[var(--border-subtle)] bg-[var(--card-alt)] group-hover:border-[var(--teal)] text-[var(--text-dim)] group-hover:text-[var(--teal)] transition-colors">copy</span>
                )}
              </button>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-6 text-[13px] text-[var(--text-secondary)] font-mono">
            <span>zero config</span>
            <span>no signup</span>
            <span>100% private</span>
          </div>
        </div>
      </div>
    </section>
  );
};
