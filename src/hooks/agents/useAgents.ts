import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { agentsApi } from '@/lib/api/agents';
import { authService } from '@/lib/auth';
import { useAuth } from '@/hooks/useAuth';
import type {
  AgentCreateInput, AgentUpdateInput, PublishInput, RunInput,
} from '@/types/agents';
import { AGENT_QUERY_KEYS } from './useTemplates';

const hasAuth = () => !!authService.getAccessToken();

export const useAgents = () => {
  const { user } = useAuth();
  const orgId = user?.org_id || '';
  return useQuery({
    queryKey: AGENT_QUERY_KEYS.agents(orgId),
    queryFn: () => agentsApi.list(),
    enabled: !!orgId && hasAuth(),
    staleTime: 30 * 1000,
  });
};

export const useAgent = (agentId: string | undefined) => {
  const { user } = useAuth();
  const orgId = user?.org_id || '';
  return useQuery({
    queryKey: AGENT_QUERY_KEYS.agent(orgId, agentId || ''),
    queryFn: () => agentsApi.get(agentId as string),
    enabled: !!orgId && !!agentId && hasAuth(),
  });
};

export const useAgentVersions = (agentId: string | undefined) => {
  const { user } = useAuth();
  const orgId = user?.org_id || '';
  return useQuery({
    queryKey: AGENT_QUERY_KEYS.versions(orgId, agentId || ''),
    queryFn: () => agentsApi.listVersions(agentId as string),
    enabled: !!orgId && !!agentId && hasAuth(),
  });
};

export const useCreateAgent = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  const orgId = user?.org_id || '';
  return useMutation({
    mutationFn: (input: AgentCreateInput) => agentsApi.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: AGENT_QUERY_KEYS.agents(orgId) }),
  });
};

export const useUpdateAgent = (agentId: string) => {
  const qc = useQueryClient();
  const { user } = useAuth();
  const orgId = user?.org_id || '';
  return useMutation({
    mutationFn: (input: AgentUpdateInput) => agentsApi.update(agentId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: AGENT_QUERY_KEYS.agents(orgId) });
      qc.invalidateQueries({ queryKey: AGENT_QUERY_KEYS.agent(orgId, agentId) });
    },
  });
};

export const useDeleteAgent = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  const orgId = user?.org_id || '';
  return useMutation({
    mutationFn: (agentId: string) => agentsApi.remove(agentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: AGENT_QUERY_KEYS.agents(orgId) }),
  });
};

export const usePublishAgent = (agentId: string) => {
  const qc = useQueryClient();
  const { user } = useAuth();
  const orgId = user?.org_id || '';
  return useMutation({
    mutationFn: (input: PublishInput) => agentsApi.publish(agentId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: AGENT_QUERY_KEYS.agent(orgId, agentId) });
      qc.invalidateQueries({ queryKey: AGENT_QUERY_KEYS.versions(orgId, agentId) });
      qc.invalidateQueries({ queryKey: AGENT_QUERY_KEYS.agents(orgId) });
    },
  });
};

export const useDryRun = (agentId: string) =>
  useMutation({
    mutationFn: (input: RunInput) => agentsApi.dryRun(agentId, input),
  });
