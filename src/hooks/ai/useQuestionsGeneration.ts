'use client';

import { useCallback } from 'react';
import { Document, DocumentQuestions } from '@/types/api';
import { questionsApi } from '@/lib/api/ai-features';
import { useAIGeneration } from './useAIGeneration';
import toast from 'react-hot-toast';

export interface QuestionsOptions {
  numQuestions?: number;
  force?: boolean;
}

export interface QuestionsGenerationState {
  selectedDocument: Document | null;
  data: DocumentQuestions | null;
  isModalOpen: boolean;
  isGenerating: boolean;
}

export interface QuestionsGenerationActions {
  handleQuestions: (document: Document, quantity?: number) => Promise<void>;
  handleModalClose: () => void;
  handleSave: (questions: string[]) => Promise<void>;
  handleRegenerate: (options?: { numQuestions?: number }) => Promise<void>;
}

export type QuestionsGenerationReturn = QuestionsGenerationState & QuestionsGenerationActions;

/**
 * Hook for document questions generation
 * Uses the generic useAIGeneration hook for common functionality
 */
export function useQuestionsGeneration(): QuestionsGenerationReturn {
  const {
    selectedDocument,
    data,
    setData,
    isModalOpen,
    isGenerating,
    handleGenerate,
    handleModalClose,
    handleRegenerate: baseRegenerate,
  } = useAIGeneration<DocumentQuestions, QuestionsOptions>({
    featureName: 'questions',
    displayName: 'Questions',
    generateFn: async (document, orgName, folderName, options) => {
      return questionsApi.generateAndConvert(
        document,
        orgName,
        folderName,
        options?.numQuestions ?? 10,
        undefined,
        options?.force ?? false
      );
    },
    formatSuccessMessage: (result, cached) => {
      const dist = result.difficulty_distribution;
      const distText = dist ? ` (Easy: ${dist.easy}, Medium: ${dist.medium}, Hard: ${dist.hard})` : '';
      return `${result.count} questions generated${distText}${cached ? ' (cached)' : ''}`;
    },
  });

  // Wrap handleGenerate to match existing API (quantity as second param)
  const handleQuestions = useCallback(
    async (document: Document, quantity: number = 10) => {
      await handleGenerate(document, { numQuestions: quantity });
    },
    [handleGenerate]
  );

  // Wrap handleRegenerate to add force flag and custom success message
  const handleRegenerate = useCallback(
    async (options?: { numQuestions?: number }) => {
      await baseRegenerate({ numQuestions: options?.numQuestions ?? 10, force: true });
    },
    [baseRegenerate]
  );

  // Custom save handler for questions (maps string[] to question objects)
  const handleSave = useCallback(
    async (questions: string[]) => {
      if (!selectedDocument || !data) return;

      setData({
        ...data,
        questions: questions.map(q => ({
          question: q,
          type: 'short_answer' as const
        })),
        updated_at: new Date().toISOString()
      });
      toast.success(`Questions saved for: ${selectedDocument.name}`);
    },
    [selectedDocument, data, setData]
  );

  return {
    selectedDocument,
    data,
    isModalOpen,
    isGenerating,
    handleQuestions,
    handleModalClose,
    handleSave,
    handleRegenerate,
  };
}
