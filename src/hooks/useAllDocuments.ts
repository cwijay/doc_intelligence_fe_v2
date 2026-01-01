import { useQuery } from '@tanstack/react-query';
import { documentsApi } from '@/lib/api/index';
import { DocumentList, DocumentFilters } from '@/types/api';
import { authService } from '@/lib/auth';

// Helper function to normalize document fields from backend response
const normalizeDocument = (doc: any): any => {
  // Handle field name mismatches
  const documentName = doc.name || doc.filename || doc.file_name || '';
  const documentType = doc.type || doc.file_type || doc.content_type || '';
  
  // Extract filename from path if name is missing
  let finalName = documentName;
  if (!finalName && doc.path) {
    finalName = doc.path.split('/').pop() || '';
  }
  if (!finalName && doc.gcs_path) {
    finalName = doc.gcs_path.split('/').pop() || '';
  }
  
  // Extract file extension for type if type is missing
  let finalType = documentType;
  if (!finalType && finalName) {
    const extension = finalName.split('.').pop()?.toLowerCase();
    finalType = extension || '';
  }
  
  // Extract folder name from storage path for display
  let folderName = 'Unknown Folder';
  if (doc.storage_path || doc.gcs_path || doc.path) {
    const path = doc.storage_path || doc.gcs_path || doc.path;
    const pathParts = path.split('/');
    // Assuming path format: org/original/folder/file or org/parsed/folder/file
    if (pathParts.length >= 3) {
      folderName = pathParts[pathParts.length - 2]; // Second to last part is folder
    }
  }
  
  return {
    ...doc, // Keep all original fields
    name: finalName || 'Unknown File',
    type: finalType || 'unknown',
    size: doc.size || doc.file_size || 0,
    status: doc.status || 'uploaded',
    uploaded_at: doc.uploaded_at || doc.created_at || new Date().toISOString(),
    folder_name: folderName, // Add folder name for display
  };
};

const QUERY_KEYS = {
  // Unified query key - includes folderName for cache separation
  documents: (orgId: string, folderName?: string | null) =>
    ['documents', orgId, folderName || 'all'],
};

/**
 * Unified hook for fetching documents - eliminates race conditions
 * by using a single hook for both all documents and folder-filtered documents.
 *
 * @param orgId - Organization ID
 * @param folderName - Optional folder name to filter by. If null/undefined, fetches all documents.
 * @param enabled - Whether the query is enabled
 */
export const useDocuments = (
  orgId: string,
  folderName?: string | null,
  enabled = true
) => {
  // Check if user is authenticated (has valid token)
  const hasValidToken = !!authService.getAccessToken();

  return useQuery({
    // Single query key - different cache entries for each folder or 'all'
    queryKey: QUERY_KEYS.documents(orgId, folderName),
    queryFn: async (): Promise<DocumentList> => {
      console.log('🔍 useDocuments START:', { orgId, folderName });

      if (!orgId) {
        console.warn('⚠️ useDocuments: No orgId provided, returning empty list');
        return { documents: [], total: 0, page: 1, per_page: 20, total_pages: 0 };
      }

      // Double-check authentication before making request
      const token = authService.getAccessToken();
      if (!token) {
        console.warn('⚠️ useDocuments: No auth token available, returning empty list');
        return { documents: [], total: 0, page: 1, per_page: 20, total_pages: 0 };
      }

      try {
        // Build filters - include folder_path if provided (backend expects folder_path, not folder_name)
        const filters: DocumentFilters | undefined = folderName
          ? { folder_path: folderName }
          : undefined;

        // Single API call - either with or without folder filter
        const result = await documentsApi.list(orgId, filters);
        console.log('✅ Documents API succeeded:', {
          totalDocuments: result.total,
          documentsReturned: result.documents.length,
          folderName: folderName || 'all'
        });

        // Normalize documents to handle field name mismatches and add folder info
        const normalizedDocuments = result.documents.map(normalizeDocument);

        const normalizedResult = {
          ...result,
          documents: normalizedDocuments
        };

        console.log('🔍 useDocuments RETURN:', {
          total: normalizedResult.total,
          documentCount: normalizedResult.documents.length,
          folderName: folderName || 'all'
        });

        return normalizedResult;
      } catch (error) {
        console.warn('⚠️ useDocuments: API failed, returning empty list', {
          error: error instanceof Error ? error.message : 'Unknown error',
          orgId,
          folderName
        });
        return { documents: [], total: 0, page: 1, per_page: 20, total_pages: 0 };
      }
    },
    enabled: enabled && !!orgId && hasValidToken,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: 2, // Retry up to 2 times before using fallback
  });
};

/**
 * @deprecated Use useDocuments instead. This is kept for backward compatibility.
 */
export const useAllDocuments = (
  orgId: string,
  filters?: DocumentFilters,
  enabled = true
) => {
  // Delegate to unified hook with no folder filter
  return useDocuments(orgId, null, enabled);
};

export default useDocuments;