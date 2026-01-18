'use client';

import { useState, useRef, useCallback } from 'react';
import {
  ChatBubbleBottomCenterTextIcon,
  PaperAirplaneIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Folder, Document } from '@/types/api';
import { useDashboardChat, ChatScopeType } from '@/hooks/dashboard/useDashboardChat';
import ChatScopeSelector from './ChatScopeSelector';
import DocumentScopeModal from './DocumentScopeModal';
import DashboardChatMessages from './DashboardChatMessages';
import { clsx } from 'clsx';

interface DashboardChatProps {
  folders: Folder[];
  documents: Document[];
  isLoadingFolders?: boolean;
  isLoadingDocuments?: boolean;
}

export default function DashboardChat({
  folders,
  documents,
  isLoadingFolders = false,
  isLoadingDocuments = false,
}: DashboardChatProps) {
  const [query, setQuery] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    // Session state
    messages,
    isLoading,
    isStreaming,
    streamingStatus,
    error,

    // Scope state
    scope,
    setScopeType,
    toggleFolderInOrg,
    setFolderScope,
    toggleDocumentInFolder,
    setDocumentsScope,
    scopeDescription,

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
  } = useDashboardChat();

  // Handle send
  const handleSend = useCallback(async () => {
    if (!query.trim() || isLoading || isStreaming) return;

    const queryToSend = query.trim();
    setQuery('');
    await sendMessage(queryToSend);
  }, [query, isLoading, isStreaming, sendMessage]);

  // Handle key press
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // Handle suggested query
  const handleSuggestedQuery = useCallback((suggestedQuery: string) => {
    setQuery(suggestedQuery);
    textareaRef.current?.focus();
  }, []);

  // Handle scope type change
  const handleScopeTypeChange = useCallback((type: ChatScopeType) => {
    setScopeType(type);
  }, [setScopeType]);

  // Handle folder selection
  const handleFolderSelect = useCallback((folderId: string, folderName: string) => {
    setFolderScope(folderId, folderName);
  }, [setFolderScope]);

  // Handle document selection confirm
  const handleDocumentConfirm = useCallback((selectedDocuments: Document[]) => {
    setDocumentsScope(selectedDocuments);
  }, [setDocumentsScope]);

  // Handle remove document from selection
  const handleRemoveDocument = useCallback((documentId: string) => {
    const remainingDocs = documents.filter(
      d => scope.documentIds?.includes(d.id) && d.id !== documentId
    );
    if (remainingDocs.length > 0) {
      setDocumentsScope(remainingDocs);
    } else {
      setScopeType('organization');
    }
  }, [documents, scope.documentIds, setDocumentsScope, setScopeType]);

  return (
    <>
      <Card className="mb-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ChatBubbleBottomCenterTextIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              <span>Chat with Documents</span>
            </span>
            <div className="flex items-center gap-2">
              {messages.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearChat}
                  className="text-error-600 hover:text-error-800 dark:text-error-400 dark:hover:text-error-300 p-1.5"
                  title="Clear chat"
                >
                  <TrashIcon className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleExpanded}
                className="p-1.5"
                title={isExpanded ? 'Collapse' : 'Expand'}
              >
                {isExpanded ? (
                  <ChevronUpIcon className="w-4 h-4" />
                ) : (
                  <ChevronDownIcon className="w-4 h-4" />
                )}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Scope Selector */}
          <ChatScopeSelector
            scope={scope}
            scopeDescription={scopeDescription}
            folders={folders}
            documents={documents}
            isLoadingFolders={isLoadingFolders}
            isLoadingDocuments={isLoadingDocuments}
            onScopeTypeChange={handleScopeTypeChange}
            onToggleFolderInOrg={toggleFolderInOrg}
            onFolderSelect={handleFolderSelect}
            onToggleDocument={toggleDocumentInFolder}
            onOpenDocumentModal={openDocumentModal}
            onRemoveDocument={handleRemoveDocument}
          />

          {/* Messages Section (collapsible) */}
          {isExpanded && (
            <div className="mt-4 border-t border-secondary-200 dark:border-secondary-700 pt-4">
              <div className="h-64 bg-secondary-50 dark:bg-secondary-800/30 rounded-lg overflow-hidden">
                <DashboardChatMessages
                  messages={messages}
                  isLoading={isLoading}
                  isStreaming={isStreaming}
                  streamingStatus={streamingStatus}
                  error={error}
                  onSuggestedQuery={handleSuggestedQuery}
                />
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="mt-4 flex items-start gap-2">
            <textarea
              ref={textareaRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about your documents..."
              disabled={isLoading || isStreaming}
              rows={1}
              className={clsx(
                'flex-1 resize-none rounded-lg border text-sm',
                'border-secondary-300 dark:border-secondary-600',
                'bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100',
                'placeholder-secondary-400 dark:placeholder-secondary-500',
                'px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            />
            <Button
              onClick={handleSend}
              disabled={!query.trim() || isLoading || isStreaming}
              className="px-3 py-2"
              size="sm"
            >
              <PaperAirplaneIcon className="w-4 h-4" />
            </Button>
          </div>

          {/* Help text */}
          <p className="text-[10px] text-secondary-400 dark:text-secondary-500 mt-1.5">
            Press Enter to send, Shift+Enter for new line
          </p>
        </CardContent>
      </Card>

      {/* Document Selection Modal */}
      <DocumentScopeModal
        isOpen={isDocumentModalOpen}
        onClose={closeDocumentModal}
        folders={folders}
        documents={documents}
        selectedDocumentIds={scope.documentIds || []}
        isLoadingDocuments={isLoadingDocuments}
        onConfirm={handleDocumentConfirm}
      />
    </>
  );
}
