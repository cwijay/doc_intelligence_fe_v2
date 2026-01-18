'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Document, DocumentParseResponse } from '@/types/api';
import { TemplateInfo } from '@/types/extraction';
import { useExtraction, UseExtractionReturn } from './useExtraction';
import { useTemplateSelection, UseTemplateSelectionReturn } from './useTemplateSelection';
import { useAuth } from '@/hooks/useAuth';
import { resolveFolderName } from '@/hooks/ai/utils';

// =============================================================================
// Session Storage Keys
// =============================================================================

const EXTRACTION_CONTEXT_KEY = (docId: string) => `extraction-context-${docId}`;

export interface ExtractionContext {
  document: Document;
  parseData: DocumentParseResponse | null;
  folderName: string;
}

// =============================================================================
// Types
// =============================================================================

export interface UseExtractionPageReturn {
  // Extraction hook return
  extraction: UseExtractionReturn;

  // Template selection hook return
  templateSelection: UseTemplateSelectionReturn;

  // Page-specific state
  document: Document | null;
  parseData: DocumentParseResponse | null;
  folderName: string | null;
  isInitialized: boolean;
  isInitializing: boolean;
  initError: string | null;
  returnPath: string;

  // Template selection UI
  showTemplateSelection: boolean;
  setShowTemplateSelection: (show: boolean) => void;

  // Actions
  handleBack: () => void;
  handleCancel: () => void;
  handleComplete: () => void;

  // Template actions
  handleSelectTemplate: (template: TemplateInfo, schema: Record<string, unknown>) => void;
  handleAnalyzeNew: () => void;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Store extraction context in sessionStorage before navigating to extraction page
 */
export function storeExtractionContext(
  documentId: string,
  document: Document,
  parseData: DocumentParseResponse | null,
  folderName: string
): void {
  const key = EXTRACTION_CONTEXT_KEY(documentId);
  const context: ExtractionContext = { document, parseData, folderName };
  sessionStorage.setItem(key, JSON.stringify(context));
  console.log('📦 Stored extraction context:', {
    documentId,
    documentName: document.name,
    folderName,
    hasParseData: !!parseData,
  });
}

/**
 * Clear stored extraction context
 */
export function clearExtractionContext(documentId: string): void {
  sessionStorage.removeItem(EXTRACTION_CONTEXT_KEY(documentId));
}

// =============================================================================
// Hook Implementation
// =============================================================================

export function useExtractionPage(documentId: string): UseExtractionPageReturn {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // Get the core extraction hook
  const extraction = useExtraction();
  const templateSelection = useTemplateSelection();

  // Page-specific state
  const [document, setDocument] = useState<Document | null>(null);
  const [parseData, setParseData] = useState<DocumentParseResponse | null>(null);
  const [folderName, setFolderName] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  // Template selection UI state
  const [showTemplateSelection, setShowTemplateSelection] = useState(false);

  // Determine return path from query params
  const returnPath = useMemo(() => {
    const from = searchParams.get('from');
    if (from === 'parse') {
      return `/documents/${documentId}/parse`;
    }
    return '/documents';
  }, [searchParams, documentId]);

  // Pre-selected template from query params
  const preselectedTemplate = searchParams.get('template');

  // =============================================================================
  // Initialization
  // =============================================================================

  useEffect(() => {
    const initializeFromStorage = async () => {
      setIsInitializing(true);
      setInitError(null);

      try {
        const key = EXTRACTION_CONTEXT_KEY(documentId);
        const storedData = sessionStorage.getItem(key);

        if (!storedData) {
          throw new Error('Extraction context not found. Please start extraction from the document page.');
        }

        const context: ExtractionContext = JSON.parse(storedData);

        console.log('📦 Loaded extraction context from sessionStorage:', {
          documentId,
          documentName: context.document.name,
          folderName: context.folderName,
          hasParseData: !!context.parseData,
        });

        setDocument(context.document);
        setParseData(context.parseData);
        setFolderName(context.folderName);

        // Check if templates exist for this folder
        if (templateSelection.filteredTemplates.length > 0) {
          // Show template selection initially if templates exist
          setShowTemplateSelection(true);
        } else {
          // No templates - start extraction directly with analyze step
          extraction.startExtraction(context.document, context.parseData || undefined);
        }

        setIsInitialized(true);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load extraction context';
        console.error('❌ Error initializing extraction page:', err);
        setInitError(errorMessage);
      } finally {
        setIsInitializing(false);
      }
    };

    if (documentId) {
      initializeFromStorage();
    }
  }, [documentId]); // Only run on mount with documentId

  // Handle template selection changes after initialization
  useEffect(() => {
    if (isInitialized && document && folderName) {
      // Open template selection modal when needed
      if (showTemplateSelection && !templateSelection.isModalOpen) {
        templateSelection.openSelection(document, folderName, parseData || undefined);
      }
    }
  }, [isInitialized, document, folderName, parseData, showTemplateSelection, templateSelection]);

  // Handle proceed flags from template selection
  useEffect(() => {
    if (templateSelection.shouldProceedWithTemplate && document) {
      if (templateSelection.selectedTemplate && templateSelection.schema) {
        extraction.startExtractionWithTemplate(
          document,
          templateSelection.selectedTemplate,
          templateSelection.schema,
          parseData || undefined
        );
        setShowTemplateSelection(false);
      }
      templateSelection.resetProceedFlags();
    } else if (templateSelection.shouldProceedWithAnalyze && document) {
      extraction.startExtraction(document, parseData || undefined);
      setShowTemplateSelection(false);
      templateSelection.resetProceedFlags();
    }
  }, [
    templateSelection.shouldProceedWithTemplate,
    templateSelection.shouldProceedWithAnalyze,
    document,
    parseData,
    templateSelection,
    extraction,
  ]);

  // =============================================================================
  // Actions
  // =============================================================================

  const handleBack = useCallback(() => {
    // Check for unsaved state
    if (extraction.isModalOpen && extraction.step !== 'analyze') {
      const confirmed = window.confirm(
        'You have unsaved extraction progress. Are you sure you want to leave?'
      );
      if (!confirmed) return;
    }

    // Clear extraction context
    clearExtractionContext(documentId);

    // Close extraction if open
    if (extraction.isModalOpen) {
      extraction.closeExtraction();
    }

    // Navigate back
    router.push(returnPath);
  }, [documentId, extraction, returnPath, router]);

  const handleCancel = useCallback(() => {
    const confirmed = window.confirm(
      'Are you sure you want to cancel extraction? Any progress will be lost.'
    );
    if (!confirmed) return;

    // Clear extraction context
    clearExtractionContext(documentId);

    // Close extraction
    extraction.closeExtraction();

    // Navigate back
    router.push(returnPath);
  }, [documentId, extraction, returnPath, router]);

  const handleComplete = useCallback(() => {
    console.log('✅ Extraction completed');

    // Clear extraction context
    clearExtractionContext(documentId);

    // Complete extraction (this keeps selectedDocument but closes modal)
    extraction.completeExtraction();

    // Navigate back
    router.push(returnPath);
  }, [documentId, extraction, returnPath, router]);

  // Template selection actions
  const handleSelectTemplate = useCallback((template: TemplateInfo, schema: Record<string, unknown>) => {
    if (!document) return;

    extraction.startExtractionWithTemplate(document, template, schema, parseData || undefined);
    setShowTemplateSelection(false);
  }, [document, parseData, extraction]);

  const handleAnalyzeNew = useCallback(() => {
    if (!document) return;

    extraction.startExtraction(document, parseData || undefined);
    setShowTemplateSelection(false);
  }, [document, parseData, extraction]);

  // =============================================================================
  // Unsaved changes warning
  // =============================================================================

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (extraction.isModalOpen && extraction.step !== 'actions') {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [extraction.isModalOpen, extraction.step]);

  // =============================================================================
  // Return
  // =============================================================================

  return useMemo(() => ({
    // Extraction hook
    extraction,

    // Template selection hook
    templateSelection,

    // Page state
    document,
    parseData,
    folderName,
    isInitialized,
    isInitializing,
    initError,
    returnPath,

    // Template selection UI
    showTemplateSelection,
    setShowTemplateSelection,

    // Actions
    handleBack,
    handleCancel,
    handleComplete,

    // Template actions
    handleSelectTemplate,
    handleAnalyzeNew,
  }), [
    extraction,
    templateSelection,
    document,
    parseData,
    folderName,
    isInitialized,
    isInitializing,
    initError,
    returnPath,
    showTemplateSelection,
    handleBack,
    handleCancel,
    handleComplete,
    handleSelectTemplate,
    handleAnalyzeNew,
  ]);
}
