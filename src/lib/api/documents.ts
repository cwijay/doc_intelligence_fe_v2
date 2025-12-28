/**
 * Documents API module
 * Handles document CRUD operations, uploads, and parsing
 */

import { AxiosResponse } from 'axios';
import api from './base';
import {
  Document,
  DocumentList,
  DocumentFilters,
  DocumentUploadResponse,
  DocumentDeleteResponse,
  DuplicateFileErrorDetail,
} from '@/types/api';
import { authService } from '../auth';
import { extractErrorMessage } from './utils/error-utils';

/**
 * Result type for upload operations - avoids throwing errors which trigger Next.js error overlay
 */
export type UploadResult =
  | { success: true; document: Document }
  | { success: false; isDuplicate: true; duplicateInfo: DuplicateFileErrorDetail }
  | { success: false; isDuplicate: false; error: string };

// Storage path utility functions
const constructStoragePath = (document: Document, orgName: string, folderName?: string): string => {
  const cleanFolderName = folderName || 'default';
  return `${orgName}/original/${cleanFolderName}/${document.name}`;
};

export const documentsApi = {
  /**
   * List documents for an organization
   */
  list: async (organizationId: string, filters?: DocumentFilters): Promise<DocumentList> => {
    const currentUser = authService.getUser();
    if (!currentUser) {
      throw new Error('No authenticated user found. Please login first.');
    }

    if (currentUser.org_id !== organizationId) {
      throw new Error('Access denied: Cannot list documents from different organization.');
    }

    try {
      const response: AxiosResponse<any> = await api.get(`/documents`, {
        params: filters,
      });

      // Map backend response to frontend expected structure
      const documents = response.data.documents || response.data.items || [];
      const total = response.data.total ?? response.data.count ?? documents.length;

      return {
        documents,
        total,
        page: response.data.page || 1,
        per_page: response.data.per_page || 20,
        total_pages: response.data.total_pages || Math.ceil(total / (response.data.per_page || 20)),
      };
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Network Error') || error.message.includes('ERR_NETWORK')) {
          throw new Error('Cannot connect to the server. Please check your connection.');
        } else if (error.message.includes('401') || error.message.includes('403')) {
          throw new Error('Access denied. Please log in again to view documents.');
        }
      }
      throw error;
    }
  },

  /**
   * Upload a document to a folder
   * Returns UploadResult to avoid throwing errors that trigger Next.js error overlay
   * @param forceOverride - If true, will replace existing file with same name
   */
  upload: async (
    file: File,
    organizationId: string,
    folderId?: string,
    onUploadProgress?: (progressEvent: any) => void,
    forceOverride?: boolean
  ): Promise<UploadResult> => {
    const currentUser = authService.getUser();
    if (!currentUser) {
      return { success: false, isDuplicate: false, error: 'No authenticated user found. Please login first.' };
    }

    // Folder is required for uploads
    if (!folderId) {
      return { success: false, isDuplicate: false, error: 'Folder selection is required. The API does not support root-level document uploads.' };
    }

    try {
      // Resolve folder name
      let folderName: string | null = null;
      try {
        const response: AxiosResponse<any> = await api.get(
          `/organizations/${currentUser.org_id}/folders/${folderId}`
        );
        folderName = response.data.name;
      } catch {
        return { success: false, isDuplicate: false, error: `Unable to resolve folder (${folderId}). Upload cannot proceed.` };
      }

      // Construct target path
      const orgName = currentUser.org_name;
      const fileName = file.name;
      const targetPath = `${orgName}/original/${folderName}/${fileName}`;

      // Prepare form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('target_path', targetPath);
      formData.append('folder_id', folderId);

      // Add force_override if specified
      if (forceOverride) {
        formData.append('force_override', 'true');
      }

      // Upload document
      const response: AxiosResponse<DocumentUploadResponse> = await api.post(
        `/documents/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress,
        }
      );

      return { success: true, document: response.data.document };
    } catch (error: any) {
      // Handle 409 Conflict - duplicate file exists (return result, don't throw)
      if (error.response?.status === 409) {
        return { success: false, isDuplicate: true, duplicateInfo: error.response.data };
      }

      // Extract error message using robust utility that handles nested error structures
      const extractedMessage = extractErrorMessage(error);

      // Handle specific error types with user-friendly messages
      let errorMessage = extractedMessage;

      // Check for network-related errors
      const errorCode = error.code || '';
      const rawMessage = error.message || extractedMessage;

      if (errorCode === 'ERR_NETWORK' || rawMessage.includes('Network Error')) {
        errorMessage = 'Cannot connect to the server. Please check your connection.';
      } else if (errorCode === 'ECONNABORTED' || rawMessage.includes('timeout')) {
        errorMessage = 'Upload timed out. Please try a smaller file or retry.';
      } else if (error.response?.status === 401 || error.response?.status === 403) {
        errorMessage = 'Authentication failed. Please log in again.';
      } else if (!errorMessage || errorMessage === 'An unexpected error occurred') {
        // Fallback if no meaningful message was extracted
        errorMessage = 'Upload failed. Please try again.';
      }

      console.error('Document upload error:', { errorMessage, extractedMessage, errorCode, status: error.response?.status });
      return { success: false, isDuplicate: false, error: errorMessage };
    }
  },

  /**
   * List documents by folder name
   */
  listByFolderName: async (
    folderName: string
  ): Promise<{ success: boolean; data?: DocumentList; shouldFallback?: boolean; error?: string }> => {
    const currentUser = authService.getUser();
    if (!currentUser) {
      throw new Error('No authenticated user found. Please login first.');
    }

    try {
      const response: AxiosResponse<any> = await api.get('/documents', {
        params: { folder_name: folderName },
      });

      if (response.data && Array.isArray(response.data.documents)) {
        return {
          success: true,
          data: {
            documents: response.data.documents,
            total: response.data.total || response.data.documents.length,
            page: response.data.page || 1,
            per_page: response.data.per_page || 20,
            total_pages: response.data.total_pages || 1,
          } as DocumentList,
        };
      }

      return {
        success: false,
        shouldFallback: true,
        error: 'Invalid response structure from Documents API',
      };
    } catch (error: any) {
      if (error.response) {
        const status = error.response.status;

        if (status === 401 || status === 403) {
          throw new Error('Access denied. Please log in again to view documents.');
        }

        return {
          success: false,
          shouldFallback: true,
          error: `Documents API returned ${status}, using fallback`,
        };
      } else if (error.request) {
        return {
          success: false,
          shouldFallback: true,
          error: 'Network error with Documents API, using fallback',
        };
      }

      return {
        success: false,
        shouldFallback: true,
        error: `Documents API error: ${error.message || 'Unknown error'}, using fallback`,
      };
    }
  },

  /**
   * Delete a document by ID
   */
  delete: async (documentId: string): Promise<DocumentDeleteResponse> => {
    const currentUser = authService.getUser();
    if (!currentUser) {
      throw new Error('No authenticated user found. Please login first.');
    }

    try {
      const response: AxiosResponse<DocumentDeleteResponse> = await api.delete(
        `/documents/${documentId}`
      );
      return response.data;
    } catch (error: any) {
      if (error.response) {
        const status = error.response.status;
        const errorData = error.response.data;

        switch (status) {
          case 404:
            throw new Error('Document not found. It may have already been deleted.');
          case 401:
          case 403:
            throw new Error('Access denied. You do not have permission to delete this document.');
          case 500:
            throw new Error(`Server error: ${errorData?.detail || 'Please try again later.'}`);
          default:
            throw new Error(
              `Delete failed (${status}): ${errorData?.detail || error.message || 'Unknown error'}`
            );
        }
      } else if (error.request) {
        throw new Error('Network error: Unable to connect to the server.');
      }
      throw error;
    }
  },
};
