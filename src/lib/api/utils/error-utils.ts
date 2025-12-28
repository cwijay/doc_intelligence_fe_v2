/**
 * Centralized error handling utilities for API operations
 * Consolidates all error handling utilities into a single module
 */

import { AxiosError } from 'axios';

// =============================================================================
// ERROR MESSAGE NORMALIZATION (merged from error-handling.ts)
// =============================================================================

/**
 * Recursively extracts a meaningful error message from various error formats
 * Handles nested objects, arrays, and different error response structures
 */
export const normalizeErrorMessage = (value: unknown): string => {
  if (value === null || value === undefined) {
    return 'An unexpected error occurred';
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (Array.isArray(value)) {
    const parts = value
      .map((item) => normalizeErrorMessage(item))
      .filter((part) => part && part !== 'An unexpected error occurred');
    if (parts.length > 0) {
      return parts.join(', ');
    }
  }

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;

    // Try common error message keys
    for (const key of ['message', 'detail', 'error']) {
      if (record[key]) {
        const nested = normalizeErrorMessage(record[key]);
        if (nested && nested !== 'An unexpected error occurred') {
          return nested;
        }
      }
    }

    // Fallback to JSON stringification
    try {
      const json = JSON.stringify(value);
      if (json && json !== '{}' && json !== '[]') {
        return json;
      }
    } catch {
      // Ignore JSON serialization errors
    }
  }

  return 'An unexpected error occurred';
};

/**
 * Creates a standardized API error with normalized message
 */
export const createApiError = (originalError: Error, message: string): Error => {
  const apiError = new Error(message);
  Object.assign(apiError, originalError);
  return apiError;
};

/**
 * Extracts a user-friendly error message from Axios errors
 * Handles various backend response formats including:
 * - { error: { message: "..." } } - structured error object
 * - { message: "..." } - direct message
 * - { detail: "..." } or { detail: [...] } - FastAPI validation errors
 * - String responses
 */
export const extractErrorMessage = (error: unknown): string => {
  if (!error) return 'An unexpected error occurred';

  // Handle Axios errors with response data
  if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, unknown>;

    // Check for Axios response structure
    const response = err.response as Record<string, unknown> | undefined;
    if (response?.data) {
      const data = response.data;

      // Use normalizeErrorMessage for the response data
      const message = normalizeErrorMessage(data);
      if (message && message !== 'An unexpected error occurred') {
        return message;
      }
    }

    // Standard Error.message property
    if (typeof err.message === 'string' && err.message) {
      // Clean up common Axios error prefixes for user display
      const msg = err.message;
      if (msg.startsWith('Request failed with status code ')) {
        return 'An error occurred while processing your request';
      }
      return msg;
    }
  }

  // String error
  if (typeof error === 'string') {
    return error;
  }

  return 'An unexpected error occurred';
};

// =============================================================================
// ERROR TYPE UTILITIES
// =============================================================================

/**
 * Error types for categorization
 */
export type ApiErrorType =
  | 'network'
  | 'timeout'
  | 'auth'
  | 'validation'
  | 'not_found'
  | 'server'
  | 'unknown';

/**
 * Structured API error
 */
export interface ApiErrorInfo {
  type: ApiErrorType;
  message: string;
  status?: number;
  details?: unknown;
}

/**
 * Check if an error is a network error (no response received)
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof AxiosError) {
    return !error.response && error.code !== 'ECONNABORTED';
  }
  return false;
}

/**
 * Check if an error is a timeout error
 */
export function isTimeoutError(error: unknown): boolean {
  if (error instanceof AxiosError) {
    return error.code === 'ECONNABORTED' || error.message?.includes('timeout');
  }
  return false;
}

/**
 * Check if an error is an authentication error
 */
export function isAuthError(error: unknown): boolean {
  if (error instanceof AxiosError) {
    return error.response?.status === 401 || error.response?.status === 403;
  }
  return false;
}

/**
 * Create a user-friendly error message from an error
 */
export function createErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    // Handle timeout
    if (isTimeoutError(error)) {
      return 'Request timed out. Please try again.';
    }

    // Handle network errors
    if (isNetworkError(error)) {
      return 'Unable to connect to the server. Please check your network connection.';
    }

    // Handle specific HTTP status codes
    const status = error.response?.status;
    if (status) {
      switch (status) {
        case 400:
          return error.response?.data?.detail || 'Invalid request. Please check your input.';
        case 401:
          return 'Authentication failed. Please log in again.';
        case 403:
          return 'You do not have permission to perform this action.';
        case 404:
          return 'The requested resource was not found.';
        case 409:
          return error.response?.data?.detail || 'A conflict occurred. The resource may already exist.';
        case 422:
          return error.response?.data?.detail || 'Validation error. Please check your input.';
        case 429:
          return 'Too many requests. Please wait a moment and try again.';
        case 500:
          return 'An internal server error occurred. Please try again later.';
        case 502:
        case 503:
        case 504:
          return 'The server is temporarily unavailable. Please try again later.';
        default:
          return error.response?.data?.detail || error.response?.data?.message || `Server error (${status})`;
      }
    }

    // Fallback to axios message
    return error.message || 'An unexpected error occurred';
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    return error.message;
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }

  return 'An unexpected error occurred';
}

/**
 * Get structured error info from an error
 */
export function getErrorInfo(error: unknown): ApiErrorInfo {
  if (error instanceof AxiosError) {
    const status = error.response?.status;

    if (isTimeoutError(error)) {
      return {
        type: 'timeout',
        message: createErrorMessage(error),
        status,
      };
    }

    if (isNetworkError(error)) {
      return {
        type: 'network',
        message: createErrorMessage(error),
      };
    }

    if (status === 401 || status === 403) {
      return {
        type: 'auth',
        message: createErrorMessage(error),
        status,
      };
    }

    if (status === 404) {
      return {
        type: 'not_found',
        message: createErrorMessage(error),
        status,
      };
    }

    if (status === 400 || status === 422) {
      return {
        type: 'validation',
        message: createErrorMessage(error),
        status,
        details: error.response?.data,
      };
    }

    if (status && status >= 500) {
      return {
        type: 'server',
        message: createErrorMessage(error),
        status,
      };
    }
  }

  return {
    type: 'unknown',
    message: createErrorMessage(error),
  };
}

/**
 * Log an API error with context
 */
export function logApiError(error: unknown, context: string): void {
  const errorInfo = getErrorInfo(error);

  console.error(`❌ API Error [${context}]:`, {
    type: errorInfo.type,
    message: errorInfo.message,
    status: errorInfo.status,
    details: errorInfo.details,
    originalError: error,
  });
}

/**
 * Handle API error by logging and re-throwing with user-friendly message
 */
export function handleApiError(error: unknown, context: string): never {
  logApiError(error, context);
  throw new Error(createErrorMessage(error));
}
