import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { foldersApi, documentsApi } from '@/lib/api/index';
import { authService } from '@/lib/auth';
import { normalizeDocument } from '@/lib/utils/normalizeDocument';
import {
  FolderCreateRequest,
  FolderUpdateRequest,
  FolderFilters,
  FolderMoveRequest,
} from '@/types/api';

const QUERY_KEYS = {
  folders: (orgId: string) => ['folders', orgId],
  foldersList: (orgId: string, filters?: FolderFilters) => ['folders', orgId, 'list', filters],
  folder: (orgId: string, folderId: string) => ['folders', orgId, folderId],
  folderTree: (orgId: string) => ['folders', orgId, 'tree'],
  folderPath: (orgId: string, folderId: string) => ['folders', orgId, folderId, 'path'],
  folderStats: (orgId: string) => ['folders', orgId, 'stats'],
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
    staleTime: 30 * 1000, // 30 seconds - prevents unnecessary refetches
  });
};

export const useFolder = (orgId: string, folderId: string, enabled = true) => {
  return useQuery({
    queryKey: QUERY_KEYS.folder(orgId, folderId),
    queryFn: () => foldersApi.getById(orgId, folderId),
    enabled: enabled && !!orgId && !!folderId,
    staleTime: 30 * 1000, // 30 seconds - prevents unnecessary refetches
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
    staleTime: 30 * 1000, // 30 seconds - prevents unnecessary refetches
  });
};

export const useFolderPath = (orgId: string, folderId: string, enabled = true) => {
  return useQuery({
    queryKey: QUERY_KEYS.folderPath(orgId, folderId),
    queryFn: () => foldersApi.getPath(orgId, folderId),
    enabled: enabled && !!orgId && !!folderId,
    staleTime: 30 * 1000, // 30 seconds - prevents unnecessary refetches
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

// useFolderDocuments has been removed - use useDocuments from useAllDocuments.ts instead
// The unified useDocuments hook handles both all-documents and folder-filtered views

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