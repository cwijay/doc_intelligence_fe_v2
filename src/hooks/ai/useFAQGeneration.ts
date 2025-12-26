'use client';

import { useState, useCallback } from 'react';
import { Document, DocumentFAQ } from '@/types/api';
import { faqApi } from '@/lib/api/ai-features';
import { useAuth } from '@/hooks/useAuth';
import { resolveFolderName } from './utils';
import toast from 'react-hot-toast';

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
 */
export function useFAQGeneration(): FAQGenerationReturn {
  const { user } = useAuth();

  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [data, setData] = useState<DocumentFAQ | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleFaq = useCallback(async (document: Document, quantity: number = 10) => {
    if (!user?.org_name || !user?.org_id) {
      toast.error('Organization information not available. Please log in again.');
      return;
    }

    try {
      setSelectedDocument(document);
      setIsGenerating(true);
      setIsModalOpen(true);
      setData(null);

      console.log('Starting FAQ generation for:', document.name);
      toast.loading(`Generating ${quantity} FAQs for: ${document.name}`, { id: `faq-${document.id}` });

      const folderName = await resolveFolderName(document, user.org_id);

      const documentFAQ = await faqApi.generateAndConvert(
        document,
        user.org_name,
        folderName,
        quantity
      );

      setData(documentFAQ);
      toast.success(
        `${documentFAQ.count} FAQs generated${documentFAQ.cached ? ' (cached)' : ''}`,
        { id: `faq-${document.id}` }
      );
      console.log('FAQ generated successfully for:', document.name);

    } catch (error) {
      console.error('FAQ operation failed:', error);

      const errorMessage = error instanceof Error ? error.message : 'Failed to generate FAQ';

      toast.error(`Failed to generate FAQ for ${document.name}: ${errorMessage}`, {
        id: `faq-${document.id}`
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

  const handleSave = useCallback(async (faqs: DocumentFAQ['faqs']) => {
    if (!selectedDocument || !data) return;

    setData({
      ...data,
      faqs,
      updated_at: new Date().toISOString()
    });
    toast.success(`FAQ updated for: ${selectedDocument.name}`);
  }, [selectedDocument, data]);

  const handleRegenerate = useCallback(async (options?: { numFaqs?: number }) => {
    if (!selectedDocument || !user?.org_name || !user?.org_id) return;

    try {
      setIsGenerating(true);
      console.log('Regenerating FAQ for:', selectedDocument.name);
      toast.loading(`Regenerating FAQ for: ${selectedDocument.name}`, {
        id: `regen-faq-${selectedDocument.id}`
      });

      const folderName = await resolveFolderName(selectedDocument, user.org_id);

      const documentFAQ = await faqApi.generateAndConvert(
        selectedDocument,
        user.org_name,
        folderName,
        options?.numFaqs || 5,
        undefined,
        true // force regeneration
      );

      setData(documentFAQ);
      toast.success(
        `${documentFAQ.count} FAQs regenerated`,
        { id: `regen-faq-${selectedDocument.id}` }
      );
      console.log('FAQ regenerated successfully');

    } catch (error) {
      console.error('FAQ regeneration failed:', error);

      const errorMessage = error instanceof Error ? error.message : 'Failed to regenerate FAQ';

      toast.error(`Failed to regenerate FAQ: ${errorMessage}`, {
        id: `regen-faq-${selectedDocument.id}`
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
    handleFaq,
    handleModalClose,
    handleSave,
    handleRegenerate,
  };
}
