import { useQuery } from '@tanstack/react-query';
import { templatesApi } from '@/lib/api/agents';

export const AGENT_QUERY_KEYS = {
  templates: ['agent-templates'] as const,
  agents: (orgId: string) => ['agents', orgId] as const,
  agent: (orgId: string, id: string) => ['agents', orgId, id] as const,
  versions: (orgId: string, id: string) => ['agents', orgId, id, 'versions'] as const,
  runs: (orgId: string) => ['agent-runs', orgId] as const,
  run: (orgId: string, id: string) => ['agent-runs', orgId, id] as const,
};

export const useTemplates = (enabled = true) =>
  useQuery({
    queryKey: AGENT_QUERY_KEYS.templates,
    queryFn: () => templatesApi.list(),
    staleTime: 60 * 60 * 1000, // 1 hour — the template set is static
    enabled,
  });
