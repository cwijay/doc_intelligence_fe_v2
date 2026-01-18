'use client';

import { useState, useCallback } from 'react';
import { GeminiSearchMode } from '@/types/rag';
import { RAG_CONFIG } from '@/lib/constants';

export interface RagChatConfig {
  maxSources: number;
  searchMode: GeminiSearchMode;
  folderFilter: string | null;
  fileFilter: string | null;
  setMaxSources: (count: number) => void;
  setFolderFilter: (folder: string | null) => void;
  setFileFilter: (file: string | null) => void;
}

/**
 * Hook for RAG chat configuration state
 * Search mode is fixed to 'hybrid' for best results (combines semantic + keyword search)
 */
export function useRagChatConfig(): RagChatConfig {
  const [maxSources, setMaxSourcesState] = useState<number>(RAG_CONFIG.DEFAULT_MAX_RESULTS);
  // Fixed to hybrid mode - combines semantic and keyword search for best results
  const searchMode: GeminiSearchMode = 'hybrid';
  const [folderFilter, setFolderFilterState] = useState<string | null>(null);
  const [fileFilter, setFileFilterState] = useState<string | null>(null);

  const setMaxSources = useCallback((count: number) => {
    setMaxSourcesState(count);
  }, []);

  const setFolderFilter = useCallback((folder: string | null) => {
    setFolderFilterState(folder);
  }, []);

  const setFileFilter = useCallback((file: string | null) => {
    setFileFilterState(file);
  }, []);

  return {
    maxSources,
    searchMode,
    folderFilter,
    fileFilter,
    setMaxSources,
    setFolderFilter,
    setFileFilter,
  };
}
