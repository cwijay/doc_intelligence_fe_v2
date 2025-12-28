'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DocumentTextIcon,
  EllipsisVerticalIcon,
  ArrowDownTrayIcon,
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
  ClockIcon,
  ArrowPathIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { Document, DocumentStatus } from '@/types/api';
import Button from '@/components/ui/Button';
import CountSelector from '@/components/ui/CountSelector';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
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
  getDocumentParseStatusMessage,
  getEffectiveDocumentStatus,
  canPerformSummaryOperations,
  getDocumentSummaryStatusMessage,
  isDocumentSummarized,
  canPerformFAQOperations,
  getDocumentFAQStatusMessage,
  isDocumentFAQGenerated,
  canPerformQuestionsOperations,
  getDocumentQuestionsStatusMessage,
  isDocumentQuestionsGenerated,
  isDocumentParsed
} from '@/lib/document-utils';
import { isSpreadsheetFile } from '@/lib/file-utils';

interface DocumentListCompactProps {
  documents: Document[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onView?: (document: Document) => void;
  onDownload?: (document: Document) => void;
  onDelete?: (document: Document) => void;
  onParse?: (document: Document) => void;
  onSummarize?: (document: Document) => void;
  onFaq?: (document: Document, count?: number) => void;
  onQuestions?: (document: Document, count?: number) => void;
  onChat?: (document: Document) => void;
  onAnalyse?: (document: Document) => void;
  parsingDocuments?: Set<string>;
  summarizingDocuments?: Set<string>;
  faqGeneratingDocuments?: Set<string>;
  questionsGeneratingDocuments?: Set<string>;
  className?: string;
  selectedDocuments?: Set<string>;
  onSelectionChange?: (selectedIds: Set<string>) => void;
  enableSelection?: boolean;
}

const getStatusDot = (status: DocumentStatus) => {
  const statusColors = {
    'uploaded': 'bg-yellow-400',
    'processing': 'bg-blue-400 animate-pulse',
    'processed': 'bg-green-400',
    'parsed': 'bg-green-500',
    'error': 'bg-red-400',
    'failed': 'bg-red-400',
  };
  
  return (
    <span 
      className={clsx(
        "inline-block w-2 h-2 rounded-full",
        statusColors[status] || 'bg-gray-400'
      )}
      title={status}
    />
  );
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const getFileIcon = (type: string) => {
  const iconClass = "w-4 h-4 text-gray-400";
  return <DocumentTextIcon className={iconClass} />;
};

export default function DocumentListCompact({
  documents,
  loading = false,
  error = null,
  onRefresh,
  onView,
  onDownload,
  onDelete,
  onParse,
  onSummarize,
  onFaq,
  onQuestions,
  onChat,
  onAnalyse,
  parsingDocuments = new Set(),
  summarizingDocuments = new Set(),
  faqGeneratingDocuments = new Set(),
  questionsGeneratingDocuments = new Set(),
  className,
  selectedDocuments = new Set(),
  onSelectionChange,
  enableSelection = false
}: DocumentListCompactProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [faqSelectorOpen, setFaqSelectorOpen] = useState<string | null>(null);
  const [questionsSelectorOpen, setQuestionsSelectorOpen] = useState<string | null>(null);
  const [faqCounts, setFaqCounts] = useState<Record<string, number>>({});
  const [questionsCounts, setQuestionsCounts] = useState<Record<string, number>>({});
  const [deletingDocument, setDeletingDocument] = useState<Document | null>(null);
  const menuRefs = useRef<Record<string, HTMLDivElement | null>>({});
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId && menuRefs.current[openMenuId] && 
          !menuRefs.current[openMenuId]?.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuId]);

  const handleSelectAll = () => {
    if (!onSelectionChange || !enableSelection) return;
    
    const parsedDocuments = documents.filter(doc => isDocumentParsed(doc));
    const allParsedSelected = parsedDocuments.length > 0 && 
      parsedDocuments.every(doc => selectedDocuments.has(doc.id));
    
    if (allParsedSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(parsedDocuments.map(doc => doc.id)));
    }
  };

  const handleSelectDocument = (documentId: string, event?: React.MouseEvent) => {
    if (!onSelectionChange || !enableSelection) return;
    
    const document = documents.find(doc => doc.id === documentId);
    if (!document || !isDocumentParsed(document)) {
      return;
    }
    
    const newSelection = new Set(selectedDocuments);
    
    if (event?.shiftKey && documents.length > 0) {
      const clickedIndex = documents.findIndex(doc => doc.id === documentId);
      const lastSelectedIndex = documents.findIndex(doc => 
        Array.from(selectedDocuments).includes(doc.id)
      );
      
      if (lastSelectedIndex !== -1 && clickedIndex !== -1) {
        const start = Math.min(clickedIndex, lastSelectedIndex);
        const end = Math.max(clickedIndex, lastSelectedIndex);
        
        for (let i = start; i <= end; i++) {
          if (isDocumentParsed(documents[i])) {
            newSelection.add(documents[i].id);
          }
        }
      } else {
        if (newSelection.has(documentId)) {
          newSelection.delete(documentId);
        } else {
          newSelection.add(documentId);
        }
      }
    } else {
      if (newSelection.has(documentId)) {
        newSelection.delete(documentId);
      } else {
        newSelection.add(documentId);
      }
    }
    
    onSelectionChange(newSelection);
  };

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

  const parsedDocuments = documents.filter(doc => isDocumentParsed(doc));
  const isAllSelected = parsedDocuments.length > 0 && 
    parsedDocuments.every(doc => selectedDocuments.has(doc.id));
  const isIndeterminate = parsedDocuments.some(doc => selectedDocuments.has(doc.id)) && !isAllSelected;

  if (loading) {
    return (
      <div className={clsx("flex items-center justify-center h-64", className)}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-500">Loading documents...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={clsx("flex items-center justify-center h-64", className)}>
        <div className="text-center">
          <ExclamationCircleIcon className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-sm font-medium text-gray-900 mb-2">Failed to load documents</h3>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
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
          <DocumentTextIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-sm font-medium text-gray-900 mb-2">No documents found</h3>
          <p className="text-sm text-gray-500">Upload documents to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx("w-full", className)}>
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {enableSelection && (
                <th className="w-12 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isIndeterminate;
                    }}
                    onChange={handleSelectAll}
                    disabled={parsedDocuments.length === 0}
                    className={clsx(
                      "h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded",
                      parsedDocuments.length > 0 ? "cursor-pointer" : "cursor-not-allowed opacity-50"
                    )}
                    title={parsedDocuments.length === 0 
                      ? "No parsed documents available"
                      : isAllSelected ? "Deselect all" : "Select all"}
                  />
                </th>
              )}
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Size
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Folder
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Modified
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {documents.map((document, index) => (
              <motion.tr
                key={document.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.02 }}
                className={clsx(
                  "hover:bg-gray-50 transition-colors",
                  selectedDocuments.has(document.id) && "bg-blue-50 hover:bg-blue-100",
                  index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                )}
              >
                {enableSelection && (
                  <td className="w-12 px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selectedDocuments.has(document.id)}
                      onChange={() => handleSelectDocument(document.id)}
                      onClick={(e) => e.stopPropagation()}
                      disabled={!isDocumentParsed(document)}
                      className={clsx(
                        "h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded",
                        isDocumentParsed(document) 
                          ? "cursor-pointer" 
                          : "cursor-not-allowed opacity-50"
                      )}
                      title={!isDocumentParsed(document)
                        ? "Document must be parsed first"
                        : selectedDocuments.has(document.id)
                          ? "Deselect" : "Select"}
                    />
                  </td>
                )}
                
                <td className="px-3 py-2 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 mr-2">
                      {getFileIcon(document.type || '')}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900 truncate max-w-xs">
                        {document.name}
                      </span>
                      {getStatusDot(getEffectiveDocumentStatus(document, parsingDocuments))}
                    </div>
                  </div>
                </td>
                
                <td className="px-3 py-2 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {typeof document.size === 'number' ? formatFileSize(document.size) : '—'}
                    {document.type && (
                      <span className="ml-1 text-xs text-gray-400">
                        {document.type.toUpperCase()}
                      </span>
                    )}
                  </div>
                </td>
                
                <td className="px-3 py-2 whitespace-nowrap">
                  {document.folder_name ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                      {document.folder_name}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400">—</span>
                  )}
                </td>
                
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                  {document.uploaded_at && !isNaN(new Date(document.uploaded_at).getTime()) 
                    ? formatDistanceToNow(new Date(document.uploaded_at), { addSuffix: true })
                    : '—'}
                </td>
                
                <td className="px-3 py-2 whitespace-nowrap">
                  <div className="flex items-center justify-center space-x-0.5">
                    {/* Parse Button */}
                    {onParse && (
                      <button
                        onClick={() => onParse(document)}
                        disabled={parsingDocuments.has(document.id)}
                        className={clsx(
                          "p-1.5 rounded hover:bg-gray-100 transition-colors",
                          parsingDocuments.has(document.id) && "opacity-50 cursor-not-allowed"
                        )}
                        title={parsingDocuments.has(document.id) ? "Parsing..." : "Parse document"}
                      >
                        {parsingDocuments.has(document.id) ? (
                          <ArrowPathIcon className="w-4 h-4 text-gray-400 animate-spin" />
                        ) : (
                          <CpuChipIcon className={clsx(
                            "w-4 h-4",
                            isDocumentParsed(document) ? "text-green-500" : "text-gray-400"
                          )} />
                        )}
                      </button>
                    )}
                    
                    {/* Summarize Button */}
                    {onSummarize && (
                      <button
                        onClick={() => canPerformSummaryOperations(document) ? onSummarize(document) : undefined}
                        disabled={!canPerformSummaryOperations(document) || summarizingDocuments.has(document.id)}
                        className={clsx(
                          "p-1.5 rounded hover:bg-gray-100 transition-colors",
                          (!canPerformSummaryOperations(document) || summarizingDocuments.has(document.id)) && "opacity-50 cursor-not-allowed"
                        )}
                        title={
                          summarizingDocuments.has(document.id) ? "Generating summary..." :
                          canPerformSummaryOperations(document) ? 
                            (isDocumentSummarized(document) ? "View/Edit summary" : "Generate summary") : 
                            "Document must be parsed first"
                        }
                      >
                        {summarizingDocuments.has(document.id) ? (
                          <ArrowPathIcon className="w-4 h-4 text-gray-400 animate-spin" />
                        ) : (
                          <SparklesIcon className={clsx(
                            "w-4 h-4",
                            isDocumentSummarized(document) ? "text-green-500" : "text-gray-400"
                          )} />
                        )}
                      </button>
                    )}
                    
                    {/* FAQ Button with Count */}
                    {onFaq && (
                      <>
                        <div className="inline-flex items-center" ref={ref => { faqButtonRefs.current[document.id] = ref; }}>
                          <button
                            onClick={() => handleFaqGenerate(document)}
                            disabled={!canPerformFAQOperations(document) || faqGeneratingDocuments.has(document.id)}
                            className={clsx(
                              "p-1.5 rounded-l hover:bg-gray-100 transition-colors border-r border-gray-200",
                              (!canPerformFAQOperations(document) || faqGeneratingDocuments.has(document.id)) && "opacity-50 cursor-not-allowed"
                            )}
                            title={
                              faqGeneratingDocuments.has(document.id) ? "Generating FAQs..." :
                              canPerformFAQOperations(document) ? 
                                (isDocumentFAQGenerated(document) ? "View/Edit FAQs" : "Generate FAQs") : 
                                "Document must be parsed first"
                            }
                          >
                            <div className="flex items-center">
                              {faqGeneratingDocuments.has(document.id) ? (
                                <ArrowPathIcon className="w-4 h-4 text-gray-400 animate-spin" />
                              ) : (
                                <QuestionMarkCircleIcon className={clsx(
                                  "w-4 h-4",
                                  isDocumentFAQGenerated(document) && "text-green-500",
                                  !isDocumentFAQGenerated(document) && "text-gray-400"
                                )} />
                              )}
                              <span className="ml-1 text-xs text-gray-600 font-medium">
                                {faqCounts[document.id] || getGenerationCount('faq', document.type)}
                              </span>
                            </div>
                          </button>
                          <button
                            onClick={() => setFaqSelectorOpen(faqSelectorOpen === document.id ? null : document.id)}
                            disabled={!canPerformFAQOperations(document) || faqGeneratingDocuments.has(document.id)}
                            className={clsx(
                              "px-1 py-1.5 hover:bg-gray-100 rounded-r transition-colors",
                              (!canPerformFAQOperations(document) || faqGeneratingDocuments.has(document.id)) && "opacity-50 cursor-not-allowed"
                            )}
                            title="Choose FAQ count"
                          >
                            <ChevronDownIcon className="w-3 h-3 text-gray-600" />
                          </button>
                        </div>
                        <CountSelector
                          isOpen={faqSelectorOpen === document.id}
                          onClose={() => setFaqSelectorOpen(null)}
                          onSelect={(count) => handleFaqGenerate(document, count)}
                          type="faq"
                          currentCount={faqCounts[document.id] || getGenerationCount('faq', document.type)}
                          presets={getRecentCounts('faq')}
                          anchorEl={faqButtonRefs.current[document.id]}
                        />
                      </>
                    )}
                    
                    {/* Questions Button with Count */}
                    {onQuestions && (
                      <>
                        <div className="inline-flex items-center" ref={ref => { questionsButtonRefs.current[document.id] = ref; }}>
                          <button
                            onClick={() => handleQuestionsGenerate(document)}
                            disabled={!canPerformQuestionsOperations(document) || questionsGeneratingDocuments.has(document.id)}
                            className={clsx(
                              "p-1.5 rounded-l hover:bg-gray-100 transition-colors border-r border-gray-200",
                              (!canPerformQuestionsOperations(document) || questionsGeneratingDocuments.has(document.id)) && "opacity-50 cursor-not-allowed"
                            )}
                            title={
                              questionsGeneratingDocuments.has(document.id) ? "Generating questions..." :
                              canPerformQuestionsOperations(document) ? 
                                (isDocumentQuestionsGenerated(document) ? "View/Edit questions" : "Generate questions") : 
                                "Document must be parsed first"
                            }
                          >
                            <div className="flex items-center">
                              {questionsGeneratingDocuments.has(document.id) ? (
                                <ArrowPathIcon className="w-4 h-4 text-gray-400 animate-spin" />
                              ) : (
                                <AcademicCapIcon className={clsx(
                                  "w-4 h-4",
                                  isDocumentQuestionsGenerated(document) && "text-green-500",
                                  !isDocumentQuestionsGenerated(document) && "text-gray-400"
                                )} />
                              )}
                              <span className="ml-1 text-xs text-gray-600 font-medium">
                                {questionsCounts[document.id] || getGenerationCount('questions', document.type)}
                              </span>
                            </div>
                          </button>
                          <button
                            onClick={() => setQuestionsSelectorOpen(questionsSelectorOpen === document.id ? null : document.id)}
                            disabled={!canPerformQuestionsOperations(document) || questionsGeneratingDocuments.has(document.id)}
                            className={clsx(
                              "px-1 py-1.5 hover:bg-gray-100 rounded-r transition-colors",
                              (!canPerformQuestionsOperations(document) || questionsGeneratingDocuments.has(document.id)) && "opacity-50 cursor-not-allowed"
                            )}
                            title="Choose question count"
                          >
                            <ChevronDownIcon className="w-3 h-3 text-gray-600" />
                          </button>
                        </div>
                        <CountSelector
                          isOpen={questionsSelectorOpen === document.id}
                          onClose={() => setQuestionsSelectorOpen(null)}
                          onSelect={(count) => handleQuestionsGenerate(document, count)}
                          type="questions"
                          currentCount={questionsCounts[document.id] || getGenerationCount('questions', document.type)}
                          presets={getRecentCounts('questions')}
                          anchorEl={questionsButtonRefs.current[document.id]}
                        />
                      </>
                    )}
                    
                    {/* Chat Button */}
                    {onChat && (
                      <button
                        onClick={() => canPerformAIOperations(document) ? onChat(document) : undefined}
                        disabled={!canPerformAIOperations(document)}
                        className={clsx(
                          "p-1.5 rounded hover:bg-gray-100 transition-colors",
                          !canPerformAIOperations(document) && "opacity-50 cursor-not-allowed"
                        )}
                        title={canPerformAIOperations(document) ? "Chat with document" : "Document must be parsed first"}
                      >
                        <ChatBubbleLeftIcon className="w-4 h-4 text-gray-400" />
                      </button>
                    )}

                    {/* Analyse Button (Spreadsheets only) */}
                    {onAnalyse && isSpreadsheetFile(document) && (
                      <button
                        onClick={() => onAnalyse(document)}
                        className="p-1.5 rounded hover:bg-green-50 transition-colors"
                        title="Analyse spreadsheet data"
                      >
                        <ChartBarIcon className="w-4 h-4 text-green-600 hover:text-green-700" />
                      </button>
                    )}

                    {/* View Button */}
                    {onView && (
                      <button
                        onClick={() => onView(document)}
                        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                        title="View document"
                      >
                        <EyeIcon className="w-4 h-4 text-gray-400" />
                      </button>
                    )}
                    
                    {/* Download Button */}
                    {onDownload && (
                      <button
                        onClick={() => onDownload(document)}
                        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                        title="Download document"
                      >
                        <ArrowDownTrayIcon className="w-4 h-4 text-gray-400" />
                      </button>
                    )}
                    
                    {/* Delete Button */}
                    {onDelete && (
                      <button
                        onClick={() => setDeletingDocument(document)}
                        className="p-1.5 rounded hover:bg-red-50 transition-colors"
                        title="Delete document"
                      >
                        <TrashIcon className="w-4 h-4 text-red-500 hover:text-red-600" />
                      </button>
                    )}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
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
    </div>
  );
}