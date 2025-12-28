'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon,
  ChatBubbleLeftIcon,
  XMarkIcon,
  Squares2X2Icon,
  ListBulletIcon,
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import DocumentList from '@/components/documents/DocumentList';
import DocumentListCompact from '@/components/documents/DocumentListCompact';
import DocumentTableView from '@/components/documents/DocumentTableView';
import DocumentAIContentModal from '@/components/documents/DocumentAIContentModal';
import DocumentParseModal from '@/components/documents/DocumentParseModal';
import ExcelChatModal from '@/components/documents/ExcelChatModal';
import RagChatModal from '@/components/documents/RagChatModal';
import { useFolders, useFolderDocuments } from '@/hooks/useFolders';
import { useAllDocuments } from '@/hooks/useAllDocuments';
import { useDocumentActions } from '@/hooks/useDocumentActions';
import { useDocumentAI } from '@/hooks/useDocumentAI';
import { useExcelChat } from '@/hooks/useExcelChat';
import { useRagChat } from '@/hooks/useRagChat';
import { useAuth } from '@/hooks/useAuth';
import { Folder, Document } from '@/types/api';
import toast from 'react-hot-toast';

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
}: DocumentsTabProps) {
  const { user } = useAuth();
  const organizationId = user?.org_id || '';
  
  // Selection state for multi-select
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
  
  // View mode state - toggle between modern and legacy views
  const [useModernView, setUseModernView] = useState(true);

  // Document actions from custom hook
  const documentActions = useDocumentActions();
  
  // AI features from custom hook
  const documentAI = useDocumentAI();
  
  // Excel chat functionality
  const excelChat = useExcelChat();
  
  // RAG chat functionality
  const ragChat = useRagChat();

  // Fetch folders data to get folder name for display
  const { data: foldersData } = useFolders(organizationId, undefined, !!organizationId);

  // Look up folder name from already-fetched folders list (avoids HTTP caching issues)
  const selectedFolderName = useMemo(() => {
    if (!selectedViewFolder || !foldersData?.folders) return '';
    const folder = foldersData.folders.find((f: Folder) => f.id === selectedViewFolder);
    return folder?.name || '';
  }, [selectedViewFolder, foldersData?.folders]);

  // Fetch all documents (when no folder selected)
  const {
    data: allDocumentsData,
    isLoading: allDocumentsLoading,
    error: allDocumentsError
  } = useAllDocuments(
    organizationId,
    undefined, // No filters for all documents view
    !!organizationId && !selectedViewFolder
  );

  // Fetch documents for selected folder
  const {
    data: folderDocumentsData,
    isLoading: folderDocumentsLoading,
    error: folderDocumentsError
  } = useFolderDocuments(
    organizationId,
    selectedViewFolder || '',
    selectedFolderName,
    !!organizationId && !!selectedViewFolder && !!selectedFolderName
  );

  // Determine which data source to use
  const documentsData = selectedViewFolder ? folderDocumentsData : allDocumentsData;
  const documentsLoading = selectedViewFolder ? folderDocumentsLoading : allDocumentsLoading;
  const documentsError = selectedViewFolder ? folderDocumentsError : allDocumentsError;

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
    viewMode: selectedViewFolder ? 'folder-specific' : 'all-documents',
    searchTerm,
    useModernView
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

  // Handle bulk download
  const handleBulkDownload = useCallback(async () => {
    if (selectedDocuments.size === 0) return;

    for (const docId of selectedDocuments) {
      const doc = filteredDocuments.find((d: Document) => d.id === docId);
      if (doc && documentActions.handleDownload) {
        await documentActions.handleDownload(doc);
      }
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

  // Handle single document analysis (for spreadsheets)
  const handleAnalyse = useCallback((document: Document) => {
    console.log('📊 DocumentsTab: handleAnalyse called for:', document.name);
    excelChat.openChat([document]);
  }, [excelChat]);

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
      // All spreadsheets - use Excel chat
      excelChat.openChat(spreadsheetDocs);
    } else if (regularDocs.length > 0 && spreadsheetDocs.length === 0) {
      // All regular documents - use RAG chat with multiple docs
      ragChat.openMultiChat(regularDocs);
    } else if (spreadsheetDocs.length > 0 && regularDocs.length > 0) {
      // Mixed types - show selection dialog or default to regular docs
      toast.error('Mixed document types selected. Please select either spreadsheets OR regular documents for chat.');
    } else {
      toast.error('No valid documents selected for chat.');
    }
  }, [selectedDocuments, filteredDocuments, documentActions, excelChat, ragChat]);
  
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
      hasExcelChatOpenChat: !!excelChat?.openChat,
      hasRagChatOpenChat: !!ragChat?.openChat,
      excelChatOpenChatType: typeof excelChat?.openChat,
      ragChatOpenChatType: typeof ragChat?.openChat
    });
    
    if (!documentActions?.setOnExcelChat) {
      console.error('🚨 DocumentsTab: documentActions.setOnExcelChat not available');
      return;
    }
    
    if (!excelChat?.openChat) {
      console.error('🚨 DocumentsTab: excelChat.openChat not available');
      return;
    }
    
    if (!documentActions?.setOnRagChat) {
      console.error('🚨 DocumentsTab: documentActions.setOnRagChat not available');
      return;
    }
    
    if (!ragChat?.openChat) {
      console.error('🚨 DocumentsTab: ragChat.openChat not available');
      return;
    }
    
    // Create a safe wrapper that won't cause state updates during render
    const safeOpenChat = (documents: Document[]) => {
      console.log('🔧 SafeOpenChat wrapper called with:', {
        documentsProvided: !!documents,
        isArray: Array.isArray(documents),
        length: documents?.length
      });
      
      // Schedule the actual call to avoid issues during render
      setTimeout(() => {
        try {
          excelChat.openChat(documents);
        } catch (error) {
          console.error('🚨 Error in safeOpenChat:', error);
        }
      }, 0);
    };
    
    try {
      documentActions.setOnExcelChat(safeOpenChat);
      console.log('✅ DocumentsTab: Excel chat callback set successfully');
    } catch (error) {
      console.error('🚨 DocumentsTab: Error setting Excel chat callback:', error);
    }
    
    // Create a safe wrapper for RAG chat
    const safeOpenRagChat = (document: Document) => {
      console.log('🔧 SafeOpenRagChat wrapper called with:', {
        documentProvided: !!document,
        documentType: typeof document,
        documentName: document?.name,
        documentId: document?.id
      });
      
      // Schedule the actual call to avoid issues during render
      setTimeout(() => {
        try {
          ragChat.openChat(document);
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
  }, [documentActions, excelChat.openChat, ragChat.openChat]);

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
                    onClick={handleBulkDownload}
                    icon={<ArrowDownTrayIcon className="w-4 h-4" />}
                    className="bg-white"
                  >
                    Download All
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
                    placeholder={useModernView ? "Search documents by name, type, or content..." : "Search documents..."}
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              {!useModernView && (
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
                    onClick={() => setUseModernView(true)}
                    className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-sm transition-all duration-200 ${
                      useModernView
                        ? 'bg-white dark:bg-gray-700 shadow-sm text-primary-600 dark:text-primary-400 font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    <ListBulletIcon className="w-4 h-4" />
                    <span>Table</span>
                  </button>
                  <button
                    onClick={() => setUseModernView(false)}
                    className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-sm transition-all duration-200 ${
                      !useModernView
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

      {/* Documents List */}
      {useModernView ? (
        <DocumentTableView
          documents={filteredDocuments}
          loading={documentsLoading}
          error={documentsError ? (documentsError as Error).message : null}
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
          onRefresh={() => window.location.reload()}
          onView={documentActions.handleView}
          onDownload={documentActions.handleDownload}
          onDelete={documentActions.handleDelete}
          onParse={documentActions.handleParse}
          onSummarize={documentAI.handleSummarize}
          onFaq={(doc, count) => documentAI.handleFaq(doc, count || 10)}
          onQuestions={(doc, count) => documentAI.handleQuestions(doc, count || 10)}
          onChat={documentActions.handleChat}
          onAnalyse={handleAnalyse}
          parsingDocuments={documentActions.parsingDocuments}
          summarizingDocuments={documentAI.summarizingDocuments}
          faqGeneratingDocuments={documentAI.faqGeneratingDocuments}
          questionsGeneratingDocuments={documentAI.questionsGeneratingDocuments}
          selectedDocuments={selectedDocuments}
          onSelectionChange={handleSelectionChange}
          enableSelection={true}
          highlightedDocumentId={highlightedDocumentId}
        />
      ) : (
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
              onView={documentActions.handleView}
              onDownload={documentActions.handleDownload}
              onDelete={documentActions.handleDelete}
              onParse={documentActions.handleParse}
              onSummarize={documentAI.handleSummarize}
              onFaq={(doc) => documentAI.handleFaq(doc, 5)}
              onQuestions={(doc) => documentAI.handleQuestions(doc, 5)}
              onChat={documentActions.handleChat}
              onAnalyse={handleAnalyse}
              parsingDocuments={documentActions.parsingDocuments}
              selectedDocuments={selectedDocuments}
              onSelectionChange={handleSelectionChange}
              enableSelection={true}
            />
          )}
        </>
      )}

      {/* AI Feature Modals - Unified Component */}
      <DocumentAIContentModal
        contentType="summary"
        isOpen={documentAI.isSummaryModalOpen}
        onClose={documentAI.handleSummaryModalClose}
        document={documentAI.selectedDocumentForSummary}
        data={documentAI.summaryData}
        onRegenerate={documentAI.handleSummaryRegenerate}
        isGenerating={documentAI.isGeneratingSummary}
      />

      <DocumentAIContentModal
        contentType="faq"
        isOpen={documentAI.isFAQModalOpen}
        onClose={documentAI.handleFAQModalClose}
        document={documentAI.selectedDocumentForFAQ}
        data={documentAI.faqData}
        onRegenerate={documentAI.handleFAQRegenerate}
        isGenerating={documentAI.isGeneratingFAQ}
      />

      <DocumentAIContentModal
        contentType="questions"
        isOpen={documentAI.isQuestionsModalOpen}
        onClose={documentAI.handleQuestionsModalClose}
        document={documentAI.selectedDocumentForQuestions}
        data={documentAI.questionsData}
        onRegenerate={documentAI.handleQuestionsRegenerate}
        isGenerating={documentAI.isGeneratingQuestions}
      />

      <DocumentParseModal
        isOpen={documentActions.isParseModalOpen}
        onClose={documentActions.closeParseModal}
        document={documentActions.selectedDocumentForParse}
        parseData={documentActions.parseData}
        onSave={documentActions.handleSaveParsedContent}
      />

      {/* Excel Chat Modal */}
      <ExcelChatModal
        isOpen={excelChat.isOpen}
        onClose={excelChat.closeChat}
        messages={excelChat.messages}
        isLoading={excelChat.isLoading}
        error={excelChat.error}
        currentDocuments={excelChat.currentDocuments}
        onSendMessage={excelChat.sendMessage}
        onClearChat={excelChat.clearChat}
        onRetry={excelChat.retryLastMessage}
      />

      {/* DocumentAgent RAG Chat Modal */}
      <RagChatModal
        isOpen={ragChat.isOpen}
        onClose={ragChat.closeChat}
        messages={ragChat.messages}
        isLoading={ragChat.isLoading}
        error={ragChat.error}
        currentDocument={ragChat.currentDocument}
        currentDocuments={ragChat.currentDocuments}
        maxSources={ragChat.maxSources}
        onSendMessage={ragChat.sendGeminiSearch}
        onClearChat={ragChat.clearChat}
        onRetry={ragChat.retryLastMessage}
        onSetMaxSources={ragChat.setMaxSources}
        searchMode={ragChat.searchMode}
        folderFilter={ragChat.folderFilter}
        fileFilter={ragChat.fileFilter}
        searchHistory={ragChat.searchHistory}
        folders={foldersData?.folders || []}
        onViewHistoryItem={ragChat.viewHistoryItem}
        onClearHistory={ragChat.clearHistory}
        onSetSearchMode={ragChat.setSearchMode}
        onSetFolderFilter={ragChat.setFolderFilter}
        onSetFileFilter={ragChat.setFileFilter}
      />
    </motion.div>
  );
}
