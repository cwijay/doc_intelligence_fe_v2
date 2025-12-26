import { Document, DocumentSummary, DocumentFAQ, DocumentQuestions, DifficultyLevel } from '@/types/api';
import {
  DocumentTextIcon,
  QuestionMarkCircleIcon,
  AcademicCapIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

// Content type discriminator
export type AIContentType = 'summary' | 'faq' | 'questions';

// Regeneration options per content type
export type SummaryRegenerationOptions = {
  length: 'short' | 'medium' | 'long';
  format: 'bullets' | 'paragraphs' | 'executive';
};

export type FAQRegenerationOptions = {
  question_count: number;
  depth: 'basic' | 'intermediate' | 'advanced';
  format: 'simple' | 'detailed' | 'technical';
};

export type QuestionsRegenerationOptions = {
  question_count: number;
  prompt: string;
};

// Union type for all regeneration options
export type RegenerationOptions = SummaryRegenerationOptions | FAQRegenerationOptions | QuestionsRegenerationOptions;

// Union type for all data types
export type AIContentData = DocumentSummary | DocumentFAQ | DocumentQuestions;

// Props interface
export interface DocumentAIContentModalProps {
  contentType: AIContentType;
  isOpen: boolean;
  onClose: () => void;
  document: Document | null;
  data: AIContentData | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onRegenerate?: (options?: any) => Promise<void>;
  isGenerating?: boolean;
}

// Config for each content type
export const CONTENT_CONFIG = {
  summary: {
    title: 'Document Summary',
    icon: DocumentTextIcon,
    tabLabel: 'Summary',
    emptyIcon: SparklesIcon,
    emptyMessage: 'No summary available',
    emptySubtext: 'Generate a summary to see the content here',
    generatingMessage: 'Generating Summary',
    generatingSubtext: 'AI is analyzing your document and creating a comprehensive summary...',
    countLabel: 'words',
    regenerateLabel: 'Regenerate Summary',
  },
  faq: {
    title: 'Document FAQs',
    icon: QuestionMarkCircleIcon,
    tabLabel: 'FAQs',
    emptyIcon: QuestionMarkCircleIcon,
    emptyMessage: 'No FAQs available',
    emptySubtext: 'Generate FAQs to see the content here',
    generatingMessage: 'Generating FAQs',
    generatingSubtext: 'AI is analyzing your document and creating frequently asked questions...',
    countLabel: 'FAQs',
    regenerateLabel: 'Regenerate FAQs',
  },
  questions: {
    title: 'Document Questions',
    icon: AcademicCapIcon,
    tabLabel: 'Questions',
    emptyIcon: QuestionMarkCircleIcon,
    emptyMessage: 'No questions available',
    emptySubtext: 'Generate questions to see the content here',
    generatingMessage: 'Generating Questions',
    generatingSubtext: 'AI is analyzing your document and creating comprehension questions...',
    countLabel: 'questions',
    regenerateLabel: 'Regenerate Questions',
  },
};

// Default regeneration options per type
export const DEFAULT_REGEN_OPTIONS: Record<AIContentType, RegenerationOptions> = {
  summary: { length: 'medium', format: 'paragraphs' } as SummaryRegenerationOptions,
  faq: { question_count: 10, depth: 'intermediate', format: 'detailed' } as FAQRegenerationOptions,
  questions: { question_count: 5, prompt: '' } as QuestionsRegenerationOptions,
};

// Helper to get difficulty badge styles
export const getDifficultyBadgeStyles = (difficulty?: DifficultyLevel): string => {
  switch (difficulty) {
    case 'easy':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'hard':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
  }
};

// Type guards
export const isSummaryData = (data: AIContentData | null): data is DocumentSummary => {
  return data !== null && 'content' in data && typeof (data as DocumentSummary).content === 'string';
};

export const isFAQData = (data: AIContentData | null): data is DocumentFAQ => {
  return data !== null && 'faqs' in data && Array.isArray((data as DocumentFAQ).faqs);
};

export const isQuestionsData = (data: AIContentData | null): data is DocumentQuestions => {
  return data !== null && 'questions' in data && Array.isArray((data as DocumentQuestions).questions);
};
