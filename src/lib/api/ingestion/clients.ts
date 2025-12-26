/**
 * Axios clients for Ingestion and RAG APIs
 */
import axios from 'axios';
import { clientConfig } from '../../config';
import { authService } from '../../auth';
import { HEADERS } from '@/lib/constants';
import { ErrorResponse } from '@/types/api';

/**
 * Create axios instance for Ingestion API
 */
export const ingestApi = axios.create({
  baseURL: clientConfig.ingestApiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for ingest API
ingestApi.interceptors.request.use(
  (config) => {
    if (clientConfig.authEnabled) {
      const token = authService.getAccessToken();
      if (token) {
        config.headers.Authorization = `${HEADERS.AUTH_SCHEME} ${token}`;
      }

      const user = authService.getUser();
      if (user?.org_id) {
        config.headers[HEADERS.ORG_ID] = user.org_id;
      }
    }

    if (clientConfig.isDevelopment) {
      console.log('🔗 Ingestion API Request:', {
        method: config.method,
        url: config.url,
        baseURL: config.baseURL,
        hasAuth: !!config.headers.Authorization,
        hasOrgId: !!config.headers[HEADERS.ORG_ID],
      });
    }

    return config;
  },
  (error) => {
    console.error('🚫 Ingestion API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for ingest API
ingestApi.interceptors.response.use(
  (response) => {
    if (clientConfig.isDevelopment) {
      console.log('✅ Ingestion API Response:', {
        status: response.status,
        url: response.config.url,
        data: response.data
      });
    }
    return response;
  },
  (error) => {
    const errorDetails = {
      status: error.response?.status ?? 'No status',
      url: error.config?.url ?? 'Unknown URL',
      data: error.response?.data ?? null,
      message: error.message || 'Unknown error',
      code: error.code || 'UNKNOWN'
    };
    console.error('🚫 Ingestion API Response Error:', JSON.stringify(errorDetails, null, 2));

    if (error.response) {
      const status = error.response.status;
      const errorData: ErrorResponse = error.response.data;

      switch (status) {
        case 400:
          throw new Error(`Bad Request: ${errorData.message || 'Invalid request data'}`);
        case 401:
          throw new Error('Authentication required for ingestion service');
        case 403:
          throw new Error('Access denied to ingestion service');
        case 404:
          throw new Error('Ingestion endpoint not found');
        case 413:
          throw new Error('Document too large for ingestion');
        case 422:
          throw new Error(`Validation Error: ${errorData.message || 'Invalid data provided'}`);
        case 429:
          throw new Error('Rate limit exceeded - please wait before retrying');
        case 500:
          throw new Error(`Ingestion service error: ${errorData.message || 'Internal server error'}`);
        default:
          throw new Error(`Ingestion API error (${status}): ${errorData.message || error.message}`);
      }
    } else if (error.request) {
      throw new Error('Cannot connect to ingestion service - please check your connection');
    } else {
      throw error;
    }
  }
);

/**
 * Create axios instance for RAG API (Gemini File Search)
 */
export const ragApi = axios.create({
  baseURL: clientConfig.aiApiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for RAG API
ragApi.interceptors.request.use(
  (config) => {
    if (clientConfig.authEnabled) {
      const token = authService.getAccessToken();
      if (token) {
        config.headers.Authorization = `${HEADERS.AUTH_SCHEME} ${token}`;
      }

      const user = authService.getUser();
      if (user?.org_id) {
        config.headers[HEADERS.ORG_ID] = user.org_id;
      }
    }

    if (clientConfig.isDevelopment) {
      console.log('🔗 RAG API Request:', {
        method: config.method,
        url: config.url,
        baseURL: config.baseURL,
        hasAuth: !!config.headers.Authorization,
        hasOrgId: !!config.headers[HEADERS.ORG_ID],
      });
    }

    return config;
  },
  (error) => {
    console.error('🚫 RAG API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for RAG API
ragApi.interceptors.response.use(
  (response) => {
    if (clientConfig.isDevelopment) {
      console.log('✅ RAG API Response:', {
        status: response.status,
        url: response.config.url,
        data: response.data
      });
    }
    return response;
  },
  (error) => {
    const errorDetails = {
      status: error.response?.status ?? 'No status',
      url: error.config?.url ?? 'Unknown URL',
      data: error.response?.data ?? null,
      message: error.message || 'Unknown error',
      code: error.code || 'UNKNOWN'
    };
    console.error('🚫 RAG API Response Error:', JSON.stringify(errorDetails, null, 2));

    if (error.response) {
      const status = error.response.status;
      const errorData = error.response.data;

      switch (status) {
        case 400:
          throw new Error(`Bad Request: ${errorData?.detail || errorData?.message || 'Invalid request data'}`);
        case 401:
          throw new Error('Authentication required for RAG service');
        case 403:
          throw new Error('Access denied to RAG service');
        case 404:
          throw new Error('RAG endpoint not found');
        case 500:
          throw new Error(`RAG service error: ${errorData?.detail || errorData?.message || 'Internal server error'}`);
        default:
          throw new Error(`RAG API error (${status}): ${errorData?.detail || errorData?.message || error.message}`);
      }
    } else if (error.request) {
      throw new Error('Cannot connect to RAG service - please check your connection');
    } else {
      throw error;
    }
  }
);
