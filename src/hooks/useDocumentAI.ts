'use client';

/**
 * @deprecated This file re-exports from the ai/ module for backward compatibility.
 * Import directly from '@/hooks/ai' instead.
 */

// Re-export everything from the new modular structure
export {
  useDocumentAI,
  useSummaryGeneration,
  useFAQGeneration,
  useQuestionsGeneration,
  type UseDocumentAIReturn,
} from './ai';
