import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { foldersApi, documentsApi } from '@/lib/api/index';
import { authService } from '@/lib/auth';
import { normalizeDocument } from '@/lib/utils/normalizeDocument';
import {
  Folder,
  FolderCreateRequest,
  FolderUpdateRequest,
  FolderFilters,
  FolderTree,
  FolderMoveRequest,
  FolderStats,
  DocumentList,
  DocumentFilters,
} from '@/types/api';

const QUERY_KEYS = {
  folders: (orgId: string) => ['folders', orgId],
  foldersList: (orgId: string, filters?: FolderFilters) => ['folders', orgId, 'list', filters],
  folder: (orgId: string, folderId: string) => ['folders', orgId, folderId],
  folderTree: (orgId: string) => ['folders', orgId, 'tree'],
  folderPath: (orgId: string, folderId: string) => ['folders', orgId, folderId, 'path'],
  folderStats: (orgId: string) => ['folders', orgId, 'stats'],
  folderDocuments: (orgId: string, folderId: string) => ['folders', orgId, folderId, 'documents'],
};

export const useFolders = (orgId: string, filters?: FolderFilters, enabled = true) => {
  // Check if user is authenticated (has valid token)
  const hasValidToken = !!authService.getAccessToken();

  console.log('🔍 useFolders Hook Debug:', {
    orgId,
    filters,
    enabled,
    hasValidToken,
    queryEnabled: enabled && !!orgId && hasValidToken,
    timestamp: new Date().toISOString()
  });

  return useQuery({
    queryKey: QUERY_KEYS.foldersList(orgId, filters),
    queryFn: async () => {
      console.log('🔍 useFolders queryFn executing:', { orgId, filters });

      // Double-check authentication before making request
      const token = authService.getAccessToken();
      if (!token) {
        console.warn('⚠️ useFolders: No auth token available, returning empty list');
        return { folders: [], total: 0, page: 1, per_page: 20, total_pages: 0 };
      }

      try {
        const result = await foldersApi.list(orgId, filters);
        console.log('✅ useFolders API Success:', {
          foldersCount: result?.folders?.length || 0,
          hasData: !!result,
          resultStructure: result ? Object.keys(result) : 'no result',
          result
        });
        return result;
      } catch (error) {
        console.error('❌ useFolders API Error:', {
          error,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          orgId,
          filters
        });
        throw error;
      }
    },
    enabled: enabled && !!orgId && hasValidToken,
    staleTime: 0, // Always fetch fresh data
  });
};

export const useFolder = (orgId: string, folderId: string, enabled = true) => {
  return useQuery({
    queryKey: QUERY_KEYS.folder(orgId, folderId),
    queryFn: () => foldersApi.getById(orgId, folderId),
    enabled: enabled && !!orgId && !!folderId,
    staleTime: 0, // Always fetch fresh data
  });
};

export const useCreateFolder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ orgId, data }: { orgId: string; data: FolderCreateRequest }) => {
      console.log('useCreateFolder mutationFn called with:', { orgId, data });
      if (!orgId) {
        console.error('No orgId provided to useCreateFolder');
        throw new Error('Organization ID is required');
      }
      if (!data?.name) {
        console.error('No folder name provided to useCreateFolder');
        throw new Error('Folder name is required');
      }
      return foldersApi.create(orgId, data);
    },
    onSuccess: (newFolder, { orgId }) => {
      console.log('Folder created successfully:', newFolder);
      // Invalidate and refetch folders list
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.folders(orgId) });
      
      // Add the new folder to the cache
      queryClient.setQueryData(
        QUERY_KEYS.folder(orgId, newFolder.id),
        newFolder
      );
    },
    onError: (error, variables) => {
      console.error('Failed to create folder:', { error, variables });
      console.error('Error details:', {
        message: error.message,
        cause: error.cause,
        stack: error.stack,
      });
    },
  });
};

export const useUpdateFolder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      orgId, 
      folderId, 
      data 
    }: { 
      orgId: string; 
      folderId: string; 
      data: FolderUpdateRequest 
    }) => foldersApi.update(orgId, folderId, data),
    onSuccess: (updatedFolder, { orgId, folderId }) => {
      // Update the specific folder in cache
      queryClient.setQueryData(
        QUERY_KEYS.folder(orgId, folderId),
        updatedFolder
      );
      
      // Invalidate folders list to reflect changes
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.folders(orgId) });
    },
  });
};

export const useDeleteFolder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ orgId, folderId }: { orgId: string; folderId: string }) =>
      foldersApi.delete(orgId, folderId),
    onSuccess: (_, { orgId, folderId }) => {
      // Remove the folder from cache
      queryClient.removeQueries({ queryKey: QUERY_KEYS.folder(orgId, folderId) });
      
      // Invalidate folders list to reflect deletion
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.folders(orgId) });
    },
  });
};

export const useFolderTree = (orgId: string, enabled = true) => {
  return useQuery({
    queryKey: QUERY_KEYS.folderTree(orgId),
    queryFn: () => foldersApi.getTree(orgId),
    enabled: enabled && !!orgId,
    staleTime: 0, // Always fetch fresh data
  });
};

export const useFolderPath = (orgId: string, folderId: string, enabled = true) => {
  return useQuery({
    queryKey: QUERY_KEYS.folderPath(orgId, folderId),
    queryFn: () => foldersApi.getPath(orgId, folderId),
    enabled: enabled && !!orgId && !!folderId,
    staleTime: 0, // Always fetch fresh data
  });
};

export const useFolderStats = (orgId: string, enabled = true) => {
  return useQuery({
    queryKey: QUERY_KEYS.folderStats(orgId),
    queryFn: () => foldersApi.getStats(orgId),
    enabled: enabled && !!orgId,
    staleTime: 2 * 60 * 1000, // 2 minutes (stats should be relatively fresh)
  });
};

export const useMoveFolder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      orgId, 
      folderId, 
      data 
    }: { 
      orgId: string; 
      folderId: string; 
      data: FolderMoveRequest 
    }) => foldersApi.move(orgId, folderId, data),
    onSuccess: (movedFolder, { orgId, folderId }) => {
      // Update the specific folder in cache
      queryClient.setQueryData(
        QUERY_KEYS.folder(orgId, folderId),
        movedFolder
      );
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.folders(orgId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.folderTree(orgId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.folderPath(orgId, folderId) });
    },
  });
};

export const useFolderDocuments = (orgId: string, folderId: string, folderName: string, enabled = true) => {
  // Check if user is authenticated (has valid token)
  const hasValidToken = !!authService.getAccessToken();

  return useQuery({
    queryKey: QUERY_KEYS.folderDocuments(orgId, folderId),
    queryFn: async () => {
      console.log('🔍 useFolderDocuments START:', { orgId, folderId, folderName });

      // Double-check authentication before making request
      const token = authService.getAccessToken();
      if (!token) {
        console.warn('⚠️ useFolderDocuments: No auth token available, returning empty list');
        return { documents: [], total: 0, page: 1, per_page: 20, total_pages: 0 };
      }

      // folderName is now passed directly to avoid HTTP caching issues
      console.log('📁 Using folder name:', { folderId, folderName });
      
      // Get documents by folder name using Documents API
      const documentsResult = await documentsApi.listByFolderName(folderName);
      console.log('📄 Documents API raw result:', documentsResult);
      console.log('📄 Documents API result details:', {
        success: documentsResult.success,
        hasData: !!documentsResult.data,
        documentCount: documentsResult.data?.documents?.length || 0,
        shouldFallback: documentsResult.shouldFallback,
        error: documentsResult.error,
        typeOfResult: typeof documentsResult,
        isObject: documentsResult && typeof documentsResult === 'object'
      });
      
      // Handle both wrapped and unwrapped responses
      let documentsData = null;

      if (documentsResult.success && documentsResult.data) {
        // Properly wrapped response
        console.log('✅ Using wrapped Documents API result');
        documentsData = documentsResult.data;
      } else if (documentsResult && 'documents' in documentsResult && Array.isArray((documentsResult as unknown as DocumentList).documents)) {
        // Direct API response (unwrapped) - cast to handle type mismatch
        console.log('✅ Using direct Documents API result (unwrapped)');
        const directResult = documentsResult as unknown as DocumentList;
        documentsData = {
          documents: directResult.documents,
          total: directResult.total || directResult.documents.length,
          page: directResult.page || 1,
          per_page: directResult.per_page || 20,
          total_pages: directResult.total_pages || 1
        };
      }

      if (documentsData) {
        console.log('📄 Raw documents from API:', documentsData.documents);

        // Normalize documents to handle field name mismatches
        const normalizedDocuments = documentsData.documents.map(normalizeDocument);
        console.log('📄 Normalized documents:', normalizedDocuments);

        // Client-side filtering to ensure only documents in this folder are shown
        // (defensive measure in case backend doesn't filter correctly)
        const filteredDocuments = normalizedDocuments.filter((doc: any) => {
          // Filter by folder_id if available
          if (doc.folder_id && doc.folder_id === folderId) {
            return true;
          }
          // Filter by folder_name if available
          if (doc.folder_name && doc.folder_name.toLowerCase() === folderName.toLowerCase()) {
            return true;
          }
          // Filter by storage_path containing folder name
          if (doc.storage_path) {
            const pathParts = doc.storage_path.split('/');
            // Path format: org/original/folder_name/filename
            if (pathParts.length >= 3 && pathParts[2].toLowerCase() === folderName.toLowerCase()) {
              return true;
            }
          }
          // Filter by gcs_path containing folder name
          if (doc.gcs_path) {
            const pathParts = doc.gcs_path.split('/');
            if (pathParts.length >= 3 && pathParts[2].toLowerCase() === folderName.toLowerCase()) {
              return true;
            }
          }
          return false;
        });

        console.log('🔍 Filtered documents for folder:', {
          folderName,
          folderId,
          beforeFilter: normalizedDocuments.length,
          afterFilter: filteredDocuments.length
        });

        const result = {
          ...documentsData,
          documents: filteredDocuments,
          total: filteredDocuments.length
        };

        console.log('🔍 useFolderDocuments RETURN:', {
          total: result.total,
          documentCount: result.documents.length,
          documents: result.documents
        });

        return result;
      } else if (documentsResult.shouldFallback) {
        // Documents API failed - use GCP bucket approach as fallback
        console.log('🔄 Documents API failed, using GCP bucket fallback');
        const currentUser = authService.getUser();
        if (!currentUser) {
          throw new Error('No authenticated user found. Please login first.');
        }

        const orgName = currentUser.org_name;
        const folderPath = `${orgName}/original/${folderName}`;
        
        const filters: DocumentFilters = { folder_path: folderPath };
        const result = await documentsApi.list(orgId, filters);
        
        console.log('✅ GCP bucket fallback succeeded:', {
          totalDocuments: result.total,
          documentsReturned: result.documents.length,
          folderName,
          folderPath
        });
        
        // Normalize documents to handle field name mismatches
        const normalizedDocuments = result.documents.map(normalizeDocument);
        
        return {
          ...result,
          documents: normalizedDocuments
        };
      } else {
        // If we reach here, neither the Documents API nor fallback worked
        console.warn('⚠️ No documents found or API failed:', {
          apiError: documentsResult.error,
          documentsResult
        });
        
        // Return empty result instead of throwing error
        return {
          documents: [],
          total: 0,
          page: 1,
          per_page: 20,
          total_pages: 0
        };
      }
    },
    enabled: enabled && !!orgId && !!folderId && hasValidToken,
    staleTime: 0, // Always fetch fresh data
  });
};

export const useDocumentStats = (orgId: string, enabled = true) => {
  // Check if user is authenticated (has valid token)
  const hasValidToken = !!authService.getAccessToken();

  return useQuery({
    queryKey: ['documents', orgId, 'stats'],
    queryFn: async () => {
      console.log('📊 useDocumentStats: Fetching stats for org:', orgId);

      // Double-check authentication before making request
      const token = authService.getAccessToken();
      if (!token) {
        console.warn('⚠️ useDocumentStats: No auth token available, returning fallback data');
        return {
          total_documents: 0,
          total_folders: 0,
          storage_used: 0,
          created_this_month: 0,
        };
      }

      try {
        // Use the existing documents list API to get total count and calculate storage
        const result = await documentsApi.list(orgId);

        console.log('📊 useDocumentStats: API result received:', {
          total: result.total,
          documentsLength: result.documents?.length,
          documents: result.documents
        });

        // Normalize documents to handle field name mismatches (same as useFolderDocuments)
        const normalizedDocuments = result.documents.map(normalizeDocument);

        // Debug: Log raw and normalized documents (can be removed in production)
        if (process.env.NODE_ENV === 'development') {
          console.log('🔒 Storage calculation debug:', {
            orgId,
            rawDocuments: result.documents.length,
            normalizedDocuments: normalizedDocuments.length,
            documentSizes: normalizedDocuments.map(doc => ({ name: doc.name, size: doc.size }))
          });
        }

        // Calculate total storage used by summing all normalized document sizes
        const totalStorageBytes = normalizedDocuments.reduce((total, doc) => {
          return total + (doc.size || 0);
        }, 0);

        // Debug: Log storage calculation result
        if (process.env.NODE_ENV === 'development') {
          console.log('🔒 Storage calculation result:', {
            totalStorageBytes,
            documentsWithSize: normalizedDocuments.filter(doc => doc.size > 0).length
          });
        }

        return {
          total_documents: result.total,
          total_folders: 0, // Will be provided by useFolders hook
          storage_used: totalStorageBytes, // Real storage in bytes
          created_this_month: 0, // Not available from this endpoint
        };
      } catch (error) {
        // Handle API failures gracefully with fallback data
        console.warn('⚠️ useDocumentStats: API failed, returning fallback data', {
          error: error instanceof Error ? error.message : 'Unknown error',
          orgId
        });
        return {
          total_documents: 0,
          total_folders: 0,
          storage_used: 0,
          created_this_month: 0,
        };
      }
    },
    enabled: enabled && !!orgId && hasValidToken,
    staleTime: 2 * 60 * 1000, // 2 minutes (stats should be relatively fresh)
    retry: 2, // Retry up to 2 times before using fallback data
  });
};