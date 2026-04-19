import agentApi from '@/lib/api/agent-base';
import type { TemplateListResponse } from '@/types/agents';

export const templatesApi = {
  async list(): Promise<string[]> {
    const { data } = await agentApi.get<TemplateListResponse>('/api/v1/templates/');
    return data.items ?? [];
  },
};
