'use client';

import { useState, useCallback, useRef } from 'react';
import {
  RagMessage,
  EnhancedRAGRequest,
  EnhancedRAGQueryOptions,
  GeminiSearchMode,
  DocumentChatRequest,
} from '@/types/rag';
import { Document } from '@/types/api';
import { simpleRagApiClient } from '@/lib/api/rag';
import { chatWithDocuments } from '@/lib/api/ingestion';
import { useAuth } from '@/hooks/useAuth';
import { foldersApi } from '@/lib/api/index';
import {
  constructMultiDocumentPaths,
  validatePathComponents,
  debugLogPaths,
  DocumentWithFolder
} from '@/lib/utils/rag-paths';
import toast from 'react-hot-toast';

export interface GeminiSearchOptions {
  searchMode?: GeminiSearchMode;
  folderName?: string;
  fileFilter?: string;
  maxSources?: number;
}

export interface RagChatSessionState {
  messages: RagMessage[];
  isLoading: boolean;
  error: string | null;
  isOpen: boolean;
  currentDocument: Document | null;
  currentDocuments: Document[];
  sessionId: string | null;
}

export interface RagChatSessionActions {
  openChat: (document: Document) => void;
  openMultiChat: (documents: Document[]) => void;
  closeChat: () => void;
  clearChat: () => void;
  addMessage: (message: Omit<RagMessage, 'id' | 'timestamp'>) => RagMessage;
  setMessages: (messages: RagMessage[]) => void;
  sendMessage: (
    query: string,
    options?: EnhancedRAGQueryOptions,
    config?: { maxSources: number }
  ) => Promise<void>;
  sendGeminiSearch: (
    query: string,
    options: GeminiSearchOptions | undefined,
    config: {
      searchMode: GeminiSearchMode;
      folderFilter: string | null;
      fileFilter: string | null;
      maxSources: number;
    },
    onHistoryAdd: (item: any) => void
  ) => Promise<void>;
  retryLastMessage: () => Promise<void>;
}

/**
 * Hook for RAG chat session management
 */
export function useRagChatSession(): RagChatSessionState & RagChatSessionActions {
  // State
  const [messages, setMessages] = useState<RagMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);
  const [currentDocuments, setCurrentDocuments] = useState<Document[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Refs for retry
  const lastQueryRef = useRef<{ query: string; options?: EnhancedRAGQueryOptions } | null>(null);

  const { user } = useAuth();

  const openChat = useCallback((document: Document) => {
    console.log('⚡ Opening RAG chat for document:', document.name);
    setCurrentDocument(document);
    setCurrentDocuments([document]);
    setIsOpen(true);
    setError(null);
    setMessages([]);
    setSessionId(null);
  }, []);

  const openMultiChat = useCallback((documents: Document[]) => {
    console.log('⚡ Opening RAG chat for', documents.length, 'documents');
    setCurrentDocument(null);
    setCurrentDocuments(documents);
    setIsOpen(true);
    setError(null);
    setMessages([]);
    setSessionId(null);
  }, []);

  const closeChat = useCallback(() => {
    console.log('⚡ Closing RAG chat');
    setIsOpen(false);
    setError(null);
  }, []);

  const clearChat = useCallback(() => {
    console.log('⚡ Clearing RAG chat history');
    setMessages([]);
    setError(null);
    lastQueryRef.current = null;
    toast.success('Chat history cleared');
  }, []);

  const addMessage = useCallback((message: Omit<RagMessage, 'id' | 'timestamp'>) => {
    const newMessage: RagMessage = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
    return newMessage;
  }, []);

  const sendMessage = useCallback(async (
    query: string,
    options?: EnhancedRAGQueryOptions,
    config?: { maxSources: number }
  ) => {
    if ((currentDocuments.length === 0 && !currentDocument) || !user?.org_id || !user?.org_name) {
      toast.error('Cannot send message: Missing document or organization information');
      return;
    }

    lastQueryRef.current = { query, options };

    addMessage({ type: 'user', content: query });
    setIsLoading(true);
    setError(null);

    try {
      const documentsWithFolders: DocumentWithFolder[] = [];

      for (const doc of currentDocuments) {
        if (!doc.folder_id) continue;
        try {
          const folderDetails = await foldersApi.getById(user.org_id, doc.folder_id);
          documentsWithFolders.push({ ...doc, folder_name: folderDetails.name });
        } catch (folderError) {
          console.error('❌ Failed to resolve folder:', doc.name, folderError);
        }
      }

      const validation = validatePathComponents(user.org_name, documentsWithFolders);
      if (!validation.isValid) {
        throw new Error(`Cannot construct RAG paths: Missing ${validation.missingComponents.join(', ')}`);
      }

      const paths = constructMultiDocumentPaths(user.org_name, validation.validDocuments);

      if (process.env.NODE_ENV === 'development') {
        debugLogPaths(user.org_name, validation.validDocuments, paths);
      }

      const request: EnhancedRAGRequest = {
        query,
        organization: user.org_name,
        document_paths: paths.document_paths,
        document_name_list: paths.document_name_list,
        bm_25_paths: paths.bm_25_paths,
        max_sources: options?.maxSources || config?.maxSources || 10,
        search_type: options?.searchType || 'hybrid',
      };

      const response = await simpleRagApiClient.enhancedSearch(request);

      if (!response?.answer) {
        throw new Error('Invalid response from Enhanced RAG API');
      }

      addMessage({
        type: 'assistant',
        content: response.answer,
        metadata: {
          processing_time: response.processing_time || 0,
          confidence_score: response.confidence_score || 0,
          sources_count: response.sources?.length || 0,
          search_strategy: response.search_strategy || 'unknown',
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process query';
      setError(errorMessage);
      addMessage({
        type: 'assistant',
        content: `Sorry, I encountered an error: ${errorMessage}`,
        metadata: { processing_time: 0, confidence_score: 0, sources_count: 0 },
      });
      toast.error(`RAG query failed: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [currentDocument, currentDocuments, user?.org_id, user?.org_name, addMessage]);

  const sendGeminiSearch = useCallback(async (
    query: string,
    options: GeminiSearchOptions | undefined,
    config: {
      searchMode: GeminiSearchMode;
      folderFilter: string | null;
      fileFilter: string | null;
      maxSources: number;
    },
    onHistoryAdd: (item: any) => void
  ) => {
    if (!user?.org_name) {
      toast.error('Cannot search: Missing organization information');
      return;
    }

    const effectiveSearchMode = options?.searchMode || config.searchMode;
    const effectiveFolderName = options?.folderName || config.folderFilter;
    const effectiveFileFilter = options?.fileFilter || config.fileFilter;
    const effectiveMaxSources = options?.maxSources || config.maxSources;

    addMessage({ type: 'user', content: query });
    setIsLoading(true);
    setError(null);

    try {
      const request: DocumentChatRequest = {
        query,
        organization_name: user.org_name,
        session_id: sessionId || undefined,
        folder_filter: effectiveFolderName || undefined,
        file_filter: effectiveFileFilter || undefined,
        search_mode: effectiveSearchMode,
        max_sources: effectiveMaxSources,
      };

      const response = await chatWithDocuments(request);

      if (!response.success) {
        throw new Error(response.error || 'Chat failed');
      }

      if (response.session_id) {
        setSessionId(response.session_id);
      }

      // Add to history via callback
      onHistoryAdd({
        query,
        response: response.answer || '',
        citations: response.citations || [],
        timestamp: new Date(),
        filters: {
          folder: effectiveFolderName || undefined,
          file: effectiveFileFilter || undefined,
          searchMode: effectiveSearchMode,
        },
      });

      addMessage({
        type: 'assistant',
        content: response.answer || 'No answer generated.',
        citations: response.citations || [],
        metadata: {
          processing_time: response.processing_time_ms / 1000,
          confidence_score: 0,
          sources_count: response.citations?.length || 0,
          search_strategy: response.search_mode,
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Chat failed';
      setError(errorMessage);
      addMessage({
        type: 'assistant',
        content: `Sorry, I encountered an error: ${errorMessage}`,
        metadata: { processing_time: 0, confidence_score: 0, sources_count: 0 },
      });
      toast.error(`Chat failed: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [user?.org_name, sessionId, addMessage]);

  const retryLastMessage = useCallback(async () => {
    if (!lastQueryRef.current) {
      toast.error('No previous message to retry');
      return;
    }

    setMessages((prev) => {
      const newMessages = [...prev];
      if (newMessages.length > 0 && newMessages[newMessages.length - 1].type === 'assistant') {
        newMessages.pop();
      }
      return newMessages;
    });

    setError(null);
    await sendMessage(lastQueryRef.current.query, lastQueryRef.current.options);
  }, [sendMessage]);

  return {
    messages,
    isLoading,
    error,
    isOpen,
    currentDocument,
    currentDocuments,
    sessionId,
    openChat,
    openMultiChat,
    closeChat,
    clearChat,
    addMessage,
    setMessages,
    sendMessage,
    sendGeminiSearch,
    retryLastMessage,
  };
}
