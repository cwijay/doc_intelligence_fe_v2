'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { AppLayout } from '@/components/layout';
import AuthGuard from '@/components/guards/AuthGuard';
import { useAgent } from '@/hooks/agents';
import { DryRunPanel } from '@/components/agents';

export default function DryRunPage({ params }: { params: Promise<{ agentId: string }> }) {
  const { agentId } = use(params);
  return (
    <AuthGuard>
      <AppLayout>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
          <Link href={`/agents/${agentId}`} className="inline-flex items-center gap-1 text-sm text-secondary-600 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400">
            <ArrowLeftIcon className="w-4 h-4" /> Back to agent
          </Link>
          <Header agentId={agentId} />
          <DryRunPanel agentId={agentId} />
        </div>
      </AppLayout>
    </AuthGuard>
  );
}

function Header({ agentId }: { agentId: string }) {
  const { data: agent } = useAgent(agentId);
  return (
    <div>
      <h1 className="text-2xl font-poppins font-bold text-secondary-900 dark:text-secondary-100">
        Dry run {agent ? `— ${agent.name}` : ''}
      </h1>
      <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">
        Compile the current draft and run it without creating a real run record.
      </p>
    </div>
  );
}
