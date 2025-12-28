'use client';

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { documentsApi, foldersApi } from '@/lib/api/index';
import { Document, DocumentList, DocumentFilters } from '@/types/api';
import { normalizeDocument } from '@/lib/utils/normalizeDocument';

interface CalculatedDocumentStats {
  total_documents: number;
  storage_used: number;
}

/**
 * Hook for document listing and pagination
 */
export function useDocumentList() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalDocuments, setTotalDocuments] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const listDocuments = useCallback(async (organizationId: string, filters?: DocumentFilters) => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Fetching documents list:', { organizationId, filters: filters || 'NO_FILTERS' });

      const response: DocumentList = await documentsApi.list(organizationId, filters);
      const normalizedDocuments = response.documents.map(normalizeDocument);

      setDocuments(normalizedDocuments);
      setTotalDocuments(response.total);
      setCurrentPage(response.page);
      setTotalPages(response.total_pages);

      console.log('✅ Documents list fetched:', { count: normalizedDocuments.length, total: response.total });
      return response;
    } catch (err) {
      console.error('❌ Failed to fetch documents:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load documents';
      setError(errorMessage);
      setDocuments([]);
      setTotalDocuments(0);
      setCurrentPage(1);
      setTotalPages(1);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshDocuments = useCallback(async (organizationId: string, folderId?: string) => {
    if (folderId) {
      const folderDetails = await foldersApi.getById(organizationId, folderId);
      const folderName = folderDetails.name;

      console.log('🔄 Refreshing documents for folder:', folderName);
      const documentList = await documentsApi.listByFolderName(folderName);

      if (documentList.success && documentList.data) {
        const normalizedDocuments = documentList.data.documents.map(normalizeDocument);
        setDocuments(normalizedDocuments);
        setTotalDocuments(documentList.data.total);
        setCurrentPage(documentList.data.page);
        setTotalPages(documentList.data.total_pages);
        return documentList.data;
      }
    }

    return await listDocuments(organizationId);
  }, [listDocuments]);

  return {
    documents,
    loading,
    error,
    totalDocuments,
    currentPage,
    totalPages,
    listDocuments,
    refreshDocuments,
  };
}

/**
 * Hook for calculating document statistics from document list
 */
export function useDocumentStats(organizationId: string, enabled = true) {
  return useQuery<CalculatedDocumentStats>({
    queryKey: ['document-stats', organizationId],
    queryFn: async () => {
      try {
        const documentList = await documentsApi.list(organizationId);
        const normalizedDocuments = documentList.documents?.map(normalizeDocument) || [];

        const total_documents = documentList.total || normalizedDocuments.length || 0;
        const storage_used = normalizedDocuments.reduce((total, doc) => {
          return total + (doc.size || 0);
        }, 0);

        return { total_documents, storage_used };
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.log('⚠️ API not available, using development fallback data');
          return { total_documents: 12, storage_used: 25600000 };
        }
        throw error;
      }
    },
    enabled: enabled && !!organizationId,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}
