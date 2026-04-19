'use client';

import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { AppLayout } from '@/components/layout';
import AuthGuard from '@/components/guards/AuthGuard';
import { AgentCreateWizard } from '@/components/agents';

export default function NewAgentPage() {
  return (
    <AuthGuard>
      <AppLayout>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href="/agents" className="inline-flex items-center gap-1 text-sm text-secondary-600 dark:text-secondary-400 hover:text-primary-600 mb-4">
            <ArrowLeftIcon className="w-4 h-4" /> Back to agents
          </Link>
          <h1 className="text-2xl font-poppins font-bold text-secondary-900 dark:text-secondary-100 mb-6">
            New agent
          </h1>
          <AgentCreateWizard />
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
