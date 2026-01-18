'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Document, DocumentParseResponse } from '@/types/api';
import { documentsApi, foldersApi, organizationsApi } from '@/lib/api/index';
import { ingestionApi, saveAndIndexDocument } from '@/lib/api/ingestion/index';
import { loadParsedContent, createLoadParsedRequest } from '@/lib/api/ingestion/content';
import { adaptIngestParseResponse } from '@/lib/api/utils/parse-adapter';
import { fileUtils } from '@/lib/file-utils';
import { useAuth } from '@/hooks/useAuth';
import { clientConfig } from '@/lib/config';
import { storeParseResultsForNavigation } from '@/hooks/useParseResultsPage';
import toast from 'react-hot-toast';

export interface DocumentActionsReturn {
  // Document actions
  handleDelete: (document: Document) => void;
  handleParse: (document: Document) => Promise<void>;
  handleLoadParsed: (document: Document) => Promise<void>;
  handleChat: (document: Document) => void;

  // RAG chat callback - will be set by DocumentsTab
  setOnRagChat: (callback: (document: Document) => void) => void;

  // Parsing state management
  parsingDocuments: Set<string>;
  loadingParsedDocuments: Set<string>;

  // Parse panel state (for inline panel mode)
  selectedDocumentForParse: Document | null;
  parseData: DocumentParseResponse | null;
  isParsePanelOpen: boolean;
  closeParsePanelAction: () => void;
  openParsePanelAction: (document: Document, parseData: DocumentParseResponse) => void;

  // Legacy modal state (kept for backward compatibility)
  isParseModalOpen: boolean;
  handleSaveParsedContent: (editedContent: string) => Promise<void>;
  closeParseModal: () => void;
  openParseModal: (document: Document, parseData: DocumentParseResponse) => void;

  // Navigate to parse page (for full-page mode)
  navigateToParsePage: (document: Document, parseData: DocumentParseResponse) => void;

  // Set parse result handler - controls whether to open panel or navigate
  setOnParseComplete: (callback: (document: Document, parseData: DocumentParseResponse) => void) => void;

  // Excel chat callback - will be set by DocumentsTab
  setOnExcelChat: (callback: (documents: Document[]) => void) => void;
}

export function useDocumentActions(): DocumentActionsReturn {
  const router = useRouter();

  // Parsing state management
  const [parsingDocuments, setParsingDocuments] = useState<Set<string>>(new Set());
  const [loadingParsedDocuments, setLoadingParsedDocuments] = useState<Set<string>>(new Set());

  // Parse panel state
  const [selectedDocumentForParse, setSelectedDocumentForParse] = useState<Document | null>(null);
  const [parseData, setParseData] = useState<DocumentParseResponse | null>(null);
  const [isParsePanelOpen, setIsParsePanelOpen] = useState(false);

  // Legacy modal state (kept for backward compatibility)
  const [isParseModalOpen, setIsParseModalOpen] = useState(false);

  // Excel chat callback ref (using useRef to avoid re-renders and state updates)
  const onExcelChatRef = useRef<((documents: Document[]) => void) | undefined>(undefined);

  // RAG chat callback ref (using useRef to avoid re-renders and state updates)
  const onRagChatRef = useRef<((document: Document) => void) | undefined>(undefined);

  // Parse complete callback ref - controls what happens after parsing
  const onParseCompleteRef = useRef<((document: Document, parseData: DocumentParseResponse) => void) | undefined>(undefined);

  // Hooks for user context and query client
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Set parse complete handler
  const setOnParseComplete = useCallback((callback: (document: Document, parseData: DocumentParseResponse) => void) => {
    onParseCompleteRef.current = callback;
  }, []);

  // Open parse panel (inline mode)
  const openParsePanelAction = useCallback((document: Document, parseResponse: DocumentParseResponse) => {
    console.log('📄 Opening parse panel:', {
      documentId: document.id,
      documentName: document.name
    });
    setSelectedDocumentForParse(document);
    setParseData(parseResponse);
    setIsParsePanelOpen(true);
  }, []);

  // Close parse panel
  const closeParsePanelAction = useCallback(() => {
    setIsParsePanelOpen(false);
    // Don't clear the document/parseData immediately to allow for animations
    setTimeout(() => {
      setSelectedDocumentForParse(null);
      setParseData(null);
    }, 300);
  }, []);

  // Navigate to parse page (full-page mode)
  const navigateToParsePage = useCallback((document: Document, parseResponse: DocumentParseResponse) => {
    // Store parse results in sessionStorage before navigation
    storeParseResultsForNavigation(document.id, document, parseResponse);

    console.log('🚀 Navigating to parse page:', {
      documentId: document.id,
      documentName: document.name
    });

    // Navigate to the parse page
    router.push(`/documents/${document.id}/parse`);
  }, [router]);

  const handleDelete = useCallback(async (document: Document) => {
    if (!document?.id) {
      toast.error('Cannot delete: Invalid document');
      return;
    }

    const loadingToast = toast.loading(`Deleting "${document.name}"...`);

    try {
      await documentsApi.delete(document.id);

      // Dismiss loading toast and show success
      toast.success(`Document "${document.name}" deleted successfully`, { id: loadingToast });

      // Invalidate document-related queries to refresh the UI (scoped to org)
      queryClient.invalidateQueries({ queryKey: ['documents', user?.org_id] });
      queryClient.invalidateQueries({ queryKey: ['document-stats'] });

      // Invalidate folder-specific document queries if document has folder_id
      if (document.folder_id && user?.org_id) {
        queryClient.invalidateQueries({
          queryKey: ['folders', user.org_id, document.folder_id, 'documents']
        });
      }

      console.log(`✅ Document deleted: ${document.name} (${document.id})`);
    } catch (error) {
      console.error('❌ Delete error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete document';
      toast.error(errorMessage, { id: loadingToast });
    }
  }, [queryClient, user?.org_id]);

  const handleParse = useCallback(async (document: Document) => {
    try {
      // Add document to parsing state
      setParsingDocuments(prev => new Set([...prev, document.id]));

      console.log(`🔍 Parsing document "${document.name}"`);

      // Enhanced loading toast with progress information
      const loadingToast = toast.loading(
        `🔍 Parsing "${document.name}" - this may take 10-30 seconds...`,
        { id: `parse-${document.id}` }
      );

      let parseResponse: DocumentParseResponse;

      // Get organization name for path construction
      const orgName = user?.org_name || '';
      if (!orgName) {
        throw new Error('Organization name not available. Please ensure you are logged in.');
      }

      // Get folder name - prioritize folder_name (from normalization) over folder_id lookup
      let folderName: string | undefined = document.folder_name;

      // If no folder_name, try to extract from storage_path
      if (!folderName && document.storage_path) {
        const pathParts = document.storage_path.split('/');
        // Path format: org/original/folder/filename
        if (pathParts.length >= 4) {
          folderName = pathParts[pathParts.length - 2];
        }
      }

      // Only use folder_id API lookup as last resort, and validate it's a UUID
      if (!folderName && document.folder_id && user?.org_id) {
        // Check if folder_id looks like a UUID (basic validation)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(document.folder_id)) {
          try {
            const folderResponse = await foldersApi.getById(user.org_id, document.folder_id);
            folderName = folderResponse.name;
          } catch (folderError) {
            console.warn('⚠️ Could not resolve folder name from folder_id:', folderError);
          }
        } else {
          console.warn('⚠️ folder_id is not a valid UUID, skipping API lookup:', document.folder_id);
        }
      }

      // Use Ingest API (port 8001) for document parsing with LlamaParse
      console.log('📄 Parsing document via Ingest API...');
      const ingestResponse = await ingestionApi.parseDocument(
        document,
        orgName,
        folderName,
        { outputFormat: 'markdown', saveToParsed: true }
      );

      // Adapt response to DocumentParseResponse format
      const filePath = `${orgName}/original/${folderName || 'default'}/${document.name}`;
      parseResponse = adaptIngestParseResponse(ingestResponse, filePath);

      console.log('✅ Ingest API parse successful');

      // Update toast to show success with statistics
      toast.success(
        `✅ Parsed "${document.name}" - ${parseResponse.parsing_metadata.total_pages} pages, ${parseResponse.parsing_metadata.content_length.toLocaleString()} chars`,
        { id: loadingToast }
      );

      // Remove document from parsing state
      setParsingDocuments(prev => {
        const newSet = new Set(prev);
        newSet.delete(document.id);
        return newSet;
      });

      // Invalidate document queries to refresh UI with updated status (scoped to org)
      queryClient.invalidateQueries({ queryKey: ['documents', user?.org_id] });
      queryClient.invalidateQueries({ queryKey: ['document-stats'] });

      // Invalidate folder-specific document queries if document has folder_id
      if (document.folder_id && user?.org_id) {
        queryClient.invalidateQueries({
          queryKey: ['folders', user.org_id, document.folder_id, 'documents']
        });
      }

      // Call the parse complete handler or navigate to full page
      if (onParseCompleteRef.current) {
        onParseCompleteRef.current(document, parseResponse);
      } else {
        // Default: navigate to full parse page for maximum screen space
        navigateToParsePage(document, parseResponse);
      }

    } catch (error) {
      console.error('Parse error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to parse document';

      // Dismiss any loading toast for this document
      toast.dismiss(`parse-${document.id}`);

      toast.error(`Parse failed: ${errorMessage}`);

      // Remove document from parsing state on error
      setParsingDocuments(prev => {
        const newSet = new Set(prev);
        newSet.delete(document.id);
        return newSet;
      });
    }
  }, [user, queryClient, navigateToParsePage]);

  /**
   * Load pre-parsed content from GCS for documents that have already been parsed
   * but parsing times out on the frontend.
   */
  const handleLoadParsed = useCallback(async (document: Document) => {
    try {
      // Add document to loading state
      setLoadingParsedDocuments(prev => new Set([...prev, document.id]));

      console.log(`📂 Loading parsed content for "${document.name}"`);

      const loadingToast = toast.loading(
        `📂 Loading parsed content for "${document.name}"...`,
        { id: `load-parsed-${document.id}` }
      );

      // Get organization name
      const orgName = user?.org_name || '';
      if (!orgName) {
        throw new Error('Organization name not available. Please ensure you are logged in.');
      }

      // Get folder name - prioritize document.folder_name (from storage path) over folder_id lookup
      let folderName: string | undefined = document.folder_name;
      if (!folderName && document.folder_id && user?.org_id) {
        try {
          const folderResponse = await foldersApi.getById(user.org_id, document.folder_id);
          folderName = folderResponse.name;
        } catch (folderError) {
          console.warn('⚠️ Could not resolve folder name:', folderError);
        }
      }

      // Call loadParsedContent from content API module
      const request = createLoadParsedRequest(document, orgName, folderName || 'default');
      const response = await loadParsedContent(request);

      toast.success(
        `✅ Loaded "${document.name}" - ${response.parsing_metadata.content_length.toLocaleString()} chars`,
        { id: loadingToast }
      );

      // Remove from loading state
      setLoadingParsedDocuments(prev => {
        const newSet = new Set(prev);
        newSet.delete(document.id);
        return newSet;
      });

      // Call the parse complete handler or navigate to full page
      if (onParseCompleteRef.current) {
        onParseCompleteRef.current(document, response);
      } else {
        // Default: navigate to full parse page for maximum screen space
        navigateToParsePage(document, response);
      }

    } catch (error) {
      console.error('Load parsed error:', error);

      const errorMessage = error instanceof Error ? error.message : 'Failed to load parsed content';

      toast.dismiss(`load-parsed-${document.id}`);
      toast.error(errorMessage);

      setLoadingParsedDocuments(prev => {
        const newSet = new Set(prev);
        newSet.delete(document.id);
        return newSet;
      });
    }
  }, [user, navigateToParsePage]);

  const handleChat = useCallback((document: Document) => {
    console.log('🔍 handleChat called for document:', {
      documentProvided: !!document,
      documentType: typeof document,
      name: document?.name,
      type: document?.type,
      isSpreadsheet: document ? fileUtils.isSpreadsheetFile(document) : false
    });
    
    // Validate document parameter
    if (!document) {
      console.error('🚨 handleChat: No document provided');
      toast.error('Cannot open chat: No document provided');
      return;
    }
    
    if (typeof document !== 'object') {
      console.error('🚨 handleChat: Invalid document format:', typeof document, document);
      toast.error('Cannot open chat: Invalid document format');
      return;
    }
    
    if (!document.name || !document.type) {
      console.error('🚨 handleChat: Document missing required fields:', { name: document.name, type: document.type });
      toast.error('Cannot open chat: Document is missing required information');
      return;
    }
    
    // Check if it's an Excel/CSV file
    if (fileUtils.isSpreadsheetFile(document)) {
      console.log('📊 Routing to Excel chat for spreadsheet file:', document.name);
      
      const excelChatHandler = onExcelChatRef.current;
      
      if (!excelChatHandler) {
        console.warn('⚠️ Excel chat handler not set');
        toast.error('Excel chat functionality not available. Please refresh the page.');
        return;
      }
      
      if (typeof excelChatHandler !== 'function') {
        console.error('🚨 excelChatHandler is not a function:', typeof excelChatHandler, excelChatHandler);
        toast.error('Excel chat functionality is not properly configured. Please refresh the page.');
        return;
      }
      
      try {
        excelChatHandler([document]);
      } catch (error) {
        console.error('🚨 Error calling excelChatHandler:', error);
        toast.error('Failed to open Excel chat. Please try again.');
      }
    } else {
      console.log('🤖 Routing to RAG chat for non-spreadsheet document:', document.name);
      
      const ragChatHandler = onRagChatRef.current;
      
      if (!ragChatHandler) {
        console.warn('⚠️ RAG chat handler not set');
        toast.error('Document chat functionality not available. Please refresh the page.');
        return;
      }
      
      if (typeof ragChatHandler !== 'function') {
        console.error('🚨 ragChatHandler is not a function:', typeof ragChatHandler, ragChatHandler);
        toast.error('Document chat functionality is not properly configured. Please refresh the page.');
        return;
      }
      
      try {
        ragChatHandler(document);
      } catch (error) {
        console.error('🚨 Error calling ragChatHandler:', error);
        toast.error('Failed to open document chat. Please try again.');
      }
    }
  }, []);

  const closeParseModal = useCallback(() => {
    setIsParseModalOpen(false);
    setSelectedDocumentForParse(null);
    setParseData(null);
  }, []);

  /**
   * Open the parse modal with existing document and parse data
   * Used when returning from extraction modal for mandatory indexing
   */
  const openParseModal = useCallback((document: Document, existingParseData: DocumentParseResponse) => {
    setSelectedDocumentForParse(document);
    setParseData(existingParseData);
    setIsParseModalOpen(true);
  }, []);

  const handleSaveParsedContent = useCallback(async (editedContent: string) => {
    if (!selectedDocumentForParse || !user?.org_id) {
      console.error('🚨 Missing required data for save operation:', {
        hasDocument: !!selectedDocumentForParse,
        hasOrgId: !!user?.org_id
      });
      toast.error('Cannot save: Missing document or organization information');
      return;
    }

    console.log('💾 Starting save and index operation:', {
      documentName: selectedDocumentForParse.name,
      contentLength: editedContent.length,
      orgId: user.org_id
    });

    try {
      // Get organization name for folder resolution
      const orgResponse = await organizationsApi.getById(user.org_id);
      const orgName = orgResponse.name;

      // Get folder name - prioritize folder_name (from normalization) over folder_id lookup
      let folderName: string | undefined = selectedDocumentForParse.folder_name;

      // If no folder_name, try to extract from storage_path
      if (!folderName && selectedDocumentForParse.storage_path) {
        const pathParts = selectedDocumentForParse.storage_path.split('/');
        // Path format: org/original/folder/filename or org/parsed/folder/filename
        if (pathParts.length >= 4) {
          folderName = pathParts[pathParts.length - 2];
        }
      }

      // Only use folder_id API lookup as last resort, and validate it's a UUID
      if (!folderName && selectedDocumentForParse.folder_id && user?.org_id) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(selectedDocumentForParse.folder_id)) {
          try {
            const folderResponse = await foldersApi.getById(user.org_id, selectedDocumentForParse.folder_id);
            folderName = folderResponse.name;
          } catch (folderError) {
            console.warn('⚠️ Could not resolve folder name from folder_id:', folderError);
          }
        } else {
          console.warn('⚠️ folder_id is not a valid UUID, skipping API lookup:', selectedDocumentForParse.folder_id);
        }
      }

      const cleanFolderName = folderName || 'default';

      // Get markdown filename (strip original extension and add .md)
      const lastDotIndex = selectedDocumentForParse.name.lastIndexOf('.');
      const nameWithoutExtension = lastDotIndex > 0
        ? selectedDocumentForParse.name.substring(0, lastDotIndex)
        : selectedDocumentForParse.name;
      const markdownFileName = `${nameWithoutExtension}.md`;

      // Build target path: {org_name}/parsed/{folder_name}/{filename}.md
      const targetPath = `${orgName}/parsed/${cleanFolderName}/${markdownFileName}`;

      // Build original GCS path for metadata
      const gcsBucket = clientConfig.gcsBucketName;
      const originalGcsPath = selectedDocumentForParse.storage_path
        ? `gs://${gcsBucket}/${selectedDocumentForParse.storage_path}`
        : `gs://${gcsBucket}/${orgName}/original/${cleanFolderName}/${selectedDocumentForParse.name}`;

      console.log('📁 Save and index parameters:', {
        targetPath,
        orgName,
        folderName: cleanFolderName,
        originalFilename: selectedDocumentForParse.name,
        originalGcsPath
      });

      // Single API call to save content to GCS and index in Gemini store
      const response = await saveAndIndexDocument({
        content: editedContent,
        target_path: targetPath,
        org_name: orgName,
        folder_name: cleanFolderName,
        original_filename: selectedDocumentForParse.name,
        original_gcs_path: originalGcsPath,
        parser_version: 'llama_parse_v2.5',
      });

      console.log('✅ Save and index completed:', response);

      // Show success message
      if (response.indexed) {
        toast.success(`Document saved and indexed in ${response.store_name}`);
      } else {
        toast.success(`Document saved to ${response.saved_path}`);
      }

      // Modal stays open so user can proceed to Extract Data

    } catch (error) {
      console.error('🚨 Save and index operation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save and index content';
      toast.error(`Failed to save and index: ${errorMessage}`);
    }
  }, [selectedDocumentForParse, user, parseData, closeParseModal]);

  return {
    // Document actions
    handleDelete,
    handleParse,
    handleLoadParsed,
    handleChat,

    // Parsing state
    parsingDocuments,
    loadingParsedDocuments,

    // Parse panel state (for inline panel mode)
    selectedDocumentForParse,
    parseData,
    isParsePanelOpen,
    closeParsePanelAction,
    openParsePanelAction,

    // Legacy modal state (kept for backward compatibility)
    isParseModalOpen,
    handleSaveParsedContent,
    closeParseModal,
    openParseModal,

    // Navigate to parse page (for full-page mode)
    navigateToParsePage,

    // Set parse complete handler
    setOnParseComplete,

    // Excel chat callback setter
    setOnExcelChat: useCallback((callback: (documents: Document[]) => void) => {
      console.log('🔧 Setting Excel chat callback:', {
        hasCallback: !!callback,
        callbackType: typeof callback
      });
      onExcelChatRef.current = callback;
    }, []),

    // RAG chat callback setter
    setOnRagChat: useCallback((callback: (document: Document) => void) => {
      console.log('🔧 Setting RAG chat callback:', {
        hasCallback: !!callback,
        callbackType: typeof callback
      });
      onRagChatRef.current = callback;
    }, []),
  };
}