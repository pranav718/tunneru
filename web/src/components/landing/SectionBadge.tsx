'use client';

import React from 'react';
import { DecodeText } from './DecodeText';

interface SectionBadgeProps {
  text: string;
  dot?: boolean;
  className?: string;
}

export const SectionBadge: React.FC<SectionBadgeProps> = ({
  text,
  dot = true,
  className = '',
}) => {
  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--border-accent)] bg-[var(--card-alt)] text-[12px] md:text-[13px] font-mono text-[var(--teal)] transition-all duration-300 hover:border-[var(--teal)] hover:shadow-[0_0_15px_rgba(129,209,208,0.15)] cursor-default ${className}`}
    >
      {dot && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--teal)] opacity-60" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--teal)]" />
        </span>
      )}
      <DecodeText text={text} />
    </div>
  );
};
