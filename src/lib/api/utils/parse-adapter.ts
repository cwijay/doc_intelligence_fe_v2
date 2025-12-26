/**
 * Adapter utilities for normalizing parse responses between APIs
 * Converts Ingest API responses to DocumentParseResponse format
 * for backward compatibility with existing UI components
 */

import { DocumentParseResponse, IngestParseResponse } from '@/types/api';

/**
 * Converts IngestParseResponse to DocumentParseResponse format
 * for backward compatibility with existing UI components (DocumentParseModal)
 */
export function adaptIngestParseResponse(
  ingestResponse: IngestParseResponse,
  originalFilePath: string
): DocumentParseResponse {
  // Calculate content length
  const contentLength = ingestResponse.parsed_content?.length || 0;

  // Extract extraction time in seconds
  const extractionTimeSeconds = ingestResponse.extraction_time_ms
    ? ingestResponse.extraction_time_ms / 1000
    : 0;

  // Construct parsed storage path from output_path or derive from file_path
  const parsedStoragePath =
    ingestResponse.output_path ||
    originalFilePath.replace('/original/', '/parsed/').replace(/\.[^.]+$/, '.md');

  return {
    success: ingestResponse.success,
    storage_path: ingestResponse.file_path,
    parsed_storage_path: parsedStoragePath,
    parsed_content: ingestResponse.parsed_content || '',
    parsing_metadata: {
      total_pages: ingestResponse.pages || 1,
      has_headers: false, // Ingest API doesn't provide this
      has_footers: false, // Ingest API doesn't provide this
      content_length: contentLength,
      parsing_duration: extractionTimeSeconds,
    },
    gcs_metadata: {
      size: contentLength, // Approximate from content
      content_type: getContentType(ingestResponse.format),
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    },
    file_info: {
      original_size: 0, // Not provided by Ingest API
      parsed_size: contentLength,
      file_type: ingestResponse.format,
      content_type: getContentType(ingestResponse.format),
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Get content type based on format
 */
function getContentType(format: string): string {
  switch (format) {
    case 'markdown':
      return 'text/markdown';
    case 'text':
      return 'text/plain';
    case 'json':
      return 'application/json';
    default:
      return 'text/plain';
  }
}

/**
 * Check if an error indicates a connection failure
 * (used to determine if fallback should be attempted)
 */
export function isConnectionError(error: any): boolean {
  // Check for specific error codes
  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
    return true;
  }

  // Check for network error messages
  if (error.message?.includes('Network Error')) {
    return true;
  }
  if (error.message?.includes('ERR_NETWORK')) {
    return true;
  }
  if (error.message?.includes('Cannot connect to ingestion service')) {
    return true;
  }

  // Check for axios specific patterns - request made but no response received
  if (!error.response && error.request) {
    return true;
  }

  return false;
}
