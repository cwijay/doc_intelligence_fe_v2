'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Document } from '@/types/api';

// =============================================================================
// Types
// =============================================================================

export interface ExcelChatContext {
  documents: Document[];
  folderName: string | null;
}

export interface UseExcelChatPageReturn {
  documents: Document[];
  folderName: string | null;
  isInitializing: boolean;
  isInitialized: boolean;
  initError: string | null;
  handleBack: () => void;
}

// =============================================================================
// Storage Keys
// =============================================================================

const EXCEL_CHAT_CONTEXT_KEY = (docId: string) => `excel-chat-context-${docId}`;

// =============================================================================
// Helper Functions
// =============================================================================

export function storeExcelChatContext(documentId: string, documents: Document[], folderName: string | null): void {
  try {
    const context: ExcelChatContext = { documents, folderName };
    sessionStorage.setItem(EXCEL_CHAT_CONTEXT_KEY(documentId), JSON.stringify(context));
    console.log('📦 Excel chat context stored for document:', documentId);
  } catch (error) {
    console.error('❌ Failed to store Excel chat context:', error);
  }
}

export function clearExcelChatContext(documentId: string): void {
  try {
    sessionStorage.removeItem(EXCEL_CHAT_CONTEXT_KEY(documentId));
    console.log('🧹 Excel chat context cleared for document:', documentId);
  } catch (error) {
    console.error('❌ Failed to clear Excel chat context:', error);
  }
}

// =============================================================================
// Hook
// =============================================================================

export function useExcelChatPage(documentId: string): UseExcelChatPageReturn {
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [folderName, setFolderName] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  // Initialize from sessionStorage
  useEffect(() => {
    const initializeFromStorage = async () => {
      console.log('🔍 useExcelChatPage: Initializing for document:', documentId);
      setIsInitializing(true);
      setInitError(null);

      try {
        const storedContext = sessionStorage.getItem(EXCEL_CHAT_CONTEXT_KEY(documentId));

        if (storedContext) {
          const context: ExcelChatContext = JSON.parse(storedContext);
          console.log('📦 useExcelChatPage: Found stored context:', {
            documentCount: context.documents?.length,
            folderName: context.folderName,
          });

          if (context.documents && context.documents.length > 0) {
            setDocuments(context.documents);
            setFolderName(context.folderName);
            setIsInitialized(true);
          } else {
            setInitError('No documents found in stored context');
          }
        } else {
          console.warn('⚠️ useExcelChatPage: No stored context found');
          setInitError('No document context found. Please navigate from the documents page.');
        }
      } catch (error) {
        console.error('❌ useExcelChatPage: Failed to initialize:', error);
        setInitError('Failed to load document context');
      } finally {
        setIsInitializing(false);
      }
    };

    initializeFromStorage();
  }, [documentId]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    // Try to get the return path from URL params
    const searchParams = new URLSearchParams(window.location.search);
    const from = searchParams.get('from');

    if (from === 'documents') {
      router.push('/documents');
    } else if (from === 'parse') {
      router.push(`/documents/${documentId}/parse`);
    } else {
      // Default to documents page
      router.push('/documents');
    }

    // Clear the context after navigation
    clearExcelChatContext(documentId);
  }, [router, documentId]);

  return {
    documents,
    folderName,
    isInitializing,
    isInitialized,
    initError,
    handleBack,
  };
}

export default useExcelChatPage;
