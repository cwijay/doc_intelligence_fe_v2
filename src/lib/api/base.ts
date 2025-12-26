import axios, { AxiosInstance } from 'axios';
import { authService } from '../auth';
import { clientConfig, getBrowserApiBaseUrl, isUsingLocalProxy, API_LOCAL_PROXY_PATH } from '../config';
import { normalizeErrorMessage } from './utils/error-handling';

// API configuration
const API_BASE_URL =
  typeof window === 'undefined' ? clientConfig.apiUrl : getBrowserApiBaseUrl();
const usingLocalProxy = typeof window !== 'undefined' ? isUsingLocalProxy() : false;

if (usingLocalProxy) {
  console.log('🔁 API client using local proxy:', API_LOCAL_PROXY_PATH);
}

// Create base API instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Increased timeout for uploads
  headers: {
    'Content-Type': 'application/json',
  },
  // Add explicit axios configuration to help with CORS
  withCredentials: false,
});

// Add session token to requests
api.interceptors.request.use(
  (config) => {
    const token = authService.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor with error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    let errorMessage = 'Unknown API error';
    
    // Handle 401 unauthorized responses with automatic logout
    if (error.response?.status === 401) {
      console.log('🚫 401 Unauthorized - triggering automatic logout...');
      
      // Skip token refresh for auth endpoints to prevent refresh loops during login
      const isAuthEndpoint = error.config?.url?.includes('/auth/login') || 
                            error.config?.url?.includes('/auth/register') ||
                            error.config?.url?.includes('/auth/refresh');
      
      if (!isAuthEndpoint) {
        // Import AuthContext logout function if available
        try {
          // Check if we're in a browser environment
          if (typeof window !== 'undefined') {
            // Use window event to trigger logout across the app
            window.dispatchEvent(new CustomEvent('auth:unauthorized', {
              detail: { reason: '401_response', timestamp: new Date().toISOString() }
            }));
          }
        } catch (logoutError) {
          console.error('Failed to trigger automatic logout on 401:', logoutError);
        }
      }
    }

    // Allow 409 Conflict errors to pass through with full response data
    // This is needed for duplicate file detection where the response contains existing_document info
    if (error.response?.status === 409) {
      console.log('🔄 409 Conflict detected - passing through for duplicate file handling');
      return Promise.reject(error);
    }

    // Detailed error logging for debugging - with fallbacks to ensure values display
    const errorDetails = {
      message: error.message || 'No message',
      code: error.code || 'UNKNOWN_CODE',
      status: error.response?.status ?? 'No status',
      statusText: error.response?.statusText || '',
      data: error.response?.data || null,
      url: error.config?.url || 'Unknown URL',
      method: error.config?.method?.toUpperCase() || 'UNKNOWN'
    };
    console.error('API Error Details:', errorDetails);
    console.error('API Error Details (JSON):', JSON.stringify(errorDetails, null, 2));

    // Handle different types of errors with improved messaging
    // Check for API response errors FIRST (4xx, 5xx) before network errors
    if (error.response) {
      // Server responded with error status
      // Use normalizeErrorMessage to extract message from nested error structures
      const normalizedMessage = normalizeErrorMessage(error.response.data);

      if (normalizedMessage && normalizedMessage !== 'An unexpected error occurred') {
        errorMessage = normalizedMessage;
      } else if (error.response.status) {
        // Fallback: Create meaningful error messages for common HTTP status codes
        switch (error.response.status) {
          case 400:
            errorMessage = 'Bad request. Please check your input and try again.';
            break;
          case 401:
            errorMessage = 'Your session has expired. Please log in again.';
            break;
          case 403:
            errorMessage = 'Access forbidden. You do not have permission to perform this action.';
            break;
          case 404:
            errorMessage = 'Resource not found. The requested item may have been deleted or moved.';
            break;
          case 409:
            errorMessage = 'Conflict. The resource already exists or conflicts with current state.';
            break;
          case 422:
            errorMessage = 'Validation error. Please check your input and try again.';
            break;
          case 500:
            errorMessage = 'Internal server error. Please try again later or contact support.';
            break;
          case 502:
            errorMessage = 'Bad gateway. The server is temporarily unavailable.';
            break;
          case 503:
            errorMessage = 'Service unavailable. Please try again later.';
            break;
          default:
            errorMessage = `Server error (${error.response.status}): ${error.response.statusText || 'Unknown error'}`;
        }
      } else {
        errorMessage = 'Server returned an error response';
      }
    } else if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
      // Actual network failure
      errorMessage = `Network connection failed. Ensure the backend server is running on ${clientConfig.apiBaseUrl} and try again.`;
    } else if (error.code === 'ERR_NETWORK') {
      errorMessage = `Cannot reach the API server. Please verify the backend is running on ${clientConfig.apiBaseUrl} and accessible.`;
    } else if (error.code === 'ECONNREFUSED') {
      errorMessage = `Connection refused. The API server at ${clientConfig.apiBaseUrl} is not responding.`;
    } else if (error.request) {
      // Request was made but no response received
      errorMessage = 'No response from server. Please check your connection and try again.';
    } else if (error.message) {
      errorMessage = error.message;
    } else {
      errorMessage = 'An unexpected error occurred';
    }
    
    // Create a new error with the properly formatted message
    // Preserve original error properties but ensure message is not overwritten
    const apiError = new Error(errorMessage);

    // Copy relevant properties from original error without overwriting message
    if (error.response) {
      (apiError as any).response = error.response;
    }
    if (error.config) {
      (apiError as any).config = error.config;
    }
    if (error.code) {
      (apiError as any).code = error.code;
    }
    if (error.request) {
      (apiError as any).request = error.request;
    }

    console.error('API Error:', errorMessage);
    console.error('Full error object:', error);

    return Promise.reject(apiError);
  }
);

export default api;
export type { AxiosInstance };
