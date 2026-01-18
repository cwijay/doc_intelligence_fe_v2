'use client';

import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ChatBubbleBottomCenterTextIcon,
  DocumentTextIcon,
  ClockIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { RagMessage } from '@/types/rag';
import { formatDistanceToNow } from 'date-fns';
import { clsx } from 'clsx';

interface DashboardChatMessagesProps {
  messages: RagMessage[];
  isLoading: boolean;
  isStreaming: boolean;
  streamingStatus: string | null;
  error: string | null;
  onSuggestedQuery?: (query: string) => void;
}

const SUGGESTED_QUERIES = [
  "What are the key topics across my documents?",
  "Summarize the most recent documents",
  "What action items are mentioned?",
  "Find important deadlines or dates",
];

export default function DashboardChatMessages({
  messages,
  isLoading,
  isStreaming,
  streamingStatus,
  error,
  onSuggestedQuery,
}: DashboardChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Format message content with basic markdown
  const formatContent = (content: string) => {
    return content
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-secondary-100 dark:bg-secondary-700 px-1 rounded text-xs">$1</code>');
  };

  // Render a single message
  const renderMessage = (message: RagMessage) => {
    const isUser = message.type === 'user';

    return (
      <motion.div
        key={message.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={clsx('flex mb-3', isUser ? 'justify-end' : 'justify-start')}
      >
        <div
          className={clsx(
            'max-w-[85%] rounded-lg px-3 py-2 shadow-sm',
            isUser
              ? 'bg-primary-600 text-white'
              : 'bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 text-secondary-900 dark:text-secondary-100'
          )}
        >
          <div
            className="prose prose-sm dark:prose-invert max-w-none text-sm"
            dangerouslySetInnerHTML={{
              __html: `<p>${formatContent(message.content)}</p>`,
            }}
          />

          {/* Citations for assistant messages */}
          {!isUser && message.citations && message.citations.length > 0 && (
            <div className="mt-2 pt-2 border-t border-secondary-200 dark:border-secondary-600">
              <div className="flex items-center gap-1 text-xs font-medium text-secondary-600 dark:text-secondary-400 mb-1.5">
                <DocumentTextIcon className="w-3 h-3" />
                Sources ({message.citations.length})
              </div>
              <div className="flex flex-wrap gap-1">
                {message.citations.slice(0, 3).map((citation, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-secondary-100 dark:bg-secondary-700 text-secondary-700 dark:text-secondary-300"
                    title={citation.text}
                  >
                    <DocumentTextIcon className="w-2.5 h-2.5" />
                    <span className="max-w-[80px] truncate">{citation.file}</span>
                    <span className="text-secondary-500">
                      {Math.round(citation.relevance_score * 100)}%
                    </span>
                  </span>
                ))}
                {message.citations.length > 3 && (
                  <span className="text-[10px] text-secondary-500">
                    +{message.citations.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Metadata for assistant messages */}
          {!isUser && message.metadata && (
            <div className="flex items-center gap-3 mt-2 pt-1 text-[10px] text-secondary-500 dark:text-secondary-400">
              {message.metadata.processing_time && (
                <span className="flex items-center gap-0.5">
                  <ClockIcon className="w-2.5 h-2.5" />
                  {message.metadata.processing_time.toFixed(1)}s
                </span>
              )}
              {message.metadata.sources_count && (
                <span>{message.metadata.sources_count} sources</span>
              )}
            </div>
          )}

          <div className="text-[10px] opacity-60 mt-1">
            {formatDistanceToNow(message.timestamp, { addSuffix: true })}
          </div>
        </div>
      </motion.div>
    );
  };

  // Empty state with suggested queries
  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-4 px-2 text-center">
        <SparklesIcon className="w-10 h-10 text-secondary-300 dark:text-secondary-600 mb-2" />
        <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-3">
          Ask anything about your documents
        </p>
        <div className="space-y-1.5 w-full">
          {SUGGESTED_QUERIES.map((query, idx) => (
            <button
              key={idx}
              onClick={() => onSuggestedQuery?.(query)}
              className={clsx(
                'w-full text-left px-3 py-2 text-xs rounded-lg transition-colors',
                'bg-secondary-50 dark:bg-secondary-800/50 hover:bg-secondary-100 dark:hover:bg-secondary-700',
                'text-secondary-700 dark:text-secondary-300'
              )}
            >
              {query}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto px-2 py-3">
      {messages.map(renderMessage)}

      {/* Streaming/Loading indicator */}
      {(isLoading || isStreaming) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-start mb-3"
        >
          <div className="bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-lg px-3 py-2 shadow-sm">
            <div className="flex items-center gap-2">
              {isStreaming ? (
                <>
                  <div className="flex space-x-0.5">
                    <div
                      className="w-1.5 h-1.5 bg-primary-600 rounded-full animate-bounce"
                      style={{ animationDelay: '0ms' }}
                    />
                    <div
                      className="w-1.5 h-1.5 bg-primary-600 rounded-full animate-bounce"
                      style={{ animationDelay: '150ms' }}
                    />
                    <div
                      className="w-1.5 h-1.5 bg-primary-600 rounded-full animate-bounce"
                      style={{ animationDelay: '300ms' }}
                    />
                  </div>
                  <span className="text-xs text-secondary-600 dark:text-secondary-400">
                    {streamingStatus || 'Generating...'}
                  </span>
                </>
              ) : (
                <>
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-primary-600" />
                  <span className="text-xs text-secondary-600 dark:text-secondary-400">
                    Searching documents...
                  </span>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Error display */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-error-50 dark:bg-error-900/30 border border-error-200 dark:border-error-800 rounded-lg p-2 mb-3"
        >
          <p className="text-xs text-error-700 dark:text-error-300">{error}</p>
        </motion.div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
