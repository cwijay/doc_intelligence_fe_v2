'use client';

import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/Card';
import { useAgentVersions } from '@/hooks/agents';
import { getTemplateCopy } from '@/lib/agents/template-copy';
import type { AgentDefinition } from '@/types/agents';

interface Props {
  agent: AgentDefinition;
}

const extractTemplateId = (payload: Record<string, unknown>): string | null => {
  const goal = payload.goal as Record<string, unknown> | undefined;
  const id = goal?.agent_type;
  return typeof id === 'string' ? id : null;
};

export default function AgentOverviewPanel({ agent }: Props) {
  const { data: versions = [], isLoading: loadingVersions } = useAgentVersions(agent.id);
  const templateId = extractTemplateId(agent.draftPayload);
  const template = templateId ? getTemplateCopy(templateId) : null;
  const latestVersion = versions[0];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardContent className="p-5 space-y-3">
          <h3 className="text-sm font-semibold text-secondary-600 dark:text-secondary-400 uppercase">Metadata</h3>
          <dl className="text-sm space-y-2">
            <Row label="ID" value={<span className="font-mono text-xs break-all">{agent.id}</span>} />
            <Row label="Mode" value={<span className="capitalize">{agent.mode}</span>} />
            <Row label="Status" value={agent.status} />
            <Row label="Created" value={format(new Date(agent.createdAt), 'PP p')} />
            <Row label="Updated" value={format(new Date(agent.updatedAt), 'PP p')} />
            {agent.description && <Row label="Description" value={agent.description} />}
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-3">
          <h3 className="text-sm font-semibold text-secondary-600 dark:text-secondary-400 uppercase">Template</h3>
          {template ? (
            <>
              <div className="font-semibold">{template.title}</div>
              <p className="text-sm text-secondary-600 dark:text-secondary-400">{template.description}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {template.nodeTypes.map((nt) => (
                  <span key={nt} className="px-2 py-0.5 rounded text-xs bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300">
                    {nt}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-secondary-500 dark:text-secondary-400">No template recorded in draft payload.</p>
          )}
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold text-secondary-600 dark:text-secondary-400 uppercase mb-3">Latest version</h3>
          {loadingVersions ? (
            <p className="text-sm text-secondary-500 dark:text-secondary-400">Loading…</p>
          ) : latestVersion ? (
            <div className="text-sm space-y-1">
              <div>Version <span className="font-medium">#{latestVersion.versionNumber}</span></div>
              <div className="text-secondary-600 dark:text-secondary-400">Published {format(new Date(latestVersion.createdAt), 'PP p')}</div>
              {latestVersion.publishNotes && (
                <p className="mt-2 text-secondary-700 dark:text-secondary-300 italic">&ldquo;{latestVersion.publishNotes}&rdquo;</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-secondary-500 dark:text-secondary-400">
              Not published yet. Use the <strong>Publish</strong> button to snapshot the current draft.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <dt className="w-24 text-secondary-500 dark:text-secondary-400">{label}</dt>
      <dd className="flex-1 text-secondary-800 dark:text-secondary-200">{value}</dd>
    </div>
  );
}
