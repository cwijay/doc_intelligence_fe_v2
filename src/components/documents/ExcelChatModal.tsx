'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
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
  TableCellsIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react';
import Button from '@/components/ui/Button';
import { ChatMessage } from '@/lib/api/excel';
import { fileUtils } from '@/lib/file-utils';
import { formatDistanceToNow } from 'date-fns';
import { clsx } from 'clsx';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Check if content contains a markdown table
const hasMarkdownTable = (content: string): boolean => {
  return content.includes('|') && content.includes('---');
};

// Memoized markdown components for table styling (defined outside component)
const markdownComponents = {
  // Style tables professionally
  table: ({ children, ...props }: any) => (
    <div className="overflow-x-auto my-4 rounded-lg border border-secondary-200 shadow-sm">
      <table className="min-w-full divide-y divide-secondary-200" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }: any) => (
    <thead className="bg-gradient-to-r from-secondary-100 to-secondary-50" {...props}>
      {children}
    </thead>
  ),
  tbody: ({ children, ...props }: any) => (
    <tbody className="divide-y divide-secondary-100 bg-white" {...props}>
      {children}
    </tbody>
  ),
  tr: ({ children, ...props }: any) => (
    <tr className="hover:bg-blue-50/50 transition-colors" {...props}>
      {children}
    </tr>
  ),
  th: ({ children, ...props }: any) => (
    <th className="px-4 py-3 text-left text-xs font-semibold text-secondary-700 uppercase tracking-wider whitespace-nowrap bg-secondary-100/50" {...props}>
      {children}
    </th>
  ),
  td: ({ children, ...props }: any) => (
    <td className="px-4 py-2.5 text-sm text-secondary-800 whitespace-nowrap font-mono" {...props}>
      {children}
    </td>
  ),
  // Style paragraphs
  p: ({ children, ...props }: any) => (
    <p className="mb-3 last:mb-0 text-sm leading-relaxed text-secondary-800" {...props}>
      {children}
    </p>
  ),
  // Style strong text
  strong: ({ children, ...props }: any) => (
    <strong className="font-semibold text-secondary-900" {...props}>
      {children}
    </strong>
  ),
  // Style lists
  ul: ({ children, ...props }: any) => (
    <ul className="list-disc list-inside mb-3 space-y-1" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: any) => (
    <ol className="list-decimal list-inside mb-3 space-y-1" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }: any) => (
    <li className="text-sm text-secondary-800" {...props}>
      {children}
    </li>
  ),
};

// Message content component to properly handle hooks
interface MessageContentProps {
  content: string;
  isUser: boolean;
}

function MessageContent({ content, isUser }: MessageContentProps) {
  const hasTable = useMemo(() => {
    if (isUser) return false;
    return hasMarkdownTable(content);
  }, [content, isUser]);

  if (isUser) {
    return <p className="text-sm leading-relaxed">{content}</p>;
  }

  return (
    <div className={clsx(
      "prose prose-sm max-w-none text-left",
      hasTable && "prose-table:my-0"
    )}>
      {hasTable && (
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-secondary-200">
          <TableCellsIcon className="w-4 h-4 text-green-600" />
          <span className="text-xs font-medium text-secondary-600 uppercase tracking-wide">
            Data Analysis Results
          </span>
        </div>
      )}
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

interface ExcelChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  currentDocuments: any[];
  onSendMessage: (query: string, options?: { detailed_analysis?: boolean }) => Promise<void>;
  onClearChat: () => void;
  onRetry: () => Promise<void>;
}

const SUGGESTED_QUERIES = [
  "What are the top 5 values in this data?",
  "Calculate the sum of all numeric columns",
  "Show me the monthly trends",
  "What's the average of the main metrics?",
  "Find any outliers or unusual patterns",
  "Create a summary of the key insights",
];

export default function ExcelChatModal({
  isOpen,
  onClose,
  messages,
  isLoading,
  error,
  currentDocuments,
  onSendMessage,
  onClearChat,
  onRetry,
}: ExcelChatModalProps) {
  const [query, setQuery] = useState('');
  const [detailedAnalysis, setDetailedAnalysis] = useState(false);
  const [showFileDetails, setShowFileDetails] = useState(false);
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
    
    await onSendMessage(queryToSend, { detailed_analysis: detailedAnalysis });
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

  const renderMessage = (message: ChatMessage) => {
    const isUser = message.type === 'user';

    // Check if content has table for width adjustment
    const hasTable = !isUser && hasMarkdownTable(message.content);

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
          'rounded-lg px-4 py-3',
          isUser
            ? 'max-w-[80%] bg-primary-600 text-white'
            : hasTable ? 'max-w-[95%] bg-secondary-50 text-secondary-900' : 'max-w-[80%] bg-secondary-50 text-secondary-900'
        )}>
          <MessageContent content={message.content} isUser={isUser} />
          
          {/* Message metadata for assistant messages */}
          {!isUser && message.metadata && (
            <div className="mt-3 pt-3 border-t border-secondary-200">
              <div className="flex items-center gap-4 text-xs text-secondary-600">
                {message.metadata.processing_time_ms && (
                  <div className="flex items-center gap-1">
                    <ClockIcon className="w-3 h-3" />
                    <span>{(message.metadata.processing_time_ms / 1000).toFixed(1)}s</span>
                  </div>
                )}
                {message.metadata.token_usage && (
                  <div className="flex items-center gap-1">
                    <CpuChipIcon className="w-3 h-3" />
                    <span>{message.metadata.token_usage.total_tokens} tokens</span>
                  </div>
                )}
                {message.metadata.files_processed && (
                  <div className="flex items-center gap-1">
                    <TableCellsIcon className="w-3 h-3" />
                    <span>{message.metadata.files_processed.length} files</span>
                  </div>
                )}
              </div>

              {/* Detailed analysis info */}
              {message.metadata.files_processed && showFileDetails && (
                <div className="mt-2 space-y-1">
                  {message.metadata.files_processed.map((file, idx) => (
                    <div key={idx} className="text-xs bg-secondary-100 rounded px-2 py-1">
                      <div className="font-medium">{file.file_path.split('/').pop()}</div>
                      <div className="text-secondary-600">
                        {file.rows ? `${file.rows.toLocaleString()} rows` : ''}{file.rows && file.columns ? ' × ' : ''}{file.columns ? `${file.columns} columns` : file.column_names ? `${file.column_names.length} columns` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                        <ChartBarIcon className="w-8 h-8 text-green-600" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-lg font-semibold text-secondary-900">
                          Excel Analysis Chat
                        </h3>
                        <p className="text-sm text-secondary-600">
                          {currentDocuments.length === 1 
                            ? `Analyzing ${currentDocuments[0].name}`
                            : `Analyzing ${currentDocuments.length} spreadsheets`
                          }
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowFileDetails(!showFileDetails)}
                        className="p-2"
                        title="Toggle file details"
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
                  
                  {/* File information */}
                  {showFileDetails && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-secondary-100"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {currentDocuments.map((doc, idx) => (
                          <div key={idx} className="bg-secondary-50 rounded-lg p-3">
                            <div className="flex items-center space-x-2 mb-2">
                              <DocumentTextIcon className={clsx(
                                'w-5 h-5',
                                fileUtils.getSpreadsheetIconClass(doc)
                              )} />
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-secondary-900 truncate">
                                  {doc.name}
                                </h4>
                                <p className="text-xs text-secondary-600">
                                  {fileUtils.getFileTypeDisplayName(doc)} • {fileUtils.formatFileSize(doc.size)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Chat messages */}
                <div className="h-96 overflow-y-auto px-6 py-4">
                  {messages.length === 0 && !isLoading && (
                    <div className="h-full flex flex-col items-start justify-start text-left">
                      <TableCellsIcon className="w-16 h-16 text-secondary-300 mb-4" />
                      <h4 className="text-lg font-medium text-secondary-900 mb-2">
                        Ready to Analyze Your Data
                      </h4>
                      <p className="text-secondary-600 mb-6">
                        Ask me anything about your spreadsheet data. I can help with calculations, trends, and insights.
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
                      <div className="bg-secondary-50 rounded-lg px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                          <span className="text-sm text-secondary-600">
                            Analyzing your data...
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
                          <InformationCircleIcon className="w-5 h-5 text-error-600" />
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
                        placeholder="Ask me anything about your spreadsheet data..."
                        className="w-full resize-none rounded-lg border border-secondary-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        rows={2}
                        disabled={isLoading}
                      />
                      
                      <div className="flex items-center justify-between mt-2">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={detailedAnalysis}
                            onChange={(e) => setDetailedAnalysis(e.target.checked)}
                            className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="text-xs text-secondary-600">
                            Detailed analysis
                          </span>
                        </label>
                        
                        <div className="text-xs text-secondary-500">
                          Press Shift+Enter for new line
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