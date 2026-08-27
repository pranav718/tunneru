import React from 'react';

const XIcon = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-main)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
          <span className="text-[13px] font-mono font-semibold text-[var(--text-primary)]">
            tunneru
          </span>
          <span className="hidden sm:inline text-[var(--border-normal)]">/</span>
          <span className="text-[12px] font-mono text-[var(--text-dim)]">
            self-hostable ngrok alternative
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 text-[12px] font-mono text-[var(--text-dim)]">
          <span className="hover:text-[var(--text-secondary)] transition-colors duration-150">
            MIT license
          </span>
          <span className="hover:text-[var(--text-secondary)] transition-colors duration-150">
            go 1.24
          </span>
          <span className="hover:text-[var(--text-secondary)] transition-colors duration-150">
            next.js 16
          </span>
          <a
            href="https://x.com/knightkun__"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative inline-flex items-center gap-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-150"
          >
            <XIcon size={12} />
            <span className="relative pb-0.5">
              <span>@knightkun__</span>
              <span className="absolute bottom-0 left-0 h-[1px] w-0 bg-[var(--teal)] transition-all duration-300 ease-out group-hover:w-full" />
            </span>
          </a>
        </div>
      </div>
    </footer>
  );
};
