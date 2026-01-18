'use client';

import { useState, useCallback, useMemo } from 'react';
import { Document, Folder } from '@/types/api';
import { RagMessage, GeminiSearchMode, SearchHistoryItem, DocumentChatRequest } from '@/types/rag';
import { useRagChatSession } from '@/hooks/rag/useRagChatSession';
import { useRagChatConfig } from '@/hooks/rag/useRagChatConfig';
import { useSearchHistory } from '@/hooks/rag/useSearchHistory';
import { useAuth } from '@/hooks/useAuth';

// Scope type for chat targeting
export type ChatScopeType = 'organization' | 'folder' | 'documents';

// Scope state with details
export interface ChatScope {
  type: ChatScopeType;
  // For organization scope - multiple folders can be selected
  folderIds?: string[];
  folderNames?: string[];
  // For folder scope - single folder
  folderId?: string;
  folderName?: string;
  // For both folder and documents scope
  documentIds?: string[];
  documentNames?: string[];
}

export interface UseDashboardChatReturn {
  // Session state
  messages: RagMessage[];
  isLoading: boolean;
  isStreaming: boolean;
  streamingStatus: string | null;
  error: string | null;

  // Scope state
  scope: ChatScope;
  setScopeType: (type: ChatScopeType) => void;
  toggleFolderInOrg: (folder: Folder) => void;
  setFolderScope: (folderId: string, folderName: string) => void;
  setFolderWithDocuments: (folderId: string, folderName: string, documents: Document[]) => void;
  toggleDocumentInFolder: (document: Document) => void;
  setDocumentsScope: (documents: Document[]) => void;

  // Configuration (fixed to hybrid mode)
  maxSources: number;
  searchMode: GeminiSearchMode;

  // Search history
  searchHistory: SearchHistoryItem[];

  // Modal state
  isDocumentModalOpen: boolean;
  openDocumentModal: () => void;
  closeDocumentModal: () => void;

  // Expansion state
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
  toggleExpanded: () => void;

  // Actions
  sendMessage: (query: string) => Promise<void>;
  clearChat: () => void;
  clearHistory: () => void;

  // Configuration setters
  setMaxSources: (count: number) => void;

  // Derived scope description
  scopeDescription: string;
}

/**
 * Hook for managing dashboard chat state with scope selection
 * Composes existing RAG hooks with scope-aware filtering
 */
export function useDashboardChat(): UseDashboardChatReturn {
  const { user } = useAuth();
  const session = useRagChatSession();
  const config = useRagChatConfig();
  const history = useSearchHistory();

  // Scope state
  const [scope, setScope] = useState<ChatScope>({ type: 'organization' });

  // Document modal state
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);

  // Expansion state
  const [isExpanded, setIsExpanded] = useState(false);

  // Set scope type
  const setScopeType = useCallback((type: ChatScopeType) => {
    setScope({ type });
  }, []);

  // Toggle folder selection in organization scope
  const toggleFolderInOrg = useCallback((folder: Folder) => {
    setScope(prev => {
      if (prev.type !== 'organization') {
        // If not in org scope, switch to org scope with this folder selected
        return {
          type: 'organization',
          folderIds: [folder.id],
          folderNames: [folder.name],
        };
      }

      const currentIds = prev.folderIds || [];
      const currentNames = prev.folderNames || [];
      const folderIndex = currentIds.indexOf(folder.id);

      if (folderIndex >= 0) {
        // Remove folder
        const newIds = [...currentIds];
        const newNames = [...currentNames];
        newIds.splice(folderIndex, 1);
        newNames.splice(folderIndex, 1);
        return {
          ...prev,
          folderIds: newIds.length > 0 ? newIds : undefined,
          folderNames: newNames.length > 0 ? newNames : undefined,
        };
      } else {
        // Add folder
        return {
          ...prev,
          folderIds: [...currentIds, folder.id],
          folderNames: [...currentNames, folder.name],
        };
      }
    });
  }, []);

  // Set folder scope (all documents in folder) - single folder deep dive
  const setFolderScope = useCallback((folderId: string, folderName: string) => {
    setScope({
      type: 'folder',
      folderId,
      folderName,
      // Clear document selection - will search all docs in folder
      documentIds: undefined,
      documentNames: undefined,
    });
  }, []);

  // Set folder scope with specific documents selected
  const setFolderWithDocuments = useCallback((folderId: string, folderName: string, documents: Document[]) => {
    setScope({
      type: 'folder',
      folderId,
      folderName,
      documentIds: documents.map(d => d.id),
      documentNames: documents.map(d => d.name),
    });
  }, []);

  // Toggle a document selection within current folder scope
  const toggleDocumentInFolder = useCallback((document: Document) => {
    setScope(prev => {
      if (prev.type !== 'folder') return prev;

      const currentIds = prev.documentIds || [];
      const currentNames = prev.documentNames || [];
      const docIndex = currentIds.indexOf(document.id);

      if (docIndex >= 0) {
        // Remove document
        const newIds = [...currentIds];
        const newNames = [...currentNames];
        newIds.splice(docIndex, 1);
        newNames.splice(docIndex, 1);
        return {
          ...prev,
          documentIds: newIds.length > 0 ? newIds : undefined,
          documentNames: newNames.length > 0 ? newNames : undefined,
        };
      } else {
        // Add document
        return {
          ...prev,
          documentIds: [...currentIds, document.id],
          documentNames: [...currentNames, document.name],
        };
      }
    });
  }, []);

  // Set documents scope (from document modal)
  const setDocumentsScope = useCallback((documents: Document[]) => {
    setScope({
      type: 'documents',
      documentIds: documents.map(d => d.id),
      documentNames: documents.map(d => d.name),
    });
  }, []);

  // Document modal actions
  const openDocumentModal = useCallback(() => setIsDocumentModalOpen(true), []);
  const closeDocumentModal = useCallback(() => setIsDocumentModalOpen(false), []);

  // Toggle expansion
  const toggleExpanded = useCallback(() => setIsExpanded(prev => !prev), []);

  // Build API filters from scope
  const buildFiltersFromScope = useCallback((): {
    folderFilter: string | string[] | null;
    fileFilter: string | string[] | null;
  } => {
    switch (scope.type) {
      case 'organization':
        // If specific folders are selected, use folder filter
        if (scope.folderNames && scope.folderNames.length > 0) {
          return {
            folderFilter: scope.folderNames.length === 1
              ? scope.folderNames[0]
              : scope.folderNames,
            fileFilter: null,
          };
        }
        // Otherwise search all documents in org
        return { folderFilter: null, fileFilter: null };
      case 'folder':
        // If specific documents are selected within the folder, use file filter
        if (scope.documentNames && scope.documentNames.length > 0) {
          return {
            folderFilter: scope.folderName || null,
            fileFilter: scope.documentNames.length === 1
              ? scope.documentNames[0]
              : scope.documentNames,
          };
        }
        // Otherwise search all documents in the folder
        return {
          folderFilter: scope.folderName || null,
          fileFilter: null,
        };
      case 'documents':
        if (scope.documentNames && scope.documentNames.length > 0) {
          return {
            folderFilter: null,
            fileFilter: scope.documentNames.length === 1
              ? scope.documentNames[0]
              : scope.documentNames,
          };
        }
        return { folderFilter: null, fileFilter: null };
      default:
        return { folderFilter: null, fileFilter: null };
    }
  }, [scope]);

  // Send message with scope-aware filters
  const sendMessage = useCallback(async (query: string) => {
    if (!query.trim()) return;

    const { folderFilter, fileFilter } = buildFiltersFromScope();

    // Expand messages when sending
    setIsExpanded(true);

    // For folder filter, use first folder if array (API may not support multiple)
    const effectiveFolderFilter = Array.isArray(folderFilter)
      ? (folderFilter.length === 1 ? folderFilter[0] : null) // Single folder or null for multiple
      : folderFilter;

    // Use streaming for better UX
    await session.sendGeminiSearchStream(
      query,
      {
        folderName: effectiveFolderFilter || undefined,
        fileFilter: fileFilter || undefined,
        maxSources: config.maxSources,
      },
      {
        searchMode: config.searchMode,
        folderFilter: effectiveFolderFilter,
        fileFilter: typeof fileFilter === 'string' ? fileFilter : null,
        maxSources: config.maxSources,
      },
      history.addHistoryItem
    );
  }, [buildFiltersFromScope, session, config, history.addHistoryItem]);

  // Clear chat
  const clearChat = useCallback(() => {
    session.clearChat();
  }, [session]);

  // Clear history
  const clearHistory = useCallback(() => {
    history.clearHistory();
  }, [history]);

  // Derive scope description for display
  const scopeDescription = useMemo(() => {
    switch (scope.type) {
      case 'organization':
        // Check if specific folders are selected
        if (scope.folderNames && scope.folderNames.length > 0) {
          if (scope.folderNames.length === 1) {
            return `Chatting with: All documents in ${scope.folderNames[0]}`;
          }
          return `Chatting with: ${scope.folderNames.length} selected folders`;
        }
        return 'Chatting with: All organization documents';
      case 'folder':
        // Check if specific documents are selected within the folder
        if (scope.documentNames && scope.documentNames.length > 0) {
          if (scope.documentNames.length === 1) {
            return `Chatting with: ${scope.documentNames[0]} in ${scope.folderName}`;
          }
          return `Chatting with: ${scope.documentNames.length} documents in ${scope.folderName}`;
        }
        return `Chatting with: All documents in ${scope.folderName || 'selected folder'}`;
      case 'documents':
        if (scope.documentNames && scope.documentNames.length > 0) {
          if (scope.documentNames.length === 1) {
            return `Chatting with: ${scope.documentNames[0]}`;
          }
          return `Chatting with: ${scope.documentNames.length} selected documents`;
        }
        return 'Select documents to chat with';
      default:
        return 'Chatting with: All organization documents';
    }
  }, [scope]);

  return {
    // Session state
    messages: session.messages,
    isLoading: session.isLoading,
    isStreaming: session.isStreaming,
    streamingStatus: session.streamingStatus,
    error: session.error,

    // Scope state
    scope,
    setScopeType,
    toggleFolderInOrg,
    setFolderScope,
    setFolderWithDocuments,
    toggleDocumentInFolder,
    setDocumentsScope,

    // Configuration
    maxSources: config.maxSources,
    searchMode: config.searchMode,

    // Search history
    searchHistory: history.searchHistory,

    // Modal state
    isDocumentModalOpen,
    openDocumentModal,
    closeDocumentModal,

    // Expansion state
    isExpanded,
    setIsExpanded,
    toggleExpanded,

    // Actions
    sendMessage,
    clearChat,
    clearHistory,

    // Configuration setters
    setMaxSources: config.setMaxSources,

    // Derived
    scopeDescription,
  };
}
