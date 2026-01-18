'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeftIcon,
  PaperAirplaneIcon,
  DocumentTextIcon,
  ClockIcon,
  TrashIcon,
  ArrowPathIcon,
  InformationCircleIcon,
  ChartBarIcon,
  TableCellsIcon,
  CpuChipIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { useExcelChatPage } from '@/hooks/useExcelChatPage';
import { excelApiService, ChatMessage, ChatSession } from '@/lib/api/excel';
import { fileUtils } from '@/lib/file-utils';
import { API_OPERATION_TIMEOUTS } from '@/lib/constants';
import { formatDistanceToNow } from 'date-fns';
import { clsx } from 'clsx';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import toast from 'react-hot-toast';

// =============================================================================
// Types
// =============================================================================

interface ExcelChatPageProps {
  documentId: string;
}

// =============================================================================
// Helper Functions
// =============================================================================

// Check if content contains a markdown table
const hasMarkdownTable = (content: string): boolean => {
  return content.includes('|') && content.includes('---');
};

// Parse structured API response
function parseApiResponse(content: string): string {
  if (!content || typeof content !== 'string') {
    return content || '';
  }

  const trimmed = content.trim();

  if (trimmed.startsWith('[') && trimmed.includes("'type':")) {
    try {
      const textBlocks: string[] = [];
      const typeTextPattern = /'type':\s*'text'/g;
      let match;
      const indices: number[] = [];

      while ((match = typeTextPattern.exec(trimmed)) !== null) {
        indices.push(match.index);
      }

      for (const idx of indices) {
        const afterType = trimmed.substring(idx);
        const textKeyMatch = afterType.match(/'text':\s*'/);

        if (textKeyMatch && textKeyMatch.index !== undefined) {
          const contentStart = idx + textKeyMatch.index + textKeyMatch[0].length;
          const remaining = trimmed.substring(contentStart);

          const endPatterns = [
            "', 'annotations'",
            '\', "annotations"',
            "', 'id':",
          ];

          let endIdx = -1;
          for (const pattern of endPatterns) {
            const foundIdx = remaining.indexOf(pattern);
            if (foundIdx !== -1 && (endIdx === -1 || foundIdx < endIdx)) {
              endIdx = foundIdx;
            }
          }

          if (endIdx !== -1) {
            const textContent = remaining.substring(0, endIdx);
            const unescaped = textContent
              .replace(/\\n/g, '\n')
              .replace(/\\t/g, '\t')
              .replace(/\\'/g, "'")
              .replace(/\\"/g, '"')
              .replace(/\\\\/g, '\\');
            textBlocks.push(unescaped);
          }
        }
      }

      if (textBlocks.length > 0) {
        return textBlocks.join('\n\n');
      }
    } catch (e) {
      console.warn('Failed to parse structured API response:', e);
    }
  }

  return content;
}

// =============================================================================
// Markdown Components
// =============================================================================

const markdownComponents = {
  table: ({ children, ...props }: React.HTMLAttributes<HTMLTableElement>) => (
    <div className="overflow-x-auto my-4 rounded-lg border border-gray-200 dark:border-brand-navy-500 shadow-sm">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-brand-navy-500" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <thead className="bg-gradient-to-r from-gray-100 to-gray-50 dark:from-brand-navy-600 dark:to-brand-navy-700" {...props}>
      {children}
    </thead>
  ),
  tbody: ({ children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <tbody className="divide-y divide-gray-100 dark:divide-brand-navy-600 bg-white dark:bg-brand-navy-700" {...props}>
      {children}
    </tbody>
  ),
  tr: ({ children, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
    <tr className="hover:bg-blue-50/50 dark:hover:bg-brand-navy-600 transition-colors" {...props}>
      {children}
    </tr>
  ),
  th: ({ children, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) => (
    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap bg-gray-100/50 dark:bg-brand-navy-600" {...props}>
      {children}
    </th>
  ),
  td: ({ children, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) => (
    <td className="px-4 py-2.5 text-sm text-gray-800 dark:text-gray-200 whitespace-nowrap font-mono" {...props}>
      {children}
    </td>
  ),
  p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="mb-3 last:mb-0 text-sm leading-relaxed text-gray-800 dark:text-gray-200" {...props}>
      {children}
    </p>
  ),
  strong: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <strong className="font-semibold text-gray-900 dark:text-white" {...props}>
      {children}
    </strong>
  ),
  ul: ({ children, ...props }: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="list-disc list-inside mb-3 space-y-1" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: React.OlHTMLAttributes<HTMLOListElement>) => (
    <ol className="list-decimal list-inside mb-3 space-y-1" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }: React.LiHTMLAttributes<HTMLLIElement>) => (
    <li className="text-sm text-gray-800 dark:text-gray-200" {...props}>
      {children}
    </li>
  ),
};

// =============================================================================
// Suggested Queries
// =============================================================================

const SUGGESTED_QUERIES = [
  "What are the top 5 values in this data?",
  "Calculate the sum of all numeric columns",
  "Show me the monthly trends",
  "What's the average of the main metrics?",
  "Find any outliers or unusual patterns",
  "Create a summary of the key insights",
];

// =============================================================================
// Message Content Component
// =============================================================================

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
      "prose prose-sm max-w-none text-left dark:prose-invert",
      hasTable && "prose-table:my-0"
    )}>
      {hasTable && (
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200 dark:border-brand-navy-500">
          <TableCellsIcon className="w-4 h-4 text-green-600" />
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
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

// =============================================================================
// Main Component
// =============================================================================

export default function ExcelChatPage({ documentId }: ExcelChatPageProps) {
  // Page state
  const pageState = useExcelChatPage(documentId);

  // Chat state
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Local state
  const [query, setQuery] = useState('');
  const [detailedAnalysis, setDetailedAnalysis] = useState(false);
  const [showFileDetails, setShowFileDetails] = useState(false);

  const lastQueryRef = useRef<{ query: string; options?: { detailed_analysis?: boolean } } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize chat session when documents are loaded
  useEffect(() => {
    if (pageState.isInitialized && pageState.documents.length > 0 && !currentSession) {
      const session: ChatSession = {
        id: excelApiService.generateSessionId(),
        documents: pageState.documents,
        messages: [],
        created_at: new Date(),
        last_activity: new Date(),
      };

      setCurrentSession(session);

      // Add welcome message
      const welcomeMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        type: 'assistant',
        content: `Hello! I'm ready to help you analyze your ${pageState.documents.length === 1 ? 'spreadsheet' : 'spreadsheets'}:\n\n${pageState.documents.map(doc => `📊 ${doc.name} (${fileUtils.getSpreadsheetFormat(doc)})`).join('\n')}\n\nAsk me anything about your data - I can help with calculations, trends, summaries, and more!`,
        timestamp: new Date(),
      };

      setMessages([welcomeMessage]);

      console.log('✅ Excel chat session initialized:', {
        sessionId: session.id,
        documentCount: pageState.documents.length,
      });
    }
  }, [pageState.isInitialized, pageState.documents, currentSession]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-focus textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (!currentSession || !pageState.documents.length) {
      toast.error('No active Excel chat session');
      return;
    }

    if (!query.trim()) {
      toast.error('Please enter a question');
      return;
    }

    setIsLoading(true);
    setError(null);

    lastQueryRef.current = { query, options: { detailed_analysis: detailedAnalysis } };

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      type: 'user',
      content: query.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const queryToSend = query.trim();
    setQuery('');

    try {
      console.log('📊 Sending Excel chat query:', {
        sessionId: currentSession.id,
        query: queryToSend.substring(0, 100) + (queryToSend.length > 100 ? '...' : ''),
        documentCount: pageState.documents.length,
      });

      const response = await excelApiService.chat(
        pageState.documents,
        queryToSend,
        currentSession.id,
        {
          detailed_analysis: detailedAnalysis,
          timeout: API_OPERATION_TIMEOUTS.EXCEL_ANALYSIS,
          max_results: 100
        }
      );

      if (!response || typeof response !== 'object') {
        throw new Error(`Invalid response from Sheets agent: ${typeof response}`);
      }

      const isSuccessResponse = response.success === true;
      const isErrorResponse = response.success === false || !!response.error;

      if (isSuccessResponse && !isErrorResponse) {
        const rawContent = response.response ||
          response.message ||
          'Analysis completed successfully, but no detailed response was provided.';

        const responseContent = parseApiResponse(rawContent);

        const assistantMessage: ChatMessage = {
          id: `msg-${Date.now()}-assistant`,
          type: 'assistant',
          content: responseContent,
          timestamp: new Date(),
          metadata: {
            files_processed: response.files_processed,
            processing_time_ms: response.processing_time_ms,
            token_usage: response.token_usage,
            tools_used: response.tools_used,
          }
        };

        setMessages(prev => [...prev, assistantMessage]);

        setCurrentSession(prev => prev ? {
          ...prev,
          messages: [...prev.messages, userMessage, assistantMessage],
          last_activity: new Date(),
        } : null);

        console.log('✅ Sheets analysis response received:', {
          responseLength: responseContent.length,
          processingTimeMs: response.processing_time_ms,
        });

      } else if (isErrorResponse) {
        const errorMessage = response.error || response.message || 'Failed to analyze spreadsheet data';
        throw new Error(errorMessage);
      } else {
        if (response.response || response.message) {
          const rawFallback = (response.response || response.message) as string;
          const fallbackContent = parseApiResponse(rawFallback);

          const assistantMessage: ChatMessage = {
            id: `msg-${Date.now()}-assistant`,
            type: 'assistant',
            content: fallbackContent,
            timestamp: new Date(),
            metadata: {
              files_processed: response.files_processed,
              processing_time_ms: response.processing_time_ms,
              token_usage: response.token_usage,
              tools_used: response.tools_used,
            }
          };

          setMessages(prev => [...prev, assistantMessage]);
          toast('Response received with unexpected format, but content was extracted', { icon: '⚠️' });
          return;
        }

        throw new Error(
          `Unexpected response format from Sheets agent. Success: "${response.success}", Available keys: ${Object.keys(response).join(', ')}`
        );
      }

    } catch (err) {
      console.error('Excel chat error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze spreadsheet data';

      setError(errorMessage);

      const errorChatMessage: ChatMessage = {
        id: `msg-${Date.now()}-error`,
        type: 'assistant',
        content: `I apologize, but I encountered an error while analyzing your data:\n\n${errorMessage}\n\nPlease try again or rephrase your question.`,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorChatMessage]);
      toast.error(`Excel analysis failed: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [currentSession, pageState.documents, query, detailedAnalysis]);

  const handleRetryLastMessage = useCallback(async () => {
    if (!lastQueryRef.current) {
      toast.error('No previous message to retry');
      return;
    }

    setQuery(lastQueryRef.current.query);
    setDetailedAnalysis(lastQueryRef.current.options?.detailed_analysis || false);
  }, []);

  const handleClearChat = useCallback(() => {
    if (!currentSession) return;

    setMessages(prevMessages => {
      const welcomeMessage = prevMessages.find(
        msg => msg.type === 'assistant' && msg.content.includes('ready to help')
      );
      return welcomeMessage ? [welcomeMessage] : [];
    });

    setError(null);
    lastQueryRef.current = null;

    setCurrentSession(prev => prev ? {
      ...prev,
      messages: [],
      last_activity: new Date(),
    } : null);

    toast.success('Chat history cleared');
  }, [currentSession]);

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
          'rounded-lg px-4 py-3 shadow-sm',
          isUser
            ? 'max-w-[80%] bg-brand-coral-500 text-white'
            : hasTable
              ? 'max-w-[95%] bg-white dark:bg-brand-navy-600 border border-gray-200 dark:border-brand-navy-500 text-gray-900 dark:text-gray-100'
              : 'max-w-[80%] bg-white dark:bg-brand-navy-600 border border-gray-200 dark:border-brand-navy-500 text-gray-900 dark:text-gray-100'
        )}>
          <MessageContent content={message.content} isUser={isUser} />

          {/* Message metadata for assistant messages */}
          {!isUser && message.metadata && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-brand-navy-500">
              <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
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

              {/* Detailed file info */}
              {message.metadata.files_processed && showFileDetails && (
                <div className="mt-2 space-y-1">
                  {message.metadata.files_processed.map((file: { file_path: string; rows?: number; columns?: number; column_names?: string[] }, idx: number) => (
                    <div key={idx} className="text-xs bg-gray-100 dark:bg-brand-navy-700 rounded px-2 py-1">
                      <div className="font-medium text-gray-900 dark:text-white">{file.file_path.split('/').pop()}</div>
                      <div className="text-gray-600 dark:text-gray-400">
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

  // Render error state
  if (pageState.initError || !pageState.documents.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50 dark:bg-brand-navy-700">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Error Loading Excel Chat
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
        <p className="text-gray-600 dark:text-gray-400">Loading Excel chat...</p>
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
                <ChartBarIcon className="w-8 h-8 text-green-600" />
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Excel Analysis Chat
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {pageState.documents.length === 1
                      ? `Analyzing ${pageState.documents[0].name}`
                      : `Analyzing ${pageState.documents.length} spreadsheets`
                    }
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
                title="Toggle file details"
              >
                <InformationCircleIcon className="w-4 h-4" />
              </Button>
              {messages.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearChat}
                  className="p-2 text-red-600 hover:text-red-800"
                  title="Clear chat"
                >
                  <TrashIcon className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* File information */}
          {showFileDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-gray-100 dark:border-brand-navy-500"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pageState.documents.map((doc, idx) => (
                  <div key={idx} className="bg-gray-50 dark:bg-brand-navy-700 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <DocumentTextIcon className={clsx(
                        'w-5 h-5',
                        fileUtils.getSpreadsheetIconClass(doc)
                      )} />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {doc.name}
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {fileUtils.getFileTypeDisplayName(doc)} • {fileUtils.formatFileSize(doc.size)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
      </header>

      {/* Chat messages - scrollable */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
        <div>
          {messages.length === 0 && !isLoading && (
            <div className="h-full flex flex-col items-start justify-start text-left py-8">
              <TableCellsIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Ready to Analyze Your Data
              </h4>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Ask me anything about your spreadsheet data. I can help with calculations, trends, and insights.
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

          {messages.map(renderMessage)}

          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start mb-4"
            >
              <div className="bg-white dark:bg-brand-navy-600 border border-gray-200 dark:border-brand-navy-500 rounded-lg px-4 py-3 shadow-sm">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-coral-500"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Analyzing your data...
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="px-4 sm:px-6 pb-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <InformationCircleIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetryLastMessage}
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
                placeholder="Ask me anything about your spreadsheet data..."
                className="w-full resize-none rounded-lg border border-gray-300 dark:border-brand-navy-500 dark:bg-brand-navy-700 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-brand-coral-500 focus:border-transparent"
                rows={2}
                disabled={isLoading}
              />

              <div className="flex items-center justify-between mt-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={detailedAnalysis}
                    onChange={(e) => setDetailedAnalysis(e.target.checked)}
                    className="rounded border-gray-300 dark:border-brand-navy-500 text-brand-coral-500 focus:ring-brand-coral-500"
                  />
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Detailed analysis
                  </span>
                </label>

                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Press Shift+Enter for new line
                </div>
              </div>
            </div>

            <Button
              onClick={handleSendMessage}
              disabled={!query.trim() || isLoading}
              className="px-4 py-2 bg-brand-coral-500 hover:bg-brand-coral-600"
            >
              <PaperAirplaneIcon className="w-4 h-4" />
            </Button>
          </div>
      </div>
    </div>
  );
}
