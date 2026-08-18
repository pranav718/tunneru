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
      <div className="p-4 text-center text-[var(--text-dim)] text-[11px]">
        empty
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
            cls = 'text-[var(--text-primary)]';
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
    <div className="rounded border border-[var(--border-subtle)] bg-[var(--card-alt)] overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1 border-b border-[var(--border-subtle)]">
        <span className="text-[10px] text-[var(--text-dim)] uppercase tracking-wider">
          {isJson ? 'json' : 'text'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] text-[var(--text-dim)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
        >
          {copied ? <Check size={10} className="text-[var(--status-success)]" /> : <Copy size={10} />}
          <span>{copied ? 'copied' : 'copy'}</span>
        </button>
      </div>

      <div className="p-3 overflow-x-auto max-h-[400px] select-text">
        <pre
          className="whitespace-pre text-[11px] leading-relaxed"
          dangerouslySetInnerHTML={{ __html: highlightJson(formatted) }}
        />
      </div>
    </div>
  );
};
