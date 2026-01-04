'use client';

import { useCallback } from 'react';
import { Document, DocumentSummary } from '@/types/api';
import { summaryApi } from '@/lib/api/ai-features';
import { useAIGeneration } from './useAIGeneration';
import toast from 'react-hot-toast';

export interface SummaryOptions {
  maxWords?: number;
  force?: boolean;
}

export interface SummaryGenerationState {
  selectedDocument: Document | null;
  data: DocumentSummary | null;
  isModalOpen: boolean;
  isGenerating: boolean;
}

export interface SummaryGenerationActions {
  handleSummarize: (document: Document, maxWords?: number) => Promise<void>;
  handleModalClose: () => void;
  handleSave: (editedContent: string) => Promise<void>;
  handleRegenerate: (options?: { maxWords?: number }) => Promise<void>;
}

export type SummaryGenerationReturn = SummaryGenerationState & SummaryGenerationActions;

/**
 * Hook for document summary generation
 * Uses the generic useAIGeneration hook for common functionality
 */
export function useSummaryGeneration(): SummaryGenerationReturn {
  const {
    selectedDocument,
    data,
    setData,
    isModalOpen,
    isGenerating,
    handleGenerate,
    handleModalClose,
    handleRegenerate: baseRegenerate,
  } = useAIGeneration<DocumentSummary, SummaryOptions>({
    featureName: 'summary',
    displayName: 'Summary',
    generateFn: async (document, orgName, folderName, options) => {
      return summaryApi.generateAndConvert(
        document,
        orgName,
        folderName,
        options?.maxWords ?? 500,
        undefined,
        options?.force ?? false
      );
    },
    formatSuccessMessage: (result, cached) =>
      `Summary generated (${result.word_count} words${cached ? ', cached' : ''})`,
  });

  // Wrap handleGenerate to match existing API (maxWords as second param)
  const handleSummarize = useCallback(
    async (document: Document, maxWords: number = 500) => {
      await handleGenerate(document, { maxWords });
    },
    [handleGenerate]
  );

  // Wrap handleRegenerate to add force flag
  const handleRegenerate = useCallback(
    async (options?: { maxWords?: number }) => {
      await baseRegenerate({ maxWords: options?.maxWords ?? 500, force: true });
    },
    [baseRegenerate]
  );

  // Custom save handler for summary (updates content string)
  const handleSave = useCallback(
    async (editedContent: string) => {
      if (!selectedDocument || !data) return;

      setData({
        ...data,
        content: editedContent,
        updated_at: new Date().toISOString()
      });
      toast.success(`Summary updated for: ${selectedDocument.name}`);
    },
    [selectedDocument, data, setData]
  );

  return {
    selectedDocument,
    data,
    isModalOpen,
    isGenerating,
    handleSummarize,
    handleModalClose,
    handleSave,
    handleRegenerate,
  };
}
