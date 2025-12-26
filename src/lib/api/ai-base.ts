import axios, { AxiosInstance } from 'axios';
import { clientConfig } from '../config';
import { authService } from '../auth';

// AI API configuration (port 8001)
const AI_API_BASE_URL = clientConfig.aiApiBaseUrl;

console.log('🤖 AI API client configured for:', AI_API_BASE_URL);

// Create AI API instance for Document Intelligence API (port 8001)
const aiApi: AxiosInstance = axios.create({
  baseURL: AI_API_BASE_URL,
  timeout: 60000, // Longer timeout for AI operations
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth headers and logging
aiApi.interceptors.request.use(
  (config) => {
    // Add authentication headers if auth is enabled
    if (clientConfig.authEnabled) {
      const token = authService.getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Add organization ID header for multi-tenant isolation
      const user = authService.getUser();
      if (user?.org_id) {
        config.headers['X-Organization-ID'] = user.org_id;
      }
    }

    console.log(`🤖 AI API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('AI API Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor with error handling
aiApi.interceptors.response.use(
  (response) => {
    console.log(`✅ AI API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    let errorMessage = 'AI API error';

    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const data = error.response.data;

      if (data?.error) {
        errorMessage = data.error;
      } else if (status === 400) {
        errorMessage = 'Invalid request. Please check your parameters.';
      } else if (status === 404) {
        errorMessage = 'Document not found or not yet ingested.';
      } else if (status === 429) {
        errorMessage = 'Rate limit exceeded. Please wait before trying again.';
      } else if (status === 500) {
        errorMessage = 'AI service error. Please try again later.';
      } else {
        errorMessage = `AI API error (${status}): ${error.response.statusText || 'Unknown error'}`;
      }
    } else if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED') {
      errorMessage = `Cannot reach AI API server at ${AI_API_BASE_URL}. Please ensure the service is running.`;
    } else if (error.request) {
      errorMessage = 'No response from AI service. Please check your connection.';
    } else if (error.message) {
      errorMessage = error.message;
    }

    console.error('❌ AI API Error:', errorMessage);

    const apiError = new Error(errorMessage);
    if (error.response) {
      (apiError as any).response = error.response;
    }
    if (error.code) {
      (apiError as any).code = error.code;
    }

    return Promise.reject(apiError);
  }
);

export default aiApi;
export type { AxiosInstance };
