'use client';

import { useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import GraphPreview from './GraphPreview';
import { useAgentVersions, useDryRun } from '@/hooks/agents';
import type { AgentDefinition, GraphSpec } from '@/types/agents';

interface Props {
  agent: AgentDefinition;
}

export default function GraphTabPanel({ agent }: Props) {
  const { data: versions = [] } = useAgentVersions(agent.id);
  const dryRun = useDryRun(agent.id);
  const publishedSpec: GraphSpec | undefined = versions[0]?.graphSpec;

  const mutateRef = useRef(dryRun.mutate);
  useEffect(() => { mutateRef.current = dryRun.mutate; });

  useEffect(() => {
    if (!publishedSpec && !dryRun.data && !dryRun.isPending && !dryRun.error) {
      mutateRef.current({ inputPayload: {} });
    }
  }, [publishedSpec, dryRun.data, dryRun.isPending, dryRun.error]);

  const spec = publishedSpec ?? dryRun.data?.graphSpec;

  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-secondary-600 dark:text-secondary-400 uppercase">
            Compiled graph
          </h3>
          {publishedSpec ? (
            <span className="text-xs text-secondary-500 dark:text-secondary-400">
              Showing latest published version
            </span>
          ) : (
            <span className="text-xs text-secondary-500 dark:text-secondary-400">
              Preview compiled from current draft (dry-run)
            </span>
          )}
        </div>
        {spec ? (
          <GraphPreview spec={spec} />
        ) : dryRun.error ? (
          <p className="text-sm text-error-600 dark:text-error-400">
            Could not compile graph: {dryRun.error instanceof Error ? dryRun.error.message : 'unknown error'}
          </p>
        ) : (
          <p className="text-sm text-secondary-500 dark:text-secondary-400">Compiling…</p>
        )}
      </CardContent>
    </Card>
  );
}
