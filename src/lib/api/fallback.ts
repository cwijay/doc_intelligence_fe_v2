/**
 * Fallback utilities for graceful degradation when backend is unavailable
 */

/**
 * Wraps an API call with optional fallback data
 * Returns fallback data if the API call fails, or re-throws the error if no fallback is provided
 */
export const withBackendFallback = async <T>(
  apiCall: () => Promise<T>,
  fallbackData?: T,
  _fallbackMessage?: string
): Promise<T> => {
  try {
    const result = await apiCall();
    return result;
  } catch (error) {
    if (fallbackData !== undefined) {
      return fallbackData;
    }
    throw error;
  }
};
