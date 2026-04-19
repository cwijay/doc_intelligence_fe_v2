/**
 * Agent Builder API Client (port 8010)
 * Uses the centralized client factory for consistent behavior.
 * Uses local proxy (/api/agents-backend) in the browser to avoid CORS.
 */

import { AxiosInstance } from 'axios';
import { createApiClient, getAgentApiConfig } from './client-factory';
import { clientConfig } from '@/lib/config';

const config = getAgentApiConfig();
if (clientConfig.isDevelopment) {
  console.log('🧩 Agent API client configured for:', config.baseURL);
}

const agentApi: AxiosInstance = createApiClient(config);

export default agentApi;
