import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { runsApi } from '@/lib/api/agents';
import { authService } from '@/lib/auth';
import { useAuth } from '@/hooks/useAuth';
import type { AgentRun, RunInput } from '@/types/agents';
import { AGENT_QUERY_KEYS } from './useTemplates';
import { useAgentVersions } from './useAgents';

const hasAuth = () => !!authService.getAccessToken();

export const useRuns = () => {
  const { user } = useAuth();
  const orgId = user?.org_id || '';
  return useQuery({
    queryKey: AGENT_QUERY_KEYS.runs(orgId),
    queryFn: () => runsApi.list(),
    enabled: !!orgId && hasAuth(),
    staleTime: 10 * 1000,
  });
};

export const useRun = (runId: string | undefined) => {
  const { user } = useAuth();
  const orgId = user?.org_id || '';
  return useQuery({
    queryKey: AGENT_QUERY_KEYS.run(orgId, runId || ''),
    queryFn: () => runsApi.get(runId as string),
    enabled: !!orgId && !!runId && hasAuth(),
  });
};

export const useCreateRun = (agentId: string) => {
  const qc = useQueryClient();
  const { user } = useAuth();
  const orgId = user?.org_id || '';
  return useMutation({
    mutationFn: (input: RunInput) => runsApi.create(agentId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: AGENT_QUERY_KEYS.runs(orgId) }),
  });
};

/**
 * Client-side filter: org-wide runs narrowed to the given agent's versions.
 * Backend has no per-agent runs endpoint today.
 */
export const useRunsForAgent = (agentId: string | undefined) => {
  const runsQuery = useRuns();
  const versionsQuery = useAgentVersions(agentId);

  const runs = useMemo<AgentRun[]>(() => {
    if (!runsQuery.data || !versionsQuery.data) return [];
    const versionIds = new Set(versionsQuery.data.map((v) => v.id));
    return runsQuery.data.filter((r) => versionIds.has(r.agentVersionId));
  }, [runsQuery.data, versionsQuery.data]);

  return {
    data: runs,
    isLoading: runsQuery.isLoading || versionsQuery.isLoading,
    error: runsQuery.error || versionsQuery.error,
    refetch: runsQuery.refetch,
  };
};
