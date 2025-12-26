import axios, { AxiosResponse } from 'axios';
import {
  SimpleRAGRequest,
  SimpleRAGResponse,
  EnhancedRAGRequest,
  SimpleRAGStats,
  SimpleRAGError,
  SimpleRAGStatus,
} from '@/types/rag';

import { clientConfig } from '@/lib/config';

// Simple RAG API Configuration
const RAG_API_BASE_URL = clientConfig.ragApiBaseUrl;
const SIMPLE_RAG_API_URL = `${RAG_API_BASE_URL}/api/v1/simple-rag`;

// Create axios instance for Simple RAG API (no authentication as specified)
const simpleRagApi = axios.create({
  baseURL: SIMPLE_RAG_API_URL,
  timeout: 15000, // 15 seconds timeout (much faster than old API!)
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

// Request interceptor for logging
simpleRagApi.interceptors.request.use(
  (config) => {
    console.log('⚡ Simple RAG API Request:', {
      url: config.url,
      method: config.method,
      baseURL: config.baseURL,
      data: config.data ? JSON.stringify(config.data).substring(0, 200) + '...' : null,
      timestamp: new Date().toISOString(),
    });
    return config;
  },
  (error) => {
    console.error('⚡ Simple RAG API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
simpleRagApi.interceptors.response.use(
  (response) => {
    console.log('⚡ Simple RAG API Response:', {
      url: response.config.url,
      status: response.status,
      processingTime: response.data?.processing_time,
      timestamp: new Date().toISOString(),
    });
    return response;
  },
  (error) => {
    console.error('⚡ Simple RAG API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
      timestamp: new Date().toISOString(),
    });

    // Transform error for better user experience
    let errorMessage = 'Simple RAG service error occurred';
    
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as SimpleRAGError;
      
      switch (status) {
        case 400:
          errorMessage = data?.error || 'Invalid query parameters. Please check your input.';
          break;
        case 404:
          errorMessage = 'Simple RAG service endpoint not found. Please ensure the service is running.';
          break;
        case 422:
          errorMessage = data?.error || 'Query validation failed. Please check your query format.';
          break;
        case 429:
          errorMessage = 'Too many requests. Please wait a moment before trying again.';
          break;
        case 500:
        case 502:
        case 503:
          errorMessage = 'Simple RAG service is temporarily unavailable. Please try again later.';
          break;
        default:
          errorMessage = data?.error || `Simple RAG service error (${status})`;
      }
    } else if (error.request) {
      errorMessage = `Cannot connect to Simple RAG service at ${RAG_API_BASE_URL}. Please ensure the service is running.`;
    } else {
      errorMessage = error.message || 'An unexpected error occurred';
    }

    const ragError = new Error(errorMessage);
    Object.assign(ragError, error);
    return Promise.reject(ragError);
  }
);

export const simpleRagApiClient = {
  /**
   * Enhanced RAG query with multi-document support - /query endpoint with answer generation
   * Supports document_paths, bm_25_paths, and enhanced filtering
   */
  enhancedSearch: async (request: EnhancedRAGRequest): Promise<SimpleRAGResponse> => {
    console.log('🚀 Submitting Enhanced RAG search:', {
      query: request.query.substring(0, 100) + '...',
      organization: request.organization,
      documentCount: request.document_paths.length,
      documentNames: request.document_name_list,
      searchType: request.search_type || 'hybrid',
      maxSources: request.max_sources || 5,
    });

    const startTime = Date.now();

    try {
      const response: AxiosResponse<SimpleRAGResponse> = await simpleRagApi.post('/query', request);
      
      const clientTime = (Date.now() - startTime) / 1000;
      
      // Ensure response has required structure
      if (!response.data) {
        throw new Error('Invalid response: No data returned from Enhanced RAG API');
      }
      
      // Ensure sources array exists
      if (!response.data.sources) {
        console.warn('⚠️ Enhanced RAG response missing sources array, initializing empty array');
        response.data.sources = [];
      }
      
      console.log('🚀 Enhanced RAG search successful:', {
        confidenceScore: response.data.confidence_score,
        sourcesCount: response.data.sources?.length || 0,
        processingTime: response.data.processing_time,
        clientTime: clientTime,
        searchStrategy: response.data.search_strategy,
        organization: response.data.organization,
      });

      return response.data;
    } catch (error) {
      console.error('🚀 Enhanced RAG search failed:', error);
      throw error;
    }
  },

  /**
   * Legacy query method - keeping for backward compatibility
   * Submit a query to the Simple RAG API - Fast 5-10 second responses!
   */
  query: async (request: SimpleRAGRequest): Promise<SimpleRAGResponse> => {
    console.log('⚡ Submitting Simple RAG query (legacy):', {
      query: request.query.substring(0, 100) + '...',
      organization: request.organization,
      maxSources: request.max_sources,
    });

    const startTime = Date.now();

    try {
      const response: AxiosResponse<SimpleRAGResponse> = await simpleRagApi.post('/query', request);
      
      const clientTime = (Date.now() - startTime) / 1000;
      
      console.log('⚡ Simple RAG query successful (much faster!):', {
        confidenceScore: response.data.confidence_score,
        sourcesCount: response.data.sources.length,
        processingTime: response.data.processing_time,
        clientTime: clientTime,
        organization: response.data.organization,
      });

      return response.data;
    } catch (error) {
      console.error('⚡ Simple RAG query failed:', error);
      throw error;
    }
  },

  /**
   * Search only (no answer generation) - even faster
   */
  search: async (query: string, organization: string, maxResults: number = 10): Promise<any> => {
    console.log('⚡ Simple RAG search only:', { query, organization, maxResults });

    try {
      const response = await simpleRagApi.post('/search', {
        query,
        organization,
        max_results: maxResults,
        search_type: 'hybrid'
      });
      return response.data;
    } catch (error) {
      console.error('⚡ Simple RAG search failed:', error);
      throw error;
    }
  },

  /**
   * Get Simple RAG service statistics
   */
  getStats: async (): Promise<SimpleRAGStats> => {
    console.log('⚡ Getting Simple RAG service stats');

    try {
      const response: AxiosResponse<SimpleRAGStats> = await simpleRagApi.get('/stats');
      return response.data;
    } catch (error) {
      console.error('⚡ Failed to get Simple RAG stats:', error);
      throw error;
    }
  },

  /**
   * Check Simple RAG service health
   */
  healthCheck: async (): Promise<SimpleRAGStatus> => {
    console.log('⚡ Checking Simple RAG service health');

    try {
      const response: AxiosResponse<SimpleRAGStatus> = await simpleRagApi.get('/health');
      return response.data;
    } catch (error) {
      console.error('⚡ Simple RAG health check failed:', error);
      throw error;
    }
  },
};

// Utility functions
export const formatTime = (seconds: number): string => {
  return seconds < 10 ? `${seconds.toFixed(1)}s` : `${Math.round(seconds)}s`;
};

export const formatSearchStrategy = (strategy: string): string => {
  const strategyNames: { [key: string]: string } = {
    hybrid: 'Hybrid Search',
    semantic: 'Semantic Search',
    keyword: 'Keyword Search',
  };
  return strategyNames[strategy] || strategy;
};

export const getConfidenceColor = (score: number): string => {
  if (score >= 0.8) return 'text-green-600';
  if (score >= 0.6) return 'text-yellow-600';
  return 'text-red-600';
};

export const getConfidenceLabel = (score: number): string => {
  if (score >= 0.9) return 'Very High';
  if (score >= 0.8) return 'High';
  if (score >= 0.6) return 'Medium';
  if (score >= 0.4) return 'Low';
  return 'Very Low';
};

export const getSearchTypeColor = (type: string): string => {
  switch (type) {
    case 'semantic': return 'bg-blue-100 text-blue-800';
    case 'keyword': return 'bg-green-100 text-green-800';  
    case 'hybrid': return 'bg-purple-100 text-purple-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

// Test connection utility
export const testSimpleRagConnection = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    await simpleRagApiClient.healthCheck();
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

// Backward compatibility
export const ragApiClient = simpleRagApiClient;
export default simpleRagApiClient;