/**
 * Service diagnostics and health check utilities
 */

import { clientConfig } from '@/lib/config';
import { authService } from '@/lib/auth';

export interface HealthCheckResult {
  healthy: boolean;
  endpoint: string | null;
  status: number | null;
}

export interface ServiceDiagnosticResult extends HealthCheckResult {
  name: string;
  url: string;
  port: string;
  description: string;
}

/**
 * Check if a service is healthy by trying common health endpoints
 */
export const checkServiceHealth = async (
  serviceUrl: string,
  serviceName: string
): Promise<HealthCheckResult> => {
  const healthEndpoints = ['/health', '/status', '/ready', '/', '/api/health'];

  for (const endpoint of healthEndpoints) {
    try {
      const response = await fetch(`${serviceUrl}${endpoint}`, {
        method: 'GET',
        mode: 'cors',
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        return { healthy: true, endpoint, status: response.status };
      }
    } catch {
      // Continue trying other endpoints
    }
  }

  return { healthy: false, endpoint: null, status: null };
};

/**
 * Run diagnostics on all configured services
 */
export const runServiceDiagnostics = async (): Promise<ServiceDiagnosticResult[]> => {
  const services = [
    {
      name: 'Document Intelligence API',
      url: clientConfig.apiBaseUrl,
      port: '8000',
      description: 'Main backend API for document management and authentication',
    },
    {
      name: 'Simple RAG API',
      url: clientConfig.ragApiBaseUrl,
      port: '8001',
      description: 'Fast RAG service for document Q&A',
    },
    {
      name: 'Excel Chat API',
      url: clientConfig.excelApiUrl,
      port: '8001',
      description: 'Excel document chat and analysis service',
    },
  ];

  const results: ServiceDiagnosticResult[] = [];

  for (const service of services) {
    const health = await checkServiceHealth(service.url, service.name);
    results.push({ ...service, ...health });
  }

  return results;
};

/**
 * Test API connection to the health endpoint
 */
export const testApiConnection = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    const baseUrl = clientConfig.apiBaseUrl;
    const normalizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const healthEndpoint = baseUrl.includes('/api/v1')
      ? baseUrl.replace('/api/v1', '/health')
      : `${normalizedBase}/health`;

    const response = await fetch(healthEndpoint, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache',
    });

    if (response.ok) {
      return { success: true };
    }
    return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
};

export interface SessionStatus {
  hasToken: boolean;
  isExpired: boolean;
  isValid: boolean;
  sessionInfo: ReturnType<typeof authService.getSessionDebugInfo>;
}

/**
 * Check current session authentication status
 */
export const checkSessionStatus = (): SessionStatus => {
  const token = authService.getAccessToken();

  return {
    hasToken: !!token,
    isExpired: authService.isAccessTokenExpired(),
    isValid: authService.isAuthenticated(),
    sessionInfo: authService.getSessionDebugInfo(),
  };
};
