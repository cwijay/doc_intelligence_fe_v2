/**
 * Shared helper functions for AI feature modules
 * Reduces duplication while preserving type safety
 */

import { validateParsedFilePath } from '../utils/path-utils';

/**
 * Validate document inputs for AI generation
 */
export function validateAIInputs(documentName: string, parsedFilePath: string): void {
  if (!documentName || documentName.trim() === '') {
    throw new Error('document_name is required and cannot be empty');
  }
  validateParsedFilePath(parsedFilePath);
}

/**
 * Clamp a quantity value to min/max bounds
 */
export function clampQuantity(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Log AI generation request
 */
export function logGenerationStart(
  emoji: string,
  featureName: string,
  documentName: string,
  parsedFilePath: string,
  quantity: number,
  force: boolean
): void {
  console.log(`${emoji} Generating ${featureName} via AI API:`, {
    documentName,
    parsedFilePath,
    quantity,
    force
  });
}

/**
 * Log AI generation success
 */
export function logGenerationSuccess(
  documentName: string,
  metadata: Record<string, unknown>
): void {
  console.log('✅ Generated successfully:', {
    documentName,
    ...metadata
  });
}

/**
 * Log AI generation failure
 */
export function logGenerationError(featureName: string, error: unknown): void {
  console.error(`🚫 ${featureName} generation failed:`, error);
}

/**
 * Build base request object for AI features
 */
export function buildBaseRequest(
  documentName: string,
  parsedFilePath: string,
  sessionId?: string,
  force?: boolean
): Record<string, unknown> {
  return {
    document_name: documentName,
    parsed_file_path: parsedFilePath,
    ...(sessionId && { session_id: sessionId }),
    ...(force && { force: true })
  };
}
