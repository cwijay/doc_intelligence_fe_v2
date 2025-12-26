'use client';

import { useState, useCallback, useEffect } from 'react';
import { Folder } from '@/types/api';
import { useDeleteFolder, useFolders } from '@/hooks/useFolders';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

export function useFolderActions() {
  const { user } = useAuth();
  const organizationId = user?.org_id || '';
  
  // Folder modal states
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [deletingFolder, setDeletingFolder] = useState<Folder | null>(null);
  
  // Selected folders for different operations
  const [selectedUploadFolder, setSelectedUploadFolder] = useState<string | null>(null);
  const [selectedViewFolder, setSelectedViewFolder] = useState<string | null>(null);
  
  // Folder search
  const [folderSearchTerm, setFolderSearchTerm] = useState('');

  const deleteFolder = useDeleteFolder();
  
  // Fetch folders data
  const { data: foldersData } = useFolders(organizationId, undefined, !!organizationId);
  
  // Auto-select first folder when folders are loaded
  // Use primitive values in dependencies to avoid triggering on object reference changes
  const firstFolderId = foldersData?.folders?.[0]?.id;
  const firstFolderName = foldersData?.folders?.[0]?.name;
  const hasFolders = (foldersData?.folders?.length ?? 0) > 0;

  useEffect(() => {
    if (hasFolders && firstFolderId && !selectedUploadFolder) {
      // Auto-select the first folder if no folder is currently selected
      setSelectedUploadFolder(firstFolderId);
      console.log('Auto-selected first folder:', firstFolderName);
    }
  }, [hasFolders, firstFolderId, firstFolderName, selectedUploadFolder]);

  const handleCreateFolder = useCallback(() => {
    setIsCreateFolderModalOpen(true);
  }, []);

  const handleEditFolder = useCallback((folder: Folder) => {
    setEditingFolder(folder);
  }, []);

  const handleDeleteFolder = useCallback((folder: Folder) => {
    setDeletingFolder(folder);
  }, []);

  const confirmDeleteFolder = useCallback(async () => {
    if (!deletingFolder) return;
    
    try {
      await deleteFolder.mutateAsync({
        orgId: deletingFolder.organization_id,
        folderId: deletingFolder.id,
      });
      toast.success(`Folder "${deletingFolder.name}" deleted successfully!`);
      setDeletingFolder(null);
      
      // If the deleted folder was selected for viewing, clear the selection
      if (selectedViewFolder === deletingFolder.id) {
        setSelectedViewFolder(null);
      }
      
      // If the deleted folder was selected for upload, clear the selection
      if (selectedUploadFolder === deletingFolder.id) {
        setSelectedUploadFolder(null);
      }
    } catch (error) {
      console.error('Failed to delete folder:', error);
      toast.error('Failed to delete folder. Please try again.');
    }
  }, [deletingFolder, deleteFolder, selectedViewFolder, selectedUploadFolder]);

  const handleFolderClick = useCallback((folder: Folder, onSwitchToDocuments?: () => void) => {
    console.log('🔒 Selected folder for document viewing:', folder);
    setSelectedViewFolder(folder.id);
    
    // Switch to documents tab to show the documents
    if (onSwitchToDocuments) {
      onSwitchToDocuments();
    }
    
    toast.success(`Loading documents from "${folder.name}" folder...`);
  }, []);

  const clearFolderSelection = useCallback(() => {
    setSelectedViewFolder(null);
  }, []);

  const closeCreateFolderModal = useCallback(() => {
    setIsCreateFolderModalOpen(false);
  }, []);

  const closeEditFolderModal = useCallback(() => {
    setEditingFolder(null);
  }, []);

  const closeDeletingFolderDialog = useCallback(() => {
    setDeletingFolder(null);
  }, []);

  return {
    // Folder modal states
    isCreateFolderModalOpen,
    editingFolder,
    deletingFolder,
    
    // Folder selections
    selectedUploadFolder,
    selectedViewFolder,
    folderSearchTerm,
    
    // Folder actions
    handleCreateFolder,
    handleEditFolder,
    handleDeleteFolder,
    confirmDeleteFolder,
    handleFolderClick,
    clearFolderSelection,
    
    // Modal controls
    closeCreateFolderModal,
    closeEditFolderModal,
    closeDeletingFolderDialog,
    
    // Setters for external control
    setSelectedUploadFolder,
    setSelectedViewFolder,
    setFolderSearchTerm,
  };
}