'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DocumentTextIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { Document } from '@/types/api';
import DocumentCard from './card';
import DocumentViewSwitcher, { ViewSettings, ViewMode } from './DocumentViewSwitcher';
import Button from '@/components/ui/Button';
import { clsx } from 'clsx';
import { getFileTypeInfo } from '@/lib/file-types';
import { isDocumentParsed } from '@/lib/document-utils';

interface DocumentGridViewProps {
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
  className?: string;
  highlightedDocumentId?: string | null;
}

const defaultViewSettings: ViewSettings = {
  mode: 'grid',
  sortField: 'uploaded_at',
  sortDirection: 'desc',
  filterCategory: 'all',
  showParsedOnly: false,
  density: 'comfortable',
};

const sortDocuments = (documents: Document[], settings: ViewSettings): Document[] => {
  return [...documents].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (settings.sortField) {
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
      case 'uploaded_at':
        aValue = new Date(a.uploaded_at || 0).getTime();
        bValue = new Date(b.uploaded_at || 0).getTime();
        break;
      case 'status':
        aValue = a.status || 'unknown';
        bValue = b.status || 'unknown';
        break;
      default:
        return 0;
    }

    let result = 0;
    if (aValue < bValue) result = -1;
    else if (aValue > bValue) result = 1;
    
    return settings.sortDirection === 'desc' ? -result : result;
  });
};

const filterDocuments = (documents: Document[], settings: ViewSettings, searchTerm: string): Document[] => {
  return documents.filter((document) => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const nameMatch = document.name?.toLowerCase().includes(searchLower);
      const typeMatch = document.type?.toLowerCase().includes(searchLower);
      const folderMatch = document.folder_name?.toLowerCase().includes(searchLower);
      
      if (!nameMatch && !typeMatch && !folderMatch) {
        return false;
      }
    }

    // Parsed only filter
    if (settings.showParsedOnly && !isDocumentParsed(document)) {
      return false;
    }

    // Category filter
    if (settings.filterCategory !== 'all') {
      const fileInfo = getFileTypeInfo(document.name, document.type);
      if (fileInfo.category !== settings.filterCategory) {
        return false;
      }
    }

    return true;
  });
};

export default function DocumentGridView({
  documents,
  loading = false,
  error = null,
  searchTerm,
  onSearchChange,
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
  selectedDocuments = new Set(),
  onSelectionChange,
  enableSelection = false,
  className,
  highlightedDocumentId,
}: DocumentGridViewProps) {
  const [viewSettings, setViewSettings] = useState<ViewSettings>(defaultViewSettings);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const filteredAndSortedDocuments = useMemo(() => {
    const filtered = filterDocuments(documents, viewSettings, searchTerm);
    return sortDocuments(filtered, viewSettings);
  }, [documents, viewSettings, searchTerm]);

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

  const getGridClasses = (mode: ViewMode, density: ViewSettings['density']) => {
    const densityClasses = {
      compact: 'gap-3',
      comfortable: 'gap-4', 
      spacious: 'gap-6',
    };

    switch (mode) {
      case 'grid':
        return clsx(
          'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5',
          densityClasses[density]
        );
      case 'list':
        return clsx('flex flex-col', densityClasses[density]);
      case 'compact':
        return clsx('flex flex-col', densityClasses[density]);
      default:
        return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
    }
  };

  if (loading) {
    return (
      <div className={clsx('w-full', className)}>
        <div className="flex flex-col items-center justify-center h-64">
          <ArrowPathIcon className="w-8 h-8 text-primary-600 animate-spin mb-4" />
          <p className="text-sm text-gray-500">Loading documents...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={clsx('w-full', className)}>
        <div className="flex flex-col items-center justify-center h-64">
          <ExclamationCircleIcon className="w-12 h-12 text-red-400 mb-4" />
          <h3 className="text-sm font-medium text-gray-900 mb-2">Failed to load documents</h3>
          <p className="text-sm text-gray-500 mb-4 text-center">{error}</p>
          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh}>
              Try Again
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={clsx('w-full space-y-6', className)}>
      {/* View Controls */}
      <DocumentViewSwitcher
        viewSettings={viewSettings}
        onViewSettingsChange={setViewSettings}
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
        totalCount={filteredAndSortedDocuments.length}
        selectedCount={selectedDocuments.size}
        showAdvancedFilters={showAdvancedFilters}
        onToggleAdvancedFilters={() => setShowAdvancedFilters(!showAdvancedFilters)}
      />

      {/* Documents Grid/List */}
      {filteredAndSortedDocuments.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <DocumentTextIcon className="w-12 h-12 text-gray-300 mb-4" />
          <h3 className="text-sm font-medium text-gray-900 mb-2">
            {searchTerm || viewSettings.filterCategory !== 'all' || viewSettings.showParsedOnly
              ? 'No documents match your filters'
              : 'No documents found'
            }
          </h3>
          <p className="text-sm text-gray-500 max-w-sm">
            {searchTerm || viewSettings.filterCategory !== 'all' || viewSettings.showParsedOnly
              ? 'Try adjusting your search or filter criteria to find documents'
              : 'Upload documents to get started with AI-powered document intelligence'
            }
          </p>
          {(searchTerm || viewSettings.filterCategory !== 'all' || viewSettings.showParsedOnly) && (
            <div className="mt-4 space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onSearchChange('')}
              >
                Clear Search
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setViewSettings(defaultViewSettings)}
              >
                Reset Filters
              </Button>
            </div>
          )}
        </div>
      ) : (
        <motion.div
          layout
          className={getGridClasses(viewSettings.mode, viewSettings.density)}
        >
          <AnimatePresence mode="popLayout">
            {filteredAndSortedDocuments.map((document, index) => (
              <DocumentCard
                key={document.id}
                document={document}
                selected={selectedDocuments.has(document.id)}
                isHighlighted={highlightedDocumentId === document.id}
                onSelectionChange={enableSelection ? (selected) => handleSelectionChange(document.id, selected) : undefined}
                onView={() => onView?.(document)}
                onDownload={() => onDownload?.(document)}
                onDelete={() => onDelete?.(document)}
                onParse={() => onParse?.(document)}
                onSummarize={() => onSummarize?.(document)}
                onFaq={(count) => onFaq?.(document, count)}
                onQuestions={(count) => onQuestions?.(document, count)}
                onChat={() => onChat?.(document)}
                isProcessing={{
                  parsing: parsingDocuments.has(document.id),
                  summarizing: summarizingDocuments.has(document.id),
                  faqGenerating: faqGeneratingDocuments.has(document.id),
                  questionsGenerating: questionsGeneratingDocuments.has(document.id),
                }}
                viewMode={viewSettings.mode}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
      
      {/* Results summary */}
      {filteredAndSortedDocuments.length > 0 && (
        <div className="flex items-center justify-center pt-4 text-sm text-gray-500 border-t">
          Showing {filteredAndSortedDocuments.length} of {documents.length} document{documents.length !== 1 ? 's' : ''}
          {selectedDocuments.size > 0 && (
            <span className="ml-2 px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs">
              {selectedDocuments.size} selected
            </span>
          )}
        </div>
      )}
    </div>
  );
}