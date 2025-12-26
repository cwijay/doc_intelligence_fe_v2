/**
 * Document ingestion operations
 */
import { AxiosResponse } from 'axios';
import { ingestApi } from './clients';
import { clientConfig } from '../../config';
import { mergeMetadata } from '../../content-metadata';
import { STORAGE_PATHS, FILE_EXTENSIONS } from '@/lib/constants';
import {
  IngestRequest,
  IngestResponse,
  JobStatusResponse,
  Document,
  IngestParseRequest,
  IngestParseResponse,
  ParseOptions
} from '@/types/api';

/**
 * Construct GCS path for parsed document
 * Format: {org_name}/parsed/{folder_name}/{document_name}.md
 */
export function constructGCSPath(document: Document, orgName: string, folderName?: string): string {
  const cleanFolderName = folderName || 'default';

  // Strip the original file extension and add .md
  const lastDotIndex = document.name.lastIndexOf('.');
  const nameWithoutExtension = lastDotIndex > 0
    ? document.name.substring(0, lastDotIndex)
    : document.name;
  const markdownFileName = `${nameWithoutExtension}${FILE_EXTENSIONS.PARSED}`;

  const gcsPath = `${orgName}/${STORAGE_PATHS.PARSED_FOLDER}/${cleanFolderName}/${markdownFileName}`;

  console.log('🏗️ Constructing GCS path for ingestion:', {
    orgName,
    folderName: cleanFolderName,
    originalName: document.name,
    markdownName: markdownFileName,
    gcsPath
  });

  return gcsPath;
}

/**
 * Construct GCS URI (gs:// format)
 * Used for document parsing to provide the backend with the complete storage location
 */
export function constructGcsFileUrl(
  storagePath: string | undefined,
  orgName: string,
  folderName: string,
  fileName: string
): string {
  const { gcsBucketName } = clientConfig;

  if (!gcsBucketName) {
    throw new Error('GCS bucket name not configured. Set NEXT_PUBLIC_GCS_BUCKET_NAME environment variable.');
  }

  let relativePath: string;
  if (storagePath) {
    relativePath = storagePath;
  } else {
    relativePath = `${orgName}/${STORAGE_PATHS.ORIGINAL_FOLDER}/${folderName}/${fileName}`;
  }

  const gcsUri = `${STORAGE_PATHS.GCS_PREFIX}${gcsBucketName}/${relativePath}`;

  console.log('🔗 Constructed GCS URI:', {
    storagePath,
    relativePath,
    gcsUri
  });

  return gcsUri;
}

export const ingestionApi = {
  /**
   * Ingest a single document into the hybrid search index
   */
  ingestDocument: async (
    document: Document & { extractedMetadata?: any },
    orgName: string,
    folderName?: string,
    editedContent?: string
  ): Promise<IngestResponse> => {
    console.log('🔍 Starting document ingestion:', {
      documentName: document.name,
      documentId: document.id,
      orgName,
      folderName
    });

    try {
      const gcsPath = constructGCSPath(document, orgName, folderName);

      const baseMetadata = {
        document_id: document.id,
        document_name: document.name,
        content_type: document.type,
        updated_at: new Date().toISOString(),
        ...(document.folder_id && { folder_id: document.folder_id })
      };

      const enhancedMetadata: Record<string, unknown> = document.extractedMetadata
        ? mergeMetadata(baseMetadata, document.extractedMetadata)
        : { ...baseMetadata };

      if (editedContent) {
        enhancedMetadata.content_edited = true;
        enhancedMetadata.content_length = editedContent.length;
        enhancedMetadata.content_edited_at = new Date().toISOString();
      }

      const requestData: IngestRequest = {
        gcs_path: gcsPath,
        organization: orgName,
        folder: folderName,
        metadata: enhancedMetadata,
        replace_existing: true,
        user_reviewed: true
      };

      console.log('📤 Ingestion request payload:', requestData);

      const response: AxiosResponse<IngestResponse> = await ingestApi.post('/', requestData);

      console.log('✅ Document ingestion initiated successfully:', {
        jobId: response.data.job_id,
        status: response.data.status,
        message: response.data.message
      });

      return response.data;
    } catch (error) {
      console.error('🚫 Document ingestion failed:', error);
      throw error;
    }
  },

  /**
   * Get the status of an ingestion job
   */
  getJobStatus: async (jobId: string): Promise<JobStatusResponse> => {
    if (!jobId) {
      throw new Error('Job ID is required to check ingestion status');
    }

    try {
      console.log('🔍 Checking ingestion job status:', jobId);

      const response: AxiosResponse<JobStatusResponse> = await ingestApi.get(`/status/${jobId}`);

      console.log('📊 Job status received:', {
        jobId: response.data.job_id,
        status: response.data.status,
        progress: response.data.progress,
        document: response.data.document
      });

      return response.data;
    } catch (error) {
      console.error('🚫 Failed to get job status:', error);
      throw error;
    }
  },

  /**
   * Test connection to ingestion API
   */
  testConnection: async (): Promise<boolean> => {
    try {
      console.log('🔌 Testing ingestion API connection...');

      const response = await ingestApi.get('/health').catch(() => {
        return ingestApi.get('/');
      });

      console.log('✅ Ingestion API connection successful:', {
        status: response.status,
        baseURL: ingestApi.defaults.baseURL
      });

      return true;
    } catch (error) {
      console.warn('⚠️ Ingestion API connection failed:', {
        error: error instanceof Error ? error.message : String(error),
        baseURL: ingestApi.defaults.baseURL
      });

      return false;
    }
  },

  /**
   * Parse a document using the Ingest API (LlamaParse)
   */
  parseDocument: async (
    document: Document,
    orgName: string,
    folderName?: string,
    options: ParseOptions = {}
  ): Promise<IngestParseResponse> => {
    if (!document) {
      throw new Error('Document is required for parsing');
    }

    if (!orgName) {
      throw new Error('Organization name is required for parsing');
    }

    const cleanFolderName = folderName || 'default';

    const filePath = constructGcsFileUrl(
      document.storage_path || document.gcs_path || document.path,
      orgName,
      cleanFolderName,
      document.name
    );

    console.log('📄 Starting Ingest API parse:', {
      documentName: document.name,
      documentId: document.id,
      orgName,
      folderName: cleanFolderName,
      filePath,
      originalStoragePath: document.storage_path
    });

    try {
      const requestData: IngestParseRequest = {
        file_path: filePath,
        folder_name: cleanFolderName,
        output_format: options.outputFormat || 'markdown',
        save_to_parsed: options.saveToParsed !== false
      };

      console.log('📤 Ingest parse request:', requestData);

      const response: AxiosResponse<IngestParseResponse> = await ingestApi.post('/parse', requestData);

      if (!response.data.success) {
        throw new Error(response.data.error || 'Document parsing failed');
      }

      console.log('✅ Ingest API parse successful:', {
        filePath: response.data.file_path,
        outputPath: response.data.output_path,
        pages: response.data.pages,
        format: response.data.format,
        extractionTimeMs: response.data.extraction_time_ms
      });

      return response.data;
    } catch (error: any) {
      const errorInfo = {
        documentName: document.name,
        filePath,
        message: error.message || 'Unknown error',
        status: error.response?.status ?? 'No status',
        responseData: error.response?.data ?? null,
        code: error.code || 'UNKNOWN'
      };
      console.error('🚫 Ingest API parse failed:', JSON.stringify(errorInfo, null, 2));
      throw error;
    }
  }
};

export default ingestionApi;
