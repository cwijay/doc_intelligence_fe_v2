/**
 * AI API Client (port 8001)
 * Uses the centralized client factory for consistent behavior
 */

import { AxiosInstance } from 'axios';
import { createApiClient, AI_API_CONFIG } from './client-factory';
import { clientConfig } from '../config';

console.log('🤖 AI API client configured for:', clientConfig.aiApiBaseUrl);

// Create AI API instance using the factory
const aiApi: AxiosInstance = createApiClient(AI_API_CONFIG);

export default aiApi;
export type { AxiosInstance };
