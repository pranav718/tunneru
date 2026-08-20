'use client';

import React, { useState, useCallback } from 'react';
import { Check, Copy } from 'lucide-react';

interface CopyPillProps {
  command: string;
}

export const CopyPill: React.FC<CopyPillProps> = ({ command }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.createElement('textarea');
      el.value = command;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [command]);

  return (
    <button
      onClick={handleCopy}
      className="group flex items-center gap-3 px-4 py-2.5 rounded-lg border border-[var(--border-normal)] bg-[var(--card-panel)] text-[13px] cursor-pointer hover:border-[var(--border-accent)] transition-colors duration-150 active:scale-[0.98]"
    >
      <span className="text-[var(--text-dim)]">$</span>
      <span className="text-[var(--text-secondary)]">{command}</span>
      <span className="ml-2 text-[var(--text-dim)] group-hover:text-[var(--text-secondary)] transition-colors duration-150">
        {copied ? <Check size={13} className="text-[var(--status-success)]" /> : <Copy size={13} />}
      </span>
    </button>
  );
};
