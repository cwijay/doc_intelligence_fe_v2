'use client';

import { useCallback } from 'react';
import { Document, DocumentFAQ } from '@/types/api';
import { faqApi } from '@/lib/api/ai-features';
import { useAIGeneration } from './useAIGeneration';
import toast from 'react-hot-toast';

export interface FAQOptions {
  numFaqs?: number;
  force?: boolean;
}

export interface FAQGenerationState {
  selectedDocument: Document | null;
  data: DocumentFAQ | null;
  isModalOpen: boolean;
  isGenerating: boolean;
}

export interface FAQGenerationActions {
  handleFaq: (document: Document, quantity?: number) => Promise<void>;
  handleModalClose: () => void;
  handleSave: (faqs: DocumentFAQ['faqs']) => Promise<void>;
  handleRegenerate: (options?: { numFaqs?: number }) => Promise<void>;
}

export type FAQGenerationReturn = FAQGenerationState & FAQGenerationActions;

/**
 * Hook for document FAQ generation
 * Uses the generic useAIGeneration hook for common functionality
 */
export function useFAQGeneration(): FAQGenerationReturn {
  const {
    selectedDocument,
    data,
    setData,
    isModalOpen,
    isGenerating,
    handleGenerate,
    handleModalClose,
    handleRegenerate: baseRegenerate,
  } = useAIGeneration<DocumentFAQ, FAQOptions>({
    featureName: 'faq',
    displayName: 'FAQ',
    generateFn: async (document, orgName, folderName, options) => {
      return faqApi.generateAndConvert(
        document,
        orgName,
        folderName,
        options?.numFaqs ?? 10,
        undefined,
        options?.force ?? false
      );
    },
    formatSuccessMessage: (result, cached) =>
      `${result.count} FAQs generated${cached ? ' (cached)' : ''}`,
  });

  // Wrap handleGenerate to match existing API (quantity as second param)
  const handleFaq = useCallback(
    async (document: Document, quantity: number = 10) => {
      await handleGenerate(document, { numFaqs: quantity });
    },
    [handleGenerate]
  );

  // Wrap handleRegenerate to add force flag
  const handleRegenerate = useCallback(
    async (options?: { numFaqs?: number }) => {
      await baseRegenerate({ numFaqs: options?.numFaqs ?? 5, force: true });
    },
    [baseRegenerate]
  );

  // Custom save handler for FAQ (updates faqs array)
  const handleSave = useCallback(
    async (faqs: DocumentFAQ['faqs']) => {
      if (!selectedDocument || !data) return;

      setData({
        ...data,
        faqs,
        updated_at: new Date().toISOString()
      });
      toast.success(`FAQ updated for: ${selectedDocument.name}`);
    },
    [selectedDocument, data, setData]
  );

  return {
    selectedDocument,
    data,
    isModalOpen,
    isGenerating,
    handleFaq,
    handleModalClose,
    handleSave,
    handleRegenerate,
  };
}
