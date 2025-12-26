'use client';

import { useState, useCallback } from 'react';
import { SearchHistoryItem, RagMessage } from '@/types/rag';
import toast from 'react-hot-toast';

export interface SearchHistoryReturn {
  searchHistory: SearchHistoryItem[];
  addHistoryItem: (item: Omit<SearchHistoryItem, 'id'>) => void;
  viewHistoryItem: (item: SearchHistoryItem, setMessages: (messages: RagMessage[]) => void) => void;
  clearHistory: () => void;
}

/**
 * Hook for managing search history
 */
export function useSearchHistory(): SearchHistoryReturn {
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);

  const addHistoryItem = useCallback((item: Omit<SearchHistoryItem, 'id'>) => {
    const historyItem: SearchHistoryItem = {
      ...item,
      id: `search-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    setSearchHistory((prev) => [historyItem, ...prev]);
  }, []);

  const viewHistoryItem = useCallback((
    item: SearchHistoryItem,
    setMessages: (messages: RagMessage[]) => void
  ) => {
    console.log('📜 Viewing history item:', item.id);

    setMessages([
      {
        id: `user-${item.id}`,
        type: 'user',
        content: item.query,
        timestamp: item.timestamp,
      },
      {
        id: `assistant-${item.id}`,
        type: 'assistant',
        content: item.response,
        timestamp: item.timestamp,
        metadata: {
          sources_count: item.citations.length,
          search_strategy: item.filters.searchMode,
        },
      },
    ]);
  }, []);

  const clearHistory = useCallback(() => {
    console.log('🗑️ Clearing search history');
    setSearchHistory([]);
    toast.success('Search history cleared');
  }, []);

  return {
    searchHistory,
    addHistoryItem,
    viewHistoryItem,
    clearHistory,
  };
}
