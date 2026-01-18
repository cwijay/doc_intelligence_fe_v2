'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Document } from '@/types/api';
import { AIContentType } from '@/components/documents/ai-modal/types';

// =============================================================================
// Session Storage Keys
// =============================================================================

const AI_CONTENT_CONTEXT_KEY = (docId: string, type: AIContentType) =>
  `ai-content-context-${type}-${docId}`;

export interface AIContentContext {
  document: Document;
  folderName: string;
}

// =============================================================================
// Types
// =============================================================================

export interface UseAIContentPageReturn {
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
 * Store AI content context in sessionStorage before navigating
 */
export function storeAIContentContext(
  documentId: string,
  contentType: AIContentType,
  document: Document,
  folderName: string
): void {
  const key = AI_CONTENT_CONTEXT_KEY(documentId, contentType);
  const context: AIContentContext = { document, folderName };
  sessionStorage.setItem(key, JSON.stringify(context));
  console.log(`📦 Stored ${contentType} context:`, {
    documentId,
    documentName: document.name,
    folderName,
  });
}

/**
 * Clear stored AI content context
 */
export function clearAIContentContext(documentId: string, contentType: AIContentType): void {
  sessionStorage.removeItem(AI_CONTENT_CONTEXT_KEY(documentId, contentType));
}

// =============================================================================
// Hook Implementation
// =============================================================================

export function useAIContentPage(
  documentId: string,
  contentType: AIContentType
): UseAIContentPageReturn {
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
        const key = AI_CONTENT_CONTEXT_KEY(documentId, contentType);
        const storedData = sessionStorage.getItem(key);

        if (!storedData) {
          throw new Error(`${contentType} context not found. Please start from the documents page.`);
        }

        const context: AIContentContext = JSON.parse(storedData);

        console.log(`📦 Loaded ${contentType} context from sessionStorage:`, {
          documentId,
          documentName: context.document.name,
          folderName: context.folderName,
        });

        setDocument(context.document);
        setFolderName(context.folderName);
        setIsInitialized(true);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load context';
        console.error(`❌ Error initializing ${contentType} page:`, err);
        setInitError(errorMessage);
      } finally {
        setIsInitializing(false);
      }
    };

    if (documentId) {
      initializeFromStorage();
    }
  }, [documentId, contentType]);

  // =============================================================================
  // Actions
  // =============================================================================

  const handleBack = useCallback(() => {
    // Clear context
    clearAIContentContext(documentId, contentType);
    // Navigate back
    router.push(returnPath);
  }, [documentId, contentType, returnPath, router]);

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
