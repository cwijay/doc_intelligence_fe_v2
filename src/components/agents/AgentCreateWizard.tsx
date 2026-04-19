'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useTemplates, useCreateAgent } from '@/hooks/agents';
import { getTemplateCopy } from '@/lib/agents/template-copy';
import type { AgentMode } from '@/types/agents';
import toast from 'react-hot-toast';

const MODES: { value: AgentMode; label: string; hint: string }[] = [
  { value: 'workflow', label: 'Workflow', hint: 'Deterministic pipeline of steps.' },
  { value: 'chat', label: 'Chat', hint: 'Conversational agent (coming soon — stored but runs as workflow today).' },
  { value: 'hybrid', label: 'Hybrid', hint: 'Mix of workflow + chat (coming soon).' },
];

export default function AgentCreateWizard() {
  const router = useRouter();
  const { data: templateIds = [], isLoading: loadingTemplates, isError: templatesError } = useTemplates();
  const createAgent = useCreateAgent();

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState<AgentMode>('workflow');
  const [templateId, setTemplateId] = useState<string | null>(null);

  const canContinue1 = name.trim().length > 0;
  const canContinue2 = !!mode;
  const canSubmit = !!templateId && canContinue1 && canContinue2;

  const submit = async () => {
    if (!canSubmit) return;
    try {
      const agent = await createAgent.mutateAsync({
        name: name.trim(),
        description: description.trim() || null,
        mode,
        templateId: templateId as string,
      });
      toast.success('Agent created');
      router.push(`/agents/${agent.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Create failed');
    }
  };

  return (
    <Card>
      <CardContent className="p-6 space-y-6">
        <Stepper step={step} />

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Basics</h2>
            <div>
              <label htmlFor="agent-name" className="block text-sm font-medium mb-1 text-secondary-700 dark:text-secondary-300">Name *</label>
              <input
                id="agent-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-secondary-300 dark:border-secondary-700 px-3 py-2 bg-white dark:bg-secondary-900 text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g. Weekly summary bot"
              />
            </div>
            <div>
              <label htmlFor="agent-description" className="block text-sm font-medium mb-1 text-secondary-700 dark:text-secondary-300">Description</label>
              <textarea
                id="agent-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-secondary-300 dark:border-secondary-700 px-3 py-2 bg-white dark:bg-secondary-900 text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Optional: what does this agent do?"
              />
            </div>
            <div className="flex justify-end">
              <Button disabled={!canContinue1} onClick={() => setStep(2)}>Next</Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Mode</h2>
            <div className="grid gap-3 md:grid-cols-3">
              {MODES.map((m) => {
                const selected = mode === m.value;
                return (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setMode(m.value)}
                    aria-pressed={selected}
                    className={`text-left p-4 rounded-lg border-2 transition ${
                      selected
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-secondary-200 dark:border-secondary-700 hover:border-secondary-400'
                    }`}
                  >
                    <div className="font-semibold">{m.label}</div>
                    <div className="text-xs text-secondary-600 dark:text-secondary-400 mt-1">{m.hint}</div>
                  </button>
                );
              })}
            </div>
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
              <Button disabled={!canContinue2} onClick={() => setStep(3)}>Next</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Template</h2>
            {loadingTemplates ? (
              <p className="text-sm text-secondary-500 dark:text-secondary-400">Loading templates…</p>
            ) : templatesError ? (
              <p className="text-sm text-error-600 dark:text-error-400">
                Failed to load templates. Check that the agent builder backend is reachable.
              </p>
            ) : templateIds.length === 0 ? (
              <p className="text-sm text-secondary-500 dark:text-secondary-400">
                No templates are available from the backend yet.
              </p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {templateIds.map((id) => {
                  const copy = getTemplateCopy(id);
                  const selected = templateId === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setTemplateId(id)}
                      aria-pressed={selected}
                      className={`text-left p-4 rounded-lg border-2 transition ${
                        selected
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-secondary-200 dark:border-secondary-700 hover:border-secondary-400'
                      }`}
                    >
                      <div className="font-semibold">{copy.title}</div>
                      <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-1">{copy.description}</p>
                      <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-2 italic">{copy.useCase}</p>
                      <div className="mt-3 flex flex-wrap gap-1">
                        {copy.nodeTypes.map((nt) => (
                          <span key={nt} className="px-2 py-0.5 rounded text-xs bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300">
                            {nt}
                          </span>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
              <Button disabled={!canSubmit || createAgent.isPending} onClick={submit}>
                {createAgent.isPending ? 'Creating…' : 'Create agent'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Stepper({ step }: { step: number }) {
  const steps = ['Basics', 'Mode', 'Template'];
  return (
    <div role="list" className="flex items-center gap-2 text-xs">
      {steps.map((label, idx) => {
        const n = idx + 1;
        const active = n === step;
        const done = n < step;
        return (
          <div key={label} role="listitem" className="flex items-center gap-2">
            <div
              aria-current={active ? 'step' : undefined}
              className={`w-6 h-6 rounded-full flex items-center justify-center font-semibold ${
                active ? 'bg-primary-500 text-white' :
                done ? 'bg-success-500 text-white' :
                'bg-secondary-200 dark:bg-secondary-700 text-secondary-600 dark:text-secondary-300'
              }`}
            >
              <span aria-hidden={done ? 'true' : undefined}>{n}</span>
              {done && <span className="sr-only"> (completed)</span>}
            </div>
            <span className={active ? 'font-medium' : 'text-secondary-500 dark:text-secondary-400'}>{label}</span>
            {n < steps.length && <div className="w-8 h-px bg-secondary-300 dark:bg-secondary-700" />}
          </div>
        );
      })}
    </div>
  );
}
