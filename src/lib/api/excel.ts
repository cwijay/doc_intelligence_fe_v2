import axios from 'axios';
import { Document } from '@/types/api';
import { authService } from '../auth';
import { clientConfig } from '../config';

// Excel Agent API Base URL from environment configuration
const EXCEL_API_BASE_URL = clientConfig.excelApiUrl;

// Create dedicated axios instance for Excel agent
const excelApi = axios.create({
  baseURL: EXCEL_API_BASE_URL,
  timeout: 600000, // 10 minutes for complex analysis
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add authentication interceptor
excelApi.interceptors.request.use(
  (config) => {
    const token = authService.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('📊 Excel API Request:', {
        url: config.url,
        method: config.method,
        baseURL: config.baseURL,
        hasToken: !!token,
        tokenPreview: token ? `${token.substring(0, 20)}...` : 'none'
      });
    } else {
      console.warn('⚠️ Excel API Request: No access token found');
    }
    return config;
  },
  (error) => {
    console.error('❌ Excel API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
excelApi.interceptors.response.use(
  (response) => {
    console.log('✅ Excel API Success:', {
      status: response.status,
      url: response.config.url,
      dataSize: JSON.stringify(response.data).length
    });
    return response;
  },
  (error) => {
    console.error('❌ Excel API Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.response?.data?.message || error.message,
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      fullURL: error.config?.baseURL + error.config?.url,
      data: error.response?.data,
      headers: error.response?.headers,
      isAuthError: error.response?.status === 401,
      isServerDown: !error.response && error.code === 'ECONNREFUSED'
    });
    
    // Handle specific error cases
    if (!error.response && error.code === 'ECONNREFUSED') {
      console.error('🚫 Excel API Server appears to be down or unreachable at:', EXCEL_API_BASE_URL);
    } else if (error.response?.status === 401) {
      console.error('🔑 Excel API Authentication failed - token may be invalid or expired');
    }
    
    return Promise.reject(error);
  }
);

// Types for Excel Chat API
export interface ExcelChatRequest {
  file_paths: string[];
  query: string;
  session_id?: string;
  options?: {
    timeout?: number;
    max_results?: number;
    detailed_analysis?: boolean;
  };
}

export interface FileAnalysisInfo {
  name: string;
  gcs_path: string;
  size_bytes: number;
  format: 'xlsx' | 'xls' | 'csv';
  columns: string[];
  row_count: number;
  processing_time_seconds: number;
}

export interface ToolUsageInfo {
  tool_name: string;
  execution_time_seconds: number;
  success: boolean;
  error_message?: string;
}

export interface TokenUsageInfo {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface ExcelChatResponse {
  status: 'success' | 'error';
  response?: string;
  files_analyzed?: FileAnalysisInfo[];
  agent_metadata?: Record<string, any>;
  tools_used?: ToolUsageInfo[];
  processing_time_seconds?: number;
  tokens_used?: TokenUsageInfo;
  session_id?: string;
  timestamp?: string;
  // Error fields
  error?: string;
  message?: string;
  details?: Record<string, any>;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    files_analyzed?: FileAnalysisInfo[];
    processing_time?: number;
    tokens_used?: TokenUsageInfo;
    tools_used?: ToolUsageInfo[];
  };
}

export interface ChatSession {
  id: string;
  documents: Document[];
  messages: ChatMessage[];
  created_at: Date;
  last_activity: Date;
}

// Utility function to construct GCS path from document
export const constructGCSPath = (document: Document): string => {
  // Handle different storage path formats
  let storagePath = '';
  
  if (document.storage_path) {
    storagePath = document.storage_path;
  } else if (document.gcs_path) {
    storagePath = document.gcs_path;
  } else if (document.path) {
    storagePath = document.path;
  } else {
    // Construct path based on document metadata
    // Format: organization/original/folder/filename
    const orgName = document.organization_id || 'default';
    const folderName = document.folder_name || 'default';
    storagePath = `${orgName}/original/${folderName}/${document.name}`;
  }
  
  // Ensure GCS format
  if (!storagePath.startsWith('gs://')) {
    const bucketName = clientConfig.gcsBucketName || 'biz-to-bricks-document-store';
    storagePath = `gs://${bucketName}/${storagePath}`;
  }
  
  console.log('🔗 Constructed GCS path:', {
    documentName: document.name,
    documentId: document.id,
    gcsPath: storagePath,
    originalStoragePath: document.storage_path,
    originalGcsPath: document.gcs_path,
    originalPath: document.path
  });
  
  return storagePath;
};

// Validation functions
export const validateGCSPath = (path: string): boolean => {
  return path.startsWith('gs://') && path.length > 5;
};

export const validateQuery = (query: string): boolean => {
  return query.trim().length >= 3;
};

export const validateExcelFile = (document: Document): boolean => {
  const excelExtensions = ['.xlsx', '.xls', '.csv'];
  const fileName = document.name.toLowerCase();
  const fileType = document.type.toLowerCase();
  
  return excelExtensions.some(ext => 
    fileName.endsWith(ext) || 
    fileType.includes(ext.slice(1))
  );
};

// Generate unique session ID
export const generateSessionId = (): string => {
  return `excel-chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Main Excel chat function
export const chatWithExcel = async (
  documents: Document[],
  query: string,
  sessionId?: string,
  options?: ExcelChatRequest['options']
): Promise<ExcelChatResponse> => {
  try {
    // Validate inputs
    if (!documents.length) {
      throw new Error('At least one document is required');
    }
    
    if (!validateQuery(query)) {
      throw new Error('Query must be at least 3 characters long');
    }
    
    // Validate all documents are Excel/CSV
    const invalidDocs = documents.filter(doc => !validateExcelFile(doc));
    if (invalidDocs.length > 0) {
      throw new Error(`Invalid file types detected: ${invalidDocs.map(d => d.name).join(', ')}. Only Excel (.xlsx, .xls) and CSV files are supported.`);
    }
    
    // Construct GCS paths
    const file_paths = documents.map(constructGCSPath);
    
    // Validate GCS paths
    const invalidPaths = file_paths.filter(path => !validateGCSPath(path));
    if (invalidPaths.length > 0) {
      throw new Error(`Invalid GCS paths: ${invalidPaths.join(', ')}`);
    }
    
    const requestData: ExcelChatRequest = {
      file_paths,
      query: query.trim(),
      session_id: sessionId,
      options: {
        timeout: 300, // 5 minutes default
        max_results: 100,
        detailed_analysis: false,
        ...options
      }
    };
    
    console.log('📊 Excel Chat Request:', {
      fileCount: documents.length,
      filePaths: file_paths,
      query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
      sessionId,
      options: requestData.options
    });
    
    const response = await excelApi.post<ExcelChatResponse>('/api/excel/chat', requestData);
    
    console.log('✅ Excel Chat Response:', {
      status: response.data.status,
      responseLength: response.data.response?.length || 0,
      filesAnalyzed: response.data.files_analyzed?.length || 0,
      processingTime: response.data.processing_time_seconds,
      tokensUsed: response.data.tokens_used?.total_tokens
    });
    
    return response.data;
    
  } catch (error) {
    console.error('❌ Excel Chat API Error:', error);
    
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message;
      const details = error.response?.data?.details;
      
      // Handle specific error cases with enhanced messages
      if (!error.response && (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND')) {
        throw new Error(`Excel AI service is not available. Please ensure the Excel API server is running on ${EXCEL_API_BASE_URL}`);
      }
      
      switch (status) {
        case 401:
          throw new Error('Authentication failed. Your session may have expired. Please log in again to chat with Excel files.');
        case 400:
          throw new Error(`File access error: ${message}. Please check that the document exists and is accessible.`);
        case 403:
          throw new Error(`Access denied: ${message}. You may not have permission to analyze this document.`);
        case 404:
          throw new Error(`Excel chat service not found. Please verify the Excel API server is running and accessible.`);
        case 422:
          throw new Error(`Validation error: ${message}. Please check your query and try again.`);
        case 429:
          throw new Error('Too many requests. Please wait a moment before trying again.');
        case 500:
          throw new Error(`Excel AI processing error: ${message}. Please try again later or contact support if the issue persists.`);
        case 502:
        case 503:
        case 504:
          throw new Error(`Excel AI service is temporarily unavailable (${status}). Please try again in a few moments.`);
        default:
          throw new Error(`Excel analysis failed (${status}): ${message}`);
      }
    }
    
    // Handle non-axios errors
    if (error instanceof Error) {
      throw new Error(`Excel chat error: ${error.message}`);
    }
    
    throw new Error('An unexpected error occurred while chatting with Excel. Please try again.');
  }
};

// Health check for Excel API service
export const checkExcelApiHealth = async (): Promise<{
  isHealthy: boolean;
  status?: number;
  message: string;
  url: string;
  responseTime?: number;
}> => {
  const startTime = Date.now();
  const healthUrl = `${EXCEL_API_BASE_URL}/api/health`;
  
  try {
    console.log('🔍 Checking Excel API health at:', healthUrl);
    
    const response = await fetch(healthUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const responseTime = Date.now() - startTime;
    
    if (response.ok) {
      return {
        isHealthy: true,
        status: response.status,
        message: 'Excel API service is healthy and reachable',
        url: healthUrl,
        responseTime,
      };
    } else {
      return {
        isHealthy: false,
        status: response.status,
        message: `Excel API health check failed with status ${response.status}`,
        url: healthUrl,
        responseTime,
      };
    }
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    
    console.error('❌ Excel API Health Check Failed:', {
      url: healthUrl,
      error: error.message,
      code: error.code,
      responseTime,
    });
    
    let message = 'Excel API service is unreachable';
    
    if (error.code === 'ECONNREFUSED') {
      message = `Excel API server is not running on ${EXCEL_API_BASE_URL}`;
    } else if (error.name === 'AbortError' || error.message?.includes('timeout')) {
      message = 'Excel API health check timed out';
    } else if (error.message) {
      message = `Excel API health check failed: ${error.message}`;
    }
    
    return {
      isHealthy: false,
      message,
      url: healthUrl,
      responseTime,
    };
  }
};

// Excel API service object
export const excelApiService = {
  chat: chatWithExcel,
  constructGCSPath,
  validateGCSPath,
  validateQuery,
  validateExcelFile,
  generateSessionId,
  checkHealth: checkExcelApiHealth,
};

export default excelApiService;