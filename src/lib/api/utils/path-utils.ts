/**
 * Centralized path construction utilities for GCS storage paths
 * Consolidates path logic from ai-features, ingestion, and document actions
 *
 * NOTE: For new code, prefer using the centralized utilities in '@/lib/gcs-paths'.
 * This module provides backwards compatibility.
 */

import { STORAGE_PATHS } from '@/lib/constants';
import {
  getBaseName as _getBaseName,
  constructParsedPath,
  constructOriginalPath,
  constructGcsUri,
  validatePath as _validatePath,
  validateContentTypePath,
  extractFolderName as _extractFolderName,
  extractOrgName as _extractOrgName,
  isPathOfType,
  originalToParsedPath as _originalToParsedPath,
  type PathParams,
} from '@/lib/gcs-paths';

/**
 * Get the base name of a file (without extension)
 *
 * @deprecated Use getBaseName from '@/lib/gcs-paths' instead
 */
export function getBaseName(filename: string): string {
  return _getBaseName(filename);
}

/**
 * Construct a parsed file path for AI features
 * Format: {org_name}/parsed/{folder_name}/{document_name}.md
 *
 * @deprecated Use constructParsedPath from '@/lib/gcs-paths' instead
 */
export function constructParsedFilePath(
  orgName: string,
  folderName: string,
  documentName: string
): string {
  const params: PathParams = { orgName, folderName, documentName };
  return constructParsedPath(params);
}

/**
 * Construct an original file path for document storage
 * Format: {org_name}/original/{folder_name}/{file_name}
 *
 * @deprecated Use constructOriginalPath from '@/lib/gcs-paths' instead
 */
export function constructOriginalFilePath(
  orgName: string,
  folderName: string,
  fileName: string
): string {
  const params: PathParams = { orgName, folderName, documentName: fileName };
  return constructOriginalPath(params);
}

/**
 * Construct a GCS URI path
 * Format: gs://{bucket}/{path}
 *
 * @deprecated Use constructGcsUri from '@/lib/gcs-paths' instead
 */
export function constructGcsPath(bucket: string, path: string): string {
  return constructGcsUri(bucket, path);
}

/**
 * Validate a storage path for security issues
 * @throws Error if path is invalid
 *
 * @deprecated Use validatePath from '@/lib/gcs-paths' instead
 */
export function validatePath(path: string): void {
  const result = _validatePath(path);
  if (!result.isValid) {
    throw new Error(result.errors[0]);
  }
}

/**
 * Validate a parsed file path specifically
 * @throws Error if path is invalid for parsed file operations
 *
 * @deprecated Use validateContentTypePath from '@/lib/gcs-paths' instead
 */
export function validateParsedFilePath(path: string): void {
  const result = validateContentTypePath(path, 'parsed');
  if (!result.isValid) {
    console.warn(result.errors[0]);
  }
}

/**
 * Extract folder name from a storage path
 * Handles both original and parsed path formats
 *
 * @deprecated Use extractFolderName from '@/lib/gcs-paths' instead
 */
export function extractFolderName(storagePath: string): string | null {
  return _extractFolderName(storagePath);
}

/**
 * Extract organization name from a storage path
 *
 * @deprecated Use extractOrgName from '@/lib/gcs-paths' instead
 */
export function extractOrgName(storagePath: string): string | null {
  return _extractOrgName(storagePath);
}

/**
 * Check if a path is a parsed file path
 *
 * @deprecated Use isPathOfType from '@/lib/gcs-paths' instead
 */
export function isParsedPath(path: string): boolean {
  return isPathOfType(path, 'parsed');
}

/**
 * Check if a path is an original file path
 *
 * @deprecated Use isPathOfType from '@/lib/gcs-paths' instead
 */
export function isOriginalPath(path: string): boolean {
  return isPathOfType(path, 'original');
}

/**
 * Convert an original path to a parsed path
 * Changes /original/ to /parsed/ and adds .md extension
 *
 * @deprecated Use originalToParsedPath from '@/lib/gcs-paths' instead
 */
export function originalToParsedPath(originalPath: string): string {
  const result = _originalToParsedPath(originalPath);
  return result ?? originalPath;
}
