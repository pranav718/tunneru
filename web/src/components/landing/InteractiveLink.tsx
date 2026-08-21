'use client';

import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

interface InteractiveLinkProps {
  href: string;
  label: string;
  external?: boolean;
  className?: string;
}

export const InteractiveLink: React.FC<InteractiveLinkProps> = ({
  href,
  label,
  external = false,
  className = '',
}) => {
  const content = (
    <span className={`group inline-flex items-center gap-1.5 text-[13px] font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-200 active:scale-[0.98] cursor-pointer whitespace-nowrap ${className}`}>
      <span className="relative inline-block pb-0.5">
        <span className="lowercase">{label}</span>
        <span className="absolute bottom-0 left-0 h-[1.5px] w-0 bg-[var(--teal)] transition-all duration-300 ease-out group-hover:w-full" />
      </span>
      <ArrowUpRight size={14} className="text-[var(--text-dim)] group-hover:text-[var(--teal)] transition-transform duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] group-hover:rotate-[405deg] group-hover:translate-x-0.5" />
    </span>
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex">
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className="inline-flex">
      {content}
    </Link>
  );
};
