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
  allDocuments: (orgId: string, filters?: DocumentFilters) => ['documents', 'all', orgId, filters],
};

export const useAllDocuments = (
  orgId: string,
  filters?: DocumentFilters,
  enabled = true
) => {
  // Check if user is authenticated (has valid token)
  const hasValidToken = !!authService.getAccessToken();

  return useQuery({
    queryKey: QUERY_KEYS.allDocuments(orgId, filters),
    queryFn: async (): Promise<DocumentList> => {
      console.log('🔍 useAllDocuments START:', { orgId, filters });

      if (!orgId) {
        console.warn('⚠️ useAllDocuments: No orgId provided, returning empty list');
        return { documents: [], total: 0, page: 1, per_page: 20, total_pages: 0 };
      }

      // Double-check authentication before making request
      const token = authService.getAccessToken();
      if (!token) {
        console.warn('⚠️ useAllDocuments: No auth token available, returning empty list');
        return { documents: [], total: 0, page: 1, per_page: 20, total_pages: 0 };
      }

      try {
        // Fetch all documents using the documents API without folder filters
        const result = await documentsApi.list(orgId, filters);
        console.log('✅ All documents API succeeded:', {
          totalDocuments: result.total,
          documentsReturned: result.documents.length,
          filters
        });

        // Normalize documents to handle field name mismatches and add folder info
        const normalizedDocuments = result.documents.map(normalizeDocument);
        console.log('📄 Normalized all documents:', normalizedDocuments);

        const normalizedResult = {
          ...result,
          documents: normalizedDocuments
        };

        console.log('🔍 useAllDocuments RETURN:', {
          total: normalizedResult.total,
          documentCount: normalizedResult.documents.length,
          page: normalizedResult.page,
          per_page: normalizedResult.per_page
        });

        return normalizedResult;
      } catch (error) {
        console.warn('⚠️ useAllDocuments: API failed, returning empty list', {
          error: error instanceof Error ? error.message : 'Unknown error',
          orgId,
          filters
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

export default useAllDocuments;