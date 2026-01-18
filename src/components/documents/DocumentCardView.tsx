'use client';

import { useState, useRef, useEffect } from 'react';
import { useDocumentSelection } from '@/hooks/useDocumentSelection';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DocumentTextIcon,
  TrashIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  CpuChipIcon,
  QuestionMarkCircleIcon,
  ChatBubbleLeftIcon,
  ChartBarIcon,
  AcademicCapIcon,
  ChevronDownIcon,
  SparklesIcon,
  ArrowPathIcon,
  CloudArrowDownIcon,
  FolderIcon,
  ClockIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline';
import { Document, DocumentStatus } from '@/types/api';
import Button from '@/components/ui/Button';
import { formatFileSize, getFileTypeInfo } from '@/lib/file-types';
import CountSelector from '@/components/ui/CountSelector';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import DocumentContentModal from './DocumentContentModal';
import { formatDistanceToNow } from 'date-fns';
import { clsx } from 'clsx';
import {
  getGenerationCount,
  setGenerationCount,
  addToRecentCounts,
  getRecentCounts
} from '@/lib/generation-preferences';
import {
  canPerformAIOperations,
  getEffectiveDocumentStatus,
  canPerformSummaryOperations,
  isDocumentSummarized,
  canPerformFAQOperations,
  isDocumentFAQGenerated,
  canPerformQuestionsOperations,
  isDocumentQuestionsGenerated,
  isDocumentParsed
} from '@/lib/document-utils';
import { isSpreadsheetFile } from '@/lib/file-utils';

interface DocumentCardViewProps {
  documents: Document[];
  loading?: boolean;
  error?: string | null;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onRefresh?: () => void;
  onView?: (document: Document) => void;
  onDownload?: (document: Document) => void;
  onDelete?: (document: Document) => void;
  onRename?: (document: Document) => void;
  onParse?: (document: Document) => void;
  onLoadParsed?: (document: Document) => void;
  onSummarize?: (document: Document) => void;
  onFaq?: (document: Document, count?: number) => void;
  onQuestions?: (document: Document, count?: number) => void;
  onChat?: (document: Document) => void;
  onAnalyse?: (document: Document) => void;
  parsingDocuments?: Set<string>;
  loadingParsedDocuments?: Set<string>;
  summarizingDocuments?: Set<string>;
  faqGeneratingDocuments?: Set<string>;
  questionsGeneratingDocuments?: Set<string>;
  renamingDocuments?: Set<string>;
  className?: string;
  selectedDocuments?: Set<string>;
  onSelectionChange?: (selectedIds: Set<string>) => void;
  enableSelection?: boolean;
  highlightedDocumentId?: string | null;
}

// Brand color scheme status configuration
const getStatusInfo = (status: DocumentStatus) => {
  const statusConfig: Record<DocumentStatus, { color: string; bgColor: string; label: string }> = {
    'uploaded': { color: 'text-brand-coral-600', bgColor: 'bg-brand-coral-100 dark:bg-brand-coral-900/30', label: 'Uploaded' },
    'processing': { color: 'text-brand-cyan-600', bgColor: 'bg-brand-cyan-100 dark:bg-brand-cyan-900/30', label: 'Processing' },
    'processed': { color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30', label: 'Processed' },
    'parsed': { color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30', label: 'Parsed' },
    'error': { color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30', label: 'Error' },
    'failed': { color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30', label: 'Failed' },
  };

  return statusConfig[status] || { color: 'text-brand-navy-600', bgColor: 'bg-brand-navy-100 dark:bg-brand-navy-900/30', label: status };
};

// Get brand-colored background for file icon based on category
const getBrandIconStyle = (category: string) => {
  const categoryStyles: Record<string, { bgColor: string; iconColor: string }> = {
    'document': { bgColor: 'bg-brand-navy-100 dark:bg-brand-navy-800', iconColor: 'text-brand-navy-600 dark:text-brand-navy-300' },
    'spreadsheet': { bgColor: 'bg-green-100 dark:bg-green-800', iconColor: 'text-green-600 dark:text-green-300' },
    'presentation': { bgColor: 'bg-brand-coral-100 dark:bg-brand-coral-800', iconColor: 'text-brand-coral-600 dark:text-brand-coral-300' },
    'image': { bgColor: 'bg-brand-coral-100 dark:bg-brand-coral-800', iconColor: 'text-brand-coral-600 dark:text-brand-coral-300' },
    'video': { bgColor: 'bg-brand-navy-100 dark:bg-brand-navy-800', iconColor: 'text-brand-navy-600 dark:text-brand-navy-300' },
    'audio': { bgColor: 'bg-brand-cyan-100 dark:bg-brand-cyan-800', iconColor: 'text-brand-cyan-600 dark:text-brand-cyan-300' },
    'code': { bgColor: 'bg-brand-cyan-100 dark:bg-brand-cyan-800', iconColor: 'text-brand-cyan-600 dark:text-brand-cyan-300' },
    'archive': { bgColor: 'bg-brand-navy-100 dark:bg-brand-navy-800', iconColor: 'text-brand-navy-600 dark:text-brand-navy-300' },
    'other': { bgColor: 'bg-brand-cyan-100 dark:bg-brand-cyan-800', iconColor: 'text-brand-cyan-600 dark:text-brand-cyan-300' },
  };

  return categoryStyles[category] || categoryStyles['other'];
};

// Action button component for cards
interface ActionButtonProps {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  isProcessing?: boolean;
  isCompleted?: boolean;
  colorClass?: string;
  count?: number;
  hasDropdown?: boolean;
  onDropdownClick?: () => void;
}

const ActionButton = ({
  icon: Icon,
  label,
  onClick,
  disabled,
  isProcessing,
  isCompleted,
  colorClass = 'text-secondary-500 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-200',
  count,
  hasDropdown,
  onDropdownClick
}: ActionButtonProps) => (
  <div className={clsx("inline-flex items-center", hasDropdown && "border border-secondary-200 dark:border-secondary-700 rounded-md")}>
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      disabled={disabled}
      className={clsx(
        'p-1.5 rounded-md transition-all duration-150',
        !hasDropdown && 'hover:bg-secondary-100 dark:hover:bg-secondary-700',
        hasDropdown && 'hover:bg-secondary-50 dark:hover:bg-secondary-800 rounded-r-none border-r border-secondary-200 dark:border-secondary-700',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1',
        disabled && 'opacity-40 cursor-not-allowed hover:bg-transparent',
        !disabled && colorClass,
        isCompleted && 'text-green-500 dark:text-green-400'
      )}
      title={label}
    >
      <div className="flex items-center">
        <Icon className={clsx(
          'w-4 h-4',
          isProcessing && 'animate-spin'
        )} />
        {count !== undefined && (
          <span className="ml-1 text-xs font-medium">{count}</span>
        )}
      </div>
    </button>
    {hasDropdown && onDropdownClick && (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDropdownClick();
        }}
        disabled={disabled}
        className={clsx(
          'px-1 py-1.5 hover:bg-secondary-50 dark:hover:bg-secondary-800 rounded-r-md transition-colors',
          disabled && 'opacity-40 cursor-not-allowed'
        )}
        title="Choose count"
      >
        <ChevronDownIcon className="w-3 h-3" />
      </button>
    )}
  </div>
);

export default function DocumentCardView({
  documents,
  loading = false,
  error = null,
  searchTerm,
  onSearchChange,
  onRefresh,
  onView,
  onDownload,
  onDelete,
  onRename,
  onParse,
  onLoadParsed,
  onSummarize,
  onFaq,
  onQuestions,
  onChat,
  onAnalyse,
  parsingDocuments = new Set(),
  loadingParsedDocuments = new Set(),
  summarizingDocuments = new Set(),
  faqGeneratingDocuments = new Set(),
  questionsGeneratingDocuments = new Set(),
  renamingDocuments = new Set(),
  className,
  selectedDocuments = new Set(),
  onSelectionChange,
  enableSelection = false,
  highlightedDocumentId,
}: DocumentCardViewProps) {
  const [faqSelectorOpen, setFaqSelectorOpen] = useState<string | null>(null);
  const [questionsSelectorOpen, setQuestionsSelectorOpen] = useState<string | null>(null);
  const [faqCounts, setFaqCounts] = useState<Record<string, number>>({});
  const [questionsCounts, setQuestionsCounts] = useState<Record<string, number>>({});
  const [deletingDocument, setDeletingDocument] = useState<Document | null>(null);
  const [selectedDocumentForModal, setSelectedDocumentForModal] = useState<Document | null>(null);
  const faqButtonRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const questionsButtonRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (documents.length > 0) {
      const faqDefaults: Record<string, number> = {};
      const questionsDefaults: Record<string, number> = {};

      documents.forEach(doc => {
        faqDefaults[doc.id] = getGenerationCount('faq', doc.type);
        questionsDefaults[doc.id] = getGenerationCount('questions', doc.type);
      });

      setFaqCounts(faqDefaults);
      setQuestionsCounts(questionsDefaults);
    }
  }, [documents]);

  // Use shared selection hook
  const {
    handleSelectAll,
    handleSelectDocument,
    isAllSelected,
    isIndeterminate,
    selectableDocuments: parsedDocuments,
  } = useDocumentSelection({
    documents,
    selectedDocuments,
    onSelectionChange,
    enableSelection,
    requireParsed: true,
  });

  const handleFaqGenerate = (document: Document, count?: number) => {
    const finalCount = count || faqCounts[document.id] || 10;
    setGenerationCount('faq', finalCount, document.type);
    addToRecentCounts('faq', finalCount);
    setFaqCounts(prev => ({ ...prev, [document.id]: finalCount }));

    if (onFaq) {
      onFaq(document, finalCount);
    }
    setFaqSelectorOpen(null);
  };

  const handleQuestionsGenerate = (document: Document, count?: number) => {
    const finalCount = count || questionsCounts[document.id] || 10;
    setGenerationCount('questions', finalCount, document.type);
    addToRecentCounts('questions', finalCount);
    setQuestionsCounts(prev => ({ ...prev, [document.id]: finalCount }));

    if (onQuestions) {
      onQuestions(document, finalCount);
    }
    setQuestionsSelectorOpen(null);
  };

  if (loading) {
    return (
      <div className={clsx("flex items-center justify-center h-64", className)}>
        <div className="text-center">
          <ArrowPathIcon className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-sm text-secondary-500 dark:text-secondary-400">Loading documents...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={clsx("flex items-center justify-center h-64", className)}>
        <div className="text-center">
          <ExclamationCircleIcon className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-sm font-medium text-secondary-900 dark:text-secondary-100 mb-2">Failed to load documents</h3>
          <p className="text-sm text-secondary-500 dark:text-secondary-400 mb-4">{error}</p>
          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh}>
              Try Again
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className={clsx("flex items-center justify-center h-64", className)}>
        <div className="text-center">
          <DocumentTextIcon className="w-12 h-12 text-secondary-300 dark:text-secondary-600 mx-auto mb-4" />
          <h3 className="text-sm font-medium text-secondary-900 dark:text-secondary-100 mb-2">
            {searchTerm ? 'No documents match your search' : 'No documents found'}
          </h3>
          <p className="text-sm text-secondary-500 dark:text-secondary-400">
            {searchTerm ? 'Try adjusting your search criteria' : 'Upload documents to get started'}
          </p>
          {searchTerm && (
            <Button variant="outline" size="sm" className="mt-4" onClick={() => onSearchChange('')}>
              Clear Search
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={clsx("w-full space-y-4", className)}>
      {/* Select All Header */}
      {enableSelection && (
        <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-secondary-800 rounded-lg border border-secondary-200 dark:border-secondary-700">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isAllSelected}
              ref={(el) => {
                if (el) el.indeterminate = isIndeterminate;
              }}
              onChange={handleSelectAll}
              disabled={parsedDocuments.length === 0}
              className={clsx(
                "h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 dark:border-secondary-600 rounded",
                parsedDocuments.length > 0 ? "cursor-pointer" : "cursor-not-allowed opacity-50"
              )}
            />
            <span className="text-sm text-secondary-600 dark:text-secondary-400">
              Select all parsed documents ({parsedDocuments.length})
            </span>
          </label>
          {selectedDocuments.size > 0 && (
            <span className="text-sm text-primary-600 dark:text-primary-400 font-medium">
              {selectedDocuments.size} selected
            </span>
          )}
        </div>
      )}

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {documents.map((document, index) => {
            const isParsing = parsingDocuments.has(document.id);
            const isLoadingParsed = loadingParsedDocuments.has(document.id);
            const isParsed = isDocumentParsed(document);
            const isSummarizing = summarizingDocuments.has(document.id);
            const isFaqGenerating = faqGeneratingDocuments.has(document.id);
            const isQuestionsGenerating = questionsGeneratingDocuments.has(document.id);
            const isHighlighted = highlightedDocumentId === document.id;
            const isSelected = selectedDocuments.has(document.id);
            const effectiveStatus = getEffectiveDocumentStatus(document, parsingDocuments);
            const statusInfo = getStatusInfo(effectiveStatus);
            const fileInfo = getFileTypeInfo(document.name, document.type);
            const FileIcon = fileInfo.icon;
            const brandIconStyle = getBrandIconStyle(fileInfo.category);

            return (
              <motion.div
                key={document.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.02 }}
                className={clsx(
                  "bg-brand-cyan-50/50 dark:bg-secondary-800 rounded-xl border shadow-sm overflow-hidden transition-all duration-200",
                  isHighlighted && "ring-2 ring-brand-cyan-500 border-brand-cyan-500",
                  isSelected && !isHighlighted && "ring-2 ring-brand-cyan-300 border-brand-cyan-300 bg-brand-cyan-100/50 dark:bg-brand-cyan-900/20",
                  !isHighlighted && !isSelected && "border-brand-cyan-200 dark:border-secondary-700 hover:shadow-md hover:border-brand-cyan-300 dark:hover:border-secondary-600"
                )}
              >
                {/* Card Header */}
                <div className="p-4 pb-3">
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    {enableSelection && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectDocument(document.id)}
                        onClick={(e) => e.stopPropagation()}
                        disabled={!isParsed}
                        className={clsx(
                          "h-4 w-4 mt-1 text-primary-600 focus:ring-primary-500 border-secondary-300 dark:border-secondary-600 rounded",
                          isParsed ? "cursor-pointer" : "cursor-not-allowed opacity-50"
                        )}
                        title={!isParsed ? "Document must be parsed first" : isSelected ? "Deselect" : "Select"}
                      />
                    )}

                    {/* File Icon - Brand colored */}
                    <div className={clsx(
                      'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center',
                      brandIconStyle.bgColor
                    )}>
                      <FileIcon className={clsx('w-5 h-5', brandIconStyle.iconColor)} />
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <button
                        onClick={() => setSelectedDocumentForModal(document)}
                        className="text-sm font-medium text-secondary-900 dark:text-secondary-100 hover:text-primary-600 dark:hover:text-primary-400 truncate block w-full text-left"
                        title={document.name}
                      >
                        {document.name}
                      </button>
                      <div className="flex items-center gap-2 mt-1 text-xs text-secondary-500 dark:text-secondary-400">
                        <span>{document.size ? formatFileSize(document.size) : '—'}</span>
                        <span className="text-secondary-300 dark:text-secondary-600">•</span>
                        <span className={clsx('px-1.5 py-0.5 rounded text-xs font-medium', statusInfo.bgColor, statusInfo.color)}>
                          {statusInfo.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Metadata Row */}
                  <div className="flex items-center gap-4 mt-3 text-xs text-secondary-500 dark:text-secondary-400">
                    {document.folder_name && (
                      <div className="flex items-center gap-1">
                        <FolderIcon className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[100px]">{document.folder_name}</span>
                      </div>
                    )}
                    {document.uploaded_at && (
                      <div className="flex items-center gap-1">
                        <ClockIcon className="w-3.5 h-3.5" />
                        <span>{formatDistanceToNow(new Date(document.uploaded_at), { addSuffix: true })}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions Footer - Brand colored */}
                <div className="px-4 py-3 bg-brand-cyan-100/50 dark:bg-brand-navy-900/50 border-t border-brand-cyan-200/50 dark:border-secondary-700">
                  <div className="flex flex-wrap items-center gap-1">
                    {/* Parse */}
                    {onParse && (
                      <ActionButton
                        icon={isParsed ? CheckCircleIcon : CpuChipIcon}
                        label={isParsed ? 'Already parsed' : 'Parse document'}
                        onClick={() => onParse(document)}
                        disabled={isParsing || isLoadingParsed || isParsed}
                        isProcessing={isParsing}
                        isCompleted={isParsed}
                        colorClass="text-brand-cyan-600 hover:text-brand-cyan-700 dark:text-brand-cyan-400"
                      />
                    )}

                    {/* Load Parsed */}
                    {onLoadParsed && (
                      <ActionButton
                        icon={CloudArrowDownIcon}
                        label={isParsed ? 'Load pre-parsed content' : 'Parse first'}
                        onClick={() => onLoadParsed(document)}
                        disabled={!isParsed || isParsing || isLoadingParsed}
                        isProcessing={isLoadingParsed}
                        colorClass="text-brand-cyan-500 hover:text-brand-cyan-700 dark:text-brand-cyan-400"
                      />
                    )}

                    {/* Summarize */}
                    {onSummarize && (
                      <ActionButton
                        icon={SparklesIcon}
                        label={isParsed ? 'Generate summary' : 'Parse first'}
                        onClick={() => onSummarize(document)}
                        disabled={!canPerformSummaryOperations(document) || isSummarizing}
                        isProcessing={isSummarizing}
                        isCompleted={isDocumentSummarized(document)}
                        colorClass="text-brand-navy-500 hover:text-brand-navy-700 dark:text-brand-navy-400"
                      />
                    )}

                    {/* FAQ with Count */}
                    {onFaq && (
                      <div ref={ref => { faqButtonRefs.current[document.id] = ref; }}>
                        <ActionButton
                          icon={QuestionMarkCircleIcon}
                          label={isParsed ? 'Generate FAQs' : 'Parse first'}
                          onClick={() => handleFaqGenerate(document)}
                          disabled={!canPerformFAQOperations(document) || isFaqGenerating}
                          isProcessing={isFaqGenerating}
                          isCompleted={isDocumentFAQGenerated(document)}
                          colorClass="text-brand-cyan-600 hover:text-brand-cyan-700 dark:text-brand-cyan-400"
                          count={faqCounts[document.id] || 10}
                          hasDropdown
                          onDropdownClick={() => setFaqSelectorOpen(faqSelectorOpen === document.id ? null : document.id)}
                        />
                        <CountSelector
                          isOpen={faqSelectorOpen === document.id}
                          onClose={() => setFaqSelectorOpen(null)}
                          onSelect={(count) => handleFaqGenerate(document, count)}
                          type="faq"
                          currentCount={faqCounts[document.id] || 10}
                          presets={getRecentCounts('faq')}
                          anchorEl={faqButtonRefs.current[document.id]}
                        />
                      </div>
                    )}

                    {/* Questions with Count */}
                    {onQuestions && (
                      <div ref={ref => { questionsButtonRefs.current[document.id] = ref; }}>
                        <ActionButton
                          icon={AcademicCapIcon}
                          label={isParsed ? 'Generate questions' : 'Parse first'}
                          onClick={() => handleQuestionsGenerate(document)}
                          disabled={!canPerformQuestionsOperations(document) || isQuestionsGenerating}
                          isProcessing={isQuestionsGenerating}
                          isCompleted={isDocumentQuestionsGenerated(document)}
                          colorClass="text-brand-coral-500 hover:text-brand-coral-700 dark:text-brand-coral-400"
                          count={questionsCounts[document.id] || 10}
                          hasDropdown
                          onDropdownClick={() => setQuestionsSelectorOpen(questionsSelectorOpen === document.id ? null : document.id)}
                        />
                        <CountSelector
                          isOpen={questionsSelectorOpen === document.id}
                          onClose={() => setQuestionsSelectorOpen(null)}
                          onSelect={(count) => handleQuestionsGenerate(document, count)}
                          type="questions"
                          currentCount={questionsCounts[document.id] || 10}
                          presets={getRecentCounts('questions')}
                          anchorEl={questionsButtonRefs.current[document.id]}
                        />
                      </div>
                    )}

                    {/* Chat */}
                    {onChat && (
                      <ActionButton
                        icon={ChatBubbleLeftIcon}
                        label={isParsed ? 'Chat with document' : 'Parse first'}
                        onClick={() => onChat(document)}
                        disabled={!canPerformAIOperations(document)}
                        colorClass="text-brand-navy-500 hover:text-brand-navy-700 dark:text-brand-navy-400"
                      />
                    )}

                    {/* Rename */}
                    {onRename && (
                      <ActionButton
                        icon={PencilSquareIcon}
                        label="Rename document"
                        onClick={() => onRename(document)}
                        disabled={renamingDocuments.has(document.id)}
                        isProcessing={renamingDocuments.has(document.id)}
                        colorClass="text-brand-cyan-600 hover:text-brand-cyan-700 dark:text-brand-cyan-400"
                      />
                    )}

                    {/* Analyse (Spreadsheets only) */}
                    {onAnalyse && isSpreadsheetFile(document) && (
                      <ActionButton
                        icon={ChartBarIcon}
                        label="Analyse spreadsheet"
                        onClick={() => onAnalyse(document)}
                        colorClass="text-brand-coral-600 hover:text-brand-coral-700 dark:text-brand-coral-500"
                      />
                    )}

                    {/* Delete - pushed to the right */}
                    <div className="flex-1" />
                    {onDelete && (
                      <ActionButton
                        icon={TrashIcon}
                        label="Delete document"
                        onClick={() => setDeletingDocument(document)}
                        colorClass="text-red-500 hover:text-red-600 dark:text-red-400"
                      />
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-center text-sm text-secondary-500 dark:text-secondary-400">
        Showing {documents.length} document{documents.length !== 1 ? 's' : ''}
        {selectedDocuments.size > 0 && (
          <span className="ml-2 px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-xs">
            {selectedDocuments.size} selected
          </span>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingDocument}
        onClose={() => setDeletingDocument(null)}
        onConfirm={() => {
          if (deletingDocument && onDelete) {
            onDelete(deletingDocument);
          }
          setDeletingDocument(null);
        }}
        title="Delete Document"
        message={`Are you sure you want to delete "${deletingDocument?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />

      {/* Document Content Modal */}
      <DocumentContentModal
        document={selectedDocumentForModal}
        isOpen={!!selectedDocumentForModal}
        onClose={() => setSelectedDocumentForModal(null)}
      />
    </div>
  );
}
