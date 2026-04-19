import agentApi from '@/lib/api/agent-base';
import type { AgentRun, AgentRunWire, RunInput } from '@/types/agents';
import { normalizeRun } from './normalize';

export const runsApi = {
  async create(agentId: string, input: RunInput): Promise<AgentRun> {
    const { data } = await agentApi.post<AgentRunWire>(
      `/api/v1/runs/${agentId}`,
      { input_payload: input.inputPayload, dry_run: false },
    );
    return normalizeRun(data);
  },

  async list(): Promise<AgentRun[]> {
    const { data } = await agentApi.get<AgentRunWire[]>('/api/v1/runs/');
    return data.map(normalizeRun);
  },

  async get(runId: string): Promise<AgentRun> {
    const { data } = await agentApi.get<AgentRunWire>(`/api/v1/runs/${runId}`);
    return normalizeRun(data);
  },
};
