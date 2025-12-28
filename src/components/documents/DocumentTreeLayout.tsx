'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronRightIcon,
  HomeIcon,
  FolderIcon,
  DocumentTextIcon,
  CloudArrowUpIcon,
} from '@heroicons/react/24/outline';
import Navbar from '@/components/layout/Navbar';
import Button from '@/components/ui/Button';
import DocumentTreeSidebar from './DocumentTreeSidebar';
import DocumentsTab from './DocumentsTab';
import DocumentUploadSection from './DocumentUploadSection';
import CreateFolderModal from '@/components/folders/CreateFolderModal';
import { useSidebarState } from '@/hooks/useSidebarState';
import { useTreeSelection } from '@/hooks/useTreeSelection';
import { useFolders } from '@/hooks/useFolders';
import { useAuth } from '@/hooks/useAuth';
import { Folder, FolderList } from '@/types/api';

export default function DocumentTreeLayout() {
  const { user } = useAuth();
  const organizationId = user?.org_id || '';
  const organizationName = user?.org_name || 'Organization';

  // Sidebar state
  const {
    sidebarState,
    toggleCollapse,
    toggleVisibility,
    customWidth,
    setCustomWidth,
    minWidth,
    maxWidth,
  } = useSidebarState();

  // Tree selection state
  const {
    selectedFolderId,
    selectedDocumentId,
    multiSelectedFolderIds,
    multiSelectedDocumentIds,
    selectFolder,
    selectDocument,
    toggleFolderMultiSelect,
    toggleDocumentMultiSelect,
    toggleFolderWithDocuments,
    selectAllDocuments,
    clearMultiSelection,
    clearDocumentMultiSelection,
  } = useTreeSelection();

  // Search state for documents
  const [searchTerm, setSearchTerm] = useState('');

  // Upload state
  const [showUpload, setShowUpload] = useState(false);
  const [selectedUploadFolder, setSelectedUploadFolder] = useState<string | null>(null);

  // Create folder modal state
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);

  // Fetch folders
  const {
    data: foldersData,
    isLoading: foldersLoading,
    refetch: refetchFolders,
  } = useFolders(organizationId, undefined, !!organizationId);

  const folders: Folder[] = (foldersData as FolderList | undefined)?.folders || [];

  // Get selected folder name for breadcrumb
  const selectedFolderName = useMemo(() => {
    if (!selectedFolderId) return null;
    const folder = folders.find((f: Folder) => f.id === selectedFolderId);
    return folder?.name || null;
  }, [selectedFolderId, folders]);

  // Handle folder selection from sidebar
  const handleFolderSelect = useCallback((folderId: string | null) => {
    selectFolder(folderId);
    // Clear document search when changing folders
    setSearchTerm('');
  }, [selectFolder]);

  // Handle clear folder selection (back to all documents)
  const handleClearFolderSelection = useCallback(() => {
    selectFolder(null);
    setSearchTerm('');
  }, [selectFolder]);

  // Handle create folder
  const handleCreateFolder = useCallback(() => {
    setIsCreateFolderModalOpen(true);
  }, []);

  const handleCloseFolderModal = useCallback(() => {
    setIsCreateFolderModalOpen(false);
    // Refetch folders to update the list
    refetchFolders();
  }, [refetchFolders]);

  // Document selection handler for sidebar
  const handleDocumentSelect = useCallback((documentId: string | null) => {
    selectDocument(documentId);
  }, [selectDocument]);

  // Breadcrumb component
  const Breadcrumb = () => (
    <div className="flex items-center space-x-2 text-sm">
      <button
        onClick={handleClearFolderSelection}
        className={`flex items-center space-x-1 transition-colors
          ${selectedFolderId === null
            ? 'text-primary-600 dark:text-primary-400 font-medium'
            : 'text-secondary-500 dark:text-secondary-400 hover:text-secondary-700 dark:hover:text-secondary-300'
          }`}
      >
        <HomeIcon className="w-4 h-4" />
        <span>{organizationName}</span>
      </button>

      {selectedFolderName && (
        <>
          <ChevronRightIcon className="w-4 h-4 text-secondary-400 dark:text-secondary-500" />
          <span className="flex items-center space-x-1 text-primary-600 dark:text-primary-400 font-medium">
            <FolderIcon className="w-4 h-4" />
            <span>{selectedFolderName}</span>
          </span>
        </>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f5f5] via-[#f0fafa] to-[#fef6f3] dark:from-brand-navy-500 dark:via-brand-navy-600 dark:to-brand-navy-700 transition-colors duration-200">
      <Navbar />

      {/* Main Content Area */}
      <div className="flex h-[calc(100vh-64px)]">
        {/* Sidebar */}
        <DocumentTreeSidebar
          sidebarState={sidebarState}
          onToggleCollapse={toggleCollapse}
          onToggleVisibility={toggleVisibility}
          organizationName={organizationName}
          folders={folders}
          foldersLoading={foldersLoading}
          selectedFolderId={selectedFolderId}
          selectedDocumentId={selectedDocumentId}
          multiSelectedFolderIds={multiSelectedFolderIds}
          multiSelectedDocumentIds={multiSelectedDocumentIds}
          onFolderSelect={handleFolderSelect}
          onDocumentSelect={handleDocumentSelect}
          onFolderMultiSelect={toggleFolderMultiSelect}
          onDocumentMultiSelect={toggleDocumentMultiSelect}
          onFolderCheckboxWithDocuments={toggleFolderWithDocuments}
          onCreateFolder={handleCreateFolder}
          customWidth={customWidth}
          onWidthChange={setCustomWidth}
          minWidth={minWidth}
          maxWidth={maxWidth}
        />

        {/* Content Area */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Page Header */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-poppins font-bold text-secondary-900 dark:text-secondary-100 flex items-center space-x-3">
                    <DocumentTextIcon className="w-7 h-7 text-primary-600 dark:text-primary-400" />
                    <span>Document Management</span>
                  </h1>
                  <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">
                    Upload, organize, and manage your documents with AI-powered insights
                  </p>
                </div>
                <Button
                  variant="primary"
                  icon={<CloudArrowUpIcon className="w-4 h-4" />}
                  className="shadow-lg"
                  onClick={() => setShowUpload(!showUpload)}
                >
                  {showUpload ? 'Hide Upload' : 'Upload Documents'}
                </Button>
              </div>

              {/* Breadcrumb */}
              <Breadcrumb />
            </motion.div>

            {/* Upload Section */}
            <DocumentUploadSection
              isVisible={showUpload}
              folders={folders}
              selectedUploadFolder={selectedUploadFolder}
              onFolderChange={setSelectedUploadFolder}
              selectedViewFolder={selectedFolderId}
            />

            {/* Documents Tab */}
            <DocumentsTab
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              selectedViewFolder={selectedFolderId}
              onClearFolderSelection={handleClearFolderSelection}
              highlightedDocumentId={selectedDocumentId}
              multiSelectedDocumentIds={multiSelectedDocumentIds}
              onSelectAllDocuments={selectAllDocuments}
              clearDocumentMultiSelection={clearDocumentMultiSelection}
            />
          </div>
        </main>
      </div>

      {/* Create Folder Modal */}
      <CreateFolderModal
        isOpen={isCreateFolderModalOpen}
        onClose={handleCloseFolderModal}
        organizationId={organizationId}
      />
    </div>
  );
}
