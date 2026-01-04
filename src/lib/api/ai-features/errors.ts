/**
 * Shared error handling for AI feature APIs
 */

export interface AIResponse {
  success?: boolean;
  error?: string;
}

/**
 * Check if response contains an error and throw appropriate exception
 */
export function handleAIResponseError(response: AIResponse, featureName: string): void {
  if (response.error) {
    const errorMsg = response.error;

    // Provide more helpful error messages for common issues
    if (errorMsg.toLowerCase().includes('not found') || errorMsg.toLowerCase().includes('does not exist')) {
      throw new Error(`Document not found. Please ensure the document has been parsed before generating ${featureName.toLowerCase()}.`);
    }
    if (errorMsg.toLowerCase().includes('failed to generate')) {
      throw new Error(`${errorMsg}. This may happen if the document hasn't been parsed yet. Please parse the document first.`);
    }
    throw new Error(errorMsg);
  }
}

/**
 * Validate that we have data in the response
 */
export function validateAIResponseData(
  response: AIResponse,
  hasData: boolean,
  featureName: string
): void {
  if (!response.success && !hasData) {
    throw new Error(`Failed to generate ${featureName.toLowerCase()}: No ${featureName.toLowerCase()} data received`);
  }

  // Warn if success is false but we have data
  if (!response.success && hasData) {
    console.warn(`⚠️ ${featureName} response has success=false but contains data, proceeding anyway`);
  }
}

/**
 * Combined error handling for generateAndConvert methods
 */
export function handleGenerateAndConvertResponse<T extends AIResponse>(
  response: T,
  hasDataFn: (response: T) => boolean,
  featureName: string
): void {
  // Check for explicit error first
  handleAIResponseError(response, featureName);

  // Validate we have data
  validateAIResponseData(response, hasDataFn(response), featureName);
}
