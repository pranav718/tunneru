'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Menu, X } from 'lucide-react';

const GithubIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
  </svg>
);

const NAV_LINKS = [
  { label: 'features', href: '#features' },
  { label: 'how it works', href: '#how-it-works' },
  { label: 'docs', href: '#docs' },
  { label: 'self-host', href: '#self-host' },
];

export const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-[background-color,border-color] duration-200 ${
        scrolled
          ? 'bg-[var(--bg-main)]/90 backdrop-blur-xl border-b border-[var(--border-normal)]'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between relative">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-[15px] font-semibold text-[var(--text-primary)] tracking-tight">
              tunneru
            </span>
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-7 absolute left-1/2 -translate-x-1/2">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="group relative text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-200 font-mono py-1 cursor-pointer"
            >
              <span>{link.label}</span>
              <span className="absolute bottom-0 left-0 h-[1.5px] w-0 bg-[var(--teal)] transition-all duration-300 ease-out group-hover:w-full" />
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/inspect"
            className="group flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-mono text-[var(--text-secondary)] rounded border border-[var(--border-normal)] hover:border-[var(--border-accent)] hover:text-[var(--text-primary)] transition-all duration-200 active:scale-[0.97] cursor-pointer"
          >
            <span className="relative">
              <span>inspector</span>
              <span className="absolute bottom-0 left-0 h-[1px] w-0 bg-[var(--teal)] transition-all duration-300 ease-out group-hover:w-full" />
            </span>
            <ArrowUpRight size={13} className="text-[var(--text-dim)] group-hover:text-[var(--teal)] transition-transform duration-700 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] group-hover:rotate-[405deg] group-hover:translate-x-0.5" />
          </Link>
          <a
            href="https://github.com/pranav718/tunneru"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] text-[var(--bg-main)] bg-[var(--text-primary)] rounded hover:opacity-90 transition-opacity duration-150 active:scale-[0.97]"
          >
            <GithubIcon size={12} />
            github
          </a>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden text-[var(--text-secondary)] active:scale-[0.95]"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-[var(--border-normal)] bg-[var(--bg-main)]/95 backdrop-blur-xl px-4 sm:px-6 py-4 flex flex-col gap-3">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="group relative text-[14px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] py-1 w-fit"
            >
              <span>{link.label}</span>
              <span className="absolute bottom-0 left-0 h-[1.5px] w-0 bg-[var(--teal)] transition-all duration-300 ease-out group-hover:w-full" />
            </a>
          ))}
          <div className="flex items-center gap-3 pt-2 border-t border-[var(--border-subtle)]">
            <Link
              href="/inspect"
              className="group flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-mono text-[var(--text-secondary)] rounded border border-[var(--border-normal)]"
            >
              <span className="relative">
                <span>inspector</span>
                <span className="absolute bottom-0 left-0 h-[1px] w-0 bg-[var(--teal)] transition-all duration-300 ease-out group-hover:w-full" />
              </span>
              <ArrowUpRight size={13} className="text-[var(--text-dim)] group-hover:text-[var(--teal)] transition-transform duration-700 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] group-hover:rotate-[405deg] group-hover:translate-x-0.5" />
            </Link>
            <a
              href="https://github.com/pranav718/tunneru"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] text-[var(--bg-main)] bg-[var(--text-primary)] rounded"
            >
              <GithubIcon size={12} />
              github
            </a>
          </div>
        </div>
      )}
    </nav>
  );
};
