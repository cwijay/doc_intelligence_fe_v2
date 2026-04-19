'use client';

import { use } from 'react';
import { AppLayout } from '@/components/layout';
import AuthGuard from '@/components/guards/AuthGuard';
import { Card, CardContent } from '@/components/ui/Card';
import { useAgent } from '@/hooks/agents';
import { AgentDetailHeader, AgentDetailTabs } from '@/components/agents';

interface Params {
  agentId: string;
}

export default function AgentDetailPage({ params }: { params: Promise<Params> }) {
  const { agentId } = use(params);
  return (
    <AuthGuard>
      <AppLayout>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AgentDetailInner agentId={agentId} />
        </div>
      </AppLayout>
    </AuthGuard>
  );
}

function AgentDetailInner({ agentId }: { agentId: string }) {
  const { data: agent, isLoading, error } = useAgent(agentId);

  if (isLoading) {
    return <Card><CardContent className="p-8 text-sm text-secondary-500 dark:text-secondary-400">Loading agent…</CardContent></Card>;
  }
  if (error || !agent) {
    return <Card><CardContent className="p-8 text-sm text-error-600 dark:text-error-400">Agent not found.</CardContent></Card>;
  }

  return (
    <div className="space-y-6">
      <AgentDetailHeader agent={agent} />
      <AgentDetailTabs agent={agent} />
    </div>
  );
}
