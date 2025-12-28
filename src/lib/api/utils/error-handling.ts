/**
 * Error handling utilities for API responses
 * Provides consistent error message normalization across the application
 */

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
