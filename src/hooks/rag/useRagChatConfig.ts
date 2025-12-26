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
  setSearchMode: (mode: GeminiSearchMode) => void;
  setFolderFilter: (folder: string | null) => void;
  setFileFilter: (file: string | null) => void;
}

/**
 * Hook for RAG chat configuration state
 */
export function useRagChatConfig(): RagChatConfig {
  const [maxSources, setMaxSourcesState] = useState<number>(RAG_CONFIG.DEFAULT_MAX_RESULTS);
  const [searchMode, setSearchModeState] = useState<GeminiSearchMode>('semantic');
  const [folderFilter, setFolderFilterState] = useState<string | null>(null);
  const [fileFilter, setFileFilterState] = useState<string | null>(null);

  const setMaxSources = useCallback((count: number) => {
    setMaxSourcesState(count);
  }, []);

  const setSearchMode = useCallback((mode: GeminiSearchMode) => {
    setSearchModeState(mode);
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
    setSearchMode,
    setFolderFilter,
    setFileFilter,
  };
}
