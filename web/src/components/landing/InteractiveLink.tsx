'use client';

import React from 'react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

interface InteractiveLinkProps {
  href: string;
  label: string;
  external?: boolean;
  arrowType?: 'right' | 'up-right';
  className?: string;
}

export const InteractiveLink: React.FC<InteractiveLinkProps> = ({
  href,
  label,
  external = false,
  arrowType = 'right',
  className = '',
}) => {
  const Icon = arrowType === 'up-right' ? ArrowUpRight : ArrowRight;
  const arrowHoverClass = arrowType === 'up-right'
    ? 'group-hover:translate-x-0.5 group-hover:-translate-y-0.5'
    : 'group-hover:translate-x-1.5';

  const content = (
    <span className={`group inline-flex items-center gap-2 text-[13px] font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-200 active:scale-[0.98] cursor-pointer ${className}`}>
      <span className="relative inline-block pb-0.5">
        <span className="lowercase">{label}</span>
        <span className="absolute bottom-0 left-0 h-[1.5px] w-0 bg-[var(--teal)] transition-all duration-300 ease-out group-hover:w-full" />
      </span>
      <Icon size={14} className={`text-[var(--teal)] transition-transform duration-300 ease-out ${arrowHoverClass}`} />
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
