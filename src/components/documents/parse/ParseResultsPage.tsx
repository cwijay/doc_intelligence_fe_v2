'use client';

import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  DocumentTextIcon,
  InformationCircleIcon,
  TagIcon,
  PencilSquareIcon,
  EyeIcon,
  TableCellsIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import RichTextEditor from '@/components/editors/RichTextEditor';
import ParseResultsHeader from './ParseResultsHeader';
import { useParseResultsPage, ViewMode, TabType } from '@/hooks/useParseResultsPage';
import { useAuth } from '@/hooks/useAuth';
import { resolveFolderName } from '@/hooks/ai/utils';
import { storeExtractionContext } from '@/hooks/extraction/useExtractionPage';
import { LAYOUT } from '@/lib/constants';
import toast from 'react-hot-toast';

// Custom sanitization schema that allows table elements from LlamaParse
const tableSchema = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames || []),
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col'
  ],
  attributes: {
    ...defaultSchema.attributes,
    table: ['className', 'border', 'cellPadding', 'cellSpacing', 'style'],
    th: ['className', 'colSpan', 'rowSpan', 'scope', 'style'],
    td: ['className', 'colSpan', 'rowSpan', 'style'],
    tr: ['className', 'style'],
    thead: ['className', 'style'],
    tbody: ['className', 'style'],
    tfoot: ['className', 'style'],
  }
};

interface ParseResultsPageProps {
  documentId: string;
}

const tabs = [
  {
    id: 'content' as TabType,
    label: 'Content',
    icon: DocumentTextIcon,
  },
  {
    id: 'metadata' as TabType,
    label: 'Metadata',
    icon: InformationCircleIcon,
  },
  {
    id: 'fileInfo' as TabType,
    label: 'File Info',
    icon: TagIcon,
  }
];

export default function ParseResultsPage({ documentId }: ParseResultsPageProps) {
  const router = useRouter();

  const {
    document,
    parseData,
    isLoading,
    error,
    viewMode,
    setViewMode,
    activeTab,
    setActiveTab,
    editedContent,
    setEditedContent,
    hasUnsavedChanges,
    isIndexed,
    isSaving,
    handleSave,
    handleDiscard,
    handleBack,
    getParseDataForExtraction,
  } = useParseResultsPage(documentId);

  // Resizable split panel state
  const [splitPosition, setSplitPosition] = useState(50); // percentage
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle mouse down on resize handle
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  // Handle mouse move for resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const newPosition = ((e.clientX - containerRect.left) / containerRect.width) * 100;

      // Clamp between 20% and 80%
      const clampedPosition = Math.min(80, Math.max(20, newPosition));
      setSplitPosition(clampedPosition);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Calculate content height - maximize editor space
  const contentHeight = useMemo(() => {
    // Full viewport minus header and minimal padding for footer
    return `calc(100vh - ${LAYOUT.HEADER_HEIGHT}px - 80px)`;
  }, []);

  const { user } = useAuth();

  // Handle extract data click - navigate to full-page extraction
  const handleExtractClick = useCallback(async () => {
    const data = getParseDataForExtraction();
    if (!data || !document || !user?.org_id) {
      toast.error('Cannot extract: Missing document data or organization');
      return;
    }

    try {
      // Resolve folder name for the document
      const folderName = await resolveFolderName(document, user.org_id);

      // Store extraction context in sessionStorage
      storeExtractionContext(documentId, document, data, folderName);

      // Navigate to extraction page
      router.push(`/documents/${documentId}/extract?from=parse`);
    } catch (error) {
      console.error('Failed to prepare extraction context:', error);
      toast.error('Failed to prepare extraction. Please try again.');
    }
  }, [document, documentId, user?.org_id, router, getParseDataForExtraction]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <ParseResultsHeader document={null} onBack={handleBack} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading parse results...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col h-full">
        <ParseResultsHeader document={null} onBack={handleBack} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Error Loading Parse Results
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Back to Documents
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render tab content
  const renderTabContent = () => {
    if (!parseData?.parsed_content) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <p className="mb-2">No parsed data available</p>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'content':
        return (
          <div className="h-full">
            {parseData?.parsed_content || editedContent ? (
              <div className="border border-gray-200 dark:border-brand-navy-500 rounded-lg overflow-hidden h-full">
                {viewMode === 'edit' ? (
                  <RichTextEditor
                    content={editedContent}
                    onChange={setEditedContent}
                    style={{ height: contentHeight }}
                  />
                ) : viewMode === 'preview' ? (
                  <div
                    className="p-4 overflow-y-auto prose prose-sm max-w-none dark:prose-invert"
                    style={{ height: contentHeight }}
                  >
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw, [rehypeSanitize, tableSchema]]}
                      components={{
                        table: ({ ...props }) => (
                          <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600 my-4" {...props} />
                        ),
                        thead: ({ ...props }) => (
                          <thead className="bg-gray-100 dark:bg-brand-navy-600" {...props} />
                        ),
                        th: ({ ...props }) => (
                          <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left font-semibold text-gray-900 dark:text-gray-100" {...props} />
                        ),
                        td: ({ ...props }) => (
                          <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-gray-700 dark:text-gray-300" {...props} />
                        ),
                        tr: ({ ...props }) => (
                          <tr className="hover:bg-gray-50 dark:hover:bg-brand-navy-600" {...props} />
                        ),
                        code({ className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || '');
                          return match ? (
                            <SyntaxHighlighter
                              style={oneDark}
                              language={match[1]}
                              PreTag="div"
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          ) : (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          );
                        }
                      }}
                    >
                      {editedContent}
                    </ReactMarkdown>
                  </div>
                ) : (
                  // Split view with resizable panels
                  <div
                    ref={containerRef}
                    className={clsx(
                      'flex h-full relative',
                      isDragging && 'select-none cursor-col-resize'
                    )}
                    style={{ height: contentHeight }}
                  >
                    {/* Editor Panel */}
                    <div
                      className="overflow-hidden"
                      style={{ width: `${splitPosition}%` }}
                    >
                      <RichTextEditor
                        content={editedContent}
                        onChange={setEditedContent}
                        className="h-full border-0 rounded-none"
                      />
                    </div>

                    {/* Resize Handle */}
                    <div
                      className={clsx(
                        'w-1 bg-gray-200 dark:bg-brand-navy-500 cursor-col-resize hover:bg-primary-400 dark:hover:bg-primary-500 transition-colors relative group flex-shrink-0',
                        isDragging && 'bg-primary-500 dark:bg-primary-400'
                      )}
                      onMouseDown={handleMouseDown}
                    >
                      {/* Visual grip indicator */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-1 h-1 bg-gray-400 dark:bg-gray-300 rounded-full" />
                        <div className="w-1 h-1 bg-gray-400 dark:bg-gray-300 rounded-full" />
                        <div className="w-1 h-1 bg-gray-400 dark:bg-gray-300 rounded-full" />
                      </div>
                    </div>

                    {/* Preview Panel */}
                    <div
                      className="overflow-hidden flex flex-col"
                      style={{ width: `${100 - splitPosition}%` }}
                    >
                      <div className="p-2 bg-gray-50 dark:bg-brand-navy-600 border-b border-gray-200 dark:border-brand-navy-500 flex-shrink-0">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Preview</span>
                      </div>
                      <div className="p-4 flex-1 overflow-y-auto prose prose-sm max-w-none dark:prose-invert">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeRaw, [rehypeSanitize, tableSchema]]}
                          components={{
                            table: ({ ...props }) => (
                              <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600 my-4" {...props} />
                            ),
                            thead: ({ ...props }) => (
                              <thead className="bg-gray-100 dark:bg-brand-navy-600" {...props} />
                            ),
                            th: ({ ...props }) => (
                              <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left font-semibold text-gray-900 dark:text-gray-100" {...props} />
                            ),
                            td: ({ ...props }) => (
                              <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-gray-700 dark:text-gray-300" {...props} />
                            ),
                            tr: ({ ...props }) => (
                              <tr className="hover:bg-gray-50 dark:hover:bg-brand-navy-600" {...props} />
                            ),
                            code({ className, children, ...props }) {
                              const match = /language-(\w+)/.exec(className || '');
                              return match ? (
                                <SyntaxHighlighter
                                  style={oneDark}
                                  language={match[1]}
                                  PreTag="div"
                                >
                                  {String(children).replace(/\n$/, '')}
                                </SyntaxHighlighter>
                              ) : (
                                <code className={className} {...props}>
                                  {children}
                                </code>
                              );
                            }
                          }}
                        >
                          {editedContent}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <DocumentTextIcon className="w-12 h-12 mx-auto mb-2" />
                <p>No text content available</p>
              </div>
            )}
          </div>
        );

      case 'metadata':
        return (
          <div className="space-y-6 p-4 overflow-y-auto" style={{ maxHeight: contentHeight }}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Document Analysis</h3>

            {parseData?.parsing_metadata ? (
              <div className="space-y-6">
                {/* Parsing Statistics */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-3">Parsing Statistics</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-400">Total Pages</span>
                      <p className="text-blue-900 dark:text-blue-200 font-semibold">{parseData.parsing_metadata.total_pages}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-400">Content Length</span>
                      <p className="text-blue-900 dark:text-blue-200 font-semibold">{parseData.parsing_metadata.content_length.toLocaleString()} characters</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-400">Parsing Duration</span>
                      <p className="text-blue-900 dark:text-blue-200 font-semibold">{parseData.parsing_metadata.parsing_duration}s</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-400">Document Structure</span>
                      <p className="text-blue-900 dark:text-blue-200">
                        {parseData.parsing_metadata.has_headers && 'Headers '}
                        {parseData.parsing_metadata.has_footers && 'Footers'}
                        {!parseData.parsing_metadata.has_headers && !parseData.parsing_metadata.has_footers && 'Simple layout'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* GCS Metadata */}
                {parseData.gcs_metadata && (
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                    <h4 className="font-semibold text-green-900 dark:text-green-300 mb-3">Cloud Storage Info</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-green-700 dark:text-green-400">File Size</span>
                        <p className="text-green-900 dark:text-green-200 font-semibold">{(parseData.gcs_metadata.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-green-700 dark:text-green-400">Content Type</span>
                        <p className="text-green-900 dark:text-green-200 font-semibold">{parseData.gcs_metadata.content_type}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-green-700 dark:text-green-400">Created</span>
                        <p className="text-green-900 dark:text-green-200">{new Date(parseData.gcs_metadata.created).toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-green-700 dark:text-green-400">Last Updated</span>
                        <p className="text-green-900 dark:text-green-200">{new Date(parseData.gcs_metadata.updated).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* File Processing Info */}
                {parseData.file_info && (
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                    <h4 className="font-semibold text-purple-900 dark:text-purple-300 mb-3">File Processing</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-purple-700 dark:text-purple-400">Original Size</span>
                        <p className="text-purple-900 dark:text-purple-200 font-semibold">{(parseData.file_info.original_size / 1024).toFixed(1)} KB</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-purple-700 dark:text-purple-400">Parsed Size</span>
                        <p className="text-purple-900 dark:text-purple-200 font-semibold">{(parseData.file_info.parsed_size / 1024).toFixed(1)} KB</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-purple-700 dark:text-purple-400">File Type</span>
                        <p className="text-purple-900 dark:text-purple-200 font-semibold">{parseData.file_info.file_type}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-purple-700 dark:text-purple-400">Content Type</span>
                        <p className="text-purple-900 dark:text-purple-200">{parseData.file_info.content_type}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <InformationCircleIcon className="w-12 h-12 mx-auto mb-2" />
                <p>No parsing metadata available</p>
              </div>
            )}
          </div>
        );

      case 'fileInfo':
        return (
          <div className="space-y-4 p-4 overflow-y-auto" style={{ maxHeight: contentHeight }}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Storage & Processing Details</h3>
            {parseData ? (
              <div className="space-y-4">
                {/* Storage Paths */}
                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                  <h4 className="font-semibold text-orange-900 dark:text-orange-300 mb-3">Storage Locations</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-orange-700 dark:text-orange-400">Original Path</span>
                      <p className="text-orange-900 dark:text-orange-200 font-mono text-sm bg-orange-100 dark:bg-orange-900/30 p-2 rounded">{parseData.storage_path}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-orange-700 dark:text-orange-400">Parsed Content Path</span>
                      <p className="text-orange-900 dark:text-orange-200 font-mono text-sm bg-orange-100 dark:bg-orange-900/30 p-2 rounded">{parseData.parsed_storage_path}</p>
                    </div>
                  </div>
                </div>

                {/* Processing Summary */}
                {parseData.file_info && (
                  <div className="p-4 bg-gray-50 dark:bg-brand-navy-600 rounded-lg border border-gray-200 dark:border-brand-navy-500">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Processing Summary</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-400">Original Size</span>
                        <p className="text-gray-900 dark:text-white font-semibold">{(parseData.file_info.original_size / 1024).toFixed(1)} KB</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-400">Processed Size</span>
                        <p className="text-gray-900 dark:text-white font-semibold">{(parseData.file_info.parsed_size / 1024).toFixed(1)} KB</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-400">File Type</span>
                        <p className="text-gray-900 dark:text-white">{parseData.file_info.file_type}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-400">Content Type</span>
                        <p className="text-gray-900 dark:text-white">{parseData.file_info.content_type}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-400">Success Status</span>
                        <p className={`font-semibold ${parseData.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {parseData.success ? 'Successful' : 'Failed'}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-400">Processed At</span>
                        <p className="text-gray-900 dark:text-white">{parseData.timestamp ? new Date(parseData.timestamp).toLocaleString() : 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <TagIcon className="w-12 h-12 mx-auto mb-2" />
                <p>No file information available</p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-brand-navy-700">
      {/* Header */}
      <ParseResultsHeader
        document={document}
        onBack={handleBack}
        hasUnsavedChanges={hasUnsavedChanges}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col px-6 py-4 overflow-hidden">
        {/* Indexing status banner */}
        {isIndexed ? (
          <div className="flex items-center gap-2 p-3 mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <CheckCircleIcon className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
            <p className="text-sm text-green-700 dark:text-green-300">
              Document indexed successfully
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3 mb-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <ExclamationTriangleIcon className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Click "Save & Index Document" to index this document for search
            </p>
          </div>
        )}

        {/* Timestamp */}
        {parseData?.timestamp && (
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Processed at {new Date(parseData.timestamp).toLocaleString()}
          </div>
        )}

        {/* Tabs and view mode toggle */}
        <div className="flex items-center justify-between mb-4">
          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-brand-navy-500">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={clsx(
                      'flex items-center py-2 px-1 border-b-2 font-medium text-sm transition-colors',
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                    )}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* View mode toggle - only show for content tab */}
          {activeTab === 'content' && parseData?.parsed_content && (
            <div className="flex rounded-lg border border-gray-200 dark:border-brand-navy-500 overflow-hidden">
              <button
                onClick={() => setViewMode('edit')}
                className={clsx(
                  'px-3 py-1 text-sm font-medium transition-colors flex items-center',
                  viewMode === 'edit'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white dark:bg-brand-navy-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-brand-navy-500'
                )}
              >
                <PencilSquareIcon className="w-4 h-4 mr-1" />
                Edit
              </button>
              <button
                onClick={() => setViewMode('split')}
                className={clsx(
                  'px-3 py-1 text-sm font-medium border-l border-gray-200 dark:border-brand-navy-500 transition-colors',
                  viewMode === 'split'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white dark:bg-brand-navy-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-brand-navy-500'
                )}
              >
                Split
              </button>
              <button
                onClick={() => setViewMode('preview')}
                className={clsx(
                  'px-3 py-1 text-sm font-medium border-l border-gray-200 dark:border-brand-navy-500 transition-colors flex items-center',
                  viewMode === 'preview'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white dark:bg-brand-navy-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-brand-navy-500'
                )}
              >
                <EyeIcon className="w-4 h-4 mr-1" />
                Preview
              </button>
            </div>
          )}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-hidden bg-white dark:bg-brand-navy-600 rounded-lg shadow-sm">
          {renderTabContent()}
        </div>
      </div>

      {/* Sticky footer action bar */}
      <div className="sticky bottom-0 bg-white dark:bg-brand-navy-600 border-t border-gray-200 dark:border-brand-navy-500 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {hasUnsavedChanges && (
              <button
                onClick={handleDiscard}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-brand-navy-500 rounded-lg hover:bg-gray-200 dark:hover:bg-brand-navy-400 transition-colors"
              >
                Discard Changes
              </button>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={clsx(
                'px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors flex items-center',
                isSaving
                  ? 'bg-primary-400 cursor-not-allowed'
                  : 'bg-primary-600 hover:bg-primary-700'
              )}
            >
              {isSaving ? (
                <>
                  <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                  Saving & Indexing...
                </>
              ) : (
                'Save & Index Document'
              )}
            </button>

            {parseData && (
              <button
                onClick={handleExtractClick}
                className="px-4 py-2 text-sm font-medium text-white bg-brand-coral-500 rounded-lg hover:bg-brand-coral-600 transition-colors flex items-center"
              >
                <TableCellsIcon className="w-4 h-4 mr-2" />
                Extract Data
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
