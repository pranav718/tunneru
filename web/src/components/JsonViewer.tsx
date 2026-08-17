'use client';

import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface JsonViewerProps {
  data: string;
}

export const JsonViewer: React.FC<JsonViewerProps> = ({ data }) => {
  const [copied, setCopied] = useState(false);

  if (!data || data.trim() === '') {
    return (
      <div className="p-6 text-center text-[var(--text-dim)] font-mono text-sm">
        No body payload
      </div>
    );
  }

  let formatted = data;
  let isJson = false;

  try {
    const parsed = JSON.parse(data);
    formatted = JSON.stringify(parsed, null, 2);
    isJson = true;
  } catch {
    formatted = data;
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const highlightJson = (json: string) => {
    if (!isJson) return json;

    const escaped = json
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    return escaped.replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      (match) => {
        let cls = 'text-[var(--status-warning)]';
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = 'text-[var(--text-primary)] font-medium'; 
          } else {
            cls = 'text-[var(--method-get)]'; 
          }
        } else if (/true|false/.test(match)) {
          cls = 'text-[var(--status-error)]'; 
        } else if (/null/.test(match)) {
          cls = 'text-[var(--text-dim)]'; 
        }
        return `<span class="${cls}">${match}</span>`;
      }
    );
  };

  return (
    <div className="relative rounded-lg border border-[var(--border-normal)] bg-[var(--card-alt)] font-mono text-xs overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border-subtle)] bg-[var(--card-panel)]">
        <span className="text-[11px] text-[var(--text-secondary)] uppercase tracking-wider font-semibold">
          {isJson ? 'JSON' : 'RAW TEXT'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 rounded bg-[var(--card-hover)] hover:bg-[var(--border-normal)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer text-xs"
        >
          {copied ? <Check size={13} className="text-[var(--status-success)]" /> : <Copy size={13} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      <div className="p-4 overflow-x-auto max-h-[420px] leading-relaxed select-text">
        <pre
          className="whitespace-pre font-mono"
          dangerouslySetInnerHTML={{ __html: highlightJson(formatted) }}
        />
      </div>
    </div>
  );
};
