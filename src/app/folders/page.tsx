'use client';

import { useState } from 'react';
import AuthGuard from '@/components/guards/AuthGuard';
import { motion } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import FolderList from '@/components/folders/FolderList';
import FolderTreeView from '@/components/folders/FolderTreeView';
import CreateFolderModal from '@/components/folders/CreateFolderModal';
import EditFolderModal from '@/components/folders/EditFolderModal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import DocumentList from '@/components/documents/DocumentList';
import { useFolders, useDeleteFolder, useFolderDocuments } from '@/hooks/useFolders';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { Folder } from '@/types/api';
import toast from 'react-hot-toast';

export default function FoldersPage() {
  return (
    <AuthGuard>
      <FoldersPageContent />
    </AuthGuard>
  );
}

function FoldersPageContent() {
  const [folderSearchTerm, setFolderSearchTerm] = useState('');
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [deletingFolder, setDeletingFolder] = useState<Folder | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [viewMode, setViewMode] = useState<'tree' | 'grid'>('tree');

  const { user } = useAuth();
  const organizationId = user?.org_id || '';
  const queryClient = useQueryClient();
  
  const { data: foldersData, isLoading: foldersLoading, error: foldersError } = useFolders(
    organizationId,
    folderSearchTerm ? { name: folderSearchTerm } : undefined,
    !!organizationId
  );

  const { data: documentsData, isLoading: documentsLoading, error: documentsError } = useFolderDocuments(
    organizationId,
    selectedFolder?.id || '',
    selectedFolder?.name || '',
    !!selectedFolder && !!organizationId
  );
  
  const deleteFolder = useDeleteFolder();

  const handleCreateFolder = () => {
    setIsCreateFolderModalOpen(true);
  };

  const handleEditFolder = (folder: Folder) => {
    setEditingFolder(folder);
  };

  const handleDeleteFolder = (folder: Folder) => {
    setDeletingFolder(folder);
  };

  const confirmDeleteFolder = async () => {
    if (!deletingFolder) return;
    
    try {
      await deleteFolder.mutateAsync({
        orgId: deletingFolder.organization_id,
        folderId: deletingFolder.id,
      });
      toast.success(`Folder "${deletingFolder.name}" deleted successfully!`);
      setDeletingFolder(null);
    } catch (error) {
      console.error('Failed to delete folder:', error);
      toast.error('Failed to delete folder. Please try again.');
    }
  };

  const handleFolderClick = (folder: Folder) => {
    console.log('Clicked folder:', folder);
    setSelectedFolder(folder);
    toast.success(`Loading documents from "${folder.name}"`);
  };

  if (!organizationId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-lg text-secondary-600">Loading organization...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          {viewMode === 'tree' ? (
            <FolderTreeView
              folders={foldersData?.folders || []}
              isLoading={foldersLoading}
              error={foldersError?.message || null}
              onCreateFolder={handleCreateFolder}
              onEditFolder={handleEditFolder}
              onDeleteFolder={handleDeleteFolder}
              searchTerm={folderSearchTerm}
              onSearchChange={setFolderSearchTerm}
            />
          ) : (
            <FolderList
              folders={foldersData?.folders || []}
              isLoading={foldersLoading}
              error={foldersError?.message || null}
              onCreateFolder={handleCreateFolder}
              onEditFolder={handleEditFolder}
              onDeleteFolder={handleDeleteFolder}
              onFolderClick={handleFolderClick}
              searchTerm={folderSearchTerm}
              onSearchChange={setFolderSearchTerm}
            />
          )}
        </motion.div>
      </main>

      {/* Modals */}
      <CreateFolderModal
        isOpen={isCreateFolderModalOpen}
        onClose={() => setIsCreateFolderModalOpen(false)}
        organizationId={organizationId}
      />

      <EditFolderModal
        isOpen={!!editingFolder}
        onClose={() => setEditingFolder(null)}
        folder={editingFolder}
      />

      <ConfirmDialog
        isOpen={!!deletingFolder}
        onClose={() => setDeletingFolder(null)}
        onConfirm={confirmDeleteFolder}
        title="Delete Folder"
        message={deletingFolder ? `Are you sure you want to delete "${deletingFolder.name}"? This action cannot be undone.` : ''}
        confirmText="Delete"
        variant="danger"
        loading={deleteFolder.isPending}
      />
    </div>
  );
}