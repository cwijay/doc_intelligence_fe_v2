'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { PlayIcon, BeakerIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import type { AgentDefinition } from '@/types/agents';
import PublishPopover from './PublishPopover';
import RunDialog from './RunDialog';

interface Props {
  agent: AgentDefinition;
}

export default function AgentDetailHeader({ agent }: Props) {
  const [runOpen, setRunOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleRunSuccess = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', 'Runs');
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    setRunOpen(false);
  };

  return (
    <div className="space-y-3">
      <Link href="/agents" className="inline-flex items-center gap-1 text-sm text-secondary-600 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400">
        <ArrowLeftIcon className="w-4 h-4" /> Back to agents
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-poppins font-bold text-secondary-900 dark:text-secondary-100">
            {agent.name}
          </h1>
          <div className="flex items-center gap-2 mt-1.5 text-xs">
            <span className="px-2 py-0.5 rounded-full bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 capitalize">
              {agent.mode}
            </span>
            <span className={`px-2 py-0.5 rounded-full ${
              agent.status === 'published'
                ? 'bg-success-100 text-success-700 dark:bg-success-900/40 dark:text-success-300'
                : 'bg-warning-100 text-warning-700 dark:bg-warning-900/40 dark:text-warning-300'
            }`}>
              {agent.status}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/agents/${agent.id}/test`}>
            <Button variant="outline" icon={<BeakerIcon className="w-4 h-4" />}>Dry Run</Button>
          </Link>
          <PublishPopover agentId={agent.id} />
          {agent.status === 'published' && (
            <Button icon={<PlayIcon className="w-4 h-4" />} onClick={() => setRunOpen(true)}>
              Run
            </Button>
          )}
        </div>
      </div>
      <RunDialog agentId={agent.id} open={runOpen} onClose={() => setRunOpen(false)} onSuccess={handleRunSuccess} />
    </div>
  );
}
