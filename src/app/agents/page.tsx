'use client';

import Link from 'next/link';
import { PlusIcon, CpuChipIcon } from '@heroicons/react/24/outline';
import { AppLayout } from '@/components/layout';
import AuthGuard from '@/components/guards/AuthGuard';
import Button from '@/components/ui/Button';
import { AgentList } from '@/components/agents';

export default function AgentsPage() {
  return (
    <AuthGuard>
      <AppLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-poppins font-bold text-secondary-900 dark:text-secondary-100 flex items-center gap-2">
                <CpuChipIcon className="w-7 h-7 text-primary-500" />
                Agents
              </h1>
              <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">
                Build, publish, and run AI agents for your organization.
              </p>
            </div>
            <Link href="/agents/new">
              <Button icon={<PlusIcon className="w-4 h-4" />}>New Agent</Button>
            </Link>
          </div>
          <AgentList />
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
