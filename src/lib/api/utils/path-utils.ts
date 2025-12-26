/**
 * Centralized path construction utilities for GCS storage paths
 * Consolidates path logic from ai-features, ingestion, and document actions
 */

import { STORAGE_PATHS, FILE_EXTENSIONS } from '@/lib/constants';

/**
 * Get the base name of a file (without extension)
 */
export function getBaseName(filename: string): string {
  return filename.replace(/\.[^.]+$/, '');
}

/**
 * Construct a parsed file path for AI features
 * Format: {org_name}/parsed/{folder_name}/{document_name}.md
 */
export function constructParsedFilePath(
  orgName: string,
  folderName: string,
  documentName: string
): string {
  const baseName = getBaseName(documentName);
  return `${orgName}/${STORAGE_PATHS.PARSED_FOLDER}/${folderName}/${baseName}${FILE_EXTENSIONS.PARSED}`;
}

/**
 * Construct an original file path for document storage
 * Format: {org_name}/original/{folder_name}/{file_name}
 */
export function constructOriginalFilePath(
  orgName: string,
  folderName: string,
  fileName: string
): string {
  return `${orgName}/${STORAGE_PATHS.ORIGINAL_FOLDER}/${folderName}/${fileName}`;
}

/**
 * Construct a GCS URI path
 * Format: gs://{bucket}/{path}
 */
export function constructGcsPath(bucket: string, path: string): string {
  return `${STORAGE_PATHS.GCS_PREFIX}${bucket}/${path}`;
}

/**
 * Validate a storage path for security issues
 * @throws Error if path is invalid
 */
export function validatePath(path: string): void {
  if (!path || path.trim() === '') {
    throw new Error('Path cannot be empty');
  }

  if (path.includes('..')) {
    throw new Error('Path cannot contain directory traversal sequences');
  }

  if (path.startsWith('/')) {
    throw new Error('Path cannot start with a leading slash');
  }

  if (path.includes('\\')) {
    throw new Error('Path cannot contain backslashes');
  }
}

/**
 * Validate a parsed file path specifically
 * @throws Error if path is invalid for parsed file operations
 */
export function validateParsedFilePath(path: string): void {
  validatePath(path);

  // Additional validation for parsed paths
  if (!path.includes(`/${STORAGE_PATHS.PARSED_FOLDER}/`)) {
    console.warn(`Path does not contain expected /${STORAGE_PATHS.PARSED_FOLDER}/ segment:`, path);
  }
}

/**
 * Extract folder name from a storage path
 * Handles both original and parsed path formats
 */
export function extractFolderName(storagePath: string): string | null {
  // Try parsed path format: org/parsed/folder/file
  const parsedMatch = storagePath.match(/\/parsed\/([^/]+)\//);
  if (parsedMatch) {
    return parsedMatch[1];
  }

  // Try original path format: org/original/folder/file
  const originalMatch = storagePath.match(/\/original\/([^/]+)\//);
  if (originalMatch) {
    return originalMatch[1];
  }

  return null;
}

/**
 * Extract organization name from a storage path
 */
export function extractOrgName(storagePath: string): string | null {
  const match = storagePath.match(/^([^/]+)\//);
  return match ? match[1] : null;
}

/**
 * Check if a path is a parsed file path
 */
export function isParsedPath(path: string): boolean {
  return path.includes(`/${STORAGE_PATHS.PARSED_FOLDER}/`);
}

/**
 * Check if a path is an original file path
 */
export function isOriginalPath(path: string): boolean {
  return path.includes(`/${STORAGE_PATHS.ORIGINAL_FOLDER}/`);
}

/**
 * Convert an original path to a parsed path
 * Changes /original/ to /parsed/ and adds .md extension
 */
export function originalToParsedPath(originalPath: string): string {
  const parsedPath = originalPath.replace(
    `/${STORAGE_PATHS.ORIGINAL_FOLDER}/`,
    `/${STORAGE_PATHS.PARSED_FOLDER}/`
  );

  // Add .md extension if not already present
  if (!parsedPath.endsWith(FILE_EXTENSIONS.PARSED)) {
    return getBaseName(parsedPath) + FILE_EXTENSIONS.PARSED;
  }

  return parsedPath;
}
