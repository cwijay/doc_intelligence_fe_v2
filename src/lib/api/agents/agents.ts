import agentApi from '@/lib/api/agent-base';
import type {
  AgentCreateInput, AgentDefinition, AgentDefinitionWire,
  AgentUpdateInput, AgentVersion, AgentVersionWire,
  DryRunResult, DryRunResultWire,
  PublishInput, RunInput,
} from '@/types/agents';
import { normalizeAgent, normalizeDryRun, normalizeVersion, toUpdateWire } from './normalize';

const toDraftPayload = (templateId: string) => ({
  goal: { agent_type: templateId },
});

export const agentsApi = {
  async list(): Promise<AgentDefinition[]> {
    const { data } = await agentApi.get<AgentDefinitionWire[]>('/api/v1/agents/');
    return data.map(normalizeAgent);
  },

  async get(agentId: string): Promise<AgentDefinition> {
    const { data } = await agentApi.get<AgentDefinitionWire>(`/api/v1/agents/${agentId}`);
    return normalizeAgent(data);
  },

  async create(input: AgentCreateInput): Promise<AgentDefinition> {
    const body = {
      name: input.name,
      description: input.description ?? null,
      mode: input.mode,
      draft_payload: toDraftPayload(input.templateId),
    };
    const { data } = await agentApi.post<AgentDefinitionWire>('/api/v1/agents/', body);
    return normalizeAgent(data);
  },

  async update(agentId: string, input: AgentUpdateInput): Promise<AgentDefinition> {
    const { data } = await agentApi.patch<AgentDefinitionWire>(
      `/api/v1/agents/${agentId}`,
      toUpdateWire(input),
    );
    return normalizeAgent(data);
  },

  async remove(agentId: string): Promise<void> {
    await agentApi.delete(`/api/v1/agents/${agentId}`);
  },

  async publish(agentId: string, input: PublishInput): Promise<AgentVersion> {
    const { data } = await agentApi.post<AgentVersionWire>(
      `/api/v1/agents/${agentId}/publish`,
      { publish_notes: input.publishNotes ?? null },
    );
    return normalizeVersion(data);
  },

  async listVersions(agentId: string): Promise<AgentVersion[]> {
    const { data } = await agentApi.get<AgentVersionWire[]>(
      `/api/v1/agents/${agentId}/versions`,
    );
    return data.map(normalizeVersion);
  },

  async dryRun(agentId: string, input: RunInput): Promise<DryRunResult> {
    const { data } = await agentApi.post<DryRunResultWire>(
      `/api/v1/agents/${agentId}/dry-run`,
      { input_payload: input.inputPayload, dry_run: true },
    );
    return normalizeDryRun(data);
  },
};
