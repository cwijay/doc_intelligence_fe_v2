/**
 * API Client Factory
 * Provides centralized axios client creation with shared interceptor logic
 * Eliminates duplication across base.ts, ai-base.ts, and ingestion/clients.ts
 */

import axios, { AxiosInstance, AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { authService } from '../auth';
import { clientConfig } from '../config';
import { HEADERS, TIMEOUTS } from '../constants';
import { normalizeErrorMessage, createErrorMessage } from './utils/error-utils';

// =============================================================================
// TYPES
// =============================================================================

export interface ApiClientConfig {
  /** Base URL for the API */
  baseURL: string;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Service name for logging (e.g., 'Main', 'AI', 'Ingestion', 'RAG') */
  serviceName: string;
  /** Whether to include organization ID header */
  includeOrgHeader?: boolean;
  /** Whether to enable debug logging (defaults to isDevelopment) */
  debugLogging?: boolean;
  /** Custom error message overrides by status code */
  errorMessages?: Partial<Record<number, string>>;
  /** Whether to dispatch auth:unauthorized event on 401 */
  handleUnauthorized?: boolean;
  /** Whether to pass through 409 Conflict errors */
  passThrough409?: boolean;
}

export interface ApiClientOptions {
  /** Skip authentication for this client */
  skipAuth?: boolean;
}

// =============================================================================
// ERROR MESSAGE DEFAULTS
// =============================================================================

const DEFAULT_ERROR_MESSAGES: Record<number, string> = {
  400: 'Bad request. Please check your input and try again.',
  401: 'Your session has expired. Please log in again.',
  403: 'Access forbidden. You do not have permission to perform this action.',
  404: 'Resource not found. The requested item may have been deleted or moved.',
  409: 'Conflict. The resource already exists or conflicts with current state.',
  413: 'Request too large. Please reduce the size and try again.',
  422: 'Validation error. Please check your input and try again.',
  429: 'Rate limit exceeded. Please wait before trying again.',
  500: 'Internal server error. Please try again later or contact support.',
  502: 'Bad gateway. The server is temporarily unavailable.',
  503: 'Service unavailable. Please try again later.',
  504: 'Gateway timeout. The server took too long to respond.',
};

// =============================================================================
// INTERCEPTOR HELPERS
// =============================================================================

/**
 * Create request interceptor for authentication and logging
 */
function createRequestInterceptor(config: ApiClientConfig) {
  return (requestConfig: InternalAxiosRequestConfig) => {
    // Add authentication headers if auth is enabled
    if (clientConfig.authEnabled) {
      const token = authService.getAccessToken();
      if (token) {
        requestConfig.headers.Authorization = `${HEADERS.AUTH_SCHEME} ${token}`;
      }

      // Add organization ID header if configured
      if (config.includeOrgHeader !== false) {
        const user = authService.getUser();
        if (user?.org_id) {
          requestConfig.headers[HEADERS.ORG_ID] = user.org_id;
        }
      }
    }

    // Debug logging
    if (config.debugLogging ?? clientConfig.isDevelopment) {
      const emoji = getServiceEmoji(config.serviceName);
      console.log(`${emoji} ${config.serviceName} API Request:`, {
        method: requestConfig.method?.toUpperCase(),
        url: requestConfig.url,
        baseURL: requestConfig.baseURL,
        hasAuth: !!requestConfig.headers.Authorization,
        hasOrgId: !!requestConfig.headers[HEADERS.ORG_ID],
      });
    }

    return requestConfig;
  };
}

/**
 * Create request error handler
 */
function createRequestErrorHandler(config: ApiClientConfig) {
  return (error: unknown) => {
    console.error(`🚫 ${config.serviceName} API Request Error:`, error);
    return Promise.reject(error);
  };
}

/**
 * Create response success handler
 */
function createResponseSuccessHandler(config: ApiClientConfig) {
  return (response: AxiosResponse) => {
    if (config.debugLogging ?? clientConfig.isDevelopment) {
      const emoji = getServiceEmoji(config.serviceName);
      console.log(`✅ ${config.serviceName} API Response:`, {
        status: response.status,
        url: response.config.url,
      });
    }
    return response;
  };
}

/**
 * Create response error handler
 */
function createResponseErrorHandler(config: ApiClientConfig) {
  return async (error: AxiosError) => {
    const errorMessages = { ...DEFAULT_ERROR_MESSAGES, ...config.errorMessages };

    // Handle 401 unauthorized responses
    if (error.response?.status === 401 && config.handleUnauthorized !== false) {
      const isAuthEndpoint = error.config?.url?.includes('/auth/login') ||
        error.config?.url?.includes('/auth/register') ||
        error.config?.url?.includes('/auth/refresh');

      if (!isAuthEndpoint && typeof window !== 'undefined') {
        console.log('🚫 401 Unauthorized - triggering automatic logout...');
        window.dispatchEvent(new CustomEvent('auth:unauthorized', {
          detail: { reason: '401_response', timestamp: new Date().toISOString() }
        }));
      }
    }

    // Pass through 409 Conflict errors if configured (for duplicate file detection)
    if (error.response?.status === 409 && config.passThrough409) {
      console.log('🔄 409 Conflict detected - passing through for duplicate handling');
      return Promise.reject(error);
    }

    // Log error details
    const errorDetails = {
      message: error.message || 'No message',
      code: error.code || 'UNKNOWN_CODE',
      status: error.response?.status ?? 'No status',
      statusText: error.response?.statusText || '',
      data: error.response?.data || null,
      url: error.config?.url || 'Unknown URL',
      method: error.config?.method?.toUpperCase() || 'UNKNOWN'
    };
    console.error(`❌ ${config.serviceName} API Error:`, JSON.stringify(errorDetails, null, 2));

    // Determine error message
    let errorMessage = 'Unknown API error';

    if (error.response) {
      // Try to extract message from response data
      const normalizedMessage = normalizeErrorMessage(error.response.data);
      if (normalizedMessage && normalizedMessage !== 'An unexpected error occurred') {
        errorMessage = normalizedMessage;
      } else {
        // Use status code based message
        const status = error.response.status;
        errorMessage = errorMessages[status] ||
          `${config.serviceName} API error (${status}): ${error.response.statusText || 'Unknown error'}`;
      }
    } else {
      // Network or other errors
      errorMessage = createErrorMessage(error);
    }

    // Create enhanced error with preserved properties
    const apiError = new Error(errorMessage);
    if (error.response) (apiError as any).response = error.response;
    if (error.config) (apiError as any).config = error.config;
    if (error.code) (apiError as any).code = error.code;
    if (error.request) (apiError as any).request = error.request;

    return Promise.reject(apiError);
  };
}

/**
 * Get emoji for service logging
 */
function getServiceEmoji(serviceName: string): string {
  const emojiMap: Record<string, string> = {
    'Main': '🔗',
    'AI': '🤖',
    'Ingestion': '📥',
    'RAG': '🔍',
  };
  return emojiMap[serviceName] || '📡';
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

/**
 * Create an axios instance with standardized interceptors
 */
export function createApiClient(config: ApiClientConfig): AxiosInstance {
  const client = axios.create({
    baseURL: config.baseURL,
    timeout: config.timeout || TIMEOUTS.BASE_API,
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: false,
  });

  // Add request interceptors
  client.interceptors.request.use(
    createRequestInterceptor(config),
    createRequestErrorHandler(config)
  );

  // Add response interceptors
  client.interceptors.response.use(
    createResponseSuccessHandler(config),
    createResponseErrorHandler(config)
  );

  return client;
}

// =============================================================================
// PRE-CONFIGURED CLIENTS (for migration convenience)
// =============================================================================

/**
 * Configuration for the main API client (port 8000)
 */
export const MAIN_API_CONFIG: ApiClientConfig = {
  baseURL: clientConfig.apiUrl,
  timeout: TIMEOUTS.BASE_API,
  serviceName: 'Main',
  handleUnauthorized: true,
  passThrough409: true,
};

/**
 * Configuration for the AI API client (port 8001)
 */
export const AI_API_CONFIG: ApiClientConfig = {
  baseURL: clientConfig.aiApiBaseUrl,
  timeout: TIMEOUTS.AI_API,
  serviceName: 'AI',
  includeOrgHeader: true,
  errorMessages: {
    404: 'Document not found or not yet ingested.',
    429: 'Rate limit exceeded. Please wait before trying again.',
    500: 'AI service error. Please try again later.',
  },
};

/**
 * Configuration for the Ingestion API client
 */
export const INGESTION_API_CONFIG: ApiClientConfig = {
  baseURL: clientConfig.ingestApiUrl,
  timeout: TIMEOUTS.AI_API,
  serviceName: 'Ingestion',
  includeOrgHeader: true,
  errorMessages: {
    413: 'Document too large for ingestion.',
  },
};

/**
 * Configuration for the RAG API client
 */
export const RAG_API_CONFIG: ApiClientConfig = {
  baseURL: clientConfig.aiApiBaseUrl,
  timeout: TIMEOUTS.RAG_API,
  serviceName: 'RAG',
  includeOrgHeader: true,
};
