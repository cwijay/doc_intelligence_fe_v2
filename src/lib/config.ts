/**
 * Centralized configuration for the Document Intelligence application
 *
 * Uses just 2 base URLs:
 * - NEXT_PUBLIC_API_URL: Main backend API (auth, documents, folders, etc.)
 * - NEXT_PUBLIC_AI_API_URL: AI services API (RAG, Excel chat, ingestion)
 */

// Base URLs from environment
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const AI_API_BASE = process.env.NEXT_PUBLIC_AI_API_URL || 'http://localhost:8001';

// API path constants
const API_PATHS = {
  // Main API paths
  api: '/api/v1',

  // AI API paths
  rag: '/api/v1/simple-rag',
  ingest: '/api/v1/ingest',
} as const;

// Client-side configuration (accessible in browser)
export const clientConfig = {
  // Main API
  apiBaseUrl: API_BASE,
  apiUrl: `${API_BASE}${API_PATHS.api}`,

  // AI API (RAG, Excel, Ingestion)
  aiApiBaseUrl: AI_API_BASE,
  excelApiUrl: AI_API_BASE,
  ragApiBaseUrl: AI_API_BASE,
  ragApiUrl: `${AI_API_BASE}${API_PATHS.rag}`,
  ingestApiBaseUrl: AI_API_BASE,
  ingestApiUrl: `${AI_API_BASE}${API_PATHS.ingest}`,

  // GCS Storage Configuration
  gcsBucketName: process.env.NEXT_PUBLIC_GCS_BUCKET_NAME || '',
  gcsBucketUrl: process.env.NEXT_PUBLIC_GCS_BUCKET_URL || 'https://storage.googleapis.com',

  // Authentication
  authEnabled: process.env.NEXT_PUBLIC_AUTH_ENABLED === 'true',

  // Application Information
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'Biz-To-Bricks',
  appVersion: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',

  // Session Configuration
  sessionTimeoutHours: parseInt(process.env.NEXT_PUBLIC_SESSION_TIMEOUT_HOURS || '12'),

  // Environment
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
} as const;

// Local proxy configuration
const LOCAL_PROXY_BASE_PATH = '/api/backend';

const shouldUseLocalProxy = (): boolean => {
  if (process.env.NEXT_PUBLIC_DISABLE_API_PROXY === 'true') {
    return false;
  }

  const forceProxy = process.env.NEXT_PUBLIC_USE_API_PROXY === 'true';

  if (typeof window === 'undefined') {
    return false;
  }

  if (forceProxy) {
    return true;
  }

  const hostname = window.location.hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1';
};

export const getBrowserApiBaseUrl = (): string => {
  if (shouldUseLocalProxy()) {
    return LOCAL_PROXY_BASE_PATH;
  }
  return clientConfig.apiUrl;
};

export const getBrowserApiOrigin = (): string => {
  if (shouldUseLocalProxy()) {
    return LOCAL_PROXY_BASE_PATH;
  }
  return clientConfig.apiBaseUrl;
};

export const isUsingLocalProxy = (): boolean => shouldUseLocalProxy();
export const API_LOCAL_PROXY_PATH = LOCAL_PROXY_BASE_PATH;

// Server-side configuration (only accessible in server components and API routes)
export const serverConfig = {
  // Main API
  apiBaseUrl: API_BASE,
  apiUrl: `${API_BASE}${API_PATHS.api}`,

  // AI API
  aiApiBaseUrl: AI_API_BASE,
  excelApiUrl: AI_API_BASE,
  ragApiBaseUrl: AI_API_BASE,
  ragApiUrl: `${AI_API_BASE}${API_PATHS.rag}`,
  ingestApiBaseUrl: AI_API_BASE,
  ingestApiUrl: `${AI_API_BASE}${API_PATHS.ingest}`,

  // Authentication
  authEnabled: process.env.NEXT_PUBLIC_AUTH_ENABLED === 'true',

  // Environment
  nodeEnv: process.env.NODE_ENV || 'development',
} as const;

// Utility functions for URL construction
export const getApiUrl = (path: string, isServer = false): string => {
  const baseUrl = isServer ? serverConfig.apiUrl : clientConfig.apiUrl;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${baseUrl}/${cleanPath}`;
};

export const getApiBaseUrl = (path: string, isServer = false): string => {
  const baseUrl = isServer ? serverConfig.apiBaseUrl : clientConfig.apiBaseUrl;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${baseUrl}/${cleanPath}`;
};


// Health check endpoints
export const endpoints = {
  health: '/health',
  status: '/status',
  ready: '/ready',
  live: '/live',
  metrics: '/metrics',
} as const;

// Validation function
export const validateConfig = (): void => {
  const requiredEnvVars = ['NEXT_PUBLIC_API_URL'];

  const missing = requiredEnvVars.filter((envVar) => !process.env[envVar]);

  if (missing.length > 0) {
    console.warn(
      `Warning: Missing environment variables: ${missing.join(', ')}\n` +
      'Using default values.'
    );
  }
};

// Development utilities
export const logConfigurationSummary = (): void => {
  if (clientConfig.isDevelopment) {
    console.log('Configuration:', {
      mainApi: clientConfig.apiBaseUrl,
      aiApi: clientConfig.aiApiBaseUrl,
      authEnabled: clientConfig.authEnabled,
    });
  }
};

// Expose dev utilities to window
if (typeof window !== 'undefined' && clientConfig.isDevelopment) {
  (window as any).__showConfig = () => {
    console.table({
      'Main API': clientConfig.apiBaseUrl,
      'AI API': clientConfig.aiApiBaseUrl,
      'RAG URL': clientConfig.ragApiUrl,
      'Ingest URL': clientConfig.ingestApiUrl,
      'Auth Enabled': clientConfig.authEnabled,
    });
  };

  (window as any).__runServiceDiagnostics = () => console.log('Service diagnostics not yet loaded');
  (window as any).__checkApiHealth = () => console.log('API health check not yet loaded');
}

// Export default
export default {
  client: clientConfig,
  server: serverConfig,
  getApiUrl,
  getApiBaseUrl,
  endpoints,
  validateConfig,
};
