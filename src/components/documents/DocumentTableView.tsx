'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import {
  ArrowPathIcon,
  ExclamationCircleIcon,
  DocumentTextIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  CpuChipIcon,
  SparklesIcon,
  QuestionMarkCircleIcon,
  AcademicCapIcon,
  ChatBubbleLeftIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { Document, DocumentStatus } from '@/types/api';
import { getFileTypeInfo, formatFileSize } from '@/lib/file-types';
import { isDocumentParsed } from '@/lib/document-utils';
import Button from '@/components/ui/Button';

interface DocumentTableViewProps {
  documents: Document[];
  loading?: boolean;
  error?: string | null;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onRefresh?: () => void;
  onView?: (document: Document) => void;
  onDownload?: (document: Document) => void;
  onDelete?: (document: Document) => void;
  onParse?: (document: Document) => void;
  onSummarize?: (document: Document) => void;
  onFaq?: (document: Document, count?: number) => void;
  onQuestions?: (document: Document, count?: number) => void;
  onChat?: (document: Document) => void;
  parsingDocuments?: Set<string>;
  summarizingDocuments?: Set<string>;
  faqGeneratingDocuments?: Set<string>;
  questionsGeneratingDocuments?: Set<string>;
  selectedDocuments?: Set<string>;
  onSelectionChange?: (selectedIds: Set<string>) => void;
  enableSelection?: boolean;
  highlightedDocumentId?: string | null;
  className?: string;
}

type SortField = 'name' | 'type' | 'size' | 'folder_name' | 'status' | 'uploaded_at';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

// Status badge component
const StatusBadge = ({ status }: { status: DocumentStatus }) => {
  const config: Record<string, { bg: string; text: string; icon: any; label: string }> = {
    uploaded: {
      bg: 'bg-yellow-100 dark:bg-yellow-900/30',
      text: 'text-yellow-700 dark:text-yellow-300',
      icon: ClockIcon,
      label: 'Uploaded'
    },
    processing: {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      text: 'text-blue-700 dark:text-blue-300',
      icon: ArrowPathIcon,
      label: 'Processing'
    },
    processed: {
      bg: 'bg-green-100 dark:bg-green-900/30',
      text: 'text-green-700 dark:text-green-300',
      icon: CheckCircleIcon,
      label: 'Ready'
    },
    parsed: {
      bg: 'bg-green-100 dark:bg-green-900/30',
      text: 'text-green-700 dark:text-green-300',
      icon: CheckCircleIcon,
      label: 'Parsed'
    },
    error: {
      bg: 'bg-red-100 dark:bg-red-900/30',
      text: 'text-red-700 dark:text-red-300',
      icon: ExclamationTriangleIcon,
      label: 'Error'
    },
    failed: {
      bg: 'bg-red-100 dark:bg-red-900/30',
      text: 'text-red-700 dark:text-red-300',
      icon: ExclamationTriangleIcon,
      label: 'Failed'
    },
  };

  const { bg, text, icon: Icon, label } = config[status] || config.uploaded;

  return (
    <span className={clsx(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
      bg, text
    )}>
      <Icon className={clsx('w-3 h-3', status === 'processing' && 'animate-spin')} />
      {label}
    </span>
  );
};

// Type badge component
const TypeBadge = ({ name, type }: { name: string; type?: string }) => {
  const fileInfo = getFileTypeInfo(name, type);

  return (
    <span className={clsx(
      'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
      'bg-gray-100 dark:bg-gray-800',
      fileInfo.color
    )}>
      {fileInfo.displayName}
    </span>
  );
};

// Action button component
interface ActionButtonProps {
  icon: any;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  isProcessing?: boolean;
  isCompleted?: boolean;
  colorClass?: string;
}

const ActionButton = ({
  icon: Icon,
  label,
  onClick,
  disabled,
  isProcessing,
  isCompleted,
  colorClass = 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
}: ActionButtonProps) => (
  <button
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    disabled={disabled}
    className={clsx(
      'p-1.5 rounded-md transition-all duration-150',
      'hover:bg-gray-100 dark:hover:bg-gray-700',
      'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1',
      disabled && 'opacity-40 cursor-not-allowed hover:bg-transparent',
      !disabled && colorClass,
      isCompleted && 'text-green-500 dark:text-green-400'
    )}
    title={label}
  >
    <Icon className={clsx(
      'w-4 h-4',
      isProcessing && 'animate-spin'
    )} />
  </button>
);

// Sort functions
const sortDocuments = (documents: Document[], config: SortConfig): Document[] => {
  return [...documents].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (config.field) {
      case 'name':
        aValue = a.name?.toLowerCase() || '';
        bValue = b.name?.toLowerCase() || '';
        break;
      case 'size':
        aValue = a.size || 0;
        bValue = b.size || 0;
        break;
      case 'type':
        aValue = a.type?.toLowerCase() || '';
        bValue = b.type?.toLowerCase() || '';
        break;
      case 'folder_name':
        aValue = a.folder_name?.toLowerCase() || '';
        bValue = b.folder_name?.toLowerCase() || '';
        break;
      case 'status':
        aValue = a.status || 'unknown';
        bValue = b.status || 'unknown';
        break;
      case 'uploaded_at':
        aValue = new Date(a.uploaded_at || 0).getTime();
        bValue = new Date(b.uploaded_at || 0).getTime();
        break;
      default:
        return 0;
    }

    let result = 0;
    if (aValue < bValue) result = -1;
    else if (aValue > bValue) result = 1;

    return config.direction === 'desc' ? -result : result;
  });
};

// Filter documents by search term
const filterDocuments = (documents: Document[], searchTerm: string): Document[] => {
  if (!searchTerm.trim()) return documents;

  const term = searchTerm.toLowerCase();
  return documents.filter((doc) => {
    const nameMatch = doc.name?.toLowerCase().includes(term);
    const typeMatch = doc.type?.toLowerCase().includes(term);
    const folderMatch = doc.folder_name?.toLowerCase().includes(term);
    return nameMatch || typeMatch || folderMatch;
  });
};

// Format date
const formatDate = (dateString?: string): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
  });
};

export default function DocumentTableView({
  documents,
  loading = false,
  error = null,
  searchTerm,
  onSearchChange,
  onRefresh,
  onParse,
  onSummarize,
  onFaq,
  onQuestions,
  onChat,
  parsingDocuments = new Set(),
  summarizingDocuments = new Set(),
  faqGeneratingDocuments = new Set(),
  questionsGeneratingDocuments = new Set(),
  selectedDocuments = new Set(),
  onSelectionChange,
  enableSelection = false,
  highlightedDocumentId,
  className,
}: DocumentTableViewProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'uploaded_at',
    direction: 'desc',
  });

  // Filter and sort documents
  const processedDocuments = useMemo(() => {
    const filtered = filterDocuments(documents, searchTerm);
    return sortDocuments(filtered, sortConfig);
  }, [documents, searchTerm, sortConfig]);

  // Handle sort click
  const handleSort = useCallback((field: SortField) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  // Handle selection
  const handleSelectionChange = useCallback((documentId: string, selected: boolean) => {
    if (!onSelectionChange) return;

    const newSelection = new Set(selectedDocuments);
    if (selected) {
      newSelection.add(documentId);
    } else {
      newSelection.delete(documentId);
    }
    onSelectionChange(newSelection);
  }, [selectedDocuments, onSelectionChange]);

  // Handle select all
  const handleSelectAll = useCallback((selected: boolean) => {
    if (!onSelectionChange) return;

    if (selected) {
      const allIds = new Set(processedDocuments.map(doc => doc.id));
      onSelectionChange(allIds);
    } else {
      onSelectionChange(new Set());
    }
  }, [processedDocuments, onSelectionChange]);

  const allSelected = processedDocuments.length > 0 &&
    processedDocuments.every(doc => selectedDocuments.has(doc.id));

  // Render sort indicator
  const SortIndicator = ({ field }: { field: SortField }) => {
    if (sortConfig.field !== field) return null;
    return sortConfig.direction === 'asc'
      ? <ChevronUpIcon className="w-4 h-4" />
      : <ChevronDownIcon className="w-4 h-4" />;
  };

  // Loading state
  if (loading) {
    return (
      <div className={clsx('w-full', className)}>
        <div className="flex flex-col items-center justify-center h-64">
          <ArrowPathIcon className="w-8 h-8 text-primary-600 animate-spin mb-4" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading documents...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={clsx('w-full', className)}>
        <div className="flex flex-col items-center justify-center h-64">
          <ExclamationCircleIcon className="w-12 h-12 text-red-400 mb-4" />
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            Failed to load documents
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 text-center">{error}</p>
          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh}>
              Try Again
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Empty state
  if (processedDocuments.length === 0) {
    return (
      <div className={clsx('w-full', className)}>
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <DocumentTextIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            {searchTerm ? 'No documents match your search' : 'No documents found'}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
            {searchTerm
              ? 'Try adjusting your search criteria'
              : 'Upload documents to get started with AI-powered document intelligence'
            }
          </p>
          {searchTerm && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => onSearchChange('')}
            >
              Clear Search
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={clsx('w-full space-y-4', className)}>
      {/* Table Container */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
            {/* Table Header */}
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                {/* Checkbox Column */}
                {enableSelection && (
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 dark:border-gray-600
                                 text-primary-600 focus:ring-primary-500"
                    />
                  </th>
                )}

                {/* Name Column */}
                <th
                  onClick={() => handleSort('name')}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300
                             uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <div className="flex items-center gap-1">
                    <span>Name</span>
                    <SortIndicator field="name" />
                  </div>
                </th>

                {/* Type Column */}
                <th
                  onClick={() => handleSort('type')}
                  className="w-24 px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300
                             uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700
                             hidden sm:table-cell"
                >
                  <div className="flex items-center gap-1">
                    <span>Type</span>
                    <SortIndicator field="type" />
                  </div>
                </th>

                {/* Size Column */}
                <th
                  onClick={() => handleSort('size')}
                  className="w-20 px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300
                             uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700
                             hidden md:table-cell"
                >
                  <div className="flex items-center gap-1">
                    <span>Size</span>
                    <SortIndicator field="size" />
                  </div>
                </th>

                {/* Folder Column */}
                <th
                  onClick={() => handleSort('folder_name')}
                  className="w-28 px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300
                             uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700
                             hidden lg:table-cell"
                >
                  <div className="flex items-center gap-1">
                    <span>Folder</span>
                    <SortIndicator field="folder_name" />
                  </div>
                </th>

                {/* Status Column */}
                <th
                  onClick={() => handleSort('status')}
                  className="w-24 px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300
                             uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <div className="flex items-center gap-1">
                    <span>Status</span>
                    <SortIndicator field="status" />
                  </div>
                </th>

                {/* Upload Date Column */}
                <th
                  onClick={() => handleSort('uploaded_at')}
                  className="w-28 px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300
                             uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700
                             hidden xl:table-cell"
                >
                  <div className="flex items-center gap-1">
                    <span>Date</span>
                    <SortIndicator field="uploaded_at" />
                  </div>
                </th>

                {/* Actions Column */}
                <th className="w-44 px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300
                               uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {processedDocuments.map((document) => {
                const isHighlighted = highlightedDocumentId === document.id;
                const isSelected = selectedDocuments.has(document.id);
                const isParsing = parsingDocuments.has(document.id);
                const isParsed = isDocumentParsed(document);
                const isSummarizing = summarizingDocuments.has(document.id);
                const isFaqGenerating = faqGeneratingDocuments.has(document.id);
                const isQuestionsGenerating = questionsGeneratingDocuments.has(document.id);
                const fileInfo = getFileTypeInfo(document.name, document.type);
                const FileIcon = fileInfo.icon;

                return (
                  <motion.tr
                    key={document.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={clsx(
                      'group transition-colors duration-150',
                      isHighlighted && 'bg-primary-50 dark:bg-primary-900/20 ring-2 ring-inset ring-primary-500',
                      !isHighlighted && isSelected && 'bg-blue-50 dark:bg-blue-900/20',
                      !isHighlighted && !isSelected && 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    )}
                  >
                    {/* Checkbox */}
                    {enableSelection && (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleSelectionChange(document.id, e.target.checked)}
                          className="w-4 h-4 rounded border-gray-300 dark:border-gray-600
                                     text-primary-600 focus:ring-primary-500"
                        />
                      </td>
                    )}

                    {/* Name with Icon */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={clsx(
                          'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center',
                          fileInfo.bgColor
                        )}>
                          <FileIcon className={clsx('w-4 h-4', fileInfo.color)} />
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-xs">
                          {document.name}
                        </span>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <TypeBadge name={document.name} type={document.type} />
                    </td>

                    {/* Size */}
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 hidden md:table-cell">
                      {document.size ? formatFileSize(document.size) : '-'}
                    </td>

                    {/* Folder */}
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 hidden lg:table-cell">
                      <span className="truncate max-w-[100px] inline-block">
                        {document.folder_name || '-'}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <StatusBadge status={isParsing ? 'processing' : (document.status as DocumentStatus)} />
                    </td>

                    {/* Upload Date */}
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 hidden xl:table-cell">
                      {formatDate(document.uploaded_at)}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-0.5">
                        {/* Parse */}
                        <ActionButton
                          icon={isParsed ? CheckCircleIcon : CpuChipIcon}
                          label={isParsed ? 'Already parsed' : 'Parse document'}
                          onClick={() => onParse?.(document)}
                          disabled={isParsing || isParsed}
                          isProcessing={isParsing}
                          isCompleted={isParsed}
                          colorClass="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        />

                        {/* Summary */}
                        <ActionButton
                          icon={SparklesIcon}
                          label={isParsed ? 'Generate summary' : 'Parse first to generate summary'}
                          onClick={() => onSummarize?.(document)}
                          disabled={!isParsed || isSummarizing}
                          isProcessing={isSummarizing}
                          colorClass="text-purple-500 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                        />

                        {/* FAQ */}
                        <ActionButton
                          icon={QuestionMarkCircleIcon}
                          label={isParsed ? 'Generate FAQs' : 'Parse first to generate FAQs'}
                          onClick={() => onFaq?.(document, 10)}
                          disabled={!isParsed || isFaqGenerating}
                          isProcessing={isFaqGenerating}
                          colorClass="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        />

                        {/* Questions */}
                        <ActionButton
                          icon={AcademicCapIcon}
                          label={isParsed ? 'Generate questions' : 'Parse first to generate questions'}
                          onClick={() => onQuestions?.(document, 10)}
                          disabled={!isParsed || isQuestionsGenerating}
                          isProcessing={isQuestionsGenerating}
                          colorClass="text-emerald-500 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                        />

                        {/* Chat */}
                        <ActionButton
                          icon={ChatBubbleLeftIcon}
                          label={isParsed ? 'Chat with document' : 'Parse first to chat'}
                          onClick={() => onChat?.(document)}
                          disabled={!isParsed}
                          colorClass="text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                        />
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
        Showing {processedDocuments.length} of {documents.length} document{documents.length !== 1 ? 's' : ''}
        {selectedDocuments.size > 0 && (
          <span className="ml-2 px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-xs">
            {selectedDocuments.size} selected
          </span>
        )}
      </div>
    </div>
  );
}
