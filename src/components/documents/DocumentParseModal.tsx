'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { DocumentParseResponse, Document } from '@/types/api';
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
  EyeIcon
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import RichTextEditor from '@/components/editors/RichTextEditor';

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

interface DocumentParseModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document | null;
  parseData: DocumentParseResponse | null;
  onSave?: (editedContent: string) => Promise<void>;
}

type TabType = 'content' | 'metadata' | 'entities';

export default function DocumentParseModal({
  isOpen,
  onClose,
  document,
  parseData,
  onSave
}: DocumentParseModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('content');
  const [editedContent, setEditedContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [previewMode, setPreviewMode] = useState<'split' | 'preview' | 'edit'>('split');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (parseData?.parsed_content) {
      setEditedContent(parseData.parsed_content);
    }
  }, [parseData]);

  const handleSave = async () => {
    if (!onSave) return;
    
    setIsSaving(true);
    try {
      await onSave(editedContent);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save content:', error);
      // Don't reset editing state on error so user can retry
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    {
      id: 'content' as TabType,
      label: 'Content',
      icon: DocumentTextIcon,
      count: parseData?.parsed_content ? 1 : 0
    },
    {
      id: 'metadata' as TabType,
      label: 'Metadata',
      icon: InformationCircleIcon,
      count: parseData?.parsing_metadata ? Object.keys(parseData.parsing_metadata).length : 0
    },
    {
      id: 'entities' as TabType,
      label: 'File Info',
      icon: TagIcon,
      count: parseData?.file_info ? 1 : 0
    }
  ];

  const renderTabContent = () => {
    // Debug logging for modal data
    console.log('🎯 DocumentParseModal Debug Info:', {
      hasParseData: !!parseData,
      parseDataKeys: parseData ? Object.keys(parseData) : 'No parseData',
      hasParsedContent: !!parseData?.parsed_content,
      parsedContentLength: parseData?.parsed_content?.length || 0,
      hasParsingMetadata: !!parseData?.parsing_metadata,
      hasFileInfo: !!parseData?.file_info,
      fullParseData: parseData,
      documentName: document?.name
    });

    if (!parseData?.parsed_content) {
      return (
        <div className="flex items-center justify-center h-64 text-secondary-500">
          <div className="text-center">
            <p className="mb-2">No parsed data available</p>
            {process.env.NODE_ENV === 'development' && (
              <details className="text-xs text-left bg-gray-100 p-2 rounded">
                <summary className="cursor-pointer">Debug Info</summary>
                <pre className="mt-2 whitespace-pre-wrap">
                  {JSON.stringify({
                    hasParseData: !!parseData,
                    parseDataKeys: parseData ? Object.keys(parseData) : 'No parseData',
                    fullData: parseData
                  }, null, 2)}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'content':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-secondary-900">Document Content</h3>
                {isEditing && (
                  <p className="text-sm text-secondary-600 mt-1">
                    Changes will be saved to storage and automatically indexed for search
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {activeTab === 'content' && parseData?.parsed_content && (
                  <>
                    <div className="flex rounded-lg border border-secondary-200 overflow-hidden">
                      <button
                        onClick={() => setPreviewMode('edit')}
                        className={clsx(
                          'px-3 py-1 text-sm font-medium transition-colors',
                          previewMode === 'edit'
                            ? 'bg-primary-600 text-white'
                            : 'bg-white text-secondary-700 hover:bg-secondary-50'
                        )}
                      >
                        <PencilSquareIcon className="w-4 h-4 inline mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => setPreviewMode('split')}
                        className={clsx(
                          'px-3 py-1 text-sm font-medium border-l border-secondary-200 transition-colors',
                          previewMode === 'split'
                            ? 'bg-primary-600 text-white'
                            : 'bg-white text-secondary-700 hover:bg-secondary-50'
                        )}
                      >
                        Split
                      </button>
                      <button
                        onClick={() => setPreviewMode('preview')}
                        className={clsx(
                          'px-3 py-1 text-sm font-medium border-l border-secondary-200 transition-colors',
                          previewMode === 'preview'
                            ? 'bg-primary-600 text-white'
                            : 'bg-white text-secondary-700 hover:bg-secondary-50'
                        )}
                      >
                        <EyeIcon className="w-4 h-4 inline mr-1" />
                        Preview
                      </button>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        {isSaving ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Saving & Indexing...
                          </>
                        ) : (
                          'Save & Index Document'
                        )}
                      </button>
                      {isEditing && (
                        <button
                          onClick={() => {
                            setIsEditing(false);
                            setEditedContent(parseData?.parsed_content || '');
                          }}
                          className="px-4 py-2 bg-secondary-100 text-secondary-700 text-sm font-medium rounded-lg hover:bg-secondary-200 transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {parseData?.parsed_content || editedContent ? (
              <div className="border border-secondary-200 rounded-lg overflow-hidden">
                {previewMode === 'edit' ? (
                  <RichTextEditor
                    content={editedContent}
                    onChange={(content) => {
                      setEditedContent(content);
                      setIsEditing(true);
                    }}
                    className="h-[600px]"
                  />
                ) : previewMode === 'preview' ? (
                  <div className="p-4 h-[600px] overflow-y-auto prose prose-sm max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw, [rehypeSanitize, tableSchema]]}
                      components={{
                        table: ({node, ...props}) => (
                          <table className="min-w-full border-collapse border border-secondary-300 my-4" {...props} />
                        ),
                        thead: ({node, ...props}) => (
                          <thead className="bg-secondary-100" {...props} />
                        ),
                        th: ({node, ...props}) => (
                          <th className="border border-secondary-300 px-4 py-2 text-left font-semibold text-secondary-900" {...props} />
                        ),
                        td: ({node, ...props}) => (
                          <td className="border border-secondary-300 px-4 py-2 text-secondary-700" {...props} />
                        ),
                        tr: ({node, ...props}) => (
                          <tr className="hover:bg-secondary-50" {...props} />
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
                  <div className="flex h-[600px]">
                    <div className="w-1/2 border-r border-secondary-200 overflow-hidden">
                      <RichTextEditor
                        content={editedContent}
                        onChange={(content) => {
                          setEditedContent(content);
                          setIsEditing(true);
                        }}
                        className="h-full border-0 rounded-none"
                      />
                    </div>
                    <div className="w-1/2">
                      <div className="p-2 bg-secondary-50 border-b border-secondary-200">
                        <span className="text-sm font-medium text-secondary-700">Preview</span>
                      </div>
                      <div className="p-4 h-full overflow-y-auto prose prose-sm max-w-none">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeRaw, [rehypeSanitize, tableSchema]]}
                          components={{
                            table: ({node, ...props}) => (
                              <table className="min-w-full border-collapse border border-secondary-300 my-4" {...props} />
                            ),
                            thead: ({node, ...props}) => (
                              <thead className="bg-secondary-100" {...props} />
                            ),
                            th: ({node, ...props}) => (
                              <th className="border border-secondary-300 px-4 py-2 text-left font-semibold text-secondary-900" {...props} />
                            ),
                            td: ({node, ...props}) => (
                              <td className="border border-secondary-300 px-4 py-2 text-secondary-700" {...props} />
                            ),
                            tr: ({node, ...props}) => (
                              <tr className="hover:bg-secondary-50" {...props} />
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
              <div className="text-center py-8 text-secondary-500">
                <DocumentTextIcon className="w-12 h-12 mx-auto mb-2" />
                <p>No text content available</p>
                {process.env.NODE_ENV === 'development' && parseData && (
                  <div className="mt-4 text-left bg-gray-100 p-4 rounded-lg">
                    <p className="text-sm font-medium mb-2">Debug: Raw Response Data</p>
                    <pre className="text-xs overflow-auto max-h-40 whitespace-pre-wrap">
                      {JSON.stringify(parseData, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 'metadata':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-secondary-900">Document Analysis</h3>
            
            {parseData?.parsing_metadata ? (
              <div className="space-y-6">
                {/* Parsing Statistics */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-3">📊 Parsing Statistics</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-blue-700">Total Pages</span>
                      <p className="text-blue-900 font-semibold">{parseData.parsing_metadata.total_pages}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-blue-700">Content Length</span>
                      <p className="text-blue-900 font-semibold">{parseData.parsing_metadata.content_length.toLocaleString()} characters</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-blue-700">Parsing Duration</span>
                      <p className="text-blue-900 font-semibold">{parseData.parsing_metadata.parsing_duration}s</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-blue-700">Document Structure</span>
                      <p className="text-blue-900">
                        {parseData.parsing_metadata.has_headers && '📄 Headers '} 
                        {parseData.parsing_metadata.has_footers && '🦶 Footers'}
                        {!parseData.parsing_metadata.has_headers && !parseData.parsing_metadata.has_footers && 'Simple layout'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* GCS Metadata */}
                {parseData.gcs_metadata && (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-900 mb-3">☁️ Cloud Storage Info</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-green-700">File Size</span>
                        <p className="text-green-900 font-semibold">{(parseData.gcs_metadata.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-green-700">Content Type</span>
                        <p className="text-green-900 font-semibold">{parseData.gcs_metadata.content_type}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-green-700">Created</span>
                        <p className="text-green-900">{new Date(parseData.gcs_metadata.created).toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-green-700">Last Updated</span>
                        <p className="text-green-900">{new Date(parseData.gcs_metadata.updated).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* File Processing Info */}
                {parseData.file_info && (
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <h4 className="font-semibold text-purple-900 mb-3">📁 File Processing</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-purple-700">Original Size</span>
                        <p className="text-purple-900 font-semibold">{(parseData.file_info.original_size / 1024).toFixed(1)} KB</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-purple-700">Parsed Size</span>
                        <p className="text-purple-900 font-semibold">{(parseData.file_info.parsed_size / 1024).toFixed(1)} KB</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-purple-700">File Type</span>
                        <p className="text-purple-900 font-semibold">{parseData.file_info.file_type}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-purple-700">Content Type</span>
                        <p className="text-purple-900">{parseData.file_info.content_type}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-secondary-500">
                <InformationCircleIcon className="w-12 h-12 mx-auto mb-2" />
                <p>No parsing metadata available</p>
              </div>
            )}
          </div>
        );

      case 'entities':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-secondary-900">Storage & Processing Details</h3>
            {parseData ? (
              <div className="space-y-4">
                {/* Storage Paths */}
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <h4 className="font-semibold text-orange-900 mb-3">📂 Storage Locations</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-orange-700">Original Path</span>
                      <p className="text-orange-900 font-mono text-sm bg-orange-100 p-2 rounded">{parseData.storage_path}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-orange-700">Parsed Content Path</span>
                      <p className="text-orange-900 font-mono text-sm bg-orange-100 p-2 rounded">{parseData.parsed_storage_path}</p>
                    </div>
                  </div>
                </div>

                {/* Processing Summary */}
                {parseData.file_info && (
                  <div className="p-4 bg-secondary-50 rounded-lg border">
                    <h4 className="font-semibold text-secondary-900 mb-3">⚙️ Processing Summary</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-secondary-700">Original Size</span>
                        <p className="text-secondary-900 font-semibold">{(parseData.file_info.original_size / 1024).toFixed(1)} KB</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-secondary-700">Processed Size</span>
                        <p className="text-secondary-900 font-semibold">{(parseData.file_info.parsed_size / 1024).toFixed(1)} KB</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-secondary-700">File Type</span>
                        <p className="text-secondary-900">{parseData.file_info.file_type}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-secondary-700">Content Type</span>
                        <p className="text-secondary-900">{parseData.file_info.content_type}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-secondary-700">Success Status</span>
                        <p className={`font-semibold ${parseData.success ? 'text-green-600' : 'text-red-600'}`}>
                          {parseData.success ? '✅ Successful' : '❌ Failed'}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-secondary-700">Processed At</span>
                        <p className="text-secondary-900">{parseData.timestamp ? new Date(parseData.timestamp).toLocaleString() : 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-secondary-500">
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

  if (!document) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Parse Results: ${document.name}`}
      size="4xl"
      className="max-h-[90vh]"
    >
      <div className="space-y-6">
        {parseData?.timestamp && (
          <div className="text-sm text-secondary-600">
            Processed at {new Date(parseData.timestamp).toLocaleString()}
          </div>
        )}

        <div className="border-b border-secondary-200">
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
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
                  )}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                  {tab.count > 0 && (
                    <span className="ml-2 bg-secondary-100 text-secondary-600 py-0.5 px-2 rounded-full text-xs">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="max-h-[75vh] overflow-y-auto">
          {renderTabContent()}
        </div>
      </div>
    </Modal>
  );
}