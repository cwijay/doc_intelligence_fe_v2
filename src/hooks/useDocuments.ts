'use client';

/**
 * useDocuments - Hook for document upload operations
 *
 * For AI features (summary, FAQ, questions), use useDocumentAI hook instead.
 * For document stats, use useDocumentStats from useFolders.
 */

import { useState, useCallback } from 'react';
import { AxiosProgressEvent } from 'axios';
import { documentsApi } from '@/lib/api/index';
import { Document } from '@/types/api';

/**
 * Upload result type for handling duplicates without throwing errors
 */
type UploadDocumentResult =
  | { success: true; document: Document }
  | { success: false; isDuplicate: true; duplicateInfo: any }
  | { success: false; isDuplicate: false; error: string };

/**
 * Hook for document upload operations
 */
export function useDocuments() {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadDocument = useCallback(async (
    file: File,
    organizationId: string,
    folderId?: string,
    forceOverride?: boolean
  ): Promise<UploadDocumentResult> => {
    setUploading(true);
    setUploadError(null);
    setUploadProgress(0);

    console.log('Starting document upload:', {
      fileName: file.name,
      fileSize: file.size,
      organizationId,
      folderId,
      forceOverride
    });

    const result = await documentsApi.upload(
      file,
      organizationId,
      folderId,
      (progressEvent: AxiosProgressEvent) => {
        if (progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
          console.log('Upload progress:', progress + '%');
        }
      },
      forceOverride
    );

    setUploading(false);

    if (result.success) {
      setUploadProgress(100);
      console.log('Upload completed successfully:', result.document);
      return { success: true, document: result.document };
    }

    if (result.isDuplicate) {
      return { success: false, isDuplicate: true, duplicateInfo: result.duplicateInfo };
    }

    const errorMessage = result.error || 'Upload failed. Please try again.';
    console.error('Upload error:', errorMessage);
    setUploadError(errorMessage);
    return { success: false, isDuplicate: false, error: errorMessage };
  }, []);

  return {
    uploading,
    uploadError,
    uploadProgress,
    uploadDocument,
  };
}
