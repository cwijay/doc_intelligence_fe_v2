'use client';

import { useEffect, useRef, useState } from 'react';
import { ClipboardDocumentIcon, CheckIcon } from '@heroicons/react/24/outline';

interface JsonViewerProps {
  value: unknown;
  label?: string;
  maxHeight?: string;
}

export default function JsonViewer({ value, label, maxHeight = 'max-h-96' }: JsonViewerProps) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pretty = JSON.stringify(value, null, 2);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(pretty);
      setCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard permission denied or API unavailable — fail silently.
    }
  };

  return (
    <div className="relative rounded-lg border border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-900">
      <div className="flex items-center justify-between px-3 py-2 border-b border-secondary-200 dark:border-secondary-700">
        <span className="text-xs font-medium text-secondary-600 dark:text-secondary-400">
          {label ?? 'JSON'}
        </span>
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? 'Copied' : 'Copy to clipboard'}
          className="p-1 rounded hover:bg-secondary-200 dark:hover:bg-secondary-800 text-secondary-500"
        >
          {copied ? (
            <CheckIcon className="w-4 h-4" aria-hidden="true" />
          ) : (
            <ClipboardDocumentIcon className="w-4 h-4" aria-hidden="true" />
          )}
        </button>
      </div>
      <pre className={`p-3 text-xs font-mono overflow-auto ${maxHeight} text-secondary-800 dark:text-secondary-200`}>
        {pretty}
      </pre>
    </div>
  );
}
