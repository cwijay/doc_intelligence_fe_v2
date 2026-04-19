'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { useDryRun } from '@/hooks/agents';
import JsonEditor from './JsonEditor';
import JsonViewer from './JsonViewer';
import GraphPreview from './GraphPreview';
import toast from 'react-hot-toast';

interface Props {
  agentId: string;
}

const DEFAULT_INPUT = `{\n  "query": "hello"\n}`;

export default function DryRunPanel({ agentId }: Props) {
  const [input, setInput] = useState(DEFAULT_INPUT);
  const dryRun = useDryRun(agentId);

  const submit = async () => {
    dryRun.reset();
    let payload: Record<string, unknown>;
    try {
      const parsed: unknown = input.trim() ? JSON.parse(input) : {};
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        toast.error('Input must be a JSON object, e.g. {"query": "hello"}');
        return;
      }
      payload = parsed as Record<string, unknown>;
    } catch (e) {
      toast.error(`Invalid JSON: ${e instanceof Error ? e.message : 'parse error'}`);
      return;
    }
    try {
      await dryRun.mutateAsync({ inputPayload: payload });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Dry run failed');
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardContent className="p-5 space-y-3">
          <h2 className="text-sm font-semibold text-secondary-600 dark:text-secondary-400 uppercase">Input</h2>
          <JsonEditor value={input} onChange={setInput} rows={14} />
          <div className="flex justify-end">
            <Button onClick={submit} disabled={dryRun.isPending}>
              {dryRun.isPending ? 'Running…' : 'Dry run'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-4">
          <h2 className="text-sm font-semibold text-secondary-600 dark:text-secondary-400 uppercase">Output</h2>
          {dryRun.error && (
            <p className="text-sm text-error-600 dark:text-error-400">
              {dryRun.error instanceof Error ? dryRun.error.message : 'Unknown error'}
            </p>
          )}
          {dryRun.data ? (
            <>
              <JsonViewer value={dryRun.data.output} label="Output payload" />
              <GraphPreview spec={dryRun.data.graphSpec} height="h-48" />
            </>
          ) : (
            <p className="text-sm text-secondary-500 dark:text-secondary-400">Run the agent to see output and the compiled graph.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
