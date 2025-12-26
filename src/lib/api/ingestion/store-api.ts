/**
 * Gemini File Search Store API operations
 */
import { AxiosResponse } from 'axios';
import { ragApi, ingestApi } from './clients';
import { StoreUploadResponse, SaveAndIndexRequest, SaveAndIndexResponse, GeminiStoreInfo } from '@/types/rag';

/**
 * Upload a document to the Gemini File Search store
 * Uses the auto store creation endpoint that creates/reuses org-specific stores
 */
export async function uploadToGeminiStore(params: {
  parsedGcsPath: string;
  orgName: string;
  folderName?: string;
  originalGcsPath?: string;
  parserVersion?: string;
}): Promise<StoreUploadResponse> {
  console.log('🚀 Uploading to Gemini File Search store:', {
    parsedGcsPath: params.parsedGcsPath,
    orgName: params.orgName,
    folderName: params.folderName,
  });

  const response: AxiosResponse<StoreUploadResponse> = await ragApi.post(
    '/api/v1/rag/stores/auto/upload',
    {
      file_paths: [params.parsedGcsPath],
      org_name: params.orgName,
      folder_name: params.folderName,
      original_gcs_paths: params.originalGcsPath ? [params.originalGcsPath] : undefined,
      parser_version: params.parserVersion || 'llama_parse_v2.5',
    }
  );

  console.log('✅ Gemini store upload response:', {
    success: response.data.success,
    storeId: response.data.store_id,
    storeName: response.data.store_name,
    uploaded: response.data.uploaded,
    skipped: response.data.skipped,
  });

  return response.data;
}

/**
 * Save parsed/edited content to GCS and index in Gemini File Search store
 * This is a single API call that combines saving and indexing operations
 */
export async function saveAndIndexDocument(params: SaveAndIndexRequest): Promise<SaveAndIndexResponse> {
  console.log('💾 Saving and indexing document:', {
    targetPath: params.target_path,
    orgName: params.org_name,
    folderName: params.folder_name,
    originalFilename: params.original_filename,
    contentLength: params.content.length,
  });

  const response: AxiosResponse<SaveAndIndexResponse> = await ingestApi.post(
    '/save-and-index',
    {
      content: params.content,
      target_path: params.target_path,
      org_name: params.org_name,
      folder_name: params.folder_name,
      original_filename: params.original_filename,
      original_gcs_path: params.original_gcs_path,
      parser_version: params.parser_version || 'llama_parse_v2.5',
      metadata: params.metadata,
    }
  );

  console.log('✅ Save and index response:', {
    success: response.data.success,
    savedPath: response.data.saved_path,
    storeId: response.data.store_id,
    storeName: response.data.store_name,
    indexed: response.data.indexed,
    message: response.data.message,
  });

  if (!response.data.success) {
    throw new Error(response.data.error || 'Failed to save and index document');
  }

  return response.data;
}

/**
 * Get the organization's Gemini File Search store
 * Returns the store info if exists, or null if no store found
 */
export async function getOrgStore(): Promise<GeminiStoreInfo | null> {
  try {
    console.log('🔍 Fetching org store...');

    const response: AxiosResponse<{
      success: boolean;
      stores: GeminiStoreInfo[];
      count: number;
      error?: string;
    }> = await ragApi.get('/api/v1/rag/stores');

    if (response.data.success && response.data.stores.length > 0) {
      const store = response.data.stores[0]; // Org has one store
      console.log('✅ Found org store:', store.store_id);
      return store;
    }

    console.log('ℹ️ No store found for organization');
    return null;
  } catch (error) {
    console.error('🚫 Failed to fetch org store:', error);
    return null;
  }
}
