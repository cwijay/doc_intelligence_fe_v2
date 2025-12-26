'use client';

import { motion } from 'framer-motion';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { Card, CardContent } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import FolderList from '@/components/folders/FolderList';
import CreateFolderModal from '@/components/folders/CreateFolderModal';
import EditFolderModal from '@/components/folders/EditFolderModal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useFolders } from '@/hooks/useFolders';
import { useAuth } from '@/hooks/useAuth';
import { Folder } from '@/types/api';

interface FoldersTabProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onFolderClick: (folder: Folder) => void;
  
  // Modal states
  isCreateFolderModalOpen: boolean;
  editingFolder: Folder | null;
  deletingFolder: Folder | null;
  
  // Modal handlers
  onCloseCreateFolderModal: () => void;
  onCloseEditFolderModal: () => void;
  onCloseDeletingFolderDialog: () => void;
  onEditFolder: (folder: Folder) => void;
  onDeleteFolder: (folder: Folder) => void;
  onConfirmDeleteFolder: () => void;
}

export default function FoldersTab({
  searchTerm,
  onSearchChange,
  onFolderClick,
  isCreateFolderModalOpen,
  editingFolder,
  deletingFolder,
  onCloseCreateFolderModal,
  onCloseEditFolderModal,
  onCloseDeletingFolderDialog,
  onEditFolder,
  onDeleteFolder,
  onConfirmDeleteFolder,
}: FoldersTabProps) {
  const { user } = useAuth();
  const organizationId = user?.org_id || '';

  const { data: foldersData, isLoading: foldersLoading, error: foldersError } = useFolders(
    organizationId,
    searchTerm ? { name: searchTerm } : undefined,
    !!organizationId
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Search */}
      <Card>
        <CardContent className="py-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary-400" />
            <Input
              placeholder="Search folders..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Folders List */}
      {foldersError ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <MagnifyingGlassIcon className="w-12 h-12 text-error-400" />
              </div>
              <h3 className="text-xl font-semibold text-error-900 mb-2">
                Error Loading Folders
              </h3>
              <p className="text-error-600">
                Failed to load folders. Please try refreshing the page.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <FolderList
          folders={foldersData?.folders || []}
          isLoading={foldersLoading}
          onEditFolder={onEditFolder}
          onDeleteFolder={onDeleteFolder}
          onFolderClick={onFolderClick}
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
        />
      )}

      {/* Modals */}
      <CreateFolderModal
        isOpen={isCreateFolderModalOpen}
        onClose={onCloseCreateFolderModal}
        organizationId={organizationId}
      />

      <EditFolderModal
        isOpen={!!editingFolder}
        onClose={onCloseEditFolderModal}
        folder={editingFolder}
      />

      <ConfirmDialog
        isOpen={!!deletingFolder}
        onClose={onCloseDeletingFolderDialog}
        onConfirm={onConfirmDeleteFolder}
        title="Delete Folder"
        message={
          deletingFolder
            ? `Are you sure you want to delete the folder "${deletingFolder.name}"? This action cannot be undone and will affect all documents in this folder.`
            : ''
        }
        confirmText="Delete"
        variant="danger"
      />
    </motion.div>
  );
}