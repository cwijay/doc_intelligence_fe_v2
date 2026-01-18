'use client';

/**
 * useDocuments - Hook for document upload and rename operations
 *
 * For AI features (summary, FAQ, questions), use useDocumentAI hook instead.
 * For document stats, use useDocumentStats from useFolders.
 */

import { useState, useCallback } from 'react';
import { AxiosProgressEvent } from 'axios';
import { documentsApi } from '@/lib/api/index';
import { Document, DocumentRenameResponse } from '@/types/api';

/**
 * Upload result type for handling duplicates without throwing errors
 */
type UploadDocumentResult =
  | { success: true; document: Document }
  | { success: false; isDuplicate: true; duplicateInfo: any }
  | { success: false; isDuplicate: false; error: string };

/**
 * Rename result type
 */
type RenameDocumentResult =
  | { success: true; data: DocumentRenameResponse }
  | { success: false; error: string };

/**
 * Hook for document upload and rename operations
 */
export function useDocuments() {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [renaming, setRenaming] = useState(false);
  const [renameError, setRenameError] = useState<string | null>(null);

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

  /**
   * Rename a document
   * @param documentId - The ID of the document to rename
   * @param newName - The new name for the document (including extension)
   * @returns RenameDocumentResult indicating success or failure
   */
  const renameDocument = useCallback(async (
    documentId: string,
    newName: string
  ): Promise<RenameDocumentResult> => {
    setRenaming(true);
    setRenameError(null);

    console.log('📝 Starting document rename:', { documentId, newName });

    try {
      const response = await documentsApi.rename(documentId, newName);

      setRenaming(false);

      if (response.success) {
        console.log('✅ Rename completed successfully:', response);
        return { success: true, data: response };
      }

      // This shouldn't happen if the API is working correctly, but handle it anyway
      const errorMessage = response.message || 'Rename failed. Please try again.';
      setRenameError(errorMessage);
      return { success: false, error: errorMessage };
    } catch (error: any) {
      setRenaming(false);

      const errorMessage = error.message || 'Rename failed. Please try again.';
      console.error('❌ Rename error:', errorMessage);
      setRenameError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  /**
   * Clear rename error state
   */
  const clearRenameError = useCallback(() => {
    setRenameError(null);
  }, []);

  return {
    // Upload state and functions
    uploading,
    uploadError,
    uploadProgress,
    uploadDocument,
    // Rename state and functions
    renaming,
    renameError,
    renameDocument,
    clearRenameError,
  };
}
