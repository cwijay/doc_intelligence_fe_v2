'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  TrashIcon,
  DocumentTextIcon,
  ChatBubbleLeftIcon,
  XMarkIcon,
  Squares2X2Icon,
  ListBulletIcon,
  TableCellsIcon,
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import DocumentList from '@/components/documents/DocumentList';
import DocumentListCompact from '@/components/documents/DocumentListCompact';
import DocumentTableView from '@/components/documents/DocumentTableView';
import DocumentCardView from '@/components/documents/DocumentCardView';
import DocumentRenameModal from '@/components/documents/DocumentRenameModal';
import { ExtractionModal } from '@/components/documents/extraction/ExtractionModal';
import { TemplateSelectionModal } from '@/components/documents/extraction/TemplateSelectionModal';
import { useFolders } from '@/hooks/useFolders';
import { useDocuments as useAllDocumentsData } from '@/hooks/useAllDocuments';
import { useDocuments as useDocumentOperations } from '@/hooks/useDocuments';
import { useDocumentActions, type DocumentActionsReturn } from '@/hooks/useDocumentActions';
import { useDocumentAI } from '@/hooks/ai';
import { useExtraction, useTemplateSelection } from '@/hooks/extraction';
import { useAuth } from '@/hooks/useAuth';
import { Folder, Document } from '@/types/api';
import toast from 'react-hot-toast';
import { storeAIContentContext } from '@/hooks/ai/useAIContentPage';
import { storeChatContext } from '@/hooks/rag/useChatPage';
import { storeExcelChatContext } from '@/hooks/useExcelChatPage';

interface DocumentsTabProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedViewFolder: string | null;
  onClearFolderSelection: () => void;
  highlightedDocumentId?: string | null;
  // Selection state from parent (for bulk operations)
  multiSelectedDocumentIds?: Set<string>;
  onSelectAllDocuments?: (documentIds: string[]) => void;
  clearDocumentMultiSelection?: () => void;
  // Shared document actions from parent (for parse panel integration)
  documentActions?: DocumentActionsReturn;
}

export default function DocumentsTab({
  searchTerm,
  onSearchChange,
  selectedViewFolder,
  onClearFolderSelection,
  highlightedDocumentId,
  multiSelectedDocumentIds,
  onSelectAllDocuments,
  clearDocumentMultiSelection,
  documentActions: documentActionsProp,
}: DocumentsTabProps) {
  const router = useRouter();
  const { user } = useAuth();
  const organizationId = user?.org_id || '';

  // Selection state for multi-select
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());

  // View mode state - 'table', 'cards' (default), or 'classic'
  type ViewMode = 'table' | 'cards' | 'classic';
  const [viewMode, setViewMode] = useState<ViewMode>('cards');

  // Note: reopenParseModalAfterExtraction state removed - parse is now a full page

  // Rename modal state
  const [documentToRename, setDocumentToRename] = useState<Document | null>(null);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [renamingDocuments, setRenamingDocuments] = useState<Set<string>>(new Set());

  // Document actions - use prop if provided, otherwise create local instance (for backward compatibility)
  const localDocumentActions = useDocumentActions();
  const documentActions = documentActionsProp || localDocumentActions;
  
  // AI features from custom hook
  const documentAI = useDocumentAI();

  // Extraction functionality
  const extraction = useExtraction();

  // Template selection for extraction (pre-step)
  const templateSelection = useTemplateSelection();

  // Fetch folders data to get folder name for display
  const { data: foldersData } = useFolders(organizationId, undefined, !!organizationId);

  // =============================================================================
  // Navigation handlers for full-page AI views
  // =============================================================================

  // Helper to get folder name for a document
  const getFolderNameForDocument = useCallback((document: Document): string => {
    if (document.folder_name) return document.folder_name;
    if (!document.folder_id || !foldersData?.folders) return 'Documents';
    const folder = foldersData.folders.find((f: Folder) => f.id === document.folder_id);
    return folder?.name || 'Documents';
  }, [foldersData?.folders]);

  // Navigate to Summary page
  const handleNavigateToSummary = useCallback((document: Document) => {
    const folderName = getFolderNameForDocument(document);
    storeAIContentContext(document.id, 'summary', document, folderName);
    router.push(`/documents/${document.id}/summary?from=documents`);
  }, [getFolderNameForDocument, router]);

  // Navigate to FAQ page
  const handleNavigateToFAQ = useCallback((document: Document) => {
    const folderName = getFolderNameForDocument(document);
    storeAIContentContext(document.id, 'faq', document, folderName);
    router.push(`/documents/${document.id}/faq?from=documents`);
  }, [getFolderNameForDocument, router]);

  // Navigate to Questions page
  const handleNavigateToQuestions = useCallback((document: Document) => {
    const folderName = getFolderNameForDocument(document);
    storeAIContentContext(document.id, 'questions', document, folderName);
    router.push(`/documents/${document.id}/questions?from=documents`);
  }, [getFolderNameForDocument, router]);

  // Navigate to Chat page
  const handleNavigateToChat = useCallback((document: Document) => {
    const folderName = getFolderNameForDocument(document);
    storeChatContext(document.id, document, folderName);
    router.push(`/documents/${document.id}/chat?from=documents`);
  }, [getFolderNameForDocument, router]);

  // Navigate to Excel Chat page
  const handleNavigateToExcelChat = useCallback((documents: Document[]) => {
    if (documents.length === 0) return;
    const folderName = getFolderNameForDocument(documents[0]);
    // Use the first document's ID for the route
    storeExcelChatContext(documents[0].id, documents, folderName);
    router.push(`/documents/${documents[0].id}/excel-chat?from=documents`);
  }, [getFolderNameForDocument, router]);

  // Look up folder name from already-fetched folders list (avoids HTTP caching issues)
  const selectedFolderName = useMemo(() => {
    if (!selectedViewFolder || !foldersData?.folders) return '';
    const folder = foldersData.folders.find((f: Folder) => f.id === selectedViewFolder);
    return folder?.name || '';
  }, [selectedViewFolder, foldersData?.folders]);

  // Single unified hook - UI driven:
  // - Click folder → pass folderName → GET /documents?folder_name=xxx
  // - Click org/all → pass null → GET /documents
  const {
    data: documentsData,
    isLoading: documentsLoading,
    error: documentsError,
    refetch: refetchDocuments
  } = useAllDocumentsData(
    organizationId,
    selectedFolderName || null,  // Pass folder name if selected, otherwise null for all docs
    !!organizationId
  );

  // Document operations (rename, etc.)
  const {
    renaming,
    renameError,
    renameDocument,
    clearRenameError
  } = useDocumentOperations();

  // Enhanced debug logging for documents data
  console.group('📊 DocumentsTab Debug Information');
  console.log('Authentication State:', {
    hasUser: !!user,
    userId: user?.user_id,
    userEmail: user?.email,
    organizationId: user?.org_id,
    organizationName: user?.org_name,
    userRole: user?.role,
    fullUserObject: user
  });
  console.log('Component State:', {
    selectedViewFolder,
    folderViewMode: selectedViewFolder ? 'folder-specific' : 'all-documents',
    searchTerm,
    viewMode
  });
  // Get selected folder details - moved before console.log to fix temporal dead zone
  const selectedFolder = useMemo(() => {
    if (!selectedViewFolder || !foldersData?.folders) return null;
    const folder = foldersData.folders.find((f: Folder) => f.id === selectedViewFolder) || null;
    console.log('📁 Selected folder details:', folder);
    return folder;
  }, [selectedViewFolder, foldersData]);

  console.log('Data Fetching Status:', {
    documentsData,
    documentsLoading,
    documentsError: documentsError?.message || documentsError,
    documentsArray: documentsData?.documents,
    documentsCount: documentsData?.documents?.length || 0,
    queryEnabled: !!organizationId && !selectedViewFolder,
    folderQueryEnabled: !!organizationId && !!selectedViewFolder
  });
  console.log('Folders Data:', {
    foldersData,
    foldersCount: foldersData?.folders?.length || 0,
    selectedFolder: selectedFolder
  });
  console.groupEnd();

  // Filter documents based on search term
  const filteredDocuments = useMemo(() => {
    console.log('🔍 Filtering documents:', {
      hasData: !!documentsData,
      documentsArray: documentsData?.documents,
      documentsLength: documentsData?.documents?.length || 0,
      searchTerm,
      viewMode: selectedViewFolder ? 'folder-specific' : 'all-documents'
    });
    
    if (!documentsData?.documents) {
      console.log('❌ No documents to filter');
      return [];
    }
    
    if (!searchTerm.trim()) {
      console.log('✅ Returning all documents (no search term):', documentsData.documents);
      return documentsData.documents;
    }
    
    const filtered = documentsData.documents.filter((doc: Document) =>
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.tags && doc.tags.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()))) ||
      (doc.folder_name && doc.folder_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    console.log('✅ Filtered documents:', filtered);
    return filtered;
  }, [documentsData?.documents, searchTerm, selectedViewFolder]);

  // Check if all documents in folder are selected (for bulk action buttons)
  const allDocumentsSelected = useMemo(() => {
    if (!selectedViewFolder || !filteredDocuments.length) return false;
    if (!multiSelectedDocumentIds || multiSelectedDocumentIds.size === 0) return false;
    return filteredDocuments.every((doc: Document) => multiSelectedDocumentIds.has(doc.id));
  }, [selectedViewFolder, filteredDocuments, multiSelectedDocumentIds]);

  // Handle selection change
  const handleSelectionChange = useCallback((newSelection: Set<string>) => {
    setSelectedDocuments(newSelection);
  }, []);
  
  // Handle bulk delete
  const handleBulkDelete = useCallback(async () => {
    if (selectedDocuments.size === 0) return;
    
    const confirmMessage = selectedDocuments.size === 1 
      ? 'Are you sure you want to delete this document?'
      : `Are you sure you want to delete ${selectedDocuments.size} documents?`;
    
    if (confirm(confirmMessage)) {
      for (const docId of selectedDocuments) {
        const doc = filteredDocuments.find((d: Document) => d.id === docId);
        if (doc && documentActions.handleDelete) {
          await documentActions.handleDelete(doc);
        }
      }
      setSelectedDocuments(new Set());
    }
  }, [selectedDocuments, filteredDocuments, documentActions]);

  // Handle bulk parse
  const handleBulkParse = useCallback(async () => {
    if (selectedDocuments.size === 0) return;

    for (const docId of selectedDocuments) {
      const doc = filteredDocuments.find((d: Document) => d.id === docId);
      if (doc && documentActions.handleParse) {
        await documentActions.handleParse(doc);
      }
    }
  }, [selectedDocuments, filteredDocuments, documentActions]);

  // Handle single document analysis (for spreadsheets) - navigates to Excel chat page
  const handleAnalyse = useCallback((document: Document) => {
    console.log('📊 DocumentsTab: handleAnalyse called for:', document.name);
    handleNavigateToExcelChat([document]);
  }, [handleNavigateToExcelChat]);

  // Handle rename - open modal
  const handleRenameClick = useCallback((document: Document) => {
    console.log('📝 DocumentsTab: handleRenameClick called for:', document.name);
    setDocumentToRename(document);
    setIsRenameModalOpen(true);
    clearRenameError();
  }, [clearRenameError]);

  // Handle rename confirmation
  const handleRenameConfirm = useCallback(async (newName: string) => {
    if (!documentToRename) return;

    console.log('📝 DocumentsTab: handleRenameConfirm called:', {
      documentId: documentToRename.id,
      oldName: documentToRename.name,
      newName
    });

    // Track renaming state
    setRenamingDocuments(prev => new Set(prev).add(documentToRename.id));

    const result = await renameDocument(documentToRename.id, newName);

    setRenamingDocuments(prev => {
      const newSet = new Set(prev);
      newSet.delete(documentToRename.id);
      return newSet;
    });

    if (result.success) {
      toast.success(`Document renamed to "${newName}"`);
      setIsRenameModalOpen(false);
      setDocumentToRename(null);
      // Refetch documents to update the list
      refetchDocuments();
    } else {
      toast.error(result.error || 'Failed to rename document');
    }
  }, [documentToRename, renameDocument, refetchDocuments]);

  // Handle rename modal close
  const handleRenameModalClose = useCallback(() => {
    if (!renaming) {
      setIsRenameModalOpen(false);
      setDocumentToRename(null);
      clearRenameError();
    }
  }, [renaming, clearRenameError]);

  // Handle extraction complete - refresh documents list
  const handleExtractionComplete = useCallback(() => {
    console.log('📋 DocumentsTab: Extraction completed');
    // Parse is now a full page, no need to reopen modal
  }, []);

  // Note: Effect to reopen parse modal removed - parse is now a full page

  // Effect to handle template selection completion
  useEffect(() => {
    if (templateSelection.shouldProceedWithTemplate) {
      // User selected a template - start extraction with template (skip analyze)
      if (templateSelection.document && templateSelection.selectedTemplate && templateSelection.schema) {
        extraction.startExtractionWithTemplate(
          templateSelection.document,
          templateSelection.selectedTemplate,
          templateSelection.schema,
          templateSelection.parseData || undefined
        );
      }
      templateSelection.resetProceedFlags();
    } else if (templateSelection.shouldProceedWithAnalyze) {
      // User chose to analyze new document - start normal extraction flow
      if (templateSelection.document) {
        extraction.startExtraction(
          templateSelection.document,
          templateSelection.parseData || undefined
        );
      }
      templateSelection.resetProceedFlags();
    }
  }, [
    templateSelection.shouldProceedWithTemplate,
    templateSelection.shouldProceedWithAnalyze,
    templateSelection.document,
    templateSelection.selectedTemplate,
    templateSelection.schema,
    templateSelection.parseData,
    templateSelection.resetProceedFlags,
    extraction,
  ]);

  // Note: handleExtractFromParse removed - extraction is now handled on the parse page
  // The parse page (/documents/[documentId]/parse) has its own extraction modal integration

  // Handle bulk chat
  const handleBulkChat = useCallback(() => {
    if (selectedDocuments.size === 0) return;

    const selectedDocs = Array.from(selectedDocuments)
      .map(docId => filteredDocuments.find((d: Document) => d.id === docId))
      .filter((doc): doc is Document => doc !== undefined);

    if (selectedDocs.length === 0) return;

    // Separate spreadsheet files from regular documents
    const spreadsheetDocs = selectedDocs.filter(doc => {
      const isSpreadsheet = doc.type && ['xlsx', 'xls', 'csv'].includes(doc.type.toLowerCase());
      return isSpreadsheet;
    });

    const regularDocs = selectedDocs.filter(doc => {
      const isSpreadsheet = doc.type && ['xlsx', 'xls', 'csv'].includes(doc.type.toLowerCase());
      return !isSpreadsheet;
    });

    // Handle based on document types
    if (spreadsheetDocs.length > 0 && regularDocs.length === 0) {
      // All spreadsheets - navigate to Excel chat page
      handleNavigateToExcelChat(spreadsheetDocs);
    } else if (regularDocs.length > 0 && spreadsheetDocs.length === 0) {
      // All regular documents - navigate to chat page for first document
      // Note: For multi-document chat, we navigate to first document's chat page
      if (regularDocs.length > 1) {
        toast('Opening chat for first selected document. Multi-document chat coming soon!', { icon: 'i' });
      }
      handleNavigateToChat(regularDocs[0]);
    } else if (spreadsheetDocs.length > 0 && regularDocs.length > 0) {
      // Mixed types - show selection dialog or default to regular docs
      toast.error('Mixed document types selected. Please select either spreadsheets OR regular documents for chat.');
    } else {
      toast.error('No valid documents selected for chat.');
    }
  }, [selectedDocuments, filteredDocuments, handleNavigateToExcelChat, handleNavigateToChat]);
  
  // Clear selection when folder changes
  useEffect(() => {
    setSelectedDocuments(new Set());
  }, [selectedViewFolder]);

  // Sync local selectedDocuments with global multiSelectedDocumentIds from props
  useEffect(() => {
    if (multiSelectedDocumentIds && multiSelectedDocumentIds.size > 0) {
      // Filter to only include documents that are in the current filtered list
      const validIds = new Set<string>();
      filteredDocuments.forEach((doc: Document) => {
        if (multiSelectedDocumentIds.has(doc.id)) {
          validIds.add(doc.id);
        }
      });
      setSelectedDocuments(validIds);
    }
  }, [multiSelectedDocumentIds, filteredDocuments]);

  // Set up chat callbacks when component mounts
  useEffect(() => {
    console.log('📋 DocumentsTab: Setting up chat callbacks', {
      hasDocumentActions: !!documentActions,
      hasSetOnExcelChat: !!documentActions?.setOnExcelChat,
      hasSetOnRagChat: !!documentActions?.setOnRagChat,
    });

    if (!documentActions?.setOnExcelChat) {
      console.error('🚨 DocumentsTab: documentActions.setOnExcelChat not available');
      return;
    }

    // Create a safe wrapper that navigates to Excel chat page
    const safeOpenExcelChat = (documents: Document[]) => {
      console.log('🔧 SafeOpenExcelChat wrapper called with:', {
        documentsProvided: !!documents,
        isArray: Array.isArray(documents),
        length: documents?.length
      });

      // Schedule the navigation to avoid issues during render
      setTimeout(() => {
        try {
          handleNavigateToExcelChat(documents);
        } catch (error) {
          console.error('🚨 Error in safeOpenExcelChat:', error);
        }
      }, 0);
    };

    try {
      documentActions.setOnExcelChat(safeOpenExcelChat);
      console.log('✅ DocumentsTab: Excel chat callback set successfully');
    } catch (error) {
      console.error('🚨 DocumentsTab: Error setting Excel chat callback:', error);
    }

    // Create a safe wrapper for RAG chat that navigates to full page
    const safeOpenRagChat = (document: Document) => {
      console.log('🔧 SafeOpenRagChat wrapper called with:', {
        documentProvided: !!document,
        documentType: typeof document,
        documentName: document?.name,
        documentId: document?.id
      });

      // Schedule the navigation to avoid issues during render
      setTimeout(() => {
        try {
          handleNavigateToChat(document);
        } catch (error) {
          console.error('🚨 Error in safeOpenRagChat:', error);
        }
      }, 0);
    };

    try {
      documentActions.setOnRagChat(safeOpenRagChat);
      console.log('✅ DocumentsTab: RAG chat callback set successfully');
    } catch (error) {
      console.error('🚨 DocumentsTab: Error setting RAG chat callback:', error);
    }

    return () => {
      try {
        documentActions.setOnExcelChat(() => {
          console.warn('⚠️ Excel chat callback called after cleanup');
        });
        documentActions.setOnRagChat(() => {
          console.warn('⚠️ RAG chat callback called after cleanup');
        });
      } catch (error) {
        console.error('🚨 DocumentsTab: Error cleaning up chat callbacks:', error);
      }
    };
  }, [documentActions, handleNavigateToExcelChat, handleNavigateToChat]);

  if (documentsError) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12"
      >
        <div className="max-w-md mx-auto">
          <div className="w-24 h-24 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <MagnifyingGlassIcon className="w-12 h-12 text-error-400" />
          </div>
          <h3 className="text-xl font-semibold text-error-900 mb-2">
            Error Loading Documents
          </h3>
          <p className="text-error-600 mb-6">
            Failed to load documents{selectedViewFolder ? ` from the "${selectedViewFolder}" folder` : ''}. Please try again.
          </p>
          {selectedViewFolder && (
            <Button variant="outline" onClick={onClearFolderSelection}>
              Back to All Documents
            </Button>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Document View Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              {selectedFolder ? (
                <>
                  <CardTitle>Documents in "{selectedFolder.name}"</CardTitle>
                  <CardDescription>
                    {documentsData?.total || 0} document(s) in this folder
                  </CardDescription>
                </>
              ) : (
                <>
                  <CardTitle>All Documents</CardTitle>
                  <CardDescription>
                    {documentsData?.total || 0} document(s) across all folders
                  </CardDescription>
                </>
              )}
            </div>
            {selectedFolder && (
              <Button variant="outline" onClick={onClearFolderSelection}>
                Back to All Documents
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Bulk Actions Bar */}
      {selectedDocuments.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="mb-4"
        >
          <Card className="bg-primary-50 border-primary-200">
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-primary-900">
                    {selectedDocuments.size} document{selectedDocuments.size !== 1 ? 's' : ''} selected
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkParse}
                    icon={<DocumentTextIcon className="w-4 h-4" />}
                    className="bg-white"
                  >
                    Parse All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkChat}
                    icon={<ChatBubbleLeftIcon className="w-4 h-4" />}
                    className="bg-white"
                  >
                    Chat All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkDelete}
                    icon={<TrashIcon className="w-4 h-4" />}
                    className="bg-white text-error-600 hover:text-error-700 hover:bg-error-50"
                  >
                    Delete All
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedDocuments(new Set())}
                    icon={<XMarkIcon className="w-4 h-4" />}
                    className="text-secondary-600"
                  >
                    Clear Selection
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Search and Filter Controls */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex space-x-4 flex-1">
              <div className="flex-1">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary-400" />
                  <Input
                    placeholder="Search documents by name, type, or content..."
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              {viewMode === 'classic' && (
                <Button variant="outline" icon={<FunnelIcon className="w-4 h-4" />}>
                  Filter
                </Button>
              )}
            </div>

            {/* View Toggle */}
            <div className="flex items-center space-x-3 ml-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">View:</span>
                <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('table')}
                    className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-sm transition-all duration-200 ${
                      viewMode === 'table'
                        ? 'bg-white dark:bg-gray-700 shadow-sm text-primary-600 dark:text-primary-400 font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    <ListBulletIcon className="w-4 h-4" />
                    <span>Table</span>
                  </button>
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-sm transition-all duration-200 ${
                      viewMode === 'cards'
                        ? 'bg-white dark:bg-gray-700 shadow-sm text-primary-600 dark:text-primary-400 font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    <TableCellsIcon className="w-4 h-4" />
                    <span>Cards</span>
                  </button>
                  <button
                    onClick={() => setViewMode('classic')}
                    className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-sm transition-all duration-200 ${
                      viewMode === 'classic'
                        ? 'bg-white dark:bg-gray-700 shadow-sm text-primary-600 dark:text-primary-400 font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    <Squares2X2Icon className="w-4 h-4" />
                    <span>Classic</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents List - Table View */}
      {viewMode === 'table' && (
        <DocumentTableView
          documents={filteredDocuments}
          loading={documentsLoading}
          error={documentsError ? (documentsError as Error).message : null}
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
          onRefresh={() => window.location.reload()}
          onDelete={documentActions.handleDelete}
          onRename={handleRenameClick}
          onParse={documentActions.handleParse}
          onLoadParsed={documentActions.handleLoadParsed}
          onSummarize={handleNavigateToSummary}
          onFaq={(doc) => handleNavigateToFAQ(doc)}
          onQuestions={(doc) => handleNavigateToQuestions(doc)}
          onChat={handleNavigateToChat}
          onAnalyse={handleAnalyse}
          parsingDocuments={documentActions.parsingDocuments}
          loadingParsedDocuments={documentActions.loadingParsedDocuments}
          summarizingDocuments={documentAI.summarizingDocuments}
          faqGeneratingDocuments={documentAI.faqGeneratingDocuments}
          questionsGeneratingDocuments={documentAI.questionsGeneratingDocuments}
          renamingDocuments={renamingDocuments}
          selectedDocuments={selectedDocuments}
          onSelectionChange={handleSelectionChange}
          enableSelection={true}
          highlightedDocumentId={highlightedDocumentId}
        />
      )}

      {/* Documents List - Cards View */}
      {viewMode === 'cards' && (
        <DocumentCardView
          documents={filteredDocuments}
          loading={documentsLoading}
          error={documentsError ? (documentsError as Error).message : null}
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
          onRefresh={() => window.location.reload()}
          onDelete={documentActions.handleDelete}
          onRename={handleRenameClick}
          onParse={documentActions.handleParse}
          onLoadParsed={documentActions.handleLoadParsed}
          onSummarize={handleNavigateToSummary}
          onFaq={(doc) => handleNavigateToFAQ(doc)}
          onQuestions={(doc) => handleNavigateToQuestions(doc)}
          onChat={handleNavigateToChat}
          onAnalyse={handleAnalyse}
          parsingDocuments={documentActions.parsingDocuments}
          loadingParsedDocuments={documentActions.loadingParsedDocuments}
          summarizingDocuments={documentAI.summarizingDocuments}
          faqGeneratingDocuments={documentAI.faqGeneratingDocuments}
          questionsGeneratingDocuments={documentAI.questionsGeneratingDocuments}
          renamingDocuments={renamingDocuments}
          selectedDocuments={selectedDocuments}
          onSelectionChange={handleSelectionChange}
          enableSelection={true}
          highlightedDocumentId={highlightedDocumentId}
        />
      )}

      {/* Documents List - Classic View */}
      {viewMode === 'classic' && (
        <>
          {documentsLoading ? (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-secondary-600">Loading documents...</p>
              </CardContent>
            </Card>
          ) : filteredDocuments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="max-w-md mx-auto">
                  <div className="w-24 h-24 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <MagnifyingGlassIcon className="w-12 h-12 text-secondary-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-secondary-900 mb-2">
                    {searchTerm ? 'No matching documents' : selectedFolder ? 'No documents in this folder' : 'No documents found'}
                  </h3>
                  <p className="text-secondary-600 mb-6">
                    {searchTerm
                      ? `No documents match your search term "${searchTerm}"`
                      : selectedFolder
                      ? 'Upload some documents to this folder to get started with AI-powered analysis'
                      : 'Upload some documents to get started with AI-powered analysis'
                    }
                  </p>
                  {searchTerm && (
                    <Button variant="outline" onClick={() => onSearchChange('')}>
                      Clear Search
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <DocumentListCompact
              documents={filteredDocuments}
              onDelete={documentActions.handleDelete}
              onParse={documentActions.handleParse}
              onLoadParsed={documentActions.handleLoadParsed}
              onSummarize={handleNavigateToSummary}
              onFaq={handleNavigateToFAQ}
              onQuestions={handleNavigateToQuestions}
              onChat={handleNavigateToChat}
              onAnalyse={handleAnalyse}
              parsingDocuments={documentActions.parsingDocuments}
              loadingParsedDocuments={documentActions.loadingParsedDocuments}
              selectedDocuments={selectedDocuments}
              onSelectionChange={handleSelectionChange}
              enableSelection={true}
            />
          )}
        </>
      )}

      {/* AI Feature Modals have been replaced with full-page views */}
      {/* Navigation to /documents/[documentId]/summary, /faq, /questions, /chat, /excel-chat is handled by navigation handlers */}

      {/* Template Selection Modal (pre-extraction step) */}
      <TemplateSelectionModal selection={templateSelection} />

      {/* Document Extraction Modal */}
      <ExtractionModal
        extraction={extraction}
        onComplete={handleExtractionComplete}
      />

      {/* Document Rename Modal */}
      <DocumentRenameModal
        isOpen={isRenameModalOpen}
        onClose={handleRenameModalClose}
        onConfirm={handleRenameConfirm}
        document={documentToRename}
        loading={renaming}
        error={renameError}
      />
    </motion.div>
  );
}
