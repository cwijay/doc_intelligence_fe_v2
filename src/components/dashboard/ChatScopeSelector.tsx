'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  BuildingOfficeIcon,
  FolderIcon,
  DocumentTextIcon,
  XMarkIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { Folder, Document } from '@/types/api';
import { ChatScope, ChatScopeType } from '@/hooks/dashboard/useDashboardChat';
import { isDocumentParsed } from '@/lib/document-utils';
import { clsx } from 'clsx';

interface ChatScopeSelectorProps {
  scope: ChatScope;
  scopeDescription: string;
  folders: Folder[];
  documents: Document[];
  isLoadingFolders?: boolean;
  isLoadingDocuments?: boolean;
  onScopeTypeChange: (type: ChatScopeType) => void;
  onToggleFolderInOrg: (folder: Folder) => void;
  onFolderSelect: (folderId: string, folderName: string) => void;
  onToggleDocument: (document: Document) => void;
  onOpenDocumentModal: () => void;
  onRemoveDocument?: (documentId: string) => void;
}

const SCOPE_OPTIONS: { type: ChatScopeType; label: string; icon: typeof BuildingOfficeIcon }[] = [
  { type: 'organization', label: 'Organization', icon: BuildingOfficeIcon },
  { type: 'folder', label: 'Folder', icon: FolderIcon },
  { type: 'documents', label: 'Documents', icon: DocumentTextIcon },
];

export default function ChatScopeSelector({
  scope,
  scopeDescription,
  folders,
  documents,
  isLoadingFolders = false,
  isLoadingDocuments = false,
  onScopeTypeChange,
  onToggleFolderInOrg,
  onFolderSelect,
  onToggleDocument,
  onOpenDocumentModal,
  onRemoveDocument,
}: ChatScopeSelectorProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');

  // Sync selected folder ID with scope (for folder scope)
  useEffect(() => {
    if (scope.type === 'folder' && scope.folderId) {
      setSelectedFolderId(scope.folderId);
    } else if (scope.type !== 'folder') {
      setSelectedFolderId('');
    }
  }, [scope]);

  // Get documents for the selected folder (filter by folder_name)
  const folderDocuments = useMemo(() => {
    if (!selectedFolderId || !scope.folderName) return [];
    return documents.filter(doc => doc.folder_name === scope.folderName);
  }, [documents, selectedFolderId, scope.folderName]);

  // Check if a document is selected
  const isDocumentSelected = (docId: string) => {
    return scope.documentIds?.includes(docId) ?? false;
  };

  // Check if a folder is selected in organization scope
  const isFolderSelectedInOrg = (folderId: string) => {
    return scope.folderIds?.includes(folderId) ?? false;
  };

  const handleFolderCheckboxClick = (folder: Folder) => {
    // Toggle: if already selected, deselect (go back to org scope)
    // Otherwise select this folder
    if (selectedFolderId === folder.id) {
      setSelectedFolderId('');
      onScopeTypeChange('organization');
    } else {
      setSelectedFolderId(folder.id);
      onFolderSelect(folder.id, folder.name);
    }
  };

  const handleScopeTypeClick = (type: ChatScopeType) => {
    onScopeTypeChange(type);

    // Clear folder selection when switching away from folder scope
    if (type !== 'folder') {
      setSelectedFolderId('');
    }
  };

  return (
    <div className="space-y-3">
      {/* Scope Type Toggle Buttons */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-secondary-600 dark:text-secondary-400 mr-1">
          Scope:
        </span>
        <div className="inline-flex rounded-lg border border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-800/50 p-0.5">
          {SCOPE_OPTIONS.map(({ type, label, icon: Icon }) => (
            <button
              key={type}
              onClick={() => handleScopeTypeClick(type)}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200',
                scope.type === type
                  ? 'bg-white dark:bg-secondary-700 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-secondary-200'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Folder Checkboxes for Organization scope - multi-select */}
      {scope.type === 'organization' && (
        <div>
          <p className="text-[10px] font-medium text-secondary-500 dark:text-secondary-400 uppercase mb-1.5">
            Filter by Folders
            {!scope.folderIds?.length && (
              <span className="normal-case font-normal ml-1">(optional - select to narrow search)</span>
            )}
          </p>
          {isLoadingFolders ? (
            <div className="flex items-center gap-2 text-xs text-secondary-500 dark:text-secondary-400">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary-500" />
              <span>Loading folders...</span>
            </div>
          ) : folders.length === 0 ? (
            <p className="text-xs text-secondary-500 dark:text-secondary-400">
              No folders available
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {folders.map(folder => {
                const isSelected = isFolderSelectedInOrg(folder.id);
                return (
                  <button
                    key={folder.id}
                    onClick={() => onToggleFolderInOrg(folder)}
                    className={clsx(
                      'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all',
                      'border',
                      isSelected
                        ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-300 dark:border-primary-700 text-primary-700 dark:text-primary-300'
                        : 'bg-white dark:bg-secondary-800 border-secondary-200 dark:border-secondary-600 text-secondary-700 dark:text-secondary-300 hover:border-secondary-300 dark:hover:border-secondary-500'
                    )}
                  >
                    <div className={clsx(
                      'w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0',
                      isSelected
                        ? 'bg-primary-600 border-primary-600'
                        : 'border-secondary-300 dark:border-secondary-500'
                    )}>
                      {isSelected && (
                        <CheckIcon className="w-2.5 h-2.5 text-white" />
                      )}
                    </div>
                    <FolderIcon className="w-3.5 h-3.5" />
                    <span className="max-w-[100px] truncate">{folder.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Folder Checkboxes - shown when folder scope is selected (single folder deep dive) */}
      {scope.type === 'folder' && (
        <div className="space-y-3">
          {/* Folder selection */}
          <div>
            <p className="text-[10px] font-medium text-secondary-500 dark:text-secondary-400 uppercase mb-1.5">
              Select Folder
            </p>
            {isLoadingFolders ? (
              <div className="flex items-center gap-2 text-xs text-secondary-500 dark:text-secondary-400">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary-500" />
                <span>Loading folders...</span>
              </div>
            ) : folders.length === 0 ? (
              <p className="text-xs text-secondary-500 dark:text-secondary-400">
                No folders available
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {folders.map(folder => {
                  const isSelected = selectedFolderId === folder.id;
                  return (
                    <button
                      key={folder.id}
                      onClick={() => handleFolderCheckboxClick(folder)}
                      className={clsx(
                        'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all',
                        'border',
                        isSelected
                          ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-300 dark:border-primary-700 text-primary-700 dark:text-primary-300'
                          : 'bg-white dark:bg-secondary-800 border-secondary-200 dark:border-secondary-600 text-secondary-700 dark:text-secondary-300 hover:border-secondary-300 dark:hover:border-secondary-500'
                      )}
                    >
                      <div className={clsx(
                        'w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0',
                        isSelected
                          ? 'bg-primary-600 border-primary-600'
                          : 'border-secondary-300 dark:border-secondary-500'
                      )}>
                        {isSelected && (
                          <CheckIcon className="w-2.5 h-2.5 text-white" />
                        )}
                      </div>
                      <FolderIcon className="w-3.5 h-3.5" />
                      <span className="max-w-[100px] truncate">{folder.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Documents in selected folder */}
          {selectedFolderId && (
            <div>
              <p className="text-[10px] font-medium text-secondary-500 dark:text-secondary-400 uppercase mb-1.5">
                Documents in {scope.folderName}
                {!scope.documentIds?.length && (
                  <span className="normal-case font-normal ml-1">(select documents to narrow search)</span>
                )}
              </p>
              {isLoadingDocuments ? (
                <div className="flex items-center gap-2 text-xs text-secondary-500 dark:text-secondary-400">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary-500" />
                  <span>Loading documents...</span>
                </div>
              ) : folderDocuments.length === 0 ? (
                <p className="text-xs text-secondary-500 dark:text-secondary-400">
                  No documents in this folder
                </p>
              ) : (
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {folderDocuments.map(doc => {
                    const isParsed = isDocumentParsed(doc);
                    const isSelected = isDocumentSelected(doc.id);

                    return (
                      <button
                        key={doc.id}
                        onClick={() => onToggleDocument(doc)}
                        disabled={!isParsed}
                        title={!isParsed ? 'Document must be parsed first' : doc.name}
                        className={clsx(
                          'inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs transition-all',
                          'border',
                          !isParsed
                            ? 'opacity-50 cursor-not-allowed border-secondary-200 dark:border-secondary-700 text-secondary-400'
                            : isSelected
                              ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-300 dark:border-primary-700 text-primary-700 dark:text-primary-300'
                              : 'bg-white dark:bg-secondary-800 border-secondary-200 dark:border-secondary-600 text-secondary-700 dark:text-secondary-300 hover:border-secondary-300 dark:hover:border-secondary-500'
                        )}
                      >
                        <div className={clsx(
                          'w-3 h-3 rounded border flex items-center justify-center flex-shrink-0',
                          !isParsed
                            ? 'border-secondary-300 dark:border-secondary-600 bg-secondary-100 dark:bg-secondary-800'
                            : isSelected
                              ? 'bg-primary-600 border-primary-600'
                              : 'border-secondary-300 dark:border-secondary-500'
                        )}>
                          {isSelected && isParsed && (
                            <CheckIcon className="w-2 h-2 text-white" />
                          )}
                        </div>
                        <DocumentTextIcon className="w-3 h-3 flex-shrink-0" />
                        <span className="max-w-[120px] truncate">{doc.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Document Selection - shown when documents scope is selected */}
      {scope.type === 'documents' && (
        <div className="flex items-center gap-2 flex-wrap">
          {/* Selected document chips */}
          {scope.documentNames && scope.documentNames.length > 0 ? (
            <>
              {scope.documentNames.map((name, index) => (
                <span
                  key={scope.documentIds?.[index] || index}
                  className={clsx(
                    'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs',
                    'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300'
                  )}
                >
                  <DocumentTextIcon className="w-3 h-3" />
                  <span className="max-w-[120px] truncate">{name}</span>
                  {onRemoveDocument && scope.documentIds && (
                    <button
                      onClick={() => onRemoveDocument(scope.documentIds![index])}
                      className="ml-0.5 hover:text-primary-900 dark:hover:text-primary-100"
                    >
                      <XMarkIcon className="w-3 h-3" />
                    </button>
                  )}
                </span>
              ))}
            </>
          ) : null}

          {/* Select Documents button */}
          <button
            onClick={onOpenDocumentModal}
            className={clsx(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium',
              'bg-secondary-100 dark:bg-secondary-700 text-secondary-700 dark:text-secondary-300',
              'hover:bg-secondary-200 dark:hover:bg-secondary-600 transition-colors'
            )}
          >
            <DocumentTextIcon className="w-3.5 h-3.5" />
            {scope.documentNames && scope.documentNames.length > 0
              ? 'Change Selection'
              : 'Select Documents'}
          </button>
        </div>
      )}

      {/* Scope Description */}
      <p className="text-xs text-secondary-500 dark:text-secondary-400 italic">
        {scopeDescription}
      </p>
    </div>
  );
}
