/**
 * Bulk Upload API module
 * Handles bulk file uploads and job status polling
 */

import { AxiosResponse } from 'axios';
import aiApi from './ai-base';
import { authService } from '@/lib/auth';

// =============================================================================
// Types
// =============================================================================

export interface UploadedFileInfo {
  filename: string;
  original_filename: string;
  size_bytes: number;
  gcs_path: string;
  document_id: string;
}

export interface FailedFileInfo {
  filename: string;
  error: string;
}

export interface BulkUploadResponse {
  success: boolean;
  job_id: string | null;
  folder_name: string;
  total_documents: number;
  uploaded_files: UploadedFileInfo[];
  failed_files: FailedFileInfo[];
  status: 'pending' | 'processing' | 'completed' | 'partial_failure' | 'failed' | 'cancelled' | null;
  message: string;
}

export interface BulkJobInfo {
  id: string;
  organization_id: string;
  folder_name: string;
  source_path: string;
  total_documents: number;
  completed_count: number;
  failed_count: number;
  skipped_count: number;
  status: string;
  created_at: string;
  updated_at: string;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
}

export interface DocumentItemInfo {
  id: string;
  original_filename: string;
  status: string;
  error_message?: string;
  parsed_path?: string;
  parse_time_ms?: number;
  index_time_ms?: number;
  generation_time_ms?: number;
  total_time_ms?: number;
}

export interface BulkJobStatusResponse {
  success: boolean;
  job: BulkJobInfo;
  documents?: DocumentItemInfo[];
  progress_percentage: number;
  estimated_remaining_seconds?: number;
}

export interface BulkUploadOptions {
  folderName: string;
  orgName: string;
  files: File[];
  generateSummary?: boolean;
  generateFaqs?: boolean;
  generateQuestions?: boolean;
  numFaqs?: number;
  numQuestions?: number;
  summaryMaxWords?: number;
  autoStart?: boolean;
  onUploadProgress?: (progress: number) => void;
}

export type BulkUploadResult =
  | { success: true; response: BulkUploadResponse }
  | { success: false; error: string };

// =============================================================================
// API Functions
// =============================================================================

export const bulkApi = {
  /**
   * Upload multiple files for bulk processing
   */
  upload: async (options: BulkUploadOptions): Promise<BulkUploadResult> => {
    const currentUser = authService.getUser();
    if (!currentUser) {
      return { success: false, error: 'No authenticated user found. Please login first.' };
    }

    if (!options.folderName || !options.folderName.trim()) {
      return { success: false, error: 'Folder name is required' };
    }

    if (!options.orgName || !options.orgName.trim()) {
      return { success: false, error: 'Organization name is required' };
    }

    if (!options.files || options.files.length === 0) {
      return { success: false, error: 'At least one file is required' };
    }

    if (options.files.length > 10) {
      return { success: false, error: 'Maximum 10 files allowed per upload' };
    }

    try {
      const formData = new FormData();

      // Add form fields
      formData.append('folder_name', options.folderName.trim());
      formData.append('org_name', options.orgName.trim());
      formData.append('generate_summary', String(options.generateSummary ?? true));
      formData.append('generate_faqs', String(options.generateFaqs ?? true));
      formData.append('generate_questions', String(options.generateQuestions ?? true));
      formData.append('num_faqs', String(options.numFaqs ?? 10));
      formData.append('num_questions', String(options.numQuestions ?? 10));
      formData.append('summary_max_words', String(options.summaryMaxWords ?? 500));
      formData.append('auto_start', String(options.autoStart ?? true));

      // Add files
      for (const file of options.files) {
        formData.append('files', file);
      }

      const response: AxiosResponse<BulkUploadResponse> = await aiApi.post(
        '/api/v1/bulk/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            if (options.onUploadProgress && progressEvent.total) {
              const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              options.onUploadProgress(progress);
            }
          },
        }
      );

      return { success: true, response: response.data };
    } catch (error: any) {
      console.error('Bulk upload error:', error);

      // Extract error message
      let errorMessage = 'Upload failed. Please try again.';

      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        if (error.message.includes('Network Error') || error.code === 'ERR_NETWORK') {
          errorMessage = 'Cannot connect to the server. Please check your connection.';
        } else if (error.message.includes('timeout') || error.code === 'ECONNABORTED') {
          errorMessage = 'Upload timed out. Please try again with fewer files.';
        } else {
          errorMessage = error.message;
        }
      }

      return { success: false, error: errorMessage };
    }
  },

  /**
   * Get bulk job status with optional document details
   */
  getJobStatus: async (
    jobId: string,
    includeDocuments: boolean = false
  ): Promise<BulkJobStatusResponse> => {
    const currentUser = authService.getUser();
    if (!currentUser) {
      throw new Error('No authenticated user found. Please login first.');
    }

    const params = includeDocuments ? { include_documents: 'true' } : {};

    const response: AxiosResponse<BulkJobStatusResponse> = await aiApi.get(
      `/api/v1/bulk/jobs/${jobId}`,
      { params }
    );

    return response.data;
  },

  /**
   * List bulk jobs for the organization
   */
  listJobs: async (
    status?: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<{ jobs: BulkJobInfo[]; total: number }> => {
    const currentUser = authService.getUser();
    if (!currentUser) {
      throw new Error('No authenticated user found. Please login first.');
    }

    const params: Record<string, any> = { limit, offset };
    if (status) {
      params.status = status;
    }

    const response: AxiosResponse<{
      success: boolean;
      jobs: BulkJobInfo[];
      total: number;
    }> = await aiApi.get('/api/v1/bulk/jobs', { params });

    return {
      jobs: response.data.jobs,
      total: response.data.total,
    };
  },

  /**
   * Cancel a running bulk job
   */
  cancelJob: async (jobId: string): Promise<{ success: boolean; message: string }> => {
    const currentUser = authService.getUser();
    if (!currentUser) {
      throw new Error('No authenticated user found. Please login first.');
    }

    const response: AxiosResponse<{
      success: boolean;
      job_id: string;
      message: string;
    }> = await aiApi.post(`/api/v1/bulk/jobs/${jobId}/cancel`);

    return {
      success: response.data.success,
      message: response.data.message,
    };
  },

  /**
   * Retry failed documents in a bulk job
   */
  retryFailed: async (
    jobId: string,
    documentIds?: string[]
  ): Promise<{ success: boolean; retried_count: number; message: string }> => {
    const currentUser = authService.getUser();
    if (!currentUser) {
      throw new Error('No authenticated user found. Please login first.');
    }

    const body = documentIds ? { document_ids: documentIds } : {};

    const response: AxiosResponse<{
      success: boolean;
      retried_count: number;
      message: string;
    }> = await aiApi.post(`/api/v1/bulk/jobs/${jobId}/retry`, body);

    return response.data;
  },
};
