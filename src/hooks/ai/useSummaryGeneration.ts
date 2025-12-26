'use client';

import { useState, useCallback } from 'react';
import { Document, DocumentSummary } from '@/types/api';
import { summaryApi } from '@/lib/api/ai-features';
import { useAuth } from '@/hooks/useAuth';
import { resolveFolderName } from './utils';
import toast from 'react-hot-toast';

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
 */
export function useSummaryGeneration(): SummaryGenerationReturn {
  const { user } = useAuth();

  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [data, setData] = useState<DocumentSummary | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSummarize = useCallback(async (document: Document, maxWords: number = 500) => {
    if (!user?.org_name || !user?.org_id) {
      toast.error('Organization information not available. Please log in again.');
      return;
    }

    try {
      setSelectedDocument(document);
      setIsGenerating(true);
      setIsModalOpen(true);
      setData(null);

      console.log('Starting summarization for:', document.name);
      toast.loading(`Generating summary for: ${document.name}`, { id: `summary-${document.id}` });

      const folderName = await resolveFolderName(document, user.org_id);

      const documentSummary = await summaryApi.generateAndConvert(
        document,
        user.org_name,
        folderName,
        maxWords
      );

      setData(documentSummary);
      toast.success(
        `Summary generated (${documentSummary.word_count} words${documentSummary.cached ? ', cached' : ''})`,
        { id: `summary-${document.id}` }
      );
      console.log('Summary generated successfully for:', document.name);

    } catch (error) {
      console.error('Summary operation failed:', error);

      const errorMessage = error instanceof Error ? error.message : 'Failed to generate summary';

      toast.error(`Failed to generate summary for ${document.name}: ${errorMessage}`, {
        id: `summary-${document.id}`
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

  const handleSave = useCallback(async (editedContent: string) => {
    if (!selectedDocument || !data) return;

    setData({
      ...data,
      content: editedContent,
      updated_at: new Date().toISOString()
    });
    toast.success(`Summary updated for: ${selectedDocument.name}`);
  }, [selectedDocument, data]);

  const handleRegenerate = useCallback(async (options?: { maxWords?: number }) => {
    if (!selectedDocument || !user?.org_name || !user?.org_id) return;

    try {
      setIsGenerating(true);
      console.log('Regenerating summary for:', selectedDocument.name);
      toast.loading(`Regenerating summary for: ${selectedDocument.name}`, {
        id: `regen-${selectedDocument.id}`
      });

      const folderName = await resolveFolderName(selectedDocument, user.org_id);

      const documentSummary = await summaryApi.generateAndConvert(
        selectedDocument,
        user.org_name,
        folderName,
        options?.maxWords || 500,
        undefined,
        true // force regeneration
      );

      setData(documentSummary);
      toast.success(
        `Summary regenerated (${documentSummary.word_count} words)`,
        { id: `regen-${selectedDocument.id}` }
      );
      console.log('Summary regenerated successfully');

    } catch (error) {
      console.error('Summary regeneration failed:', error);

      const errorMessage = error instanceof Error ? error.message : 'Failed to regenerate summary';

      toast.error(`Failed to regenerate summary: ${errorMessage}`, {
        id: `regen-${selectedDocument.id}`
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
    handleSummarize,
    handleModalClose,
    handleSave,
    handleRegenerate,
  };
}
