'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeftIcon,
  PaperAirplaneIcon,
  DocumentTextIcon,
  ClockIcon,
  TrashIcon,
  ArrowPathIcon,
  InformationCircleIcon,
  ChatBubbleBottomCenterTextIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  FolderIcon,
  FunnelIcon,
  ClockIcon as HistoryIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { useChatPage } from '@/hooks/rag/useChatPage';
import { useRagChat } from '@/hooks/rag';
import { useFolders } from '@/hooks/useFolders';
import { useAuth } from '@/hooks/useAuth';
import { RagMessage, SearchHistoryItem } from '@/types/rag';
import { formatSearchStrategy, getConfidenceColor, getConfidenceLabel } from '@/lib/api/rag';
import { formatDistanceToNow } from 'date-fns';
import { clsx } from 'clsx';

// =============================================================================
// Types
// =============================================================================

interface ChatPageProps {
  documentId: string;
}

// =============================================================================
// Suggested Queries
// =============================================================================

const SUGGESTED_QUERIES = [
  "What are the key points in this document?",
  "Summarize the main conclusions",
  "What evidence supports the arguments?",
  "Are there any recommendations or action items?",
  "What are the potential risks or concerns mentioned?",
  "How does this relate to industry standards?",
];

// =============================================================================
// Main Component
// =============================================================================

export default function ChatPage({ documentId }: ChatPageProps) {
  const { user } = useAuth();
  const organizationId = user?.org_id || '';

  // Page state
  const pageState = useChatPage(documentId);

  // RAG chat functionality
  const ragChat = useRagChat();

  // Folders for filter dropdown
  const { data: foldersData } = useFolders(organizationId, undefined, !!organizationId);

  // Local state
  const [query, setQuery] = useState('');
  const [showFileDetails, setShowFileDetails] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [localFileFilter, setLocalFileFilter] = useState(ragChat.fileFilter || '');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ragChat.messages]);

  // Open chat with document when initialized
  useEffect(() => {
    if (pageState.isInitialized && pageState.document && !ragChat.currentDocument) {
      ragChat.openChat(pageState.document);
    }
  }, [pageState.isInitialized, pageState.document, ragChat]);

  // Auto-focus textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const handleSendMessage = async () => {
    if (!query.trim() || ragChat.isLoading) return;

    const queryToSend = query.trim();
    setQuery('');

    await ragChat.sendGeminiSearchStream(queryToSend, {
      folderName: ragChat.folderFilter || undefined,
      fileFilter: localFileFilter || undefined,
      maxSources: ragChat.maxSources,
    });
  };

  const handleFileFilterBlur = () => {
    ragChat.setFileFilter(localFileFilter || null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestedQuery = (suggestedQuery: string) => {
    setQuery(suggestedQuery);
    textareaRef.current?.focus();
  };

  const formatMessageContent = (content: string) => {
    return content
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-secondary-100 px-1 rounded">$1</code>');
  };

  const renderMessage = (message: RagMessage) => {
    const isUser = message.type === 'user';

    return (
      <motion.div
        key={message.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={clsx(
          'flex mb-4',
          isUser ? 'justify-end' : 'justify-start'
        )}
      >
        <div className={clsx(
          'max-w-[85%] rounded-lg px-4 py-3 shadow-sm',
          isUser
            ? 'bg-brand-coral-500 text-white'
            : 'bg-white dark:bg-brand-navy-600 border border-gray-200 dark:border-brand-navy-500 text-gray-900 dark:text-gray-100'
        )}>
          <div
            className="prose prose-sm max-w-none text-left dark:prose-invert"
            dangerouslySetInnerHTML={{
              __html: `<div>${formatMessageContent(message.content)}</div>`
            }}
          />

          {/* Citations section for assistant messages */}
          {!isUser && message.citations && message.citations.length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                <DocumentTextIcon className="w-4 h-4" />
                Sources ({message.citations.length})
              </div>
              <div className="space-y-2">
                {message.citations.map((citation, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 dark:bg-brand-navy-700 rounded-md p-2 text-xs border border-gray-100 dark:border-brand-navy-500"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-800 dark:text-gray-200 truncate max-w-[200px]">
                        {citation.file}
                      </span>
                      <span className={clsx(
                        "px-1.5 py-0.5 rounded text-[10px] font-medium",
                        citation.relevance_score >= 0.8 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                        citation.relevance_score >= 0.5 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                        "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                      )}>
                        {Math.round(citation.relevance_score * 100)}% match
                      </span>
                    </div>
                    {citation.text && (
                      <p className="text-gray-600 dark:text-gray-400 line-clamp-2 italic">
                        &ldquo;{citation.text}&rdquo;
                      </p>
                    )}
                    {citation.folder_name && (
                      <span className="text-gray-400 dark:text-gray-500 text-[10px]">
                        Folder: {citation.folder_name}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Message metadata for assistant messages */}
          {!isUser && message.metadata && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                {message.metadata.processing_time && (
                  <div className="flex items-center gap-1">
                    <ClockIcon className="w-3 h-3" />
                    <span>{message.metadata.processing_time.toFixed(1)}s</span>
                  </div>
                )}

                {message.metadata.confidence_score !== undefined && message.metadata.confidence_score > 0 && (
                  <div className="flex items-center gap-1">
                    <div className={clsx(
                      "w-2 h-2 rounded-full",
                      message.metadata.confidence_score >= 0.8 ? "bg-green-500" :
                      message.metadata.confidence_score >= 0.6 ? "bg-yellow-500" : "bg-red-500"
                    )} />
                    <span className={getConfidenceColor(message.metadata.confidence_score)}>
                      {getConfidenceLabel(message.metadata.confidence_score)} Confidence
                    </span>
                  </div>
                )}

                {message.metadata.sources_count && (
                  <div className="flex items-center gap-1">
                    <DocumentTextIcon className="w-3 h-3" />
                    <span>{message.metadata.sources_count} sources</span>
                  </div>
                )}

                {message.metadata.search_strategy && (
                  <div className="flex items-center gap-1">
                    <MagnifyingGlassIcon className="w-3 h-3" />
                    <span>{formatSearchStrategy(message.metadata.search_strategy)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-2">
            <span className="text-xs opacity-70">
              {formatDistanceToNow(message.timestamp, { addSuffix: true })}
            </span>
          </div>
        </div>
      </motion.div>
    );
  };

  // Render error state
  if (pageState.initError || !pageState.document) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50 dark:bg-brand-navy-700">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Error Loading Chat
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {pageState.initError || 'Failed to load document context'}
          </p>
          <Button onClick={pageState.handleBack} variant="primary">
            Back to Documents
          </Button>
        </div>
      </div>
    );
  }

  // Render initializing state
  if (pageState.isInitializing) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50 dark:bg-brand-navy-700">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-brand-coral-500 mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Loading chat...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] bg-gray-50 dark:bg-brand-navy-700">
      {/* Header */}
      <header className="bg-white dark:bg-brand-navy-600 border-b border-gray-200 dark:border-brand-navy-500 px-4 sm:px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
            {/* Left side: Back button and info */}
            <div className="flex items-center space-x-4">
              <button
                onClick={pageState.handleBack}
                className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5" />
                <span className="text-sm font-medium hidden sm:inline">Back</span>
              </button>

              <div className="h-6 w-px bg-gray-300 dark:bg-brand-navy-500" />

              <div className="flex items-center space-x-3">
                <ChatBubbleBottomCenterTextIcon className="w-8 h-8 text-brand-coral-500" />
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Document Chat
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {pageState.document.name}
                  </p>
                </div>
              </div>
            </div>

            {/* Right side: Actions */}
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFileDetails(!showFileDetails)}
                className="p-2"
                title="Document details"
              >
                <InformationCircleIcon className="w-4 h-4" />
              </Button>
              {ragChat.messages.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={ragChat.clearChat}
                  className="p-2 text-red-600 hover:text-red-800"
                  title="Clear chat"
                >
                  <TrashIcon className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Document details */}
          {showFileDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-gray-100 dark:border-brand-navy-500"
            >
              <div className="bg-gray-50 dark:bg-brand-navy-700 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-2">
                  <DocumentTextIcon className="w-5 h-5 text-brand-coral-500" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {pageState.document.name}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {pageState.document.type} • ID: {pageState.document.id}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Configuration display */}
          <div className="mt-4 flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
            <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
              <MagnifyingGlassIcon className="w-3 h-3" />
              Hybrid Search
            </span>
            {ragChat.folderFilter ? (
              <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                <FolderIcon className="w-3 h-3" />
                {ragChat.folderFilter}
              </span>
            ) : (
              <span className="text-gray-500">All Folders</span>
            )}
            <span>Max Sources: {ragChat.maxSources}</span>
            <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
              <CheckCircleIcon className="w-3 h-3" />
              DocumentAgent RAG
            </span>
          </div>
      </header>

      {/* Search Options with Filters */}
      <div className="border-b border-gray-200 dark:border-brand-navy-500 px-4 sm:px-6 py-4 bg-gray-100 dark:bg-brand-navy-600/50 flex-shrink-0">
        <div className="space-y-4">
          {/* Filters Row */}
          <div className="flex items-end space-x-4">
            {/* Folder Filter */}
            {foldersData?.folders && foldersData.folders.length > 0 && (
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <FolderIcon className="w-3 h-3 inline mr-1" />
                  Folder Filter
                </label>
                <select
                  value={ragChat.folderFilter || ''}
                  onChange={(e) => ragChat.setFolderFilter(e.target.value || null)}
                  className="w-full text-sm rounded-lg border border-gray-300 dark:border-brand-navy-500 dark:bg-brand-navy-700 dark:text-white px-3 py-1.5 focus:ring-2 focus:ring-brand-coral-500 focus:border-transparent"
                >
                  <option value="">All Folders (Org-wide)</option>
                  {foldersData.folders.map((folder) => (
                    <option key={folder.id} value={folder.name}>
                      {folder.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* File Filter */}
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                <FunnelIcon className="w-3 h-3 inline mr-1" />
                File Filter
              </label>
              <input
                type="text"
                value={localFileFilter}
                onChange={(e) => setLocalFileFilter(e.target.value)}
                onBlur={handleFileFilterBlur}
                placeholder="e.g., contract.pdf"
                className="w-full text-sm rounded-lg border border-gray-300 dark:border-brand-navy-500 dark:bg-brand-navy-700 dark:text-white px-3 py-1.5 focus:ring-2 focus:ring-brand-coral-500 focus:border-transparent"
              />
            </div>

            {/* Max Sources */}
            <div className="w-32">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Max Sources: {ragChat.maxSources}
              </label>
              <input
                type="range"
                min="1"
                max="20"
                value={ragChat.maxSources}
                onChange={(e) => ragChat.setMaxSources(parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            {/* History Toggle */}
            {ragChat.searchHistory.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHistory(!showHistory)}
                className={clsx(
                  'p-2',
                  showHistory && 'bg-brand-coral-100 text-brand-coral-700 dark:bg-brand-coral-900/30 dark:text-brand-coral-400'
                )}
                title="Search history"
              >
                <HistoryIcon className="w-4 h-4" />
                <span className="ml-1 text-xs">{ragChat.searchHistory.length}</span>
              </Button>
            )}
          </div>

          {/* Search History Panel */}
          {showHistory && ragChat.searchHistory.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-gray-200 dark:border-brand-navy-500 pt-3"
            >
              <div className="flex items-center justify-between mb-2">
                <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Search History
                </h5>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={ragChat.clearHistory}
                  className="text-xs text-red-600 hover:text-red-800 p-1"
                >
                  <TrashIcon className="w-3 h-3 mr-1" />
                  Clear
                </Button>
              </div>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {ragChat.searchHistory.slice(0, 10).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => ragChat.viewHistoryItem(item)}
                    className="w-full text-left px-2 py-1.5 text-xs bg-white dark:bg-brand-navy-700 hover:bg-gray-100 dark:hover:bg-brand-navy-600 rounded border border-gray-200 dark:border-brand-navy-500 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate flex-1 text-gray-900 dark:text-white">
                        {item.query.substring(0, 50)}
                        {item.query.length > 50 && '...'}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400 ml-2 flex-shrink-0">
                        {formatDistanceToNow(item.timestamp, { addSuffix: true })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-gray-500 dark:text-gray-400">
                      {item.filters.folder && (
                        <span className="truncate">
                          <FolderIcon className="w-3 h-3 inline" /> {item.filters.folder}
                        </span>
                      )}
                      <span>{item.citations.length} sources</span>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Chat messages - scrollable */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
        <div>
          {ragChat.messages.length === 0 && !ragChat.isLoading && (
            <div className="h-full flex flex-col items-start justify-start text-left py-8">
              <ChatBubbleBottomCenterTextIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Fast Document Q&A Ready
              </h4>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Ask me anything about your document. Simple RAG provides fast, accurate answers in just 5-10 seconds using hybrid search.
              </p>

              {/* Suggested queries */}
              <div className="w-full max-w-lg">
                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Try asking:
                </h5>
                <div className="grid grid-cols-1 gap-2">
                  {SUGGESTED_QUERIES.slice(0, 3).map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSuggestedQuery(suggestion)}
                      className="text-left px-3 py-2 text-sm bg-white dark:bg-brand-navy-600 hover:bg-gray-100 dark:hover:bg-brand-navy-500 rounded-lg transition-colors border border-gray-200 dark:border-brand-navy-500"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {ragChat.messages.map(renderMessage)}

          {/* Streaming/Loading indicator */}
          {(ragChat.isLoading || ragChat.isStreaming) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start mb-4"
            >
              <div className="bg-white dark:bg-brand-navy-600 border border-gray-200 dark:border-brand-navy-500 rounded-lg px-4 py-3 shadow-sm">
                <div className="flex items-center space-x-2">
                  {ragChat.isStreaming ? (
                    <>
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-brand-coral-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-brand-coral-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-brand-coral-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {ragChat.streamingStatus || 'Generating...'}
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-coral-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Getting your answer (5-10s)...
                      </span>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Error display */}
      {ragChat.error && (
        <div className="px-4 sm:px-6 pb-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <p className="text-sm text-red-800 dark:text-red-300">{ragChat.error}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={ragChat.retryLastMessage}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <ArrowPathIcon className="w-4 h-4 mr-1" />
                  Retry
                </Button>
              </div>
            </div>
        </div>
      )}

      {/* Input area */}
      <div className="border-t border-gray-200 dark:border-brand-navy-500 bg-white dark:bg-brand-navy-600 px-4 sm:px-6 py-4 flex-shrink-0">
        <div className="flex items-start space-x-3">
            <div className="flex-1">
              <textarea
                ref={textareaRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about this document..."
                className="w-full resize-none rounded-lg border border-gray-300 dark:border-brand-navy-500 dark:bg-brand-navy-700 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-brand-coral-500 focus:border-transparent"
                rows={2}
                disabled={ragChat.isLoading}
              />

              <div className="flex items-center justify-between mt-2">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Press Shift+Enter for new line
                </div>

                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Simple RAG - Fast responses
                </div>
              </div>
            </div>

            <Button
              onClick={handleSendMessage}
              disabled={!query.trim() || ragChat.isLoading}
              className="px-4 py-2 bg-brand-coral-500 hover:bg-brand-coral-600"
            >
              <PaperAirplaneIcon className="w-4 h-4" />
            </Button>
          </div>
      </div>
    </div>
  );
}
