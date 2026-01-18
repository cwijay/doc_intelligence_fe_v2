'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  FolderIcon,
  DocumentTextIcon,
  CheckIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react';
import Button from '@/components/ui/Button';
import { Document, Folder } from '@/types/api';
import { isDocumentParsed } from '@/lib/document-utils';
import { clsx } from 'clsx';

interface DocumentScopeModalProps {
  isOpen: boolean;
  onClose: () => void;
  folders: Folder[];
  documents: Document[];
  selectedDocumentIds: string[];
  isLoadingDocuments?: boolean;
  onConfirm: (documents: Document[]) => void;
}

export default function DocumentScopeModal({
  isOpen,
  onClose,
  folders,
  documents,
  selectedDocumentIds,
  isLoadingDocuments = false,
  onConfirm,
}: DocumentScopeModalProps) {
  // Local state for selections during modal session
  const [localSelectedIds, setLocalSelectedIds] = useState<Set<string>>(new Set());
  // Store active folder name (not ID) for filtering, since documents have folder_name from path normalization
  const [activeFolderName, setActiveFolderName] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Reset local state when modal opens
  useEffect(() => {
    if (isOpen) {
      setLocalSelectedIds(new Set(selectedDocumentIds));
      setActiveFolderName(null);
      setSearchQuery('');
    }
  }, [isOpen, selectedDocumentIds]);

  // Filter documents by active folder name and search query
  const filteredDocuments = useMemo(() => {
    let filtered = documents;

    // Filter by folder name if one is selected
    // Documents have folder_name extracted from storage path during normalization
    if (activeFolderName) {
      filtered = filtered.filter(doc => doc.folder_name === activeFolderName);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(doc =>
        doc.name.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [documents, activeFolderName, searchQuery]);

  // Get parsed documents only for selection
  const parsedDocuments = useMemo(() =>
    filteredDocuments.filter(doc => isDocumentParsed(doc)),
    [filteredDocuments]
  );

  // Toggle document selection
  const toggleDocument = useCallback((docId: string, event?: React.MouseEvent) => {
    const doc = documents.find(d => d.id === docId);
    if (!doc || !isDocumentParsed(doc)) return;

    const newSelection = new Set(localSelectedIds);

    // Handle shift-click for range selection
    if (event?.shiftKey && filteredDocuments.length > 0) {
      const clickedIndex = filteredDocuments.findIndex(d => d.id === docId);
      const lastSelectedIndex = filteredDocuments.findIndex(d =>
        Array.from(localSelectedIds).includes(d.id)
      );

      if (lastSelectedIndex !== -1 && clickedIndex !== lastSelectedIndex) {
        const startIndex = Math.min(clickedIndex, lastSelectedIndex);
        const endIndex = Math.max(clickedIndex, lastSelectedIndex);

        // Select all parsed documents in range
        for (let i = startIndex; i <= endIndex; i++) {
          const d = filteredDocuments[i];
          if (isDocumentParsed(d)) {
            newSelection.add(d.id);
          }
        }
      } else {
        if (newSelection.has(docId)) {
          newSelection.delete(docId);
        } else {
          newSelection.add(docId);
        }
      }
    } else {
      if (newSelection.has(docId)) {
        newSelection.delete(docId);
      } else {
        newSelection.add(docId);
      }
    }

    setLocalSelectedIds(newSelection);
  }, [documents, localSelectedIds, filteredDocuments]);

  // Select/deselect all visible parsed documents
  const toggleSelectAll = useCallback(() => {
    const allParsedSelected = parsedDocuments.every(doc => localSelectedIds.has(doc.id));

    if (allParsedSelected) {
      // Deselect all visible
      const newSelection = new Set(localSelectedIds);
      parsedDocuments.forEach(doc => newSelection.delete(doc.id));
      setLocalSelectedIds(newSelection);
    } else {
      // Select all visible parsed documents
      const newSelection = new Set(localSelectedIds);
      parsedDocuments.forEach(doc => newSelection.add(doc.id));
      setLocalSelectedIds(newSelection);
    }
  }, [parsedDocuments, localSelectedIds]);

  // Handle confirm
  const handleConfirm = useCallback(() => {
    const selectedDocs = documents.filter(doc => localSelectedIds.has(doc.id));
    onConfirm(selectedDocs);
    onClose();
  }, [documents, localSelectedIds, onConfirm, onClose]);

  // Get document count for each folder (by folder name, not ID)
  const folderDocumentCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    documents.forEach(doc => {
      if (doc.folder_name) {
        counts[doc.folder_name] = (counts[doc.folder_name] || 0) + 1;
      }
    });
    return counts;
  }, [documents]);

  const isAllSelected = parsedDocuments.length > 0 &&
    parsedDocuments.every(doc => localSelectedIds.has(doc.id));

  const isSomeSelected = parsedDocuments.some(doc => localSelectedIds.has(doc.id));

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
          <DialogBackdrop className="fixed inset-0 bg-black/30 dark:bg-black/50" />

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <DialogPanel
                as={motion.div}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-4xl bg-white dark:bg-secondary-900 rounded-xl shadow-xl overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-secondary-200 dark:border-secondary-700">
                  <div>
                    <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                      Select Documents
                    </h3>
                    <p className="text-sm text-secondary-500 dark:text-secondary-400">
                      Choose documents to chat with ({localSelectedIds.size} selected)
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5 text-secondary-500" />
                  </button>
                </div>

                {/* Body - Two Panel Layout */}
                <div className="flex h-[480px]">
                  {/* Left Panel - Folders */}
                  <div className="w-64 border-r border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-800/50 overflow-y-auto">
                    <div className="p-3">
                      <h4 className="text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase mb-2">
                        Folders
                      </h4>

                      {/* All Documents option */}
                      <button
                        onClick={() => setActiveFolderName(null)}
                        className={clsx(
                          'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors mb-1',
                          !activeFolderName
                            ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300'
                            : 'text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700'
                        )}
                      >
                        <DocumentTextIcon className="w-4 h-4" />
                        <span className="flex-1 text-left">All Documents</span>
                        <span className="text-xs text-secondary-500">
                          {documents.length}
                        </span>
                      </button>

                      {/* Folder list */}
                      {folders.map(folder => (
                        <button
                          key={folder.id}
                          onClick={() => setActiveFolderName(folder.name)}
                          className={clsx(
                            'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors mb-1',
                            activeFolderName === folder.name
                              ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300'
                              : 'text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700'
                          )}
                        >
                          <FolderIcon className="w-4 h-4" />
                          <span className="flex-1 text-left truncate">{folder.name}</span>
                          <span className="text-xs text-secondary-500">
                            {folderDocumentCounts[folder.name] || 0}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Right Panel - Documents */}
                  <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Search and Select All */}
                    <div className="p-3 border-b border-secondary-200 dark:border-secondary-700 space-y-2">
                      {/* Search */}
                      <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search documents..."
                          className={clsx(
                            'w-full pl-9 pr-3 py-2 text-sm rounded-lg',
                            'border border-secondary-300 dark:border-secondary-600',
                            'bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100',
                            'placeholder-secondary-400 dark:placeholder-secondary-500',
                            'focus:ring-2 focus:ring-primary-500 focus:border-transparent'
                          )}
                        />
                      </div>

                      {/* Select All */}
                      <div className="flex items-center justify-between">
                        <button
                          onClick={toggleSelectAll}
                          disabled={parsedDocuments.length === 0}
                          className={clsx(
                            'flex items-center gap-2 text-sm',
                            parsedDocuments.length > 0
                              ? 'text-primary-600 dark:text-primary-400 hover:text-primary-700'
                              : 'text-secondary-400 cursor-not-allowed'
                          )}
                        >
                          <div className={clsx(
                            'w-4 h-4 rounded border flex items-center justify-center',
                            isAllSelected
                              ? 'bg-primary-600 border-primary-600'
                              : isSomeSelected
                                ? 'border-primary-600 bg-primary-100'
                                : 'border-secondary-300 dark:border-secondary-600'
                          )}>
                            {(isAllSelected || isSomeSelected) && (
                              <CheckIcon className={clsx(
                                'w-3 h-3',
                                isAllSelected ? 'text-white' : 'text-primary-600'
                              )} />
                            )}
                          </div>
                          Select All Parsed
                        </button>

                        <span className="text-xs text-secondary-500">
                          {parsedDocuments.length} of {filteredDocuments.length} selectable
                        </span>
                      </div>
                    </div>

                    {/* Document List */}
                    <div className="flex-1 overflow-y-auto p-3">
                      {isLoadingDocuments ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
                        </div>
                      ) : filteredDocuments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-secondary-500">
                          <DocumentTextIcon className="w-12 h-12 mb-2 opacity-50" />
                          <p className="text-sm">No documents found</p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {filteredDocuments.map(doc => {
                            const isParsed = isDocumentParsed(doc);
                            const isSelected = localSelectedIds.has(doc.id);

                            return (
                              <button
                                key={doc.id}
                                onClick={(e) => toggleDocument(doc.id, e)}
                                disabled={!isParsed}
                                className={clsx(
                                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors',
                                  isParsed
                                    ? isSelected
                                      ? 'bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800'
                                      : 'hover:bg-secondary-100 dark:hover:bg-secondary-700 border border-transparent'
                                    : 'opacity-50 cursor-not-allowed border border-transparent'
                                )}
                              >
                                {/* Checkbox */}
                                <div className={clsx(
                                  'w-5 h-5 rounded border flex items-center justify-center flex-shrink-0',
                                  isSelected
                                    ? 'bg-primary-600 border-primary-600'
                                    : isParsed
                                      ? 'border-secondary-300 dark:border-secondary-600'
                                      : 'border-secondary-200 dark:border-secondary-700 bg-secondary-100 dark:bg-secondary-800'
                                )}>
                                  {isSelected && (
                                    <CheckIcon className="w-3 h-3 text-white" />
                                  )}
                                </div>

                                {/* Document info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <DocumentTextIcon className="w-4 h-4 text-secondary-400 flex-shrink-0" />
                                    <span className={clsx(
                                      'text-sm truncate',
                                      isParsed
                                        ? 'text-secondary-900 dark:text-secondary-100'
                                        : 'text-secondary-500'
                                    )}>
                                      {doc.name}
                                    </span>
                                  </div>
                                  {!isParsed && (
                                    <div className="flex items-center gap-1 mt-0.5 text-xs text-warning-600 dark:text-warning-400">
                                      <ExclamationTriangleIcon className="w-3 h-3" />
                                      <span>Not parsed - parse first to enable chat</span>
                                    </div>
                                  )}
                                </div>

                                {/* Status badge */}
                                <span className={clsx(
                                  'text-xs px-2 py-0.5 rounded-full flex-shrink-0',
                                  isParsed
                                    ? 'bg-success-100 dark:bg-success-900/40 text-success-700 dark:text-success-300'
                                    : 'bg-secondary-100 dark:bg-secondary-800 text-secondary-500'
                                )}>
                                  {doc.status}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-800/50">
                  <p className="text-sm text-secondary-500">
                    {localSelectedIds.size} document{localSelectedIds.size !== 1 ? 's' : ''} selected
                  </p>
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleConfirm}
                      disabled={localSelectedIds.size === 0}
                    >
                      Confirm Selection
                    </Button>
                  </div>
                </div>
              </DialogPanel>
            </div>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  );
}
