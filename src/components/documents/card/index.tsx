'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import CountSelector from '@/components/ui/CountSelector';
import {
  CheckCircleIcon,
  ArrowPathIcon,
  SparklesIcon,
  QuestionMarkCircleIcon,
  AcademicCapIcon,
  ChatBubbleLeftIcon,
  TableCellsIcon,
  EllipsisVerticalIcon,
} from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';
import { clsx } from 'clsx';
import { formatDistanceToNow } from 'date-fns';
import { getFileTypeInfo, formatFileSize } from '@/lib/file-types';
import {
  isDocumentParsed,
  isDocumentSummarized,
  isDocumentFAQGenerated,
  isDocumentQuestionsGenerated,
  canPerformAIOperations,
  getEffectiveDocumentStatus,
} from '@/lib/document-utils';

import { DocumentCardProps, getStatusInfo } from './types';
import { FileIcon, StatusBadge, FeatureBadges } from './shared';
import { DocumentCardActions } from './DocumentCardActions';

// Re-export types
export type { DocumentCardProps, ProcessingState } from './types';

export default function DocumentCard({
  document,
  selected = false,
  isHighlighted = false,
  onSelectionChange,
  onView,
  onDownload,
  onDelete,
  onParse,
  onLoadParsed,
  onSummarize,
  onFaq,
  onQuestions,
  onChat,
  onAnalyse,
  onExtract,
  isProcessing = {},
  viewMode = 'grid',
  className,
}: DocumentCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showFaqCountSelector, setShowFaqCountSelector] = useState(false);
  const [showQuestionsCountSelector, setShowQuestionsCountSelector] = useState(false);
  const faqButtonRef = useRef<HTMLButtonElement>(null);
  const questionsButtonRef = useRef<HTMLButtonElement>(null);

  const fileInfo = getFileTypeInfo(document.name, document.type);
  const effectiveStatus = getEffectiveDocumentStatus(
    document,
    isProcessing.parsing ? new Set([document.id]) : new Set()
  );
  const statusInfo = getStatusInfo(effectiveStatus, isProcessing.parsing);

  const handleSelectionToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isDocumentParsed(document)) {
      onSelectionChange?.(!selected);
    }
  };

  const handleFaqClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    faqButtonRef.current = e.currentTarget;
    setShowFaqCountSelector(true);
  };

  const handleQuestionsClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    questionsButtonRef.current = e.currentTarget;
    setShowQuestionsCountSelector(true);
  };

  // Dialogs and selectors (shared between all view modes)
  const renderDialogs = () => (
    <>
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          onDelete?.();
          setShowDeleteConfirm(false);
        }}
        title="Delete Document"
        message={`Are you sure you want to delete "${document.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
      <CountSelector
        isOpen={showFaqCountSelector}
        onClose={() => setShowFaqCountSelector(false)}
        onSelect={(count) => {
          onFaq?.(count);
          setShowFaqCountSelector(false);
        }}
        type="faq"
        currentCount={10}
        presets={[5, 10, 15, 20]}
        anchorEl={faqButtonRef.current}
      />
      <CountSelector
        isOpen={showQuestionsCountSelector}
        onClose={() => setShowQuestionsCountSelector(false)}
        onSelect={(count) => {
          onQuestions?.(count);
          setShowQuestionsCountSelector(false);
        }}
        type="questions"
        currentCount={10}
        presets={[5, 10, 15, 20]}
        anchorEl={questionsButtonRef.current}
      />
    </>
  );

  // List View
  if (viewMode === 'list') {
    return (
      <>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={clsx(
            'flex items-center space-x-4 p-4 rounded-lg border transition-all duration-200',
            'bg-white dark:bg-secondary-800',
            'hover:border-secondary-300 dark:hover:border-secondary-600',
            selected &&
              'border-primary-300 dark:border-primary-600 bg-primary-50 dark:bg-primary-900/20',
            isHighlighted &&
              !selected &&
              'ring-2 ring-primary-500 dark:ring-primary-400 border-primary-400 dark:border-primary-500 shadow-lg shadow-primary-100 dark:shadow-primary-900/30',
            !selected && !isHighlighted && 'border-secondary-200 dark:border-secondary-700',
            className
          )}
        >
          {onSelectionChange && (
            <div className="flex-shrink-0">
              <button
                onClick={handleSelectionToggle}
                disabled={!isDocumentParsed(document)}
                className={clsx(
                  'relative w-5 h-5 rounded border-2 transition-all duration-200',
                  selected
                    ? 'bg-primary-500 border-primary-500'
                    : 'border-gray-300 hover:border-gray-400',
                  !isDocumentParsed(document) && 'opacity-50 cursor-not-allowed'
                )}
              >
                {selected && <CheckIcon className="w-3 h-3 text-white absolute inset-0.5" />}
              </button>
            </div>
          )}

          <div className="flex-shrink-0">
            <FileIcon document={document} viewMode={viewMode} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-medium text-secondary-900 dark:text-secondary-100 truncate">
                {document.name}
              </h3>
              <span className="text-xs text-secondary-500 dark:text-secondary-400 bg-secondary-100 dark:bg-secondary-700 px-1.5 py-0.5 rounded">
                {fileInfo.displayName}
              </span>
            </div>
            <div className="flex items-center space-x-4 mt-1 text-xs text-secondary-500 dark:text-secondary-400">
              <span>{formatFileSize(document.size || 0)}</span>
              {document.folder_name && <span className="truncate">📁 {document.folder_name}</span>}
              {document.uploaded_at && (
                <span>
                  {formatDistanceToNow(new Date(document.uploaded_at), { addSuffix: true })}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <FeatureBadges document={document} viewMode={viewMode} />
            <StatusBadge statusInfo={statusInfo} />
          </div>

          {/* List view inline actions */}
          <div className="flex items-center space-x-1">
            {onParse && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onParse();
                }}
                disabled={isProcessing.parsing}
                className={clsx(
                  'p-1.5 rounded hover:bg-gray-100 transition-colors',
                  isProcessing.parsing && 'opacity-50 cursor-not-allowed'
                )}
                title={isProcessing.parsing ? 'Parsing...' : 'Parse document'}
              >
                {isProcessing.parsing ? (
                  <ArrowPathIcon className="w-4 h-4 text-gray-400 animate-spin" />
                ) : (
                  <CheckCircleIcon
                    className={clsx(
                      'w-4 h-4',
                      isDocumentParsed(document) ? 'text-green-500' : 'text-blue-500'
                    )}
                  />
                )}
              </button>
            )}

            {onSummarize && isDocumentParsed(document) && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onSummarize();
                }}
                disabled={isProcessing.summarizing}
                className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                title="Summarize"
              >
                <SparklesIcon
                  className={clsx(
                    'w-4 h-4',
                    isDocumentSummarized(document) ? 'text-green-500' : 'text-purple-500'
                  )}
                />
              </button>
            )}

            {onFaq && isDocumentParsed(document) && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleFaqClick(e);
                }}
                disabled={isProcessing.faqGenerating}
                className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                title="Generate FAQ"
              >
                <QuestionMarkCircleIcon
                  className={clsx(
                    'w-4 h-4',
                    isDocumentFAQGenerated(document) ? 'text-green-500' : 'text-blue-500'
                  )}
                />
              </button>
            )}

            {onQuestions && isDocumentParsed(document) && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleQuestionsClick(e);
                }}
                disabled={isProcessing.questionsGenerating}
                className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                title="Generate Questions"
              >
                <AcademicCapIcon
                  className={clsx(
                    'w-4 h-4',
                    isDocumentQuestionsGenerated(document) ? 'text-green-500' : 'text-emerald-500'
                  )}
                />
              </button>
            )}

            {onChat && canPerformAIOperations(document) && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onChat();
                }}
                className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                title="Chat"
              >
                <ChatBubbleLeftIcon className="w-4 h-4 text-indigo-500" />
              </button>
            )}

            {onExtract && isDocumentParsed(document) && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onExtract();
                }}
                disabled={isProcessing.extracting}
                className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                title="Extract data"
              >
                <TableCellsIcon className="w-4 h-4 text-orange-500" />
              </button>
            )}

            {(onView || onDownload || onDelete) && (
              <button
                className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                title="More actions"
              >
                <EllipsisVerticalIcon className="w-4 h-4 text-gray-500" />
              </button>
            )}
          </div>
        </motion.div>
        {renderDialogs()}
      </>
    );
  }

  // Grid View (default)
  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ y: -2 }}
        className={clsx(
          'relative group rounded-xl border transition-all duration-200',
          'bg-white dark:bg-secondary-800',
          'hover:border-secondary-300 dark:hover:border-secondary-600',
          'hover:shadow-lg dark:hover:shadow-dark-medium',
          selected &&
            'border-primary-300 dark:border-primary-600 bg-primary-50 dark:bg-primary-900/20 shadow-md',
          isHighlighted &&
            !selected &&
            'ring-2 ring-primary-500 dark:ring-primary-400 border-primary-400 dark:border-primary-500 shadow-lg shadow-primary-100 dark:shadow-primary-900/30',
          !selected && 'border-secondary-200 dark:border-secondary-700',
          viewMode === 'grid' ? 'p-6' : 'p-4',
          className
        )}
      >
        {/* Selection checkbox */}
        {onSelectionChange && (
          <div className="absolute top-3 left-3 z-10">
            <button
              onClick={handleSelectionToggle}
              disabled={!isDocumentParsed(document)}
              className={clsx(
                'relative w-5 h-5 rounded border-2 transition-all duration-200',
                'hover:scale-110',
                selected
                  ? 'bg-primary-500 border-primary-500'
                  : 'border-gray-300 hover:border-gray-400 group-hover:opacity-100',
                !isDocumentParsed(document) ? 'opacity-50 cursor-not-allowed' : 'opacity-0'
              )}
            >
              {selected && <CheckIcon className="w-3 h-3 text-white absolute inset-0.5" />}
            </button>
          </div>
        )}

        {/* File icon and status */}
        <div className="flex items-start justify-between mb-4">
          <FileIcon document={document} viewMode={viewMode} />
          <StatusBadge statusInfo={statusInfo} />
        </div>

        {/* File name and type */}
        <div className="mb-3">
          <h3 className="font-medium text-secondary-900 dark:text-secondary-100 mb-1 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            {document.name}
          </h3>
          <div className="flex items-center space-x-2">
            <span
              className={clsx(
                'inline-flex items-center px-2 py-1 rounded-md text-xs font-medium',
                fileInfo.bgColor.replace('border-', 'border ')
              )}
            >
              <span className={fileInfo.color}>{fileInfo.displayName}</span>
            </span>
            {document.size && (
              <span className="text-xs text-secondary-500 dark:text-secondary-400">
                {formatFileSize(document.size)}
              </span>
            )}
          </div>
        </div>

        {/* Metadata */}
        <div className="space-y-1 text-xs text-secondary-500 dark:text-secondary-400 mb-4">
          {document.folder_name && (
            <div className="flex items-center space-x-1">
              <span>📁</span>
              <span className="truncate">{document.folder_name}</span>
            </div>
          )}
          {document.uploaded_at && (
            <div>
              {formatDistanceToNow(new Date(document.uploaded_at), { addSuffix: true })}
            </div>
          )}
        </div>

        {/* Actions */}
        {viewMode !== 'compact' && (
          <DocumentCardActions
            document={document}
            isProcessing={isProcessing}
            onParse={onParse}
            onLoadParsed={onLoadParsed}
            onSummarize={onSummarize}
            onFaq={onFaq ? handleFaqClick : undefined}
            onQuestions={onQuestions ? handleQuestionsClick : undefined}
            onChat={onChat}
            onAnalyse={onAnalyse}
            onExtract={onExtract}
            onView={onView}
            onDownload={onDownload}
            onDelete={onDelete ? () => setShowDeleteConfirm(true) : undefined}
          />
        )}
      </motion.div>
      {renderDialogs()}
    </>
  );
}
