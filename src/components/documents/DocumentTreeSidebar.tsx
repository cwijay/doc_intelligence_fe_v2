'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  Bars3Icon,
  XMarkIcon,
  MagnifyingGlassIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import TreeNode, { TreeNodeBadge } from './TreeNode';
import { Folder, Document, DocumentStatus } from '@/types/api';
import { useFolderDocuments } from '@/hooks/useFolders';
import { useAuth } from '@/hooks/useAuth';
import { SidebarState } from '@/hooks/useSidebarState';

interface DocumentTreeSidebarProps {
  sidebarState: SidebarState;
  onToggleCollapse: () => void;
  onToggleVisibility: () => void;
  organizationName: string;
  folders: Folder[];
  foldersLoading?: boolean;
  selectedFolderId: string | null;
  selectedDocumentId: string | null;
  multiSelectedFolderIds: Set<string>;
  multiSelectedDocumentIds: Set<string>;
  onFolderSelect: (folderId: string | null) => void;
  onDocumentSelect: (documentId: string | null) => void;
  onFolderMultiSelect: (folderId: string) => void;
  onDocumentMultiSelect: (documentId: string) => void;
  onCreateFolder?: () => void;
  // Resizable sidebar
  customWidth: number;
  onWidthChange: (width: number) => void;
  minWidth: number;
  maxWidth: number;
}

interface ExpandedFoldersState {
  [folderId: string]: boolean;
}

// Component for rendering documents within a folder
function FolderDocuments({
  folderId,
  folderName,
  isCollapsedMode,
  selectedDocumentId,
  multiSelectedDocumentIds,
  onDocumentSelect,
  onDocumentMultiSelect,
}: {
  folderId: string;
  folderName: string;
  isCollapsedMode: boolean;
  selectedDocumentId: string | null;
  multiSelectedDocumentIds: Set<string>;
  onDocumentSelect: (documentId: string | null) => void;
  onDocumentMultiSelect: (documentId: string) => void;
}) {
  const { user } = useAuth();
  const organizationId = user?.org_id || '';

  const { data: documentsData, isLoading } = useFolderDocuments(
    organizationId,
    folderId,
    folderName,
    !!organizationId && !!folderId && !!folderName
  );

  if (isLoading) {
    return (
      <div className="py-2 px-4">
        <div className="flex items-center space-x-2 text-xs text-secondary-500 dark:text-secondary-400">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary-500"></div>
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (!documentsData?.documents?.length) {
    return (
      <div className="py-1 px-4 text-xs text-secondary-400 dark:text-secondary-500 italic">
        {isCollapsedMode ? '' : 'No documents'}
      </div>
    );
  }

  return (
    <div className="py-1">
      {documentsData.documents.map((doc: Document) => {
        // Build badges for document features
        const badges: TreeNodeBadge[] = [];
        if (doc.indexed_at) {
          badges.push({ type: 'indexed', tooltip: 'Indexed for search' });
        }

        return (
          <TreeNode
            key={doc.id}
            id={doc.id}
            type="document"
            name={doc.name}
            level={2}
            isSelected={selectedDocumentId === doc.id}
            isMultiSelected={multiSelectedDocumentIds.has(doc.id)}
            documentType={doc.type}
            status={doc.status as DocumentStatus}
            badges={badges}
            onClick={() => onDocumentSelect(doc.id)}
            onCheckboxChange={() => onDocumentMultiSelect(doc.id)}
            isCollapsedMode={isCollapsedMode}
            showCheckbox={!isCollapsedMode}
          />
        );
      })}
    </div>
  );
}

export default function DocumentTreeSidebar({
  sidebarState,
  onToggleCollapse,
  onToggleVisibility,
  organizationName,
  folders,
  foldersLoading = false,
  selectedFolderId,
  selectedDocumentId,
  multiSelectedFolderIds,
  multiSelectedDocumentIds,
  onFolderSelect,
  onDocumentSelect,
  onFolderMultiSelect,
  onDocumentMultiSelect,
  onCreateFolder,
  // Resizable sidebar
  customWidth,
  onWidthChange,
  minWidth,
  maxWidth,
}: DocumentTreeSidebarProps) {
  const [expandedFolders, setExpandedFolders] = useState<ExpandedFoldersState>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [isOrgExpanded, setIsOrgExpanded] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  const isCollapsed = sidebarState === 'collapsed';
  const isHidden = sidebarState === 'hidden';

  // Handle drag resize
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      const newWidth = Math.min(maxWidth, Math.max(minWidth, e.clientX));
      onWidthChange(newWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    // Set cursor and disable text selection during drag
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, minWidth, maxWidth, onWidthChange]);

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  // Toggle folder expansion
  const toggleFolderExpand = useCallback((folderId: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  }, []);

  // Filter folders by search term
  const filteredFolders = useMemo(() => {
    if (!searchTerm.trim()) return folders;
    const term = searchTerm.toLowerCase();
    return folders.filter(folder =>
      folder.name.toLowerCase().includes(term) ||
      folder.description?.toLowerCase().includes(term)
    );
  }, [folders, searchTerm]);

  // Calculate total document count
  const totalDocumentCount = useMemo(() => {
    return folders.reduce((sum, folder) => sum + (folder.document_count || 0), 0);
  }, [folders]);

  // Sidebar width based on state
  const sidebarWidth = isCollapsed ? 64 : customWidth;

  // Hidden state - render a floating toggle button
  if (isHidden) {
    return (
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        onClick={onToggleVisibility}
        className="fixed left-4 top-20 z-40 p-2 rounded-lg bg-white dark:bg-gray-800 shadow-lg
                   border border-secondary-200 dark:border-secondary-700
                   hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-colors"
        title="Show sidebar"
      >
        <Bars3Icon className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
      </motion.button>
    );
  }

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarWidth }}
      transition={{ duration: isDragging ? 0 : 0.2, ease: 'easeInOut' }}
      className="relative flex-shrink-0 h-full bg-white dark:bg-gray-900 border-r border-secondary-200 dark:border-secondary-700
                 flex flex-col overflow-hidden"
    >
      {/* Drag Handle (only in expanded mode) */}
      {!isCollapsed && (
        <div
          onMouseDown={handleDragStart}
          className={`absolute right-0 top-0 h-full w-1 cursor-col-resize z-10
                     transition-colors duration-150
                     ${isDragging
                       ? 'bg-primary-500 dark:bg-primary-400'
                       : 'hover:bg-primary-400 dark:hover:bg-primary-500 bg-transparent'}`}
          title="Drag to resize"
        />
      )}

      {/* Sidebar Header */}
      <div className="flex-shrink-0 p-3 border-b border-secondary-200 dark:border-secondary-700">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <h2 className="text-sm font-semibold text-secondary-900 dark:text-secondary-100 truncate">
              Documents
            </h2>
          )}
          <div className="flex items-center gap-1">
            {/* Collapse/Expand Toggle */}
            <button
              onClick={onToggleCollapse}
              className="p-1.5 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? (
                <ChevronDoubleRightIcon className="w-4 h-4 text-secondary-500 dark:text-secondary-400" />
              ) : (
                <ChevronDoubleLeftIcon className="w-4 h-4 text-secondary-500 dark:text-secondary-400" />
              )}
            </button>
            {/* Hide Toggle */}
            <button
              onClick={onToggleVisibility}
              className="p-1.5 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors"
              title="Hide sidebar"
            >
              <XMarkIcon className="w-4 h-4 text-secondary-500 dark:text-secondary-400" />
            </button>
          </div>
        </div>

        {/* Search (only in expanded mode) */}
        {!isCollapsed && (
          <div className="mt-3 relative">
            <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary-400" />
            <input
              type="text"
              placeholder="Search folders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg
                         border border-secondary-200 dark:border-secondary-700
                         bg-secondary-50 dark:bg-secondary-800
                         text-secondary-900 dark:text-secondary-100
                         placeholder-secondary-400 dark:placeholder-secondary-500
                         focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400
                         focus:border-transparent"
            />
          </div>
        )}
      </div>

      {/* Tree Content */}
      <div className="flex-1 overflow-y-auto py-2">
        {foldersLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <>
            {/* Organization Root Node */}
            <TreeNode
              id="org-root"
              type="organization"
              name={organizationName || 'Organization'}
              level={0}
              isExpanded={isOrgExpanded}
              isSelected={selectedFolderId === null}
              hasChildren={filteredFolders.length > 0}
              childCount={totalDocumentCount}
              onToggleExpand={() => setIsOrgExpanded(!isOrgExpanded)}
              onClick={() => onFolderSelect(null)}
              isCollapsedMode={isCollapsed}
              showCheckbox={false}
            />

            {/* Folders */}
            <AnimatePresence>
              {isOrgExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {filteredFolders.length === 0 ? (
                    <div className={`py-4 text-center ${isCollapsed ? '' : 'px-4'}`}>
                      {!isCollapsed && (
                        <>
                          <p className="text-sm text-secondary-500 dark:text-secondary-400">
                            {searchTerm ? 'No folders match your search' : 'No folders yet'}
                          </p>
                          {!searchTerm && onCreateFolder && (
                            <button
                              onClick={onCreateFolder}
                              className="mt-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                            >
                              Create your first folder
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  ) : (
                    filteredFolders.map((folder) => {
                      const isFolderExpanded = expandedFolders[folder.id] || false;

                      return (
                        <div key={folder.id}>
                          <TreeNode
                            id={folder.id}
                            type="folder"
                            name={folder.name}
                            level={1}
                            isExpanded={isFolderExpanded}
                            isSelected={selectedFolderId === folder.id}
                            isMultiSelected={multiSelectedFolderIds.has(folder.id)}
                            hasChildren={true}
                            childCount={folder.document_count}
                            onToggleExpand={() => toggleFolderExpand(folder.id)}
                            onClick={() => onFolderSelect(folder.id)}
                            onCheckboxChange={() => onFolderMultiSelect(folder.id)}
                            isCollapsedMode={isCollapsed}
                            showCheckbox={!isCollapsed}
                          />

                          {/* Documents in folder (when expanded) */}
                          <AnimatePresence>
                            {isFolderExpanded && !isCollapsed && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.15 }}
                              >
                                <FolderDocuments
                                  folderId={folder.id}
                                  folderName={folder.name}
                                  isCollapsedMode={isCollapsed}
                                  selectedDocumentId={selectedDocumentId}
                                  multiSelectedDocumentIds={multiSelectedDocumentIds}
                                  onDocumentSelect={onDocumentSelect}
                                  onDocumentMultiSelect={onDocumentMultiSelect}
                                />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>

      {/* Create Folder Button (only in expanded mode) */}
      {!isCollapsed && onCreateFolder && (
        <div className="flex-shrink-0 p-3 border-t border-secondary-200 dark:border-secondary-700">
          <button
            onClick={onCreateFolder}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium
                       rounded-lg border border-dashed border-secondary-300 dark:border-secondary-600
                       text-secondary-600 dark:text-secondary-400
                       hover:border-primary-500 hover:text-primary-600
                       dark:hover:border-primary-400 dark:hover:text-primary-400
                       transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            <span>New Folder</span>
          </button>
        </div>
      )}
    </motion.aside>
  );
}
