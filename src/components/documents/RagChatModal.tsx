'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  PaperAirplaneIcon,
  DocumentTextIcon,
  ClockIcon,
  CpuChipIcon,
  TrashIcon,
  ArrowPathIcon,
  InformationCircleIcon,
  ChatBubbleBottomCenterTextIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  FolderIcon,
  FunnelIcon,
  ClockIcon as HistoryIcon,
} from '@heroicons/react/24/outline';
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { RagMessage, GeminiSearchMode, SearchHistoryItem } from '@/types/rag';
import { Document, Folder } from '@/types/api';
import { formatSearchStrategy, getConfidenceColor, getConfidenceLabel } from '@/lib/api/rag';
import { formatDistanceToNow } from 'date-fns';
import { clsx } from 'clsx';

interface RagChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: RagMessage[];
  isLoading: boolean;
  error: string | null;
  currentDocument: Document | null;
  currentDocuments?: Document[];

  // Configuration
  maxSources: number;
  searchMode: GeminiSearchMode;
  folderFilter: string | null;
  fileFilter: string | null;

  // Search history
  searchHistory: SearchHistoryItem[];

  // Available folders for filter dropdown
  folders?: Folder[];

  // Actions
  onSendMessage: (query: string, options?: { searchMode?: GeminiSearchMode; folderName?: string; fileFilter?: string; maxSources?: number }) => Promise<void>;
  onClearChat: () => void;
  onRetry: () => Promise<void>;
  onViewHistoryItem: (item: SearchHistoryItem) => void;
  onClearHistory: () => void;

  // Configuration setters
  onSetMaxSources: (count: number) => void;
  onSetSearchMode: (mode: GeminiSearchMode) => void;
  onSetFolderFilter: (folder: string | null) => void;
  onSetFileFilter: (file: string | null) => void;
}

const SUGGESTED_QUERIES = [
  "What are the key points in this document?",
  "Summarize the main conclusions",
  "What evidence supports the arguments?",
  "Are there any recommendations or action items?",
  "What are the potential risks or concerns mentioned?",
  "How does this relate to industry standards?",
];

// Simple RAG uses automatic hybrid search strategy - no configuration needed!

export default function RagChatModal({
  isOpen,
  onClose,
  messages,
  isLoading,
  error,
  currentDocument,
  currentDocuments = [],
  maxSources,
  searchMode,
  folderFilter,
  fileFilter,
  searchHistory,
  folders = [],
  onSendMessage,
  onClearChat,
  onRetry,
  onViewHistoryItem,
  onClearHistory,
  onSetMaxSources,
  onSetSearchMode,
  onSetFolderFilter,
  onSetFileFilter,
}: RagChatModalProps) {
  const [query, setQuery] = useState('');
  const [showFileDetails, setShowFileDetails] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [localFileFilter, setLocalFileFilter] = useState(fileFilter || '');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-focus textarea when modal opens
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!query.trim() || isLoading) return;

    const queryToSend = query.trim();
    setQuery('');

    // Use unified DocumentAgent chat
    await onSendMessage(queryToSend, {
      searchMode,
      folderName: folderFilter || undefined,
      fileFilter: localFileFilter || undefined,
      maxSources,
    });
  };

  const handleFileFilterBlur = () => {
    onSetFileFilter(localFileFilter || null);
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
    // Enhanced formatting for better readability
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
            ? 'bg-primary-600 text-white'
            : 'bg-white border border-secondary-200 text-secondary-900'
        )}>
          <div
            className="prose prose-sm max-w-none text-left"
            dangerouslySetInnerHTML={{
              __html: `<div>${formatMessageContent(message.content)}</div>`
            }}
          />

          {/* Citations section for assistant messages */}
          {!isUser && message.citations && message.citations.length > 0 && (
            <div className="mt-4 pt-3 border-t border-secondary-200">
              <div className="text-xs font-semibold text-secondary-700 mb-2 flex items-center gap-1">
                <DocumentTextIcon className="w-4 h-4" />
                Sources ({message.citations.length})
              </div>
              <div className="space-y-2">
                {message.citations.map((citation, index) => (
                  <div
                    key={index}
                    className="bg-secondary-50 rounded-md p-2 text-xs border border-secondary-100"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-secondary-800 truncate max-w-[200px]">
                        {citation.file}
                      </span>
                      <span className={clsx(
                        "px-1.5 py-0.5 rounded text-[10px] font-medium",
                        citation.relevance_score >= 0.8 ? "bg-green-100 text-green-700" :
                        citation.relevance_score >= 0.5 ? "bg-yellow-100 text-yellow-700" :
                        "bg-secondary-100 text-secondary-600"
                      )}>
                        {Math.round(citation.relevance_score * 100)}% match
                      </span>
                    </div>
                    {citation.text && (
                      <p className="text-secondary-600 line-clamp-2 italic">
                        "{citation.text}"
                      </p>
                    )}
                    {citation.folder_name && (
                      <span className="text-secondary-400 text-[10px]">
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
            <div className="mt-3 pt-3 border-t border-secondary-200">
              <div className="flex items-center gap-4 text-xs text-secondary-600">
                {message.metadata.processing_time && (
                  <div className="flex items-center gap-1">
                    <ClockIcon className="w-3 h-3" />
                    <span>{message.metadata.processing_time.toFixed(1)}s</span>
                  </div>
                )}
                
                {message.metadata.confidence_score !== undefined && (
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


  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
          <DialogBackdrop className="fixed inset-0 bg-black bg-opacity-25" />
          
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-left">
              <DialogPanel
                as={motion.div}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all"
              >
                {/* Header */}
                <div className="border-b border-secondary-200 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <ChatBubbleBottomCenterTextIcon className="w-8 h-8 text-primary-600" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-lg font-semibold text-secondary-900">
                          Document Chat - Simple RAG ⚡
                        </h3>
                        <p className="text-sm text-secondary-600">
                          {currentDocuments.length > 1 
                            ? `Analyzing ${currentDocuments.length} documents` 
                            : currentDocument?.name 
                              ? `Analyzing "${currentDocument.name}"` 
                              : 'No document selected'
                          }
                        </p>
                        <p className="text-xs text-secondary-500">
                          Fast 5-10 second responses
                        </p>
                      </div>
                    </div>
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
                      {messages.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={onClearChat}
                          className="p-2 text-error-600 hover:text-error-800"
                          title="Clear chat"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="p-2"
                      >
                        <XMarkIcon className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Document information */}
                  {showFileDetails && currentDocument && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-secondary-100"
                    >
                      <div className="bg-secondary-50 rounded-lg p-3">
                        {currentDocuments.length > 1 ? (
                          <div>
                            <div className="flex items-center space-x-2 mb-2">
                              <DocumentTextIcon className="w-5 h-5 text-primary-600" />
                              <h4 className="text-sm font-medium text-secondary-900">
                                {currentDocuments.length} Documents Selected
                              </h4>
                            </div>
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                              {currentDocuments.map((doc, index) => (
                                <div key={doc.id} className="flex items-center space-x-2 py-1">
                                  <div className="w-2 h-2 bg-primary-400 rounded-full flex-shrink-0"></div>
                                  <span className="text-xs text-secondary-700 truncate">
                                    {doc.name}
                                  </span>
                                  <span className="text-xs text-secondary-500">
                                    ({doc.type})
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : currentDocument ? (
                          <div className="flex items-center space-x-2 mb-2">
                            <DocumentTextIcon className="w-5 h-5 text-primary-600" />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-secondary-900 truncate">
                                {currentDocument.name}
                              </h4>
                              <p className="text-xs text-secondary-600">
                                {currentDocument.type} • ID: {currentDocument.id}
                              </p>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </motion.div>
                  )}
                  
                  {/* Configuration display */}
                  <div className="mt-4 flex items-center gap-4 text-xs text-secondary-600">
                    <span className="flex items-center gap-1 text-purple-600">
                      <MagnifyingGlassIcon className="w-3 h-3" />
                      {searchMode.charAt(0).toUpperCase() + searchMode.slice(1)} Search
                    </span>
                    {folderFilter ? (
                      <span className="flex items-center gap-1 text-blue-600">
                        <FolderIcon className="w-3 h-3" />
                        {folderFilter}
                      </span>
                    ) : (
                      <span className="text-secondary-500">All Folders</span>
                    )}
                    <span>Max Sources: {maxSources}</span>
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircleIcon className="w-3 h-3" />
                      DocumentAgent RAG
                    </span>
                  </div>
                </div>

                {/* Search Options with Filters */}
                <div className="border-t border-secondary-200 px-6 py-4 bg-secondary-50">
                  <div className="space-y-4">
                    {/* Search Mode Toggle */}
                    <div>
                      <label className="block text-xs font-medium text-secondary-700 mb-2">
                        Search Mode
                      </label>
                      <div className="flex space-x-2">
                        {(['semantic', 'keyword', 'hybrid'] as GeminiSearchMode[]).map((mode) => (
                          <button
                            key={mode}
                            onClick={() => onSetSearchMode(mode)}
                            className={clsx(
                              'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
                              searchMode === mode
                                ? 'bg-primary-600 text-white'
                                : 'bg-white border border-secondary-300 text-secondary-700 hover:bg-secondary-100'
                            )}
                          >
                            {mode.charAt(0).toUpperCase() + mode.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Filters Row */}
                    <div className="flex items-end space-x-4">
                      {/* Folder Filter */}
                      {folders.length > 0 && (
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-secondary-700 mb-1">
                            <FolderIcon className="w-3 h-3 inline mr-1" />
                            Folder Filter
                          </label>
                          <select
                            value={folderFilter || ''}
                            onChange={(e) => onSetFolderFilter(e.target.value || null)}
                            className="w-full text-sm rounded-lg border border-secondary-300 px-3 py-1.5 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          >
                            <option value="">All Folders (Org-wide)</option>
                            {folders.map((folder) => (
                              <option key={folder.id} value={folder.name}>
                                {folder.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* File Filter */}
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-secondary-700 mb-1">
                          <FunnelIcon className="w-3 h-3 inline mr-1" />
                          File Filter
                        </label>
                        <input
                          type="text"
                          value={localFileFilter}
                          onChange={(e) => setLocalFileFilter(e.target.value)}
                          onBlur={handleFileFilterBlur}
                          placeholder="e.g., contract.pdf"
                          className="w-full text-sm rounded-lg border border-secondary-300 px-3 py-1.5 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>

                      {/* Max Sources */}
                      <div className="w-32">
                        <label className="block text-xs font-medium text-secondary-700 mb-1">
                          Max Sources: {maxSources}
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="20"
                          value={maxSources}
                          onChange={(e) => onSetMaxSources(parseInt(e.target.value))}
                          className="w-full"
                        />
                      </div>

                      {/* History Toggle */}
                      {searchHistory.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowHistory(!showHistory)}
                          className={clsx(
                            'p-2',
                            showHistory && 'bg-primary-100 text-primary-700'
                          )}
                          title="Search history"
                        >
                          <HistoryIcon className="w-4 h-4" />
                          <span className="ml-1 text-xs">{searchHistory.length}</span>
                        </Button>
                      )}
                    </div>

                    {/* Search History Panel */}
                    {showHistory && searchHistory.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-secondary-200 pt-3"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="text-xs font-medium text-secondary-700">
                            Search History
                          </h5>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClearHistory}
                            className="text-xs text-error-600 hover:text-error-800 p-1"
                          >
                            <TrashIcon className="w-3 h-3 mr-1" />
                            Clear
                          </Button>
                        </div>
                        <div className="max-h-32 overflow-y-auto space-y-1">
                          {searchHistory.slice(0, 10).map((item) => (
                            <button
                              key={item.id}
                              onClick={() => onViewHistoryItem(item)}
                              className="w-full text-left px-2 py-1.5 text-xs bg-white hover:bg-secondary-100 rounded border border-secondary-200 transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <span className="truncate flex-1 text-secondary-900">
                                  {item.query.substring(0, 50)}
                                  {item.query.length > 50 && '...'}
                                </span>
                                <span className="text-secondary-500 ml-2 flex-shrink-0">
                                  {formatDistanceToNow(item.timestamp, { addSuffix: true })}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 text-secondary-500">
                                <span className="bg-secondary-100 px-1 rounded">
                                  {item.filters.searchMode}
                                </span>
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

                {/* Chat messages */}
                <div className="h-96 overflow-y-auto px-6 py-4">
                  {messages.length === 0 && !isLoading && (
                    <div className="h-full flex flex-col items-start justify-start text-left">
                      <ChatBubbleBottomCenterTextIcon className="w-16 h-16 text-secondary-300 mb-4" />
                      <h4 className="text-lg font-medium text-secondary-900 mb-2">
                        ⚡ Fast Document Q&A Ready
                      </h4>
                      <p className="text-secondary-600 mb-6">
                        Ask me anything about your document. Simple RAG provides fast, accurate answers in just 5-10 seconds using hybrid search.
                      </p>
                      
                      {/* Suggested queries */}
                      <div className="w-full max-w-lg">
                        <h5 className="text-sm font-medium text-secondary-700 mb-3">
                          Try asking:
                        </h5>
                        <div className="grid grid-cols-1 gap-2">
                          {SUGGESTED_QUERIES.slice(0, 3).map((suggestion, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSuggestedQuery(suggestion)}
                              className="text-left px-3 py-2 text-sm bg-secondary-50 hover:bg-secondary-100 rounded-lg transition-colors"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {messages.map(renderMessage)}
                  
                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-start mb-4"
                    >
                      <div className="bg-white border border-secondary-200 rounded-lg px-4 py-3 shadow-sm">
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                          <span className="text-sm text-secondary-600">
                            Getting your answer (5-10s)...
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>

                {/* Error display */}
                {error && (
                  <div className="px-6 pb-4">
                    <div className="bg-error-50 border border-error-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <ExclamationTriangleIcon className="w-5 h-5 text-error-600" />
                          <p className="text-sm text-error-800">{error}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={onRetry}
                          className="text-error-600 border-error-200 hover:bg-error-50"
                        >
                          <ArrowPathIcon className="w-4 h-4 mr-1" />
                          Retry
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Input area */}
                <div className="border-t border-secondary-200 px-6 py-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-1">
                      <textarea
                        ref={textareaRef}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask me anything about this document..."
                        className="w-full resize-none rounded-lg border border-secondary-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        rows={2}
                        disabled={isLoading}
                      />
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="text-xs text-secondary-500">
                          Press Shift+Enter for new line
                        </div>
                        
                        <div className="text-xs text-secondary-500">
                          Simple RAG - Fast responses
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      onClick={handleSendMessage}
                      disabled={!query.trim() || isLoading}
                      className="px-4 py-2"
                    >
                      <PaperAirplaneIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </DialogPanel>
            </div>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  );
}