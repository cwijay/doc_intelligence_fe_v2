/**
 * Centralized GCS path construction utility.
 *
 * This module is the SINGLE SOURCE OF TRUTH for all GCS path construction.
 * All path construction should use these functions to ensure consistency
 * across the application.
 *
 * Path Structure:
 * - Original:   {org_name}/original/{folder_name}/{document_name}.ext
 * - Parsed:     {org_name}/parsed/{folder_name}/{document_name}.md
 * - Summary:    {org_name}/summary/{folder_name}/{document_name}.md
 * - FAQ:        {org_name}/faq/{folder_name}/{document_name}.json
 * - Questions:  {org_name}/questions/{folder_name}/{document_name}.json
 */

// =============================================================================
// Types and Constants
// =============================================================================

/** Supported content types for GCS storage */
export type GCSContentType =
  | 'original'
  | 'parsed'
  | 'summary'
  | 'faq'
  | 'questions';

/** Folder names for each content type */
export const CONTENT_TYPE_FOLDERS: Record<GCSContentType, string> = {
  original: 'original',
  parsed: 'parsed',
  summary: 'summary',
  faq: 'faq', // Note: singular, not 'faqs'
  questions: 'questions',
} as const;

/** File extension mapping for each content type */
const CONTENT_TYPE_EXTENSIONS: Record<GCSContentType, string> = {
  original: '', // Keeps original extension
  parsed: '.md',
  summary: '.md',
  faq: '.json',
  questions: '.json',
};

/** Path construction parameters */
export interface PathParams {
  orgName: string;
  folderName: string;
  documentName: string;
}

/** Complete set of document paths */
export interface DocumentPaths {
  original: string;
  parsed: string;
  summary: string;
  faq: string;
  questions: string;
}

/** Path validation result */
export interface PathValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedPath?: string;
}

/** Parsed path components */
export interface ParsedPathComponents {
  orgName: string;
  contentType: GCSContentType | null;
  folderName: string;
  fileName: string;
}

// =============================================================================
// Core Path Construction Functions
// =============================================================================

/**
 * Get document base name without extension.
 *
 * @example
 * getBaseName('report.pdf') // 'report'
 * getBaseName('data.xlsx') // 'data'
 * getBaseName('file') // 'file'
 */
export function getBaseName(documentName: string): string {
  const lastDotIndex = documentName.lastIndexOf('.');
  return lastDotIndex > 0 ? documentName.substring(0, lastDotIndex) : documentName;
}

/**
 * Get file extension including the dot.
 *
 * @example
 * getExtension('report.pdf') // '.pdf'
 * getExtension('file') // ''
 */
export function getExtension(documentName: string): string {
  const lastDotIndex = documentName.lastIndexOf('.');
  return lastDotIndex > 0 ? documentName.substring(lastDotIndex) : '';
}

/**
 * Construct a GCS path for a specific content type.
 *
 * @example
 * constructPath({ orgName: 'Acme Corp', folderName: 'invoices', documentName: 'doc.pdf' }, 'original')
 * // 'Acme Corp/original/invoices/doc.pdf'
 *
 * constructPath({ orgName: 'Acme Corp', folderName: 'invoices', documentName: 'doc.pdf' }, 'parsed')
 * // 'Acme Corp/parsed/invoices/doc.md'
 *
 * constructPath({ orgName: 'Acme Corp', folderName: 'invoices', documentName: 'doc.pdf' }, 'faq')
 * // 'Acme Corp/faq/invoices/doc.json'
 */
export function constructPath(
  params: PathParams,
  contentType: GCSContentType
): string {
  const { orgName, folderName, documentName } = params;
  const baseName = getBaseName(documentName);
  const folder = CONTENT_TYPE_FOLDERS[contentType];
  const extension = CONTENT_TYPE_EXTENSIONS[contentType];

  if (contentType === 'original') {
    // Original files keep their extension
    return `${orgName}/${folder}/${folderName}/${documentName}`;
  }

  return `${orgName}/${folder}/${folderName}/${baseName}${extension}`;
}

/**
 * Construct all document paths at once.
 *
 * @example
 * constructAllPaths({ orgName: 'Acme Corp', folderName: 'invoices', documentName: 'doc.pdf' })
 * // {
 * //   original: 'Acme Corp/original/invoices/doc.pdf',
 * //   parsed: 'Acme Corp/parsed/invoices/doc.md',
 * //   summary: 'Acme Corp/summary/invoices/doc.md',
 * //   faq: 'Acme Corp/faq/invoices/doc.json',
 * //   questions: 'Acme Corp/questions/invoices/doc.json'
 * // }
 */
export function constructAllPaths(params: PathParams): DocumentPaths {
  return {
    original: constructPath(params, 'original'),
    parsed: constructPath(params, 'parsed'),
    summary: constructPath(params, 'summary'),
    faq: constructPath(params, 'faq'),
    questions: constructPath(params, 'questions'),
  };
}

// =============================================================================
// Convenience Functions for Each Content Type
// =============================================================================

/** Construct original file path */
export const constructOriginalPath = (params: PathParams): string =>
  constructPath(params, 'original');

/** Construct parsed document path */
export const constructParsedPath = (params: PathParams): string =>
  constructPath(params, 'parsed');

/** Construct summary path */
export const constructSummaryPath = (params: PathParams): string =>
  constructPath(params, 'summary');

/** Construct FAQ path */
export const constructFAQPath = (params: PathParams): string =>
  constructPath(params, 'faq');

/** Construct questions path */
export const constructQuestionsPath = (params: PathParams): string =>
  constructPath(params, 'questions');

// =============================================================================
// GCS URI Construction
// =============================================================================

/**
 * Construct a full GCS URI from bucket and path.
 *
 * @example
 * constructGcsUri('my-bucket', 'Acme Corp/parsed/invoices/doc.md')
 * // 'gs://my-bucket/Acme Corp/parsed/invoices/doc.md'
 */
export function constructGcsUri(bucket: string, path: string): string {
  return `gs://${bucket}/${path}`;
}

/**
 * Construct a full GCS URI for a specific content type.
 *
 * @example
 * constructGcsUriForContent('my-bucket', params, 'parsed')
 * // 'gs://my-bucket/Acme Corp/parsed/invoices/doc.md'
 */
export function constructGcsUriForContent(
  bucket: string,
  params: PathParams,
  contentType: GCSContentType
): string {
  const path = constructPath(params, contentType);
  return constructGcsUri(bucket, path);
}

// =============================================================================
// Path Validation Functions
// =============================================================================

/**
 * Validate a GCS path for security and format compliance.
 *
 * @example
 * validatePath('Acme Corp/parsed/invoices/doc.md')
 * // { isValid: true, errors: [], sanitizedPath: 'Acme Corp/parsed/invoices/doc.md' }
 *
 * validatePath('../etc/passwd')
 * // { isValid: false, errors: ['Path cannot contain directory traversal sequences (..)'] }
 */
export function validatePath(path: string): PathValidationResult {
  const errors: string[] = [];

  if (!path || !path.trim()) {
    errors.push('Path cannot be empty');
    return { isValid: false, errors };
  }

  if (path.includes('..')) {
    errors.push('Path cannot contain directory traversal sequences (..)');
  }

  if (path.startsWith('/')) {
    errors.push('Path cannot start with a leading slash');
  }

  if (path.includes('\\')) {
    errors.push('Path cannot contain backslashes');
  }

  if (path.includes('\x00') || path.includes('\r') || path.includes('\n')) {
    errors.push('Path contains invalid characters');
  }

  // Check for double slashes
  if (path.includes('//')) {
    errors.push('Path cannot contain double slashes');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedPath: errors.length === 0 ? path.trim() : undefined,
  };
}

/**
 * Validate path parameters before construction.
 *
 * @example
 * validatePathParams({ orgName: 'Acme Corp', folderName: 'invoices', documentName: 'doc.pdf' })
 * // { isValid: true, errors: [] }
 */
export function validatePathParams(params: PathParams): PathValidationResult {
  const errors: string[] = [];

  if (!params.orgName || !params.orgName.trim()) {
    errors.push('Organization name is required');
  }

  if (!params.folderName || !params.folderName.trim()) {
    errors.push('Folder name is required');
  }

  if (!params.documentName || !params.documentName.trim()) {
    errors.push('Document name is required');
  }

  // Check for path traversal in each component
  const components = [params.orgName, params.folderName, params.documentName];
  for (const comp of components) {
    if (comp && comp.includes('..')) {
      errors.push(`Path traversal detected in component: ${comp}`);
    }
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validate that a path matches expected content type format.
 */
export function validateContentTypePath(
  path: string,
  expectedType: GCSContentType
): PathValidationResult {
  const baseValidation = validatePath(path);
  if (!baseValidation.isValid) {
    return baseValidation;
  }

  const errors: string[] = [];
  const expectedFolder = CONTENT_TYPE_FOLDERS[expectedType];

  // Check path contains the expected folder
  if (!path.includes(`/${expectedFolder}/`)) {
    errors.push(
      `Path does not contain expected folder '${expectedFolder}'. Expected format: {org_name}/${expectedFolder}/{folder_name}/{filename}`
    );
  }

  // Check file extension for non-original types
  if (expectedType !== 'original') {
    const expectedExtension = CONTENT_TYPE_EXTENSIONS[expectedType];
    if (!path.endsWith(expectedExtension)) {
      errors.push(`Path should end with '${expectedExtension}' for ${expectedType} content`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedPath: errors.length === 0 ? path : undefined,
  };
}

// =============================================================================
// Path Parsing Functions
// =============================================================================

/**
 * Extract components from a GCS path.
 *
 * @example
 * parsePath('Acme Corp/parsed/invoices/doc.md')
 * // { orgName: 'Acme Corp', contentType: 'parsed', folderName: 'invoices', fileName: 'doc.md' }
 */
export function parsePath(path: string): ParsedPathComponents | null {
  const parts = path.split('/');
  if (parts.length < 4) return null;

  const [orgName, contentTypeStr, folderName, ...rest] = parts;
  const fileName = rest.join('/');

  const validContentTypes: GCSContentType[] = [
    'original',
    'parsed',
    'summary',
    'faq',
    'questions',
  ];
  const contentType = validContentTypes.includes(contentTypeStr as GCSContentType)
    ? (contentTypeStr as GCSContentType)
    : null;

  return { orgName, contentType, folderName, fileName };
}

/**
 * Check if a path is for a specific content type.
 *
 * @example
 * isPathOfType('Acme Corp/parsed/invoices/doc.md', 'parsed') // true
 * isPathOfType('Acme Corp/parsed/invoices/doc.md', 'original') // false
 */
export function isPathOfType(path: string, contentType: GCSContentType): boolean {
  const parsed = parsePath(path);
  return parsed?.contentType === contentType;
}

/**
 * Extract organization name from a path.
 *
 * @example
 * extractOrgName('Acme Corp/parsed/invoices/doc.md') // 'Acme Corp'
 */
export function extractOrgName(path: string): string | null {
  const parsed = parsePath(path);
  return parsed?.orgName ?? null;
}

/**
 * Extract folder name from a path.
 *
 * @example
 * extractFolderName('Acme Corp/parsed/invoices/doc.md') // 'invoices'
 */
export function extractFolderName(path: string): string | null {
  const parsed = parsePath(path);
  return parsed?.folderName ?? null;
}

/**
 * Extract content type from a path.
 *
 * @example
 * extractContentType('Acme Corp/parsed/invoices/doc.md') // 'parsed'
 */
export function extractContentType(path: string): GCSContentType | null {
  const parsed = parsePath(path);
  return parsed?.contentType ?? null;
}

// =============================================================================
// Path Conversion Functions
// =============================================================================

/**
 * Convert a path from one content type to another.
 *
 * @example
 * convertPathType('Acme Corp/original/invoices/doc.pdf', 'parsed')
 * // 'Acme Corp/parsed/invoices/doc.md'
 *
 * convertPathType('Acme Corp/parsed/invoices/doc.md', 'faq')
 * // 'Acme Corp/faq/invoices/doc.json'
 */
export function convertPathType(
  sourcePath: string,
  targetType: GCSContentType
): string | null {
  const parsed = parsePath(sourcePath);
  if (!parsed) return null;

  const { orgName, folderName, fileName } = parsed;
  const baseName = getBaseName(fileName);

  const params: PathParams = {
    orgName,
    folderName,
    documentName: baseName + getExtension(fileName),
  };

  return constructPath(params, targetType);
}

/**
 * Convert an original path to a parsed path.
 *
 * @example
 * originalToParsedPath('Acme Corp/original/invoices/doc.pdf')
 * // 'Acme Corp/parsed/invoices/doc.md'
 */
export function originalToParsedPath(originalPath: string): string | null {
  return convertPathType(originalPath, 'parsed');
}

/**
 * Convert a parsed path to a summary path.
 *
 * @example
 * parsedToSummaryPath('Acme Corp/parsed/invoices/doc.md')
 * // 'Acme Corp/summary/invoices/doc.md'
 */
export function parsedToSummaryPath(parsedPath: string): string | null {
  return convertPathType(parsedPath, 'summary');
}

/**
 * Convert a parsed path to a FAQ path.
 *
 * @example
 * parsedToFAQPath('Acme Corp/parsed/invoices/doc.md')
 * // 'Acme Corp/faq/invoices/doc.json'
 */
export function parsedToFAQPath(parsedPath: string): string | null {
  return convertPathType(parsedPath, 'faq');
}

/**
 * Convert a parsed path to a questions path.
 *
 * @example
 * parsedToQuestionsPath('Acme Corp/parsed/invoices/doc.md')
 * // 'Acme Corp/questions/invoices/doc.json'
 */
export function parsedToQuestionsPath(parsedPath: string): string | null {
  return convertPathType(parsedPath, 'questions');
}

// =============================================================================
// GCS URI Utilities
// =============================================================================

/**
 * Check if a string is a GCS URI (starts with gs://).
 *
 * @example
 * isGcsUri('gs://bucket/path') // true
 * isGcsUri('Acme Corp/parsed/doc.md') // false
 */
export function isGcsUri(path: string): boolean {
  return path.startsWith('gs://');
}

/**
 * Parse a GCS URI into bucket and path components.
 *
 * @example
 * parseGcsUri('gs://my-bucket/Acme Corp/parsed/doc.md')
 * // { bucket: 'my-bucket', path: 'Acme Corp/parsed/doc.md' }
 */
export function parseGcsUri(uri: string): { bucket: string; path: string } | null {
  if (!isGcsUri(uri)) return null;

  const withoutPrefix = uri.slice(5); // Remove 'gs://'
  const slashIndex = withoutPrefix.indexOf('/');

  if (slashIndex === -1) {
    return { bucket: withoutPrefix, path: '' };
  }

  return {
    bucket: withoutPrefix.slice(0, slashIndex),
    path: withoutPrefix.slice(slashIndex + 1),
  };
}

/**
 * Strip GCS URI prefix to get just the path.
 *
 * @example
 * stripGcsPrefix('gs://bucket/Acme Corp/parsed/doc.md')
 * // 'Acme Corp/parsed/doc.md'
 */
export function stripGcsPrefix(uri: string): string {
  const parsed = parseGcsUri(uri);
  return parsed?.path ?? uri;
}
