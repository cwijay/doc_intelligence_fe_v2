'use client';

import { useState, useCallback, useMemo } from 'react';

export interface TreeSelectionState {
  // Navigation selection (single item for filtering)
  selectedFolderId: string | null;
  // Single document selection (for highlighting and actions)
  selectedDocumentId: string | null;
  // Multi-selection for bulk operations
  multiSelectedFolderIds: Set<string>;
  multiSelectedDocumentIds: Set<string>;
  // Track last selected for shift+click range selection
  lastSelectedId: string | null;
  lastSelectedType: 'folder' | 'document' | null;
}

export interface UseTreeSelectionReturn {
  // State
  selectedFolderId: string | null;
  selectedDocumentId: string | null;
  multiSelectedFolderIds: Set<string>;
  multiSelectedDocumentIds: Set<string>;

  // Navigation selection (click to filter/highlight)
  selectFolder: (folderId: string | null) => void;
  selectDocument: (documentId: string | null) => void;

  // Multi-selection (checkbox operations)
  toggleFolderMultiSelect: (folderId: string) => void;
  toggleDocumentMultiSelect: (documentId: string) => void;

  // Bulk selection operations
  selectAllFolders: (folderIds: string[]) => void;
  selectAllDocuments: (documentIds: string[]) => void;
  clearMultiSelection: () => void;
  clearFolderMultiSelection: () => void;
  clearDocumentMultiSelection: () => void;

  // Folder checkbox with auto-select documents
  toggleFolderWithDocuments: (folderId: string, documentIds: string[]) => void;

  // Selection state checks
  isFolderSelected: (folderId: string) => boolean;
  isDocumentSelected: (documentId: string) => boolean;
  hasMultiSelection: boolean;
  multiSelectionCount: number;

  // Get all selected items
  getSelectedItems: () => {
    folders: string[];
    documents: string[];
  };
}

export function useTreeSelection(): UseTreeSelectionReturn {
  const [state, setState] = useState<TreeSelectionState>({
    selectedFolderId: null,
    selectedDocumentId: null,
    multiSelectedFolderIds: new Set(),
    multiSelectedDocumentIds: new Set(),
    lastSelectedId: null,
    lastSelectedType: null,
  });

  // Navigation selection - select a folder to filter documents
  const selectFolder = useCallback((folderId: string | null) => {
    setState(prev => ({
      ...prev,
      selectedFolderId: folderId,
      // Clear document selection when folder changes
      selectedDocumentId: null,
    }));
  }, []);

  // Select a single document for highlighting and actions
  const selectDocument = useCallback((documentId: string | null) => {
    setState(prev => ({
      ...prev,
      selectedDocumentId: documentId,
    }));
  }, []);

  // Toggle folder multi-selection (checkbox)
  const toggleFolderMultiSelect = useCallback((folderId: string) => {
    setState(prev => {
      const newSet = new Set(prev.multiSelectedFolderIds);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return {
        ...prev,
        multiSelectedFolderIds: newSet,
        lastSelectedId: folderId,
        lastSelectedType: 'folder',
      };
    });
  }, []);

  // Toggle document multi-selection (checkbox)
  const toggleDocumentMultiSelect = useCallback((documentId: string) => {
    setState(prev => {
      const newSet = new Set(prev.multiSelectedDocumentIds);
      if (newSet.has(documentId)) {
        newSet.delete(documentId);
      } else {
        newSet.add(documentId);
      }
      return {
        ...prev,
        multiSelectedDocumentIds: newSet,
        lastSelectedId: documentId,
        lastSelectedType: 'document',
      };
    });
  }, []);

  // Select all folders
  const selectAllFolders = useCallback((folderIds: string[]) => {
    setState(prev => ({
      ...prev,
      multiSelectedFolderIds: new Set(folderIds),
    }));
  }, []);

  // Select all documents
  const selectAllDocuments = useCallback((documentIds: string[]) => {
    setState(prev => ({
      ...prev,
      multiSelectedDocumentIds: new Set(documentIds),
    }));
  }, []);

  // Clear all multi-selections
  const clearMultiSelection = useCallback(() => {
    setState(prev => ({
      ...prev,
      multiSelectedFolderIds: new Set(),
      multiSelectedDocumentIds: new Set(),
      lastSelectedId: null,
      lastSelectedType: null,
    }));
  }, []);

  // Clear folder multi-selections only
  const clearFolderMultiSelection = useCallback(() => {
    setState(prev => ({
      ...prev,
      multiSelectedFolderIds: new Set(),
    }));
  }, []);

  // Clear document multi-selections only
  const clearDocumentMultiSelection = useCallback(() => {
    setState(prev => ({
      ...prev,
      multiSelectedDocumentIds: new Set(),
    }));
  }, []);

  // Toggle folder checkbox with auto-select all documents in folder
  const toggleFolderWithDocuments = useCallback((folderId: string, documentIds: string[]) => {
    setState(prev => {
      const isCurrentlySelected = prev.multiSelectedFolderIds.has(folderId);
      const newFolderSet = new Set(prev.multiSelectedFolderIds);
      const newDocSet = new Set(prev.multiSelectedDocumentIds);

      if (isCurrentlySelected) {
        // Deselect folder and its documents
        newFolderSet.delete(folderId);
        documentIds.forEach(id => newDocSet.delete(id));
      } else {
        // Select folder and all its documents
        newFolderSet.add(folderId);
        documentIds.forEach(id => newDocSet.add(id));
      }

      return {
        ...prev,
        multiSelectedFolderIds: newFolderSet,
        multiSelectedDocumentIds: newDocSet,
        lastSelectedId: folderId,
        lastSelectedType: 'folder',
      };
    });
  }, []);

  // Check if a folder is selected
  const isFolderSelected = useCallback((folderId: string) => {
    return state.multiSelectedFolderIds.has(folderId);
  }, [state.multiSelectedFolderIds]);

  // Check if a document is selected
  const isDocumentSelected = useCallback((documentId: string) => {
    return state.multiSelectedDocumentIds.has(documentId);
  }, [state.multiSelectedDocumentIds]);

  // Check if there are any multi-selections
  const hasMultiSelection = useMemo(() => {
    return state.multiSelectedFolderIds.size > 0 || state.multiSelectedDocumentIds.size > 0;
  }, [state.multiSelectedFolderIds.size, state.multiSelectedDocumentIds.size]);

  // Get total multi-selection count
  const multiSelectionCount = useMemo(() => {
    return state.multiSelectedFolderIds.size + state.multiSelectedDocumentIds.size;
  }, [state.multiSelectedFolderIds.size, state.multiSelectedDocumentIds.size]);

  // Get all selected items
  const getSelectedItems = useCallback(() => ({
    folders: Array.from(state.multiSelectedFolderIds),
    documents: Array.from(state.multiSelectedDocumentIds),
  }), [state.multiSelectedFolderIds, state.multiSelectedDocumentIds]);

  return {
    selectedFolderId: state.selectedFolderId,
    selectedDocumentId: state.selectedDocumentId,
    multiSelectedFolderIds: state.multiSelectedFolderIds,
    multiSelectedDocumentIds: state.multiSelectedDocumentIds,
    selectFolder,
    selectDocument,
    toggleFolderMultiSelect,
    toggleDocumentMultiSelect,
    selectAllFolders,
    selectAllDocuments,
    clearMultiSelection,
    clearFolderMultiSelection,
    clearDocumentMultiSelection,
    toggleFolderWithDocuments,
    isFolderSelected,
    isDocumentSelected,
    hasMultiSelection,
    multiSelectionCount,
    getSelectedItems,
  };
}
