'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  DocumentTextIcon,
  CloudArrowUpIcon,
  FolderIcon,
} from '@heroicons/react/24/outline';
import Navbar from '@/components/layout/Navbar';
import Button from '@/components/ui/Button';
import DocumentsTab from '@/components/documents/DocumentsTab';
import FoldersTab from '@/components/documents/FoldersTab';
import DocumentUploadSection from '@/components/documents/DocumentUploadSection';
import { useFolders } from '@/hooks/useFolders';
import { useFolderActions } from '@/hooks/useFolderActions';
import { useAuth } from '@/hooks/useAuth';

type TabType = 'documents' | 'folders';

export default function DocumentsPageLayout() {
  const { user } = useAuth();
  const organizationId = user?.org_id || '';
  
  // Tab and search state
  const [activeTab, setActiveTab] = useState<TabType>('documents');
  const [searchTerm, setSearchTerm] = useState('');
  const [showUpload, setShowUpload] = useState(false);

  // Folder actions hook
  const folderActions = useFolderActions();

  // Fetch folders data
  const { data: foldersData } = useFolders(
    organizationId,
    folderActions.folderSearchTerm ? { name: folderActions.folderSearchTerm } : undefined,
    !!organizationId
  );

  const handleFolderClick = (folder: any) => {
    folderActions.handleFolderClick(folder, () => setActiveTab('documents'));
  };

  const handleTabSwitch = (tab: TabType) => {
    setActiveTab(tab);
    // Clear search when switching tabs
    setSearchTerm('');
    folderActions.setFolderSearchTerm('');
  };

  const getTabSearchTerm = () => {
    return activeTab === 'folders' ? folderActions.folderSearchTerm : searchTerm;
  };

  const handleSearchChange = (term: string) => {
    if (activeTab === 'folders') {
      folderActions.setFolderSearchTerm(term);
    } else {
      setSearchTerm(term);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          {/* Page Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-poppins font-bold text-secondary-900 flex items-center space-x-3">
                <DocumentTextIcon className="w-8 h-8 text-primary-600" />
                <span>Document Management</span>
              </h1>
              <p className="text-lg text-secondary-600 mt-2">
                Upload, organize, and manage your business documents with AI-powered insights
              </p>
            </div>
            
            <div className="flex space-x-3">
              {activeTab === 'folders' && (
                <Button
                  variant="outline"
                  icon={<FolderIcon className="w-4 h-4" />}
                  onClick={folderActions.handleCreateFolder}
                >
                  New Folder
                </Button>
              )}
              <Button
                variant="primary"
                icon={<CloudArrowUpIcon className="w-4 h-4" />}
                className="shadow-lg"
                onClick={() => setShowUpload(!showUpload)}
              >
                Upload Documents
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <div className="border-b border-secondary-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => handleTabSwitch('documents')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    activeTab === 'documents'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <DocumentTextIcon className="w-4 h-4" />
                    <span>Documents</span>
                  </div>
                </button>
                <button
                  onClick={() => handleTabSwitch('folders')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    activeTab === 'folders'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <FolderIcon className="w-4 h-4" />
                    <span>Folders</span>
                  </div>
                </button>
              </nav>
            </div>
          </div>

          {/* Upload Section */}
          <DocumentUploadSection
            isVisible={showUpload}
            folders={foldersData?.folders || []}
            selectedUploadFolder={folderActions.selectedUploadFolder}
            onFolderChange={folderActions.setSelectedUploadFolder}
            selectedViewFolder={folderActions.selectedViewFolder}
          />

          {/* Tab Content */}
          {activeTab === 'documents' ? (
            <DocumentsTab
              searchTerm={getTabSearchTerm()}
              onSearchChange={handleSearchChange}
              selectedViewFolder={folderActions.selectedViewFolder}
              onClearFolderSelection={folderActions.clearFolderSelection}
            />
          ) : (
            <FoldersTab
              searchTerm={getTabSearchTerm()}
              onSearchChange={handleSearchChange}
              onFolderClick={handleFolderClick}
              isCreateFolderModalOpen={folderActions.isCreateFolderModalOpen}
              editingFolder={folderActions.editingFolder}
              deletingFolder={folderActions.deletingFolder}
              onCloseCreateFolderModal={folderActions.closeCreateFolderModal}
              onCloseEditFolderModal={folderActions.closeEditFolderModal}
              onCloseDeletingFolderDialog={folderActions.closeDeletingFolderDialog}
              onEditFolder={folderActions.handleEditFolder}
              onDeleteFolder={folderActions.handleDeleteFolder}
              onConfirmDeleteFolder={folderActions.confirmDeleteFolder}
            />
          )}
        </motion.div>
      </main>
    </div>
  );
}