'use client';

/**
 * RAG Chat Hook Module
 *
 * Composed from focused sub-hooks for better maintainability:
 * - useRagChatSession: Core session and message management
 * - useRagChatConfig: Search configuration state
 * - useSearchHistory: Search history management
 */

import { useCallback } from 'react';
import { Document } from '@/types/api';
import { RagMessage, EnhancedRAGQueryOptions, GeminiSearchMode, SearchHistoryItem } from '@/types/rag';
import { useRagChatSession, GeminiSearchOptions } from './useRagChatSession';
import { useRagChatConfig } from './useRagChatConfig';
import { useSearchHistory } from './useSearchHistory';

// Re-export sub-hooks for direct usage
export { useRagChatSession, type GeminiSearchOptions } from './useRagChatSession';
export { useRagChatConfig } from './useRagChatConfig';
export { useSearchHistory } from './useSearchHistory';
export { useChatPage, storeChatContext, clearChatContext, type UseChatPageReturn, type ChatContext } from './useChatPage';

export interface UseRagChatReturn {
  // State
  messages: RagMessage[];
  isLoading: boolean;
  isStreaming: boolean;              // Whether currently streaming tokens
  streamingStatus: string | null;    // Status message during streaming
  error: string | null;
  isOpen: boolean;
  currentDocument: Document | null;
  currentDocuments: Document[];

  // Configuration (searchMode is fixed to 'hybrid')
  maxSources: number;
  searchMode: GeminiSearchMode;
  folderFilter: string | null;
  fileFilter: string | null;

  // Search history
  searchHistory: SearchHistoryItem[];

  // Actions
  openChat: (document: Document) => void;
  openMultiChat: (documents: Document[]) => void;
  closeChat: () => void;
  sendMessage: (query: string, options?: EnhancedRAGQueryOptions) => Promise<void>;
  sendGeminiSearch: (query: string, options?: GeminiSearchOptions) => Promise<void>;
  sendGeminiSearchStream: (query: string, options?: GeminiSearchOptions) => Promise<void>;
  clearChat: () => void;
  retryLastMessage: () => Promise<void>;
  viewHistoryItem: (item: SearchHistoryItem) => void;
  clearHistory: () => void;

  // Configuration setters
  setMaxSources: (count: number) => void;
  setFolderFilter: (folder: string | null) => void;
  setFileFilter: (file: string | null) => void;
}

/**
 * Composed RAG Chat hook
 * Combines session, config, and history management
 */
export function useRagChat(): UseRagChatReturn {
  const session = useRagChatSession();
  const config = useRagChatConfig();
  const history = useSearchHistory();

  // Wrap sendMessage to include config
  const sendMessage = useCallback(async (query: string, options?: EnhancedRAGQueryOptions) => {
    await session.sendMessage(query, options, { maxSources: config.maxSources });
  }, [session, config.maxSources]);

  // Wrap sendGeminiSearch to include config and history
  const sendGeminiSearch = useCallback(async (query: string, options?: GeminiSearchOptions) => {
    await session.sendGeminiSearch(query, options, {
      searchMode: config.searchMode,
      folderFilter: config.folderFilter,
      fileFilter: config.fileFilter,
      maxSources: config.maxSources,
    }, history.addHistoryItem);
  }, [session, config, history.addHistoryItem]);

  // Wrap sendGeminiSearchStream to include config and history (streaming version)
  const sendGeminiSearchStream = useCallback(async (query: string, options?: GeminiSearchOptions) => {
    await session.sendGeminiSearchStream(query, options, {
      searchMode: config.searchMode,
      folderFilter: config.folderFilter,
      fileFilter: config.fileFilter,
      maxSources: config.maxSources,
    }, history.addHistoryItem);
  }, [session, config, history.addHistoryItem]);

  // Wrap viewHistoryItem to pass setMessages
  const viewHistoryItem = useCallback((item: SearchHistoryItem) => {
    history.viewHistoryItem(item, session.setMessages);
  }, [history, session.setMessages]);

  return {
    // State from session
    messages: session.messages,
    isLoading: session.isLoading,
    isStreaming: session.isStreaming,
    streamingStatus: session.streamingStatus,
    error: session.error,
    isOpen: session.isOpen,
    currentDocument: session.currentDocument,
    currentDocuments: session.currentDocuments,

    // Configuration from config
    maxSources: config.maxSources,
    searchMode: config.searchMode,
    folderFilter: config.folderFilter,
    fileFilter: config.fileFilter,

    // History
    searchHistory: history.searchHistory,

    // Actions
    openChat: session.openChat,
    openMultiChat: session.openMultiChat,
    closeChat: session.closeChat,
    sendMessage,
    sendGeminiSearch,
    sendGeminiSearchStream,
    clearChat: session.clearChat,
    retryLastMessage: session.retryLastMessage,
    viewHistoryItem,
    clearHistory: history.clearHistory,

    // Configuration setters
    setMaxSources: config.setMaxSources,
    setFolderFilter: config.setFolderFilter,
    setFileFilter: config.setFileFilter,
  };
}
