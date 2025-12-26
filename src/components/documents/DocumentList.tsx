'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  DocumentTextIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  Cog6ToothIcon,
  CpuChipIcon,
  QuestionMarkCircleIcon,
  ChatBubbleLeftIcon,
  AcademicCapIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { Document, DocumentStatus } from '@/types/api';
import { Card, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import CountSelector from '@/components/ui/CountSelector';
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

interface DocumentListProps {
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
  parsingDocuments?: Set<string>;
  summarizingDocuments?: Set<string>;
  faqGeneratingDocuments?: Set<string>;
  questionsGeneratingDocuments?: Set<string>;
  className?: string;
  selectedDocuments?: Set<string>;
  onSelectionChange?: (selectedIds: Set<string>) => void;
  enableSelection?: boolean;
}

const getStatusIcon = (status: DocumentStatus) => {
  switch (status) {
    case 'uploaded':
      return <CheckCircleIcon className="w-4 h-4 text-success-500" />;
    case 'processing':
      return <Cog6ToothIcon className="w-4 h-4 text-warning-500 animate-spin" />;
    case 'processed':
      return <CheckCircleIcon className="w-4 h-4 text-success-600" />;
    case 'parsed':
      return <CpuChipIcon className="w-4 h-4 text-primary-600" />;
    case 'error':
    case 'failed':
      return <ExclamationCircleIcon className="w-4 h-4 text-error-500" />;
    default:
      return <ClockIcon className="w-4 h-4 text-secondary-400" />;
  }
};

const getStatusColor = (status: DocumentStatus) => {
  switch (status) {
    case 'uploaded':
      return 'bg-success-100 text-success-800';
    case 'processing':
      return 'bg-warning-100 text-warning-800';
    case 'processed':
      return 'bg-success-100 text-success-900';
    case 'parsed':
      return 'bg-primary-100 text-primary-800';
    case 'error':
    case 'failed':
      return 'bg-error-100 text-error-800';
    default:
      return 'bg-secondary-100 text-secondary-600';
  }
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileTypeIcon = (_type: string) => {
  // For now, use document icon for all types
  // Can be expanded to show different icons per file type
  return <DocumentTextIcon className="w-5 h-5 text-primary-500" />;
};

export default function DocumentList({
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
  parsingDocuments = new Set(),
  summarizingDocuments = new Set(),
  faqGeneratingDocuments = new Set(),
  questionsGeneratingDocuments = new Set(),
  className,
  selectedDocuments = new Set(),
  onSelectionChange,
  enableSelection = false
}: DocumentListProps) {
  // State for count selectors
  const [faqSelectorOpen, setFaqSelectorOpen] = useState<string | null>(null);
  const [questionsSelectorOpen, setQuestionsSelectorOpen] = useState<string | null>(null);
  const [faqCounts, setFaqCounts] = useState<Record<string, number>>({});
  const [questionsCounts, setQuestionsCounts] = useState<Record<string, number>>({});
  const faqButtonRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const questionsButtonRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Selection handlers
  const handleSelectAll = () => {
    if (!onSelectionChange || !enableSelection) return;
    
    // Only consider parsed documents for selection
    const parsedDocuments = documents.filter(doc => isDocumentParsed(doc));
    const allParsedSelected = parsedDocuments.length > 0 && 
      parsedDocuments.every(doc => selectedDocuments.has(doc.id));
    
    if (allParsedSelected) {
      onSelectionChange(new Set());
    } else {
      // Only select parsed documents
      onSelectionChange(new Set(parsedDocuments.map(doc => doc.id)));
    }
  };

  const handleSelectDocument = (documentId: string, event?: React.MouseEvent) => {
    if (!onSelectionChange || !enableSelection) return;
    
    // Find the document to check if it's parsed
    const document = documents.find(doc => doc.id === documentId);
    if (!document || !isDocumentParsed(document)) {
      return; // Don't allow selection of non-parsed documents
    }
    
    const newSelection = new Set(selectedDocuments);
    
    if (event?.shiftKey && documents.length > 0) {
      // Handle shift-click for range selection
      const clickedIndex = documents.findIndex(doc => doc.id === documentId);
      const lastSelectedIndex = documents.findIndex(doc => 
        Array.from(selectedDocuments).includes(doc.id)
      );
      
      if (lastSelectedIndex !== -1 && clickedIndex !== -1) {
        const start = Math.min(clickedIndex, lastSelectedIndex);
        const end = Math.max(clickedIndex, lastSelectedIndex);
        
        for (let i = start; i <= end; i++) {
          // Only add parsed documents to selection
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
      // Regular click
      if (newSelection.has(documentId)) {
        newSelection.delete(documentId);
      } else {
        newSelection.add(documentId);
      }
    }
    
    onSelectionChange(newSelection);
  };

  // Calculate selection states considering only parsed documents
  const parsedDocuments = documents.filter(doc => isDocumentParsed(doc));
  const isAllSelected = parsedDocuments.length > 0 && 
    parsedDocuments.every(doc => selectedDocuments.has(doc.id));
  const isIndeterminate = parsedDocuments.some(doc => selectedDocuments.has(doc.id)) && !isAllSelected;

  // Load saved counts on mount
  useEffect(() => {
    if (documents.length > 0) {
      const faqDefaults: Record<string, number> = {};
      const questionsDefaults: Record<string, number> = {};
      
      documents.forEach(doc => {
        faqDefaults[doc.id] = getGenerationCount('faq', doc.type);
        questionsDefaults[doc.id] = getGenerationCount('questions', doc.type);
      });
      
      console.log('🔧 DocumentList count initialization:', {
        faqDefaults,
        questionsDefaults,
        documentCount: documents.length
      });
      
      setFaqCounts(faqDefaults);
      setQuestionsCounts(questionsDefaults);
    }
  }, [documents]);

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
      <div className={clsx("p-8 text-center", className)}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-secondary-600">Loading documents...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={clsx("p-8 text-center", className)}>
        <ExclamationCircleIcon className="w-12 h-12 text-error-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-secondary-900 mb-2">Failed to load documents</h3>
        <p className="text-secondary-600 mb-4">{error || 'An unknown error occurred'}</p>
        {onRefresh && (
          <Button
            variant="outline"
            onClick={onRefresh}
            className="mx-auto"
          >
            Try Again
          </Button>
        )}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className={clsx("p-8 text-center", className)}>
        <DocumentTextIcon className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-secondary-900 mb-2">No documents found</h3>
        <p className="text-secondary-600">
          Upload some documents to get started, or select a different folder.
        </p>
      </div>
    );
  }

  return (
    <div className={clsx("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {enableSelection && documents.length > 0 && (
            <input
              type="checkbox"
              checked={isAllSelected}
              ref={(el) => {
                if (el) {
                  el.indeterminate = isIndeterminate;
                }
              }}
              onChange={handleSelectAll}
              disabled={parsedDocuments.length === 0}
              className={clsx(
                "h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded",
                parsedDocuments.length > 0 ? "cursor-pointer" : "cursor-not-allowed opacity-50"
              )}
              title={
                parsedDocuments.length === 0 
                  ? "No parsed documents available to select"
                  : isAllSelected 
                    ? "Deselect all parsed documents" 
                    : "Select all parsed documents"
              }
            />
          )}
          <h3 className="text-lg font-semibold text-secondary-900">
            Documents ({documents.length})
            {selectedDocuments.size > 0 && (
              <span className="ml-2 text-sm font-normal text-secondary-600">
                ({selectedDocuments.size} selected)
              </span>
            )}
          </h3>
        </div>
        {onRefresh && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            className="text-secondary-600 hover:text-secondary-900"
          >
            Refresh
          </Button>
        )}
      </div>

      <div className="grid gap-4">
        {documents.map((document, index) => (
          <motion.div
            key={document.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className={clsx(
              "hover:shadow-md transition-shadow",
              selectedDocuments.has(document.id) && "ring-2 ring-primary-500 bg-primary-50"
            )}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1 min-w-0">
                    {enableSelection && (
                      <input
                        type="checkbox"
                        checked={selectedDocuments.has(document.id)}
                        onChange={() => handleSelectDocument(document.id)}
                        onClick={(e) => e.stopPropagation()}
                        disabled={!isDocumentParsed(document)}
                        className={clsx(
                          "h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded",
                          isDocumentParsed(document) 
                            ? "cursor-pointer" 
                            : "cursor-not-allowed opacity-50"
                        )}
                        title={
                          !isDocumentParsed(document)
                            ? "Document must be parsed before selection"
                            : selectedDocuments.has(document.id)
                              ? "Deselect document"
                              : "Select document"
                        }
                      />
                    )}
                    {getFileTypeIcon(document.type || '')}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="text-sm font-medium text-secondary-900 truncate">
                          {document.name}
                        </h4>
                        <span className={clsx(
                          'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                          getStatusColor(getEffectiveDocumentStatus(document, parsingDocuments))
                        )}>
                          {getStatusIcon(getEffectiveDocumentStatus(document, parsingDocuments))}
                          <span className="ml-1 capitalize">{getEffectiveDocumentStatus(document, parsingDocuments)}</span>
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-xs text-secondary-500">
                        <span>{typeof document.size === 'number' ? formatFileSize(document.size) : '—'}</span>
                        <span>{document.type?.toUpperCase() || 'FILE'}</span>
                        <span>
                          {document.uploaded_at && !isNaN(new Date(document.uploaded_at).getTime()) 
                            ? formatDistanceToNow(new Date(document.uploaded_at), { addSuffix: true })
                            : '—'
                          }
                        </span>
                        {document.folder_name && (
                          <span className="bg-secondary-100 text-secondary-700 px-2 py-1 rounded text-xs font-medium">
                            📁 {document.folder_name}
                          </span>
                        )}
                        {document.tags && document.tags.length > 0 && (
                          <span>
                            Tags: {document.tags.join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    {onParse && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onParse(document)}
                        disabled={parsingDocuments.has(document.id)}
                        className={clsx(
                          "p-2",
                          parsingDocuments.has(document.id) && "cursor-not-allowed opacity-75"
                        )}
                        title={parsingDocuments.has(document.id) ? "Parsing in progress..." : "Parse document content"}
                      >
                        {parsingDocuments.has(document.id) ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                        ) : (
                          <CpuChipIcon className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                    
                    {onSummarize && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => canPerformSummaryOperations(document) ? onSummarize(document) : undefined}
                        disabled={!canPerformSummaryOperations(document) || summarizingDocuments.has(document.id)}
                        className={clsx(
                          "p-2",
                          (!canPerformSummaryOperations(document) || summarizingDocuments.has(document.id)) && "opacity-50 cursor-not-allowed"
                        )}
                        title={
                          summarizingDocuments.has(document.id) ? "Generating summary..." :
                          canPerformSummaryOperations(document) ? 
                            (isDocumentSummarized(document) ? "View/Edit document summary" : "Generate document summary") : 
                            getDocumentSummaryStatusMessage(document) || "Document must be parsed first"
                        }
                      >
                        {summarizingDocuments.has(document.id) ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                        ) : (
                          <DocumentTextIcon className={clsx(
                            "w-4 h-4",
                            isDocumentSummarized(document) && "text-success-600"
                          )} />
                        )}
                      </Button>
                    )}
                    
                    {onFaq && (
                      <>
                        <div className="inline-flex items-center" ref={ref => { faqButtonRefs.current[document.id] = ref; }}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFaqGenerate(document)}
                            disabled={!canPerformFAQOperations(document) || faqGeneratingDocuments.has(document.id)}
                            className={clsx(
                              "p-2 rounded-r-none border-r-0",
                              (!canPerformFAQOperations(document) || faqGeneratingDocuments.has(document.id)) && "opacity-50 cursor-not-allowed"
                            )}
                            title={
                              faqGeneratingDocuments.has(document.id) ? "Generating FAQs..." :
                              canPerformFAQOperations(document) ? 
                                (isDocumentFAQGenerated(document) ? "View/Edit document FAQs" : "Generate document FAQs") : 
                                getDocumentFAQStatusMessage(document) || "Document must be parsed first"
                            }
                          >
                            <div className="flex items-center">
                              {faqGeneratingDocuments.has(document.id) ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                              ) : (
                                <QuestionMarkCircleIcon className={clsx(
                                  "w-4 h-4",
                                  isDocumentFAQGenerated(document) && "text-success-600"
                                )} />
                              )}
                              <span className="ml-1 text-xs bg-secondary-200 text-secondary-700 px-1.5 py-0.5 rounded-full font-semibold">
                                {faqCounts[document.id] || getGenerationCount('faq', document.type)}
                              </span>
                            </div>
                          </Button>
                          <button
                            onClick={() => setFaqSelectorOpen(document.id)}
                            disabled={!canPerformFAQOperations(document) || faqGeneratingDocuments.has(document.id)}
                            className={clsx(
                              "px-1 py-2 bg-white hover:bg-secondary-50 border border-l-0 border-secondary-300 rounded-r-md transition-colors",
                              (!canPerformFAQOperations(document) || faqGeneratingDocuments.has(document.id)) && "opacity-50 cursor-not-allowed"
                            )}
                            title="Choose FAQ count"
                          >
                            <ChevronDownIcon className="w-3 h-3 text-secondary-600" />
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
                    
                    {onQuestions && (
                      <>
                        <div className="inline-flex items-center" ref={ref => { questionsButtonRefs.current[document.id] = ref; }}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleQuestionsGenerate(document)}
                            disabled={!canPerformQuestionsOperations(document) || questionsGeneratingDocuments.has(document.id)}
                            className={clsx(
                              "p-2 rounded-r-none border-r-0",
                              (!canPerformQuestionsOperations(document) || questionsGeneratingDocuments.has(document.id)) && "opacity-50 cursor-not-allowed"
                            )}
                            title={
                              questionsGeneratingDocuments.has(document.id) ? "Generating questions..." :
                              canPerformQuestionsOperations(document) ? 
                                (isDocumentQuestionsGenerated(document) ? "View/Edit document questions" : "Generate document questions") : 
                                getDocumentQuestionsStatusMessage(document) || "Document must be parsed first"
                            }
                          >
                            <div className="flex items-center">
                              {questionsGeneratingDocuments.has(document.id) ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                              ) : (
                                <AcademicCapIcon className={clsx(
                                  "w-4 h-4",
                                  isDocumentQuestionsGenerated(document) && "text-success-600"
                                )} />
                              )}
                              <span className="ml-1 text-xs bg-secondary-200 text-secondary-700 px-1.5 py-0.5 rounded-full font-semibold">
                                {questionsCounts[document.id] || getGenerationCount('questions', document.type)}
                              </span>
                            </div>
                          </Button>
                          <button
                            onClick={() => setQuestionsSelectorOpen(document.id)}
                            disabled={!canPerformQuestionsOperations(document) || questionsGeneratingDocuments.has(document.id)}
                            className={clsx(
                              "px-1 py-2 bg-white hover:bg-secondary-50 border border-l-0 border-secondary-300 rounded-r-md transition-colors",
                              (!canPerformQuestionsOperations(document) || questionsGeneratingDocuments.has(document.id)) && "opacity-50 cursor-not-allowed"
                            )}
                            title="Choose question count"
                          >
                            <ChevronDownIcon className="w-3 h-3 text-secondary-600" />
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
                    
                    {onChat && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => canPerformAIOperations(document) ? onChat(document) : undefined}
                        disabled={!canPerformAIOperations(document)}
                        className={clsx(
                          "p-2",
                          !canPerformAIOperations(document) && "opacity-50 cursor-not-allowed"
                        )}
                        title={canPerformAIOperations(document) ? "Chat with document" : getDocumentParseStatusMessage(document) || "Document must be parsed first"}
                      >
                        <ChatBubbleLeftIcon className="w-4 h-4" />
                      </Button>
                    )}
                    
                    {onView && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView(document)}
                        className="p-2"
                        title="View document"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </Button>
                    )}
                    
                    {onDownload && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDownload(document)}
                        className="p-2"
                        title="Download document"
                      >
                        <ArrowDownTrayIcon className="w-4 h-4" />
                      </Button>
                    )}
                    
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(document)}
                        className="p-2 text-error-600 hover:text-error-800 hover:bg-error-50"
                        title="Delete document"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}