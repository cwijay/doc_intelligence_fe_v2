'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Document } from '@/types/api';

// =============================================================================
// Session Storage Keys
// =============================================================================

const CHAT_CONTEXT_KEY = (docId: string) => `chat-context-${docId}`;

export interface ChatContext {
  document: Document;
  folderName: string;
}

// =============================================================================
// Types
// =============================================================================

export interface UseChatPageReturn {
  // Document context
  document: Document | null;
  folderName: string | null;
  isInitialized: boolean;
  isInitializing: boolean;
  initError: string | null;
  returnPath: string;

  // Navigation actions
  handleBack: () => void;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Store chat context in sessionStorage before navigating
 */
export function storeChatContext(
  documentId: string,
  document: Document,
  folderName: string
): void {
  const key = CHAT_CONTEXT_KEY(documentId);
  const context: ChatContext = { document, folderName };
  sessionStorage.setItem(key, JSON.stringify(context));
  console.log(`📦 Stored chat context:`, {
    documentId,
    documentName: document.name,
    folderName,
  });
}

/**
 * Clear stored chat context
 */
export function clearChatContext(documentId: string): void {
  sessionStorage.removeItem(CHAT_CONTEXT_KEY(documentId));
}

// =============================================================================
// Hook Implementation
// =============================================================================

export function useChatPage(documentId: string): UseChatPageReturn {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Page-specific state
  const [document, setDocument] = useState<Document | null>(null);
  const [folderName, setFolderName] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  // Determine return path from query params
  const returnPath = useMemo(() => {
    const from = searchParams.get('from');
    if (from === 'documents') {
      return '/documents';
    }
    return '/documents';
  }, [searchParams]);

  // =============================================================================
  // Initialization
  // =============================================================================

  useEffect(() => {
    const initializeFromStorage = async () => {
      setIsInitializing(true);
      setInitError(null);

      try {
        const key = CHAT_CONTEXT_KEY(documentId);
        const storedData = sessionStorage.getItem(key);

        if (!storedData) {
          throw new Error('Chat context not found. Please start from the documents page.');
        }

        const context: ChatContext = JSON.parse(storedData);

        console.log(`📦 Loaded chat context from sessionStorage:`, {
          documentId,
          documentName: context.document.name,
          folderName: context.folderName,
        });

        setDocument(context.document);
        setFolderName(context.folderName);
        setIsInitialized(true);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load context';
        console.error('❌ Error initializing chat page:', err);
        setInitError(errorMessage);
      } finally {
        setIsInitializing(false);
      }
    };

    if (documentId) {
      initializeFromStorage();
    }
  }, [documentId]);

  // =============================================================================
  // Actions
  // =============================================================================

  const handleBack = useCallback(() => {
    // Clear context
    clearChatContext(documentId);
    // Navigate back
    router.push(returnPath);
  }, [documentId, returnPath, router]);

  // =============================================================================
  // Return
  // =============================================================================

  return useMemo(() => ({
    document,
    folderName,
    isInitialized,
    isInitializing,
    initError,
    returnPath,
    handleBack,
  }), [
    document,
    folderName,
    isInitialized,
    isInitializing,
    initError,
    returnPath,
    handleBack,
  ]);
}
