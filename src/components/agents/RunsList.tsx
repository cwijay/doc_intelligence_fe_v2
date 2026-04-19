'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Card } from '@/components/ui/Card';
import { useRunsForAgent } from '@/hooks/agents';
import type { AgentRun } from '@/types/agents';
import RunDetail from './RunDetail';

interface Props {
  agentId: string;
}

export default function RunsList({ agentId }: Props) {
  const { data: runs, isLoading, error } = useRunsForAgent(agentId);
  const [selected, setSelected] = useState<AgentRun | null>(null);

  if (isLoading) {
    return <Card><div className="p-6 text-sm text-secondary-500 dark:text-secondary-400">Loading runs…</div></Card>;
  }
  if (error) {
    return <Card><div className="p-6 text-sm text-error-600 dark:text-error-400">Failed to load runs.</div></Card>;
  }
  if (!runs || runs.length === 0) {
    return (
      <Card>
        <div className="p-8 text-center text-sm text-secondary-500 dark:text-secondary-400">
          No runs yet. Publish and run the agent to see results here.
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <div className="overflow-x-auto">
          <table aria-label="Agent runs" className="min-w-full text-sm">
            <thead className="bg-secondary-50 dark:bg-secondary-900 text-xs uppercase text-secondary-500">
              <tr>
                <th scope="col" className="text-left px-4 py-3">Run ID</th>
                <th scope="col" className="text-left px-4 py-3">Version</th>
                <th scope="col" className="text-left px-4 py-3">Status</th>
                <th scope="col" className="text-left px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-200 dark:divide-secondary-700">
              {runs.map((r) => (
                <tr
                  key={r.id}
                  tabIndex={0}
                  onClick={() => setSelected(r)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelected(r);
                    }
                  }}
                  className="hover:bg-secondary-50 dark:hover:bg-secondary-900/50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset"
                >
                  <td className="px-4 py-3 font-mono text-xs">{r.id.slice(0, 8)}…</td>
                  <td className="px-4 py-3 font-mono text-xs">{r.agentVersionId.slice(0, 8)}…</td>
                  <td className="px-4 py-3">
                    <StatusPill status={r.status} />
                  </td>
                  <td className="px-4 py-3 text-secondary-600 dark:text-secondary-400">
                    {format(new Date(r.createdAt), 'PP p')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      {selected && <RunDetail run={selected} onClose={() => setSelected(null)} />}
    </>
  );
}

function StatusPill({ status }: { status: AgentRun['status'] }) {
  const cls = ({
    pending: 'bg-secondary-100 text-secondary-700 dark:bg-secondary-800 dark:text-secondary-300',
    running: 'bg-warning-100 text-warning-700 dark:bg-warning-900/40 dark:text-warning-300',
    completed: 'bg-success-100 text-success-700 dark:bg-success-900/40 dark:text-success-300',
    failed: 'bg-error-100 text-error-700 dark:bg-error-900/40 dark:text-error-300',
  } as Record<string, string>)[status] ?? 'bg-secondary-100 text-secondary-700 dark:bg-secondary-800 dark:text-secondary-300';
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{status}</span>;
}
