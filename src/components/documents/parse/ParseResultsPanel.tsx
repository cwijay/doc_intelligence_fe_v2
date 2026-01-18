'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  XMarkIcon,
  DocumentTextIcon,
  InformationCircleIcon,
  TagIcon,
  PencilSquareIcon,
  EyeIcon,
  TableCellsIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  ChevronDoubleRightIcon,
  ChevronDoubleLeftIcon,
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import RichTextEditor from '@/components/editors/RichTextEditor';
import { Document, DocumentParseResponse } from '@/types/api';
import { useAuth } from '@/hooks/useAuth';
import { organizationsApi, foldersApi } from '@/lib/api/index';
import { saveAndIndexDocument } from '@/lib/api/ingestion/index';
import { clientConfig } from '@/lib/config';
import toast from 'react-hot-toast';

// Custom sanitization schema for tables
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

type ViewMode = 'edit' | 'split' | 'preview';
type TabType = 'content' | 'metadata' | 'fileInfo';

interface ParseResultsPanelProps {
  isOpen: boolean;
  document: Document | null;
  parseData: DocumentParseResponse | null;
  onClose: () => void;
  onExtract?: (document: Document, parseData: DocumentParseResponse) => void;
  // Resizable panel props (ignored when isFullWidth is true)
  width: number;
  onWidthChange: (width: number) => void;
  minWidth: number;
  maxWidth: number;
  // Full width mode - fills parent container, no resize handle, no close button in header
  isFullWidth?: boolean;
}

const tabs = [
  { id: 'content' as TabType, label: 'Content', icon: DocumentTextIcon },
  { id: 'metadata' as TabType, label: 'Metadata', icon: InformationCircleIcon },
  { id: 'fileInfo' as TabType, label: 'File Info', icon: TagIcon },
];

export default function ParseResultsPanel({
  isOpen,
  document,
  parseData,
  onClose,
  onExtract,
  width,
  onWidthChange,
  minWidth,
  maxWidth,
  isFullWidth = false,
}: ParseResultsPanelProps) {
  const { user } = useAuth();
  const panelRef = useRef<HTMLDivElement>(null);

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [activeTab, setActiveTab] = useState<TabType>('content');

  // Editor state
  const [editedContent, setEditedContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');

  // Save state
  const [isIndexed, setIsIndexed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Resize state
  const [isDragging, setIsDragging] = useState(false);

  // Split panel resize state (for split view)
  const [splitPosition, setSplitPosition] = useState(50);
  const [isSplitDragging, setIsSplitDragging] = useState(false);
  const splitContainerRef = useRef<HTMLDivElement>(null);

  // Track unsaved changes
  const hasUnsavedChanges = editedContent !== originalContent;

  // Initialize content when parseData changes
  useEffect(() => {
    if (parseData?.parsed_content) {
      setEditedContent(parseData.parsed_content);
      setOriginalContent(parseData.parsed_content);
      setIsIndexed(false);
    }
  }, [parseData]);

  // Handle panel resize
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      if (panelRef.current) {
        // Calculate from right edge of viewport
        const newWidth = window.innerWidth - e.clientX;
        const constrainedWidth = Math.min(maxWidth, Math.max(minWidth, newWidth));
        onWidthChange(constrainedWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      window.document.body.style.cursor = '';
      window.document.body.style.userSelect = '';
    };

    window.document.body.style.cursor = 'col-resize';
    window.document.body.style.userSelect = 'none';

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.document.body.style.cursor = '';
      window.document.body.style.userSelect = '';
    };
  }, [isDragging, minWidth, maxWidth, onWidthChange]);

  // Handle split view resize
  useEffect(() => {
    if (!isSplitDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!splitContainerRef.current) return;
      const containerRect = splitContainerRef.current.getBoundingClientRect();
      const newPosition = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      const clampedPosition = Math.min(80, Math.max(20, newPosition));
      setSplitPosition(clampedPosition);
    };

    const handleMouseUp = () => {
      setIsSplitDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isSplitDragging]);

  // Handle save
  const handleSave = useCallback(async () => {
    if (!document || !user?.org_id) {
      toast.error('Cannot save: Missing document or organization information');
      return;
    }

    setIsSaving(true);

    try {
      const orgResponse = await organizationsApi.getById(user.org_id);
      const orgName = orgResponse.name;

      let folderName: string | undefined = document.folder_name;

      if (!folderName && document.storage_path) {
        const pathParts = document.storage_path.split('/');
        if (pathParts.length >= 4) {
          folderName = pathParts[pathParts.length - 2];
        }
      }

      if (!folderName && document.folder_id && user?.org_id) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(document.folder_id)) {
          try {
            const folderResponse = await foldersApi.getById(user.org_id, document.folder_id);
            folderName = folderResponse.name;
          } catch (folderError) {
            console.warn('Could not resolve folder name:', folderError);
          }
        }
      }

      const cleanFolderName = folderName || 'default';

      const lastDotIndex = document.name.lastIndexOf('.');
      const nameWithoutExtension = lastDotIndex > 0
        ? document.name.substring(0, lastDotIndex)
        : document.name;
      const markdownFileName = `${nameWithoutExtension}.md`;

      const targetPath = `${orgName}/parsed/${cleanFolderName}/${markdownFileName}`;

      const gcsBucket = clientConfig.gcsBucketName;
      const originalGcsPath = document.storage_path
        ? `gs://${gcsBucket}/${document.storage_path}`
        : `gs://${gcsBucket}/${orgName}/original/${cleanFolderName}/${document.name}`;

      const response = await saveAndIndexDocument({
        content: editedContent,
        target_path: targetPath,
        org_name: orgName,
        folder_name: cleanFolderName,
        original_filename: document.name,
        original_gcs_path: originalGcsPath,
        parser_version: 'llama_parse_v2.5',
      });

      setIsIndexed(true);
      setOriginalContent(editedContent);

      if (response.indexed) {
        toast.success(`Document saved and indexed in ${response.store_name}`);
      } else {
        toast.success(`Document saved to ${response.saved_path}`);
      }
    } catch (err) {
      console.error('Save and index failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save and index';
      toast.error(`Failed to save: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  }, [document, user, editedContent]);

  // Handle discard
  const handleDiscard = useCallback(() => {
    if (parseData?.parsed_content) {
      setEditedContent(parseData.parsed_content);
      setOriginalContent(parseData.parsed_content);
    }
  }, [parseData]);

  // Handle close with unsaved changes warning
  const handleClose = useCallback(() => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to close?');
      if (!confirmed) return;
    }
    onClose();
  }, [hasUnsavedChanges, onClose]);

  // Handle extract
  const handleExtract = useCallback(() => {
    if (document && parseData && onExtract) {
      onExtract(document, { ...parseData, parsed_content: editedContent });
    }
  }, [document, parseData, editedContent, onExtract]);

  if (!isOpen) return null;

  // Render markdown preview
  const renderMarkdownPreview = (content: string) => (
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
            <SyntaxHighlighter style={oneDark} language={match[1]} PreTag="div">
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          ) : (
            <code className={className} {...props}>{children}</code>
          );
        }
      }}
    >
      {content}
    </ReactMarkdown>
  );

  // Render tab content
  const renderTabContent = () => {
    if (!parseData?.parsed_content) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          <p>No parsed data available</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'content':
        return (
          <div className="h-full">
            {viewMode === 'edit' ? (
              <RichTextEditor
                content={editedContent}
                onChange={setEditedContent}
                className="h-full"
              />
            ) : viewMode === 'preview' ? (
              <div className="p-4 h-full overflow-y-auto prose prose-sm max-w-none dark:prose-invert">
                {renderMarkdownPreview(editedContent)}
              </div>
            ) : (
              // Split view with resizable panels
              <div
                ref={splitContainerRef}
                className={clsx('flex h-full relative', isSplitDragging && 'select-none cursor-col-resize')}
              >
                <div className="overflow-hidden" style={{ width: `${splitPosition}%` }}>
                  <RichTextEditor
                    content={editedContent}
                    onChange={setEditedContent}
                    className="h-full border-0 rounded-none"
                  />
                </div>
                {/* Split resize handle */}
                <div
                  className={clsx(
                    'w-1 bg-gray-200 dark:bg-brand-navy-500 cursor-col-resize hover:bg-primary-400 dark:hover:bg-primary-500 transition-colors relative group flex-shrink-0',
                    isSplitDragging && 'bg-primary-500 dark:bg-primary-400'
                  )}
                  onMouseDown={(e) => { e.preventDefault(); setIsSplitDragging(true); }}
                >
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-1 h-1 bg-gray-400 dark:bg-gray-300 rounded-full" />
                    <div className="w-1 h-1 bg-gray-400 dark:bg-gray-300 rounded-full" />
                    <div className="w-1 h-1 bg-gray-400 dark:bg-gray-300 rounded-full" />
                  </div>
                </div>
                <div className="overflow-hidden flex flex-col" style={{ width: `${100 - splitPosition}%` }}>
                  <div className="p-2 bg-gray-50 dark:bg-brand-navy-600 border-b border-gray-200 dark:border-brand-navy-500 flex-shrink-0">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Preview</span>
                  </div>
                  <div className="p-4 flex-1 overflow-y-auto prose prose-sm max-w-none dark:prose-invert">
                    {renderMarkdownPreview(editedContent)}
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'metadata':
        return (
          <div className="space-y-4 p-4 overflow-y-auto h-full">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Document Analysis</h3>
            {parseData?.parsing_metadata ? (
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-3">Parsing Statistics</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700 dark:text-blue-400">Total Pages</span>
                      <p className="text-blue-900 dark:text-blue-200 font-semibold">{parseData.parsing_metadata.total_pages}</p>
                    </div>
                    <div>
                      <span className="text-blue-700 dark:text-blue-400">Content Length</span>
                      <p className="text-blue-900 dark:text-blue-200 font-semibold">{parseData.parsing_metadata.content_length.toLocaleString()} chars</p>
                    </div>
                    <div>
                      <span className="text-blue-700 dark:text-blue-400">Duration</span>
                      <p className="text-blue-900 dark:text-blue-200 font-semibold">{parseData.parsing_metadata.parsing_duration}s</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No metadata available</p>
            )}
          </div>
        );

      case 'fileInfo':
        return (
          <div className="space-y-4 p-4 overflow-y-auto h-full">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Storage Details</h3>
            {parseData ? (
              <div className="space-y-4">
                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                  <h4 className="font-semibold text-orange-900 dark:text-orange-300 mb-3">Storage Paths</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-orange-700 dark:text-orange-400">Original</span>
                      <p className="text-orange-900 dark:text-orange-200 font-mono text-xs bg-orange-100 dark:bg-orange-900/30 p-2 rounded break-all">{parseData.storage_path}</p>
                    </div>
                    <div>
                      <span className="text-orange-700 dark:text-orange-400">Parsed</span>
                      <p className="text-orange-900 dark:text-orange-200 font-mono text-xs bg-orange-100 dark:bg-orange-900/30 p-2 rounded break-all">{parseData.parsed_storage_path}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No file info available</p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      ref={panelRef}
      className={clsx(
        'relative h-full bg-white dark:bg-gray-900 flex flex-col',
        isFullWidth ? 'w-full' : 'flex-shrink-0 border-l border-gray-200 dark:border-gray-700'
      )}
      style={isFullWidth ? undefined : { width }}
    >
      {/* Resize Handle (left edge) - Only show when not full width */}
      {!isFullWidth && (
        <div
          onMouseDown={(e) => { e.preventDefault(); setIsDragging(true); }}
          className={clsx(
            'absolute -left-2 top-0 h-full w-5 cursor-col-resize z-20 group transition-all duration-150 flex items-center justify-center',
            isDragging ? 'bg-primary-500/20 dark:bg-primary-400/20' : 'hover:bg-primary-400/10 dark:hover:bg-primary-500/10 bg-transparent'
          )}
          title="Drag to resize panel"
        >
          <div className={clsx(
            'w-1.5 h-16 rounded-full transition-all duration-150 shadow-sm',
            isDragging ? 'bg-primary-500 dark:bg-primary-400 scale-110 h-24' : 'bg-secondary-400 dark:bg-secondary-500 group-hover:bg-primary-500 dark:group-hover:bg-primary-400 group-hover:h-24 group-hover:w-2'
          )} />
        </div>
      )}

      {/* Panel Header - Different style for full width mode */}
      <div className={clsx(
        'flex-shrink-0 px-4 py-3 border-b border-gray-200 dark:border-gray-700',
        isFullWidth ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 min-w-0">
            <DocumentTextIcon className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0" />
            <h2 className={clsx(
              'font-semibold text-gray-900 dark:text-white truncate',
              isFullWidth ? 'text-lg' : 'text-sm'
            )}>
              {isFullWidth ? 'Parse Results' : (document?.name || 'Parse Results')}
            </h2>
            {hasUnsavedChanges && (
              <span className="flex items-center space-x-1 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full flex-shrink-0">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                <span>Unsaved</span>
              </span>
            )}
          </div>
          {/* Close button - Only show when not full width (back button is in parent) */}
          {!isFullWidth && (
            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="Close panel"
            >
              <XMarkIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Status Banner */}
      {isIndexed ? (
        <div className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800">
          <CheckCircleIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
          <p className="text-xs text-green-700 dark:text-green-300">Document indexed successfully</p>
        </div>
      ) : (
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
          <ExclamationTriangleIcon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <p className="text-xs text-amber-700 dark:text-amber-300">Click "Save & Index" to index for search</p>
        </div>
      )}

      {/* Tabs and View Toggle */}
      <div className="flex-shrink-0 px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex space-x-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  'flex items-center px-2 py-1 text-xs font-medium rounded transition-colors',
                  activeTab === tab.id
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                )}
              >
                <Icon className="w-3.5 h-3.5 mr-1" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === 'content' && parseData?.parsed_content && (
          <div className="flex rounded border border-gray-200 dark:border-gray-600 overflow-hidden">
            <button
              onClick={() => setViewMode('edit')}
              className={clsx(
                'px-2 py-1 text-xs font-medium transition-colors',
                viewMode === 'edit' ? 'bg-primary-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
              )}
            >
              <PencilSquareIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={clsx(
                'px-2 py-1 text-xs font-medium border-l border-gray-200 dark:border-gray-600 transition-colors',
                viewMode === 'split' ? 'bg-primary-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
              )}
            >
              Split
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={clsx(
                'px-2 py-1 text-xs font-medium border-l border-gray-200 dark:border-gray-600 transition-colors',
                viewMode === 'preview' ? 'bg-primary-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
              )}
            >
              <EyeIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {renderTabContent()}
      </div>

      {/* Action Bar */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div>
            {hasUnsavedChanges && (
              <button
                onClick={handleDiscard}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Discard
              </button>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={clsx(
                'px-3 py-1.5 text-xs font-medium text-white rounded transition-colors flex items-center',
                isSaving ? 'bg-primary-400 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700'
              )}
            >
              {isSaving ? (
                <>
                  <ArrowPathIcon className="w-3.5 h-3.5 mr-1 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save & Index'
              )}
            </button>
            {onExtract && parseData && (
              <button
                onClick={handleExtract}
                className="px-3 py-1.5 text-xs font-medium text-white bg-orange-500 rounded hover:bg-orange-600 transition-colors flex items-center"
              >
                <TableCellsIcon className="w-3.5 h-3.5 mr-1" />
                Extract
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
