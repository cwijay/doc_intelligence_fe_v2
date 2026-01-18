'use client';

import { useState, useCallback, useRef } from 'react';
import {
  RagMessage,
  EnhancedRAGRequest,
  EnhancedRAGQueryOptions,
  GeminiSearchMode,
  DocumentChatRequest,
  DocumentChatStreamRequest,
  StreamEvent,
  DocumentChatCitation,
} from '@/types/rag';
import { Document } from '@/types/api';
import { simpleRagApiClient } from '@/lib/api/rag';
import { chatWithDocuments, chatWithDocumentsStream } from '@/lib/api/ingestion/index';
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
  /** Filter by specific file(s). Accepts single filename or array of filenames. */
  fileFilter?: string | string[];
  maxSources?: number;
}

export interface RagChatSessionState {
  messages: RagMessage[];
  isLoading: boolean;
  isStreaming: boolean;
  streamingStatus: string | null;  // "Searching documents...", "Generating answer...", etc.
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
  sendGeminiSearchStream: (
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
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingStatus, setStreamingStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);
  const [currentDocuments, setCurrentDocuments] = useState<Document[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  // Resolved folder name for semantic cache scoping
  const [currentFolderName, setCurrentFolderName] = useState<string | null>(null);

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

    // Use folder_id directly as folder name for semantic cache scoping
    // folder_id may contain either UUID or folder name - either works for cache
    if (document.folder_id) {
      setCurrentFolderName(document.folder_id);
      console.log('📁 Using folder for cache:', document.folder_id);
    } else {
      setCurrentFolderName(null);
    }
  }, []);

  const openMultiChat = useCallback((documents: Document[]) => {
    console.log('⚡ Opening RAG chat for', documents.length, 'documents');
    setCurrentDocument(null);
    setCurrentDocuments(documents);
    setIsOpen(true);
    setError(null);
    setMessages([]);
    setSessionId(null);

    // Use folder_id directly for single document cache scoping
    if (documents.length === 1 && documents[0].folder_id) {
      setCurrentFolderName(documents[0].folder_id);
      console.log('📁 Using folder for cache:', documents[0].folder_id);
    } else {
      setCurrentFolderName(null);
    }
  }, []);

  const closeChat = useCallback(() => {
    console.log('⚡ Closing RAG chat');
    setIsOpen(false);
    setError(null);
    setCurrentFolderName(null);
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
    const effectiveMaxSources = options?.maxSources || config.maxSources;

    // Auto-derive filters from currentDocuments when not explicitly set
    // This ensures semantic cache is correctly scoped by document(s)
    // Support multiple files: pass array of document names when multiple are selected
    let effectiveFileFilter: string | string[] | null = options?.fileFilter || config.fileFilter || null;
    if (!effectiveFileFilter && currentDocuments.length > 0) {
      if (currentDocuments.length === 1) {
        effectiveFileFilter = currentDocuments[0].name;
      } else {
        // Multiple documents selected - pass array of file names
        effectiveFileFilter = currentDocuments.map(doc => doc.name);
      }
    }
    // Don't fallback to currentFolderName - respect user's explicit folder filter choice
    // When user selects "All Folders", config.folderFilter is null and should remain null
    const effectiveFolderName = options?.folderName || config.folderFilter || null;

    console.log('📤 Sending Gemini search with filters:', {
      fileFilter: effectiveFileFilter,
      folderFilter: effectiveFolderName,
      currentDocuments: currentDocuments.map(d => d.name),
    });

    addMessage({ type: 'user', content: query });
    setIsLoading(true);
    setError(null);

    try {
      const request: DocumentChatRequest = {
        query,
        organization_name: user.org_name,
        session_id: sessionId || undefined,
        folder_filter: effectiveFolderName || undefined,
        // Pass file_filter as-is (string, string[], or undefined)
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

      // Calculate confidence from citation relevance scores (average of top scores)
      // If citations exist but scores are 0, default to 0.8 (having citations = high confidence)
      const citations = response.citations || [];
      let confidenceScore = 0;
      if (citations.length > 0) {
        const totalRelevance = citations.reduce((sum, c) => sum + (c.relevance_score || 0), 0);
        const avgRelevance = totalRelevance / citations.length;
        // Use calculated average, or default to 0.8 if citations exist but scores are missing
        confidenceScore = avgRelevance > 0 ? avgRelevance : 0.8;
      }

      addMessage({
        type: 'assistant',
        content: response.answer || 'No answer generated.',
        citations: citations,
        metadata: {
          processing_time: response.processing_time_ms / 1000,
          confidence_score: confidenceScore,
          sources_count: citations.length,
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
  }, [user?.org_name, sessionId, addMessage, currentDocuments, currentFolderName]);

  /**
   * Send a streaming chat request using SSE
   * Tokens are delivered progressively for real-time UI updates
   */
  const sendGeminiSearchStream = useCallback(async (
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
    const effectiveMaxSources = options?.maxSources || config.maxSources;

    // Auto-derive filters from currentDocuments when not explicitly set
    let effectiveFileFilter: string | string[] | null = options?.fileFilter || config.fileFilter || null;
    if (!effectiveFileFilter && currentDocuments.length > 0) {
      if (currentDocuments.length === 1) {
        effectiveFileFilter = currentDocuments[0].name;
      } else {
        effectiveFileFilter = currentDocuments.map(doc => doc.name);
      }
    }
    const effectiveFolderName = options?.folderName || config.folderFilter || null;

    console.log('🌊 Starting streaming Gemini search:', {
      query,
      fileFilter: effectiveFileFilter,
      folderFilter: effectiveFolderName,
    });

    // Add user message
    addMessage({ type: 'user', content: query });

    // Create assistant message that we'll update with streaming content
    // Don't set confidence_score or sources_count until we have actual data
    const assistantMessageId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    const assistantMessage: RagMessage = {
      id: assistantMessageId,
      type: 'assistant',
      content: '',
      citations: [],
      timestamp: new Date(),
      metadata: {
        search_strategy: effectiveSearchMode,
        // processing_time, confidence_score, sources_count will be set after streaming completes
      },
    };
    setMessages(prev => [...prev, assistantMessage]);

    setIsStreaming(true);
    setIsLoading(true);
    setStreamingStatus('Starting...');
    setError(null);

    // Track accumulated content and citations
    let accumulatedContent = '';
    let citations: DocumentChatCitation[] = [];
    let finalSessionId: string | null = null;
    let processingTimeMs = 0;

    try {
      const request: DocumentChatStreamRequest = {
        query,
        organization_name: user.org_name,
        session_id: sessionId || undefined,
        folder_filter: effectiveFolderName || undefined,
        file_filter: effectiveFileFilter || undefined,
        search_mode: effectiveSearchMode,
        max_sources: effectiveMaxSources,
        include_tool_events: true,
      };

      await chatWithDocumentsStream(request, (event: StreamEvent) => {
        switch (event.event) {
          case 'status':
            setStreamingStatus(event.message || 'Processing...');
            break;

          case 'tool_start':
            if (event.tool_name === 'rag_search') {
              setStreamingStatus('Searching documents...');
            } else {
              setStreamingStatus(`Running ${event.tool_name}...`);
            }
            break;

          case 'tool_end':
            if (event.tool_name === 'rag_search') {
              setStreamingStatus('Generating answer...');
            }
            break;

          case 'token':
            // Update accumulated content with new token
            accumulatedContent = event.accumulated || (accumulatedContent + (event.token || ''));
            // Update the message in place
            setMessages(prev => prev.map(msg =>
              msg.id === assistantMessageId
                ? { ...msg, content: accumulatedContent }
                : msg
            ));
            break;

          case 'citations':
            citations = event.citations || [];
            // Update citations in message
            setMessages(prev => prev.map(msg =>
              msg.id === assistantMessageId
                ? { ...msg, citations }
                : msg
            ));
            break;

          case 'usage':
            // Could track token usage if needed
            break;

          case 'done':
            finalSessionId = event.session_id || null;
            processingTimeMs = event.processing_time_ms || 0;
            setStreamingStatus(null);
            break;

          case 'error':
            throw new Error(event.error || 'Stream error');
        }
      });

      // Update session ID if we got a new one
      if (finalSessionId) {
        setSessionId(finalSessionId);
      }

      // Calculate confidence from citations
      let confidenceScore = 0;
      if (citations.length > 0) {
        const totalRelevance = citations.reduce((sum, c) => sum + (c.relevance_score || 0), 0);
        const avgRelevance = totalRelevance / citations.length;
        confidenceScore = avgRelevance > 0 ? avgRelevance : 0.8;
      }

      // Final update with metadata
      setMessages(prev => prev.map(msg =>
        msg.id === assistantMessageId
          ? {
              ...msg,
              content: accumulatedContent || 'No answer generated.',
              citations,
              metadata: {
                processing_time: processingTimeMs / 1000,
                confidence_score: confidenceScore,
                sources_count: citations.length,
                search_strategy: effectiveSearchMode,
              },
            }
          : msg
      ));

      // Add to history
      onHistoryAdd({
        query,
        response: accumulatedContent,
        citations,
        timestamp: new Date(),
        filters: {
          folder: effectiveFolderName || undefined,
          file: effectiveFileFilter || undefined,
          searchMode: effectiveSearchMode,
        },
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Stream failed';
      setError(errorMessage);

      // Update the assistant message with error
      setMessages(prev => prev.map(msg =>
        msg.id === assistantMessageId
          ? {
              ...msg,
              content: `Sorry, I encountered an error: ${errorMessage}`,
              metadata: { processing_time: 0, confidence_score: 0, sources_count: 0 },
            }
          : msg
      ));
      toast.error(`Chat failed: ${errorMessage}`);
    } finally {
      setIsStreaming(false);
      setIsLoading(false);
      setStreamingStatus(null);
    }
  }, [user?.org_name, sessionId, addMessage, currentDocuments, currentFolderName]);

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
    isStreaming,
    streamingStatus,
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
    sendGeminiSearchStream,
    retryLastMessage,
  };
}
