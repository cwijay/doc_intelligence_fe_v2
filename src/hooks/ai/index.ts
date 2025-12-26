'use client';

/**
 * Document AI Hooks Module
 *
 * Composed from focused sub-hooks for better maintainability:
 * - useSummaryGeneration: Summary generation and management
 * - useFAQGeneration: FAQ generation and management
 * - useQuestionsGeneration: Questions generation and management
 */

import { Document, DocumentSummary, DocumentFAQ, DocumentQuestions } from '@/types/api';
import { useSummaryGeneration } from './useSummaryGeneration';
import { useFAQGeneration } from './useFAQGeneration';
import { useQuestionsGeneration } from './useQuestionsGeneration';

// Re-export sub-hooks for direct usage
export { useSummaryGeneration } from './useSummaryGeneration';
export { useFAQGeneration } from './useFAQGeneration';
export { useQuestionsGeneration } from './useQuestionsGeneration';
export { resolveFolderName } from './utils';

export interface UseDocumentAIReturn {
  // Summary state and handlers
  selectedDocumentForSummary: Document | null;
  summaryData: DocumentSummary | null;
  isSummaryModalOpen: boolean;
  isGeneratingSummary: boolean;
  summarizingDocuments: Set<string>;
  handleSummarize: (document: Document, maxWords?: number) => Promise<void>;
  handleSummaryModalClose: () => void;
  handleSummarySave: (editedContent: string) => Promise<void>;
  handleSummaryRegenerate: (options?: { maxWords?: number }) => Promise<void>;

  // FAQ state and handlers
  selectedDocumentForFAQ: Document | null;
  faqData: DocumentFAQ | null;
  isFAQModalOpen: boolean;
  isGeneratingFAQ: boolean;
  faqGeneratingDocuments: Set<string>;
  handleFaq: (document: Document, quantity?: number) => Promise<void>;
  handleFAQModalClose: () => void;
  handleFAQSave: (faqs: DocumentFAQ['faqs']) => Promise<void>;
  handleFAQRegenerate: (options?: { numFaqs?: number }) => Promise<void>;

  // Questions state and handlers
  selectedDocumentForQuestions: Document | null;
  questionsData: DocumentQuestions | null;
  isQuestionsModalOpen: boolean;
  isGeneratingQuestions: boolean;
  questionsGeneratingDocuments: Set<string>;
  handleQuestions: (document: Document, quantity?: number) => Promise<void>;
  handleQuestionsModalClose: () => void;
  handleQuestionsSave: (questions: string[]) => Promise<void>;
  handleQuestionsRegenerate: (options?: { numQuestions?: number }) => Promise<void>;
}

/**
 * Composed Document AI hook
 * Combines summary, FAQ, and questions generation
 */
export function useDocumentAI(): UseDocumentAIReturn {
  const summary = useSummaryGeneration();
  const faq = useFAQGeneration();
  const questions = useQuestionsGeneration();

  // Compute generating documents sets based on current state
  const summarizingDocuments = summary.isGenerating && summary.selectedDocument
    ? new Set([summary.selectedDocument.id])
    : new Set<string>();

  const faqGeneratingDocuments = faq.isGenerating && faq.selectedDocument
    ? new Set([faq.selectedDocument.id])
    : new Set<string>();

  const questionsGeneratingDocuments = questions.isGenerating && questions.selectedDocument
    ? new Set([questions.selectedDocument.id])
    : new Set<string>();

  return {
    // Summary state and handlers
    selectedDocumentForSummary: summary.selectedDocument,
    summaryData: summary.data,
    isSummaryModalOpen: summary.isModalOpen,
    isGeneratingSummary: summary.isGenerating,
    summarizingDocuments,
    handleSummarize: summary.handleSummarize,
    handleSummaryModalClose: summary.handleModalClose,
    handleSummarySave: summary.handleSave,
    handleSummaryRegenerate: summary.handleRegenerate,

    // FAQ state and handlers
    selectedDocumentForFAQ: faq.selectedDocument,
    faqData: faq.data,
    isFAQModalOpen: faq.isModalOpen,
    isGeneratingFAQ: faq.isGenerating,
    faqGeneratingDocuments,
    handleFaq: faq.handleFaq,
    handleFAQModalClose: faq.handleModalClose,
    handleFAQSave: faq.handleSave,
    handleFAQRegenerate: faq.handleRegenerate,

    // Questions state and handlers
    selectedDocumentForQuestions: questions.selectedDocument,
    questionsData: questions.data,
    isQuestionsModalOpen: questions.isModalOpen,
    isGeneratingQuestions: questions.isGenerating,
    questionsGeneratingDocuments,
    handleQuestions: questions.handleQuestions,
    handleQuestionsModalClose: questions.handleModalClose,
    handleQuestionsSave: questions.handleSave,
    handleQuestionsRegenerate: questions.handleRegenerate,
  };
}
