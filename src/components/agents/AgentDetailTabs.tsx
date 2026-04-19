'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
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

const tabId = (t: TabName) => `agent-tab-${t.toLowerCase()}`;
const panelId = (t: TabName) => `agent-panel-${t.toLowerCase()}`;

const isTabName = (v: string | null): v is TabName =>
  v === 'Overview' || v === 'Graph' || v === 'Runs';

export default function AgentDetailTabs({ agent }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlTab = searchParams.get('tab');
  const tab: TabName = isTabName(urlTab) ? urlTab : 'Overview';

  const setTab = (next: TabName) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', next);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div>
      <div className="border-b border-secondary-200 dark:border-secondary-700 mb-5">
        <nav role="tablist" aria-label="Agent sections" className="flex gap-6">
          {TABS.map((t) => {
            const selected = tab === t;
            return (
              <button
                key={t}
                type="button"
                role="tab"
                id={tabId(t)}
                aria-selected={selected}
                aria-controls={panelId(t)}
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
      <div role="tabpanel" id={panelId(tab)} aria-labelledby={tabId(tab)}>
        {tab === 'Overview' && <AgentOverviewPanel agent={agent} />}
        {tab === 'Graph' && <GraphTabPanel agent={agent} />}
        {tab === 'Runs' && <RunsTabPanel agent={agent} />}
      </div>
    </div>
  );
}
