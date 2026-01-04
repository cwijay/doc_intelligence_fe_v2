import axios from 'axios';
import { Document } from '@/types/api';
import { authService } from '@/lib/auth';
import { clientConfig } from '@/lib/config';

// Sheets Agent API Base URL from environment configuration
// Uses the AI API base URL where the SheetsAgent is hosted
const SHEETS_API_BASE_URL = clientConfig.aiApiBaseUrl;

// Create dedicated axios instance for Sheets agent
const sheetsApi = axios.create({
  baseURL: SHEETS_API_BASE_URL,
  timeout: 600000, // 10 minutes for complex analysis
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add authentication and organization interceptor
sheetsApi.interceptors.request.use(
  (config) => {
    const token = authService.getAccessToken();
    const user = authService.getUser();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn('⚠️ Sheets API Request: No access token found');
    }

    // Add organization header for multi-tenancy
    // AI API expects org_name, not org_id UUID
    if (user?.org_name) {
      config.headers['X-Organization-ID'] = user.org_name;
    }

    console.log('📊 Sheets API Request:', {
      url: config.url,
      method: config.method,
      baseURL: config.baseURL,
      hasToken: !!token,
      orgName: user?.org_name || 'none'
    });

    return config;
  },
  (error) => {
    console.error('❌ Sheets API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
sheetsApi.interceptors.response.use(
  (response) => {
    console.log('✅ Sheets API Success:', {
      status: response.status,
      url: response.config.url,
      dataSize: JSON.stringify(response.data).length
    });
    return response;
  },
  (error) => {
    console.error('❌ Sheets API Error:', {
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
      console.error('🚫 Sheets API Server appears to be down or unreachable at:', SHEETS_API_BASE_URL);
    } else if (error.response?.status === 401) {
      console.error('🔑 Sheets API Authentication failed - token may be invalid or expired');
    }

    return Promise.reject(error);
  }
);

// Types for Sheets Analysis API (matching backend SheetsAgent schemas)
export interface SheetsAnalyzeRequest {
  file_paths: string[];
  query: string;
  session_id?: string;
  options?: {
    timeout?: number;
    max_results?: number;
    detailed_analysis?: boolean;
  };
}

export interface FileMetadata {
  file_path: string;
  file_type: string;
  source?: string;
  size_bytes?: number;
  rows?: number;
  columns?: number;
  column_names?: string[];
  sheet_names?: string[];
  processing_time_ms?: number;
  shape?: number[];
}

export interface ToolUsageInfo {
  tool_name: string;
  execution_time_ms?: number;
  execution_time_seconds?: number;
  success: boolean;
  error_message?: string;
}

export interface TokenUsageInfo {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  estimated_cost_usd?: number;
}

export interface SheetsAnalyzeResponse {
  success: boolean;
  message?: string;
  response?: string;
  files_processed?: FileMetadata[];
  tools_used?: ToolUsageInfo[];
  token_usage?: TokenUsageInfo;
  session_id?: string;
  processing_time_ms?: number;
  timestamp?: string;
  // Error fields
  error?: string;
  details?: Record<string, any>;
}

// Legacy type aliases for backward compatibility
export type ExcelChatRequest = SheetsAnalyzeRequest;
export type ExcelChatResponse = SheetsAnalyzeResponse;
export type FileAnalysisInfo = FileMetadata;

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    files_processed?: FileMetadata[];
    processing_time_ms?: number;
    token_usage?: TokenUsageInfo;
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
    // Format: {org_name}/original/{folder_name}/{filename}
    const user = authService.getUser();
    const orgName = user?.org_name || 'default';
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
    folderName: document.folder_name,
    gcsPath: storagePath,
    originalStoragePath: document.storage_path,
    originalGcsPath: document.gcs_path,
    originalPath: document.path,
    userOrgName: authService.getUser()?.org_name
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

// Main Sheets analysis function - calls /api/v1/sheets/analyze endpoint
export const analyzeSheets = async (
  documents: Document[],
  query: string,
  sessionId?: string,
  options?: SheetsAnalyzeRequest['options']
): Promise<SheetsAnalyzeResponse> => {
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

    const requestData: SheetsAnalyzeRequest = {
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

    console.log('📊 Sheets Analysis Request:', {
      fileCount: documents.length,
      filePaths: file_paths,
      query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
      sessionId,
      options: requestData.options
    });

    // Call the SheetsAgent endpoint
    const response = await sheetsApi.post<SheetsAnalyzeResponse>('/api/v1/sheets/analyze', requestData);

    console.log('✅ Sheets Analysis Response:', {
      success: response.data.success,
      responseLength: response.data.response?.length || 0,
      filesProcessed: response.data.files_processed?.length || 0,
      processingTimeMs: response.data.processing_time_ms,
      tokensUsed: response.data.token_usage?.total_tokens
    });

    return response.data;

  } catch (error) {
    console.error('❌ Sheets Analysis API Error:', error);

    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message;

      // Handle specific error cases with enhanced messages
      if (!error.response && (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND')) {
        throw new Error(`Sheets analysis service is not available. Please ensure the API server is running on ${SHEETS_API_BASE_URL}`);
      }

      switch (status) {
        case 401:
          throw new Error('Authentication failed. Your session may have expired. Please log in again.');
        case 400:
          throw new Error(`File access error: ${message}. Please check that the document exists and is accessible.`);
        case 403:
          throw new Error(`Access denied: ${message}. You may not have permission to analyze this document.`);
        case 404:
          throw new Error(`Sheets analysis service not found. Please verify the API server is running and accessible.`);
        case 422:
          throw new Error(`Validation error: ${message}. Please check your query and try again.`);
        case 429:
          throw new Error('Too many requests. Please wait a moment before trying again.');
        case 500:
          throw new Error(`Sheets analysis error: ${message}. Please try again later or contact support if the issue persists.`);
        case 502:
        case 503:
        case 504:
          throw new Error(`Sheets analysis service is temporarily unavailable (${status}). Please try again in a few moments.`);
        default:
          throw new Error(`Sheets analysis failed (${status}): ${message}`);
      }
    }

    // Handle non-axios errors
    if (error instanceof Error) {
      throw new Error(`Sheets analysis error: ${error.message}`);
    }

    throw new Error('An unexpected error occurred while analyzing spreadsheet. Please try again.');
  }
};

// Legacy alias for backward compatibility
export const chatWithExcel = analyzeSheets;

// Health check for Sheets API service
export const checkSheetsApiHealth = async (): Promise<{
  isHealthy: boolean;
  status?: number;
  message: string;
  url: string;
  responseTime?: number;
}> => {
  const startTime = Date.now();
  const healthUrl = `${SHEETS_API_BASE_URL}/api/v1/sheets/health`;

  try {
    console.log('🔍 Checking Sheets API health at:', healthUrl);

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
        message: 'Sheets API service is healthy and reachable',
        url: healthUrl,
        responseTime,
      };
    } else {
      return {
        isHealthy: false,
        status: response.status,
        message: `Sheets API health check failed with status ${response.status}`,
        url: healthUrl,
        responseTime,
      };
    }
  } catch (error: any) {
    const responseTime = Date.now() - startTime;

    console.error('❌ Sheets API Health Check Failed:', {
      url: healthUrl,
      error: error.message,
      code: error.code,
      responseTime,
    });

    let message = 'Sheets API service is unreachable';

    if (error.code === 'ECONNREFUSED') {
      message = `Sheets API server is not running on ${SHEETS_API_BASE_URL}`;
    } else if (error.name === 'AbortError' || error.message?.includes('timeout')) {
      message = 'Sheets API health check timed out';
    } else if (error.message) {
      message = `Sheets API health check failed: ${error.message}`;
    }

    return {
      isHealthy: false,
      message,
      url: healthUrl,
      responseTime,
    };
  }
};

// Legacy alias for backward compatibility
export const checkExcelApiHealth = checkSheetsApiHealth;

// Sheets API service object (primary export)
export const sheetsApiService = {
  analyze: analyzeSheets,
  constructGCSPath,
  validateGCSPath,
  validateQuery,
  validateExcelFile,
  generateSessionId,
  checkHealth: checkSheetsApiHealth,
};

// Legacy alias for backward compatibility
export const excelApiService = {
  chat: chatWithExcel,
  analyze: analyzeSheets,
  constructGCSPath,
  validateGCSPath,
  validateQuery,
  validateExcelFile,
  generateSessionId,
  checkHealth: checkSheetsApiHealth,
};

export default sheetsApiService;