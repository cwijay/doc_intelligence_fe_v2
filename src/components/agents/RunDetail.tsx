'use client';

import { useEffect } from 'react';
import { format } from 'date-fns';
import type { AgentRun } from '@/types/agents';
import JsonViewer from './JsonViewer';

interface Props {
  run: AgentRun;
  onClose: () => void;
}

export default function RunDetail({ run, onClose }: Props) {
  // Escape closes the drawer
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40 flex" role="dialog" aria-modal="true" aria-label="Run detail">
      <div className="flex-1 bg-black/50" onClick={onClose} />
      <aside className="w-full max-w-xl h-full bg-white dark:bg-secondary-900 shadow-2xl overflow-auto">
        <div className="p-5 border-b border-secondary-200 dark:border-secondary-700 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">Run detail</h3>
            <p className="text-xs font-mono text-secondary-500 dark:text-secondary-400 break-all">{run.id}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close run detail"
            className="text-secondary-500 hover:text-secondary-800 dark:hover:text-secondary-200"
          >
            ✕
          </button>
        </div>
        <div className="p-5 space-y-4">
          <dl className="text-sm space-y-2">
            <Row label="Status" value={run.status} />
            <Row label="Version" value={<span className="font-mono text-xs break-all">{run.agentVersionId}</span>} />
            <Row label="Created" value={format(new Date(run.createdAt), 'PP p')} />
          </dl>
          <JsonViewer value={run.inputPayload} label="Input" />
          <JsonViewer value={run.outputPayload ?? { note: 'No output recorded' }} label="Output" />
        </div>
      </aside>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <dt className="w-20 text-secondary-500 dark:text-secondary-400">{label}</dt>
      <dd className="flex-1 text-secondary-800 dark:text-secondary-200">{value}</dd>
    </div>
  );
}
