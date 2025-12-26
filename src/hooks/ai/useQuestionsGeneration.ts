'use client';

import { useState, useCallback } from 'react';
import { Document, DocumentQuestions } from '@/types/api';
import { questionsApi } from '@/lib/api/ai-features';
import { useAuth } from '@/hooks/useAuth';
import { resolveFolderName } from './utils';
import toast from 'react-hot-toast';

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
 */
export function useQuestionsGeneration(): QuestionsGenerationReturn {
  const { user } = useAuth();

  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [data, setData] = useState<DocumentQuestions | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleQuestions = useCallback(async (document: Document, quantity: number = 10) => {
    if (!user?.org_name || !user?.org_id) {
      toast.error('Organization information not available. Please log in again.');
      return;
    }

    try {
      setSelectedDocument(document);
      setIsGenerating(true);
      setIsModalOpen(true);
      setData(null);

      console.log('Starting questions generation for:', document.name);
      toast.loading(`Generating ${quantity} questions for: ${document.name}`, { id: `questions-${document.id}` });

      const folderName = await resolveFolderName(document, user.org_id);

      const documentQuestions = await questionsApi.generateAndConvert(
        document,
        user.org_name,
        folderName,
        quantity
      );

      setData(documentQuestions);

      // Show difficulty distribution in toast
      const dist = documentQuestions.difficulty_distribution;
      const distText = dist ? ` (Easy: ${dist.easy}, Medium: ${dist.medium}, Hard: ${dist.hard})` : '';

      toast.success(
        `${documentQuestions.count} questions generated${distText}${documentQuestions.cached ? ' (cached)' : ''}`,
        { id: `questions-${document.id}` }
      );
      console.log('Questions generated successfully for:', document.name);

    } catch (error) {
      console.error('Questions operation failed:', error);

      const errorMessage = error instanceof Error ? error.message : 'Failed to generate questions';

      toast.error(`Failed to generate questions for ${document.name}: ${errorMessage}`, {
        id: `questions-${document.id}`
      });

      setData(null);
    } finally {
      setIsGenerating(false);
    }
  }, [user]);

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setSelectedDocument(null);
    setData(null);
    setIsGenerating(false);
  }, []);

  const handleSave = useCallback(async (questions: string[]) => {
    if (!selectedDocument || !data) return;

    // Map string[] to the questions array format
    setData({
      ...data,
      questions: questions.map(q => ({
        question: q,
        type: 'short_answer' as const
      })),
      updated_at: new Date().toISOString()
    });
    toast.success(`Questions saved for: ${selectedDocument.name}`);
  }, [selectedDocument, data]);

  const handleRegenerate = useCallback(async (options?: { numQuestions?: number }) => {
    if (!selectedDocument || !user?.org_name || !user?.org_id) return;

    try {
      setIsGenerating(true);
      console.log('Regenerating questions for:', selectedDocument.name);
      toast.loading(`Regenerating questions for: ${selectedDocument.name}`, {
        id: `regen-questions-${selectedDocument.id}`
      });

      const folderName = await resolveFolderName(selectedDocument, user.org_id);

      const documentQuestions = await questionsApi.generateAndConvert(
        selectedDocument,
        user.org_name,
        folderName,
        options?.numQuestions || 10,
        undefined,
        true // force regeneration
      );

      setData(documentQuestions);

      const dist = documentQuestions.difficulty_distribution;
      const distText = dist ? ` (E:${dist.easy} M:${dist.medium} H:${dist.hard})` : '';

      toast.success(
        `${documentQuestions.count} questions regenerated${distText}`,
        { id: `regen-questions-${selectedDocument.id}` }
      );
      console.log('Questions regenerated successfully');

    } catch (error) {
      console.error('Questions regeneration failed:', error);

      const errorMessage = error instanceof Error ? error.message : 'Failed to regenerate questions';

      toast.error(`Failed to regenerate questions: ${errorMessage}`, {
        id: `regen-questions-${selectedDocument.id}`
      });
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, [selectedDocument, user]);

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
