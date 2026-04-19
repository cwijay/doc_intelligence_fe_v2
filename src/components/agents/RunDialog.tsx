'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import JsonEditor from './JsonEditor';
import JsonViewer from './JsonViewer';
import { useCreateRun } from '@/hooks/agents';
import toast from 'react-hot-toast';
import type { AgentRun } from '@/types/agents';

interface Props {
  agentId: string;
  open: boolean;
  onClose: () => void;
}

const DEFAULT_INPUT = `{\n  "query": "hello"\n}`;

export default function RunDialog({ agentId, open, onClose }: Props) {
  const [input, setInput] = useState(DEFAULT_INPUT);
  const [result, setResult] = useState<AgentRun | null>(null);
  const createRun = useCreateRun(agentId);

  if (!open) return null;

  const submit = async () => {
    let payload: Record<string, unknown>;
    try {
      payload = input.trim() ? JSON.parse(input) : {};
    } catch (e) {
      toast.error(`Invalid JSON: ${e instanceof Error ? e.message : 'parse error'}`);
      return;
    }
    try {
      const run = await createRun.mutateAsync({ inputPayload: payload });
      setResult(run);
      toast.success('Run completed');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Run failed');
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Run agent"
    >
      <div
        className="bg-white dark:bg-secondary-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-secondary-200 dark:border-secondary-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Run agent</h3>
          <button onClick={onClose} aria-label="Close dialog" className="text-secondary-500 hover:text-secondary-800 dark:hover:text-secondary-200">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <JsonEditor value={input} onChange={setInput} rows={8} />
          <div className="flex justify-end">
            <Button onClick={submit} disabled={createRun.isPending}>
              {createRun.isPending ? 'Running…' : 'Run'}
            </Button>
          </div>
          {result && (
            <div className="space-y-3">
              <div className="text-sm">
                Status: <span className="font-medium">{result.status}</span>
              </div>
              <JsonViewer value={result.outputPayload ?? {}} label="Output" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
