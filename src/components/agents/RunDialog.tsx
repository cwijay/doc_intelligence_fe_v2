'use client';

import { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import JsonEditor from './JsonEditor';
import JsonViewer from './JsonViewer';
import { useCreateRun } from '@/hooks/agents';
import toast from 'react-hot-toast';
import type { AgentRun } from '@/types/agents';

interface Props {
  agentId: string;
  open: boolean;
  onClose: () => void;
  onSuccess?: (run: AgentRun) => void;
}

const DEFAULT_INPUT = `{\n  "query": "hello"\n}`;

export default function RunDialog({ agentId, open, onClose, onSuccess }: Props) {
  const [input, setInput] = useState(DEFAULT_INPUT);
  const [result, setResult] = useState<AgentRun | null>(null);
  const createRun = useCreateRun(agentId);

  // Reset state whenever the dialog re-opens.
  useEffect(() => {
    if (open) {
      setInput(DEFAULT_INPUT);
      setResult(null);
    }
  }, [open]);

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
      onSuccess?.(run);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Run failed');
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} title="Run agent" size="xl">
      <div className="space-y-4">
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
    </Modal>
  );
}
