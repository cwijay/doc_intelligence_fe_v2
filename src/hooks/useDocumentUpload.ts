'use client';

import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useDocuments } from '@/hooks/useDocuments';
import { ExistingDocumentInfo } from '@/types/api';
import { FILE_EXTENSIONS, MIME_TYPES, UPLOAD_LIMITS } from '@/lib/constants';
import toast from 'react-hot-toast';

// Interface for duplicate conflict state
export interface DuplicateConflict {
  file: File;
  folderId: string | null;
  selectedViewFolder: string | null;
  existingDocument: ExistingDocumentInfo | null;  // Can be null if details unavailable
}

export function useDocumentUpload() {
  const { user } = useAuth();
  const organizationId = user?.org_id || '';
  const queryClient = useQueryClient();
  const { uploadDocument } = useDocuments();

  // State for duplicate file conflict
  const [duplicateConflict, setDuplicateConflict] = useState<DuplicateConflict | null>(null);
  const [isReplacing, setIsReplacing] = useState(false);

  // Allowed file types from constants
  const ALLOWED_EXTENSIONS = [
    ...FILE_EXTENSIONS.EXCEL.map(ext => ext.replace('.', '')),
    ...FILE_EXTENSIONS.DOCUMENTS.map(ext => ext.replace('.', '')),
    ...FILE_EXTENSIONS.IMAGES.map(ext => ext.replace('.', '')),
  ];
  const ALLOWED_MIME_TYPES = [
    MIME_TYPES.PDF,
    MIME_TYPES.EXCEL_XLSX,
    MIME_TYPES.EXCEL_XLS,
    MIME_TYPES.PNG,
    MIME_TYPES.JPEG,
    MIME_TYPES.GIF,
    MIME_TYPES.WEBP,
    MIME_TYPES.BMP,
    MIME_TYPES.SVG,
  ];

  const isValidFileType = useCallback((file: File): boolean => {
    // Check by extension
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    if (ALLOWED_EXTENSIONS.includes(extension)) {
      return true;
    }
    // Check by MIME type as fallback
    if (ALLOWED_MIME_TYPES.some(mime => mime === file.type)) {
      return true;
    }
    return false;
  }, []);

  const handleUpload = useCallback(async (
    files: File[],
    folderId?: string | null,
    selectedViewFolder?: string | null
  ) => {
    if (!files || files.length === 0) {
      console.warn('No files provided for upload');
      return;
    }

    console.log(`Starting upload process for ${files.length} file(s)`);

    for (const file of files) {
      // Validate file type
      if (!isValidFileType(file)) {
        const extension = file.name.split('.').pop()?.toLowerCase() || 'unknown';
        toast.error(`File type ".${extension}" is not supported. Allowed: PDF, Excel, Images`);
        console.warn(`File ${file.name} has unsupported type: ${extension}`);
        continue;
      }

      // Validate file size
      if (file.size > UPLOAD_LIMITS.MAX_FILE_SIZE) {
        toast.error(`File ${file.name} is too large. Maximum size is 100MB.`);
        console.warn(`File ${file.name} exceeds size limit: ${file.size} bytes`);
        continue;
      }

      if (file.size === 0) {
        toast.error(`Invalid file size for ${file.name}`);
        continue;
      }

      console.log(`Uploading: ${file.name}, Size: ${file.size} bytes, Type: ${file.type || 'unknown'}, Folder: ${folderId || 'root'}`);

      // Upload to GCP bucket via API - returns result object, never throws
      const result = await uploadDocument(file, organizationId, folderId || undefined);

      // Handle successful upload
      if (result.success) {
        toast.success(`${file.name} uploaded successfully!`);
        console.log('Upload successful:', result.document);

        // Invalidate ALL document-related queries to refresh UI everywhere
        console.log('🔄 Invalidating document queries after successful upload');
        queryClient.invalidateQueries({ queryKey: ['documents'] });
        queryClient.invalidateQueries({ queryKey: ['folders', organizationId] });

        if (selectedViewFolder) {
          queryClient.invalidateQueries({
            queryKey: ['folders', organizationId, selectedViewFolder, 'documents']
          });
        }
        continue;
      }

      // Handle duplicate file - show replacement dialog
      if (result.isDuplicate) {
        const existingDoc = result.duplicateInfo?.existing_document
          || result.duplicateInfo?.existingDocument
          || (result.duplicateInfo?.filename ? result.duplicateInfo : null)
          || null;

        setDuplicateConflict({
          file,
          folderId: folderId || null,
          selectedViewFolder: selectedViewFolder || null,
          existingDocument: existingDoc,
        });
        return; // Stop processing more files, wait for user decision
      }

      // Handle other errors
      toast.error(`Failed to upload ${file.name}: ${result.error}`);
    }
  }, [uploadDocument, organizationId, queryClient, isValidFileType]);

  const validateFiles = useCallback((files: File[]): { valid: File[], invalid: { file: File, reason: string }[] } => {
    const valid: File[] = [];
    const invalid: { file: File, reason: string }[] = [];

    for (const file of files) {
      // Check file type
      if (!isValidFileType(file)) {
        const extension = file.name.split('.').pop()?.toLowerCase() || 'unknown';
        invalid.push({ file, reason: `Unsupported file type (.${extension}). Allowed: PDF, Excel, Images` });
        continue;
      }

      if (file.size > UPLOAD_LIMITS.MAX_FILE_SIZE) {
        const maxMB = UPLOAD_LIMITS.MAX_FILE_SIZE / (1024 * 1024);
        invalid.push({ file, reason: `File too large (${(file.size / (1024 * 1024)).toFixed(1)}MB > ${maxMB}MB)` });
        continue;
      }

      if (file.size === 0) {
        invalid.push({ file, reason: 'File is empty' });
        continue;
      }

      valid.push(file);
    }

    return { valid, invalid };
  }, [isValidFileType]);

  // Handle force upload (replace existing file)
  const handleForceUpload = useCallback(async () => {
    if (!duplicateConflict) {
      console.warn('No duplicate conflict to resolve');
      return;
    }

    const { file, folderId, selectedViewFolder } = duplicateConflict;
    setIsReplacing(true);

    console.log(`Force uploading: ${file.name} to replace existing file`);

    // Upload with forceOverride=true - returns result object, never throws
    const result = await uploadDocument(file, organizationId, folderId || undefined, true);

    setIsReplacing(false);

    if (result.success) {
      toast.success(`${file.name} replaced successfully!`);
      console.log('Force upload successful:', result.document);

      // Clear the conflict state
      setDuplicateConflict(null);

      // Invalidate queries to refresh UI
      console.log('🔄 Invalidating document queries after force upload');
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['folders', organizationId] });

      if (selectedViewFolder) {
        queryClient.invalidateQueries({
          queryKey: ['folders', organizationId, selectedViewFolder, 'documents']
        });
      }
    } else {
      const errorMsg = result.isDuplicate ? 'File still exists' : result.error;
      toast.error(`Failed to replace ${file.name}: ${errorMsg}`);
    }
  }, [duplicateConflict, uploadDocument, organizationId, queryClient]);

  // Clear duplicate conflict (cancel replacement)
  const clearDuplicateConflict = useCallback(() => {
    setDuplicateConflict(null);
    setIsReplacing(false);
  }, []);

  return {
    handleUpload,
    validateFiles,
    duplicateConflict,
    isReplacing,
    handleForceUpload,
    clearDuplicateConflict,
  };
}