'use client';

import Link from 'next/link';
import { TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import Button from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { useAgents, useDeleteAgent } from '@/hooks/agents';
import toast from 'react-hot-toast';

export default function AgentList() {
  const { data: agents = [], isLoading, error } = useAgents();
  const deleteAgent = useDeleteAgent();

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete agent "${name}"? This cannot be undone.`)) return;
    try {
      await deleteAgent.mutateAsync(id);
      toast.success('Agent deleted');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Delete failed');
    }
  };

  if (isLoading) {
    return <Card><CardContent className="p-6 text-sm text-secondary-500">Loading agents…</CardContent></Card>;
  }
  if (error) {
    return <Card><CardContent className="p-6 text-sm text-error-600">Failed to load agents.</CardContent></Card>;
  }

  if (agents.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <h3 className="text-lg font-semibold text-secondary-800 dark:text-secondary-200 mb-2">
            No agents yet
          </h3>
          <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-6">
            Create an agent from a template to get started.
          </p>
          <Link href="/agents/new">
            <Button icon={<PlusIcon className="w-4 h-4" />}>New Agent</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-secondary-50 dark:bg-secondary-900 text-xs uppercase text-secondary-500">
            <tr>
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Mode</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Updated</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary-200 dark:divide-secondary-700">
            {agents.map((a) => (
              <tr key={a.id} className="hover:bg-secondary-50 dark:hover:bg-secondary-900/50">
                <td className="px-4 py-3">
                  <Link href={`/agents/${a.id}`} className="font-medium text-primary-600 dark:text-primary-400 hover:underline">
                    {a.name}
                  </Link>
                  {a.description && (
                    <p className="text-xs text-secondary-500 mt-0.5 line-clamp-1">{a.description}</p>
                  )}
                </td>
                <td className="px-4 py-3 capitalize">{a.mode}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                    a.status === 'published'
                      ? 'bg-success-100 text-success-700 dark:bg-success-900/40 dark:text-success-300'
                      : 'bg-secondary-100 text-secondary-700 dark:bg-secondary-800 dark:text-secondary-300'
                  }`}>
                    {a.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-secondary-600 dark:text-secondary-400">
                  {format(new Date(a.updatedAt), 'PP')}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => handleDelete(a.id, a.name)}
                    aria-label={`Delete agent ${a.name}`}
                    className="p-1.5 rounded hover:bg-error-50 dark:hover:bg-error-900/30 text-secondary-500 hover:text-error-600"
                  >
                    <TrashIcon className="w-4 h-4" aria-hidden="true" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
