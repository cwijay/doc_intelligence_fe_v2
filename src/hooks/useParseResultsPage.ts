'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Document, DocumentParseResponse } from '@/types/api';
import { useAuth } from '@/hooks/useAuth';
import { organizationsApi, foldersApi } from '@/lib/api/index';
import { saveAndIndexDocument } from '@/lib/api/ingestion/index';
import { loadParsedContent, createLoadParsedRequest } from '@/lib/api/ingestion/content';
import { clientConfig } from '@/lib/config';
import toast from 'react-hot-toast';

// Session storage keys
const PARSE_RESULTS_KEY = (docId: string) => `parse-results-${docId}`;
const PARSE_STATE_KEY = (docId: string) => `parse-state-${docId}`;

export type ViewMode = 'edit' | 'split' | 'preview';
export type TabType = 'content' | 'metadata' | 'fileInfo';

interface ParseState {
  editedContent: string;
  viewMode: ViewMode;
  activeTab: TabType;
}

interface UseParseResultsPageReturn {
  // Document and parse data
  document: Document | null;
  parseData: DocumentParseResponse | null;
  isLoading: boolean;
  error: string | null;

  // View state
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;

  // Editor state
  editedContent: string;
  setEditedContent: (content: string) => void;
  hasUnsavedChanges: boolean;

  // Indexing state
  isIndexed: boolean;
  isSaving: boolean;

  // Actions
  handleSave: () => Promise<void>;
  handleDiscard: () => void;
  handleBack: () => void;

  // For extraction
  getParseDataForExtraction: () => DocumentParseResponse | null;
}

export function useParseResultsPage(documentId: string): UseParseResultsPageReturn {
  const router = useRouter();
  const { user } = useAuth();

  // Document and parse data state
  const [document, setDocument] = useState<Document | null>(null);
  const [parseData, setParseData] = useState<DocumentParseResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [activeTab, setActiveTab] = useState<TabType>('content');

  // Editor state
  const [editedContent, setEditedContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');

  // Save state
  const [isIndexed, setIsIndexed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Track unsaved changes
  const hasUnsavedChanges = editedContent !== originalContent;

  // Load data from sessionStorage on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // First, try to get data from sessionStorage
        const storageKey = PARSE_RESULTS_KEY(documentId);
        const storedData = sessionStorage.getItem(storageKey);

        if (storedData) {
          const { document: storedDoc, parseData: storedParseData } = JSON.parse(storedData);

          console.log('📦 Loaded parse data from sessionStorage:', {
            documentId,
            documentName: storedDoc?.name,
            hasParseData: !!storedParseData
          });

          setDocument(storedDoc);
          setParseData(storedParseData);
          setEditedContent(storedParseData?.parsed_content || '');
          setOriginalContent(storedParseData?.parsed_content || '');

          // Also try to restore view state
          const stateKey = PARSE_STATE_KEY(documentId);
          const storedState = sessionStorage.getItem(stateKey);
          if (storedState) {
            const state: ParseState = JSON.parse(storedState);
            setViewMode(state.viewMode);
            setActiveTab(state.activeTab);
            if (state.editedContent) {
              setEditedContent(state.editedContent);
            }
          }

          setIsLoading(false);
          return;
        }

        // If no stored data, we need to load from API
        // This would happen if user refreshed the page or navigated directly
        console.log('⚠️ No parse data in sessionStorage, attempting to load from API...');

        // For now, show an error since we don't have the document data
        // In a full implementation, we would fetch the document from the API
        setError('Parse data not found. Please parse the document again from the documents page.');

      } catch (err) {
        console.error('❌ Error loading parse data:', err);
        setError('Failed to load parse data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    if (documentId) {
      loadData();
    }
  }, [documentId]);

  // Save view state changes to sessionStorage
  useEffect(() => {
    if (document && documentId) {
      const stateKey = PARSE_STATE_KEY(documentId);
      const state: ParseState = {
        editedContent,
        viewMode,
        activeTab
      };
      sessionStorage.setItem(stateKey, JSON.stringify(state));
    }
  }, [documentId, document, editedContent, viewMode, activeTab]);

  // Unsaved changes warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Handle save and index
  const handleSave = useCallback(async () => {
    if (!document || !user?.org_id) {
      toast.error('Cannot save: Missing document or organization information');
      return;
    }

    setIsSaving(true);

    try {
      // Get organization name
      const orgResponse = await organizationsApi.getById(user.org_id);
      const orgName = orgResponse.name;

      // Get folder name
      let folderName: string | undefined = document.folder_name;

      // Try to extract from storage_path if not available
      if (!folderName && document.storage_path) {
        const pathParts = document.storage_path.split('/');
        if (pathParts.length >= 4) {
          folderName = pathParts[pathParts.length - 2];
        }
      }

      // Try API lookup as last resort
      if (!folderName && document.folder_id && user?.org_id) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(document.folder_id)) {
          try {
            const folderResponse = await foldersApi.getById(user.org_id, document.folder_id);
            folderName = folderResponse.name;
          } catch (folderError) {
            console.warn('⚠️ Could not resolve folder name:', folderError);
          }
        }
      }

      const cleanFolderName = folderName || 'default';

      // Get markdown filename
      const lastDotIndex = document.name.lastIndexOf('.');
      const nameWithoutExtension = lastDotIndex > 0
        ? document.name.substring(0, lastDotIndex)
        : document.name;
      const markdownFileName = `${nameWithoutExtension}.md`;

      // Build target path
      const targetPath = `${orgName}/parsed/${cleanFolderName}/${markdownFileName}`;

      // Build original GCS path
      const gcsBucket = clientConfig.gcsBucketName;
      const originalGcsPath = document.storage_path
        ? `gs://${gcsBucket}/${document.storage_path}`
        : `gs://${gcsBucket}/${orgName}/original/${cleanFolderName}/${document.name}`;

      console.log('💾 Saving and indexing document:', {
        targetPath,
        orgName,
        folderName: cleanFolderName
      });

      // Save and index
      const response = await saveAndIndexDocument({
        content: editedContent,
        target_path: targetPath,
        org_name: orgName,
        folder_name: cleanFolderName,
        original_filename: document.name,
        original_gcs_path: originalGcsPath,
        parser_version: 'llama_parse_v2.5',
      });

      console.log('✅ Save and index completed:', response);

      // Update state
      setIsIndexed(true);
      setOriginalContent(editedContent);

      // Show success message
      if (response.indexed) {
        toast.success(`Document saved and indexed in ${response.store_name}`);
      } else {
        toast.success(`Document saved to ${response.saved_path}`);
      }

    } catch (err) {
      console.error('❌ Save and index failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save and index';
      toast.error(`Failed to save: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  }, [document, user, editedContent]);

  // Handle discard changes
  const handleDiscard = useCallback(() => {
    if (parseData?.parsed_content) {
      setEditedContent(parseData.parsed_content);
      setOriginalContent(parseData.parsed_content);
    }
  }, [parseData]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to leave?'
      );
      if (!confirmed) return;
    }

    // Clear sessionStorage for this document
    sessionStorage.removeItem(PARSE_RESULTS_KEY(documentId));
    sessionStorage.removeItem(PARSE_STATE_KEY(documentId));

    // Navigate back to documents
    router.push('/documents');
  }, [documentId, hasUnsavedChanges, router]);

  // Get parse data for extraction
  const getParseDataForExtraction = useCallback(() => {
    if (!parseData) return null;

    // Return parse data with current edited content
    return {
      ...parseData,
      parsed_content: editedContent
    };
  }, [parseData, editedContent]);

  return {
    document,
    parseData,
    isLoading,
    error,
    viewMode,
    setViewMode,
    activeTab,
    setActiveTab,
    editedContent,
    setEditedContent,
    hasUnsavedChanges,
    isIndexed,
    isSaving,
    handleSave,
    handleDiscard,
    handleBack,
    getParseDataForExtraction
  };
}

// Helper function to store parse results before navigation
export function storeParseResultsForNavigation(
  documentId: string,
  document: Document,
  parseData: DocumentParseResponse
): void {
  const storageKey = PARSE_RESULTS_KEY(documentId);
  sessionStorage.setItem(storageKey, JSON.stringify({ document, parseData }));
  console.log('📦 Stored parse results for navigation:', {
    documentId,
    documentName: document.name
  });
}

// Helper function to clear stored parse results
export function clearStoredParseResults(documentId: string): void {
  sessionStorage.removeItem(PARSE_RESULTS_KEY(documentId));
  sessionStorage.removeItem(PARSE_STATE_KEY(documentId));
}
