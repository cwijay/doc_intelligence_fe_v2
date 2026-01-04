/**
 * AI API Client (port 8001)
 * Uses the centralized client factory for consistent behavior
 * Uses local proxy (/api/ai) in development to avoid CORS issues
 */

import { AxiosInstance } from 'axios';
import { createApiClient, getAiApiConfig } from './client-factory';
import { getBrowserAiApiBaseUrl } from '@/lib/config';

// Get config with proxy-aware URL
const config = getAiApiConfig();
console.log('🤖 AI API client configured for:', config.baseURL);

// Create AI API instance using the factory
const aiApi: AxiosInstance = createApiClient(config);

export default aiApi;
export { getBrowserAiApiBaseUrl };
export type { AxiosInstance };
