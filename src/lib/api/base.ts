/**
 * Main API Client (port 8000)
 * Uses the centralized client factory for consistent behavior
 */

import { AxiosInstance } from 'axios';
import { createApiClient, MAIN_API_CONFIG, ApiClientConfig } from './client-factory';
import { getBrowserApiBaseUrl, isUsingLocalProxy, API_LOCAL_PROXY_PATH } from '@/lib/config';
import { TIMEOUTS } from '@/lib/constants';

// Determine the correct base URL based on environment
const API_BASE_URL =
  typeof window === 'undefined' ? MAIN_API_CONFIG.baseURL : getBrowserApiBaseUrl();
const usingLocalProxy = typeof window !== 'undefined' ? isUsingLocalProxy() : false;

if (usingLocalProxy) {
  console.log('🔁 API client using local proxy:', API_LOCAL_PROXY_PATH);
}

// Create the main API config with the correct base URL
const mainApiConfig: ApiClientConfig = {
  ...MAIN_API_CONFIG,
  baseURL: API_BASE_URL,
  timeout: TIMEOUTS.BASE_API,
};

// Create main API instance using the factory
const api: AxiosInstance = createApiClient(mainApiConfig);

export default api;
export type { AxiosInstance };
