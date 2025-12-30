'use client';

import { useCallback, useMemo } from 'react';
import { Document } from '@/types/api';
import { isDocumentParsed } from '@/lib/document-utils';

export interface UseDocumentSelectionProps {
  documents: Document[];
  selectedDocuments: Set<string>;
  onSelectionChange?: (selectedIds: Set<string>) => void;
  enableSelection?: boolean;
  /** If true, only allow selection of parsed documents */
  requireParsed?: boolean;
}

export interface UseDocumentSelectionReturn {
  /** Toggle selection of all eligible documents */
  handleSelectAll: () => void;
  /** Toggle selection of a single document, supports shift-click range selection */
  handleSelectDocument: (documentId: string, event?: React.MouseEvent) => void;
  /** Whether all eligible documents are selected */
  isAllSelected: boolean;
  /** Whether some but not all eligible documents are selected */
  isIndeterminate: boolean;
  /** Number of selected documents */
  selectedCount: number;
  /** Documents eligible for selection (parsed if requireParsed is true) */
  selectableDocuments: Document[];
}

/**
 * Hook for managing document selection state with support for:
 * - Single click selection
 * - Shift-click range selection
 * - Select all / deselect all
 * - Optional restriction to parsed documents only
 */
export function useDocumentSelection({
  documents,
  selectedDocuments,
  onSelectionChange,
  enableSelection = false,
  requireParsed = true,
}: UseDocumentSelectionProps): UseDocumentSelectionReturn {
  // Get documents that can be selected
  const selectableDocuments = useMemo(() => {
    if (!requireParsed) return documents;
    return documents.filter(doc => isDocumentParsed(doc));
  }, [documents, requireParsed]);

  // Compute selection state
  const isAllSelected = useMemo(() => {
    return selectableDocuments.length > 0 &&
      selectableDocuments.every(doc => selectedDocuments.has(doc.id));
  }, [selectableDocuments, selectedDocuments]);

  const isIndeterminate = useMemo(() => {
    return selectableDocuments.some(doc => selectedDocuments.has(doc.id)) && !isAllSelected;
  }, [selectableDocuments, selectedDocuments, isAllSelected]);

  const selectedCount = selectedDocuments.size;

  // Handle select all toggle
  const handleSelectAll = useCallback(() => {
    if (!onSelectionChange || !enableSelection) return;

    if (isAllSelected) {
      // Deselect all
      onSelectionChange(new Set());
    } else {
      // Select all selectable documents
      onSelectionChange(new Set(selectableDocuments.map(doc => doc.id)));
    }
  }, [onSelectionChange, enableSelection, isAllSelected, selectableDocuments]);

  // Handle single document selection with shift-click support
  const handleSelectDocument = useCallback((documentId: string, event?: React.MouseEvent) => {
    if (!onSelectionChange || !enableSelection) return;

    // Check if document is selectable
    const document = documents.find(doc => doc.id === documentId);
    if (!document) return;

    if (requireParsed && !isDocumentParsed(document)) {
      return; // Can't select unparsed documents when requireParsed is true
    }

    const newSelection = new Set(selectedDocuments);

    // Handle shift-click for range selection
    if (event?.shiftKey && documents.length > 0) {
      const clickedIndex = documents.findIndex(doc => doc.id === documentId);
      const lastSelectedIndex = documents.findIndex(doc =>
        Array.from(selectedDocuments).includes(doc.id)
      );

      if (lastSelectedIndex !== -1 && clickedIndex !== lastSelectedIndex) {
        const startIndex = Math.min(clickedIndex, lastSelectedIndex);
        const endIndex = Math.max(clickedIndex, lastSelectedIndex);

        // Select all selectable documents in range
        for (let i = startIndex; i <= endIndex; i++) {
          const doc = documents[i];
          if (!requireParsed || isDocumentParsed(doc)) {
            newSelection.add(doc.id);
          }
        }
      } else {
        // No previous selection, just toggle current
        if (newSelection.has(documentId)) {
          newSelection.delete(documentId);
        } else {
          newSelection.add(documentId);
        }
      }
    } else {
      // Regular click - toggle selection
      if (newSelection.has(documentId)) {
        newSelection.delete(documentId);
      } else {
        newSelection.add(documentId);
      }
    }

    onSelectionChange(newSelection);
  }, [documents, selectedDocuments, onSelectionChange, enableSelection, requireParsed]);

  return {
    handleSelectAll,
    handleSelectDocument,
    isAllSelected,
    isIndeterminate,
    selectedCount,
    selectableDocuments,
  };
}
