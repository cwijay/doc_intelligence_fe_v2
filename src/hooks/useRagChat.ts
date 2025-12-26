'use client';

/**
 * @deprecated This file re-exports from the rag/ module for backward compatibility.
 * Import directly from '@/hooks/rag' instead.
 */

// Re-export everything from the new modular structure
export {
  useRagChat,
  useRagChatSession,
  useRagChatConfig,
  useSearchHistory,
  type UseRagChatReturn,
  type GeminiSearchOptions,
} from './rag';
