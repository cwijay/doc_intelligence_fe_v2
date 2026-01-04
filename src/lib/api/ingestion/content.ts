/**
 * Content API operations for loading pre-parsed documents
 *
 * This module provides functions to load pre-parsed document content from GCS
 * when the document has already been parsed but parsing times out on retry.
 */
import { AxiosResponse } from 'axios';
import aiApi from '@/lib/api/ai-base';
import {
  LoadParsedRequest,
  LoadParsedResponse,
  CheckParsedExistsResponse,
  Document,
} from '@/types/api';
import { TIMEOUTS } from '@/lib/constants';

/**
 * Load pre-parsed content from GCS
 *
 * @param request - The load parsed request with org_name, folder_name, document_name
 * @returns LoadParsedResponse matching DocumentParseResponse format
 * @throws Error with 404 if parsed content doesn't exist
 */
export async function loadParsedContent(
  request: LoadParsedRequest
): Promise<LoadParsedResponse> {
  console.log('📂 Loading parsed content from GCS:', request);

  try {
    const response: AxiosResponse<LoadParsedResponse> = await aiApi.post(
      '/api/v1/content/load-parsed',
      request,
      { timeout: TIMEOUTS.RAG_API }
    );

    if (!response.data.success) {
      throw new Error('Failed to load parsed content');
    }

    console.log('✅ Loaded parsed content:', {
      path: response.data.parsed_storage_path,
      contentLength: response.data.parsed_content?.length,
    });

    return response.data;
  } catch (error: any) {
    // Check for 404 - parsed content not found
    if (error.response?.status === 404) {
      console.warn('⚠️ Parsed content not found:', request);
      throw new Error('Parsed content not found. Please parse the document first.');
    }

    console.error('🚫 Failed to load parsed content:', error);
    throw error;
  }
}

/**
 * Check if parsed content exists in GCS (lightweight check)
 *
 * @param orgName - Organization name
 * @param folderName - Folder name
 * @param documentName - Document name
 * @returns CheckParsedExistsResponse with exists boolean and path
 */
export async function checkParsedExists(
  orgName: string,
  folderName: string,
  documentName: string
): Promise<CheckParsedExistsResponse> {
  try {
    const response: AxiosResponse<CheckParsedExistsResponse> = await aiApi.get(
      '/api/v1/content/check-parsed',
      {
        params: {
          org_name: orgName,
          folder_name: folderName,
          document_name: documentName,
        },
        timeout: TIMEOUTS.RAG_API,
      }
    );

    return response.data;
  } catch (error) {
    console.error('🚫 Failed to check parsed existence:', error);
    return { exists: false, path: '' };
  }
}

/**
 * Helper to construct LoadParsedRequest from document metadata
 *
 * @param document - The document object
 * @param orgName - Organization name
 * @param folderName - Folder name
 * @returns LoadParsedRequest ready for API call
 */
export function createLoadParsedRequest(
  document: Document,
  orgName: string,
  folderName: string
): LoadParsedRequest {
  return {
    org_name: orgName,
    folder_name: folderName || 'default',
    document_name: document.name,
  };
}
