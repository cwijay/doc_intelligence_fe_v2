'use client';

import { useState } from 'react';
import clsx from 'clsx';
import type { AgentDefinition } from '@/types/agents';
import AgentOverviewPanel from './AgentOverviewPanel';
import GraphTabPanel from './GraphTabPanel';
import RunsTabPanel from './RunsTabPanel';

interface Props {
  agent: AgentDefinition;
}

const TABS = ['Overview', 'Graph', 'Runs'] as const;
type TabName = typeof TABS[number];

export default function AgentDetailTabs({ agent }: Props) {
  const [tab, setTab] = useState<TabName>('Overview');
  return (
    <div>
      <div role="tablist" aria-label="Agent sections" className="border-b border-secondary-200 dark:border-secondary-700 mb-5">
        <nav className="flex gap-6">
          {TABS.map((t) => {
            const selected = tab === t;
            return (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setTab(t)}
                className={clsx(
                  'py-3 text-sm font-medium border-b-2 transition',
                  selected
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-secondary-100',
                )}
              >
                {t}
              </button>
            );
          })}
        </nav>
      </div>
      <div role="tabpanel">
        {tab === 'Overview' && <AgentOverviewPanel agent={agent} />}
        {tab === 'Graph' && <GraphTabPanel agent={agent} />}
        {tab === 'Runs' && <RunsTabPanel agent={agent} />}
      </div>
    </div>
  );
}
