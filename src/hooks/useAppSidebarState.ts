'use client';

import { useState, useEffect, useCallback } from 'react';
import { STORAGE_KEYS, LAYOUT } from '@/lib/constants';

export type AppSidebarState = 'expanded' | 'collapsed';

function getDefaultStateForWidth(width: number): AppSidebarState {
  // On mobile (< LG breakpoint), default to collapsed
  if (width < LAYOUT.BREAKPOINTS.LG) return 'collapsed';
  return 'expanded';
}

export interface UseAppSidebarStateReturn {
  sidebarState: AppSidebarState;
  setSidebarState: (state: AppSidebarState) => void;
  toggleSidebar: () => void;
  isExpanded: boolean;
  isCollapsed: boolean;
  sidebarWidth: number;
  isMobile: boolean;
}

export function useAppSidebarState(): UseAppSidebarStateReturn {
  const [sidebarState, setSidebarStateInternal] = useState<AppSidebarState>('expanded');
  const [isMobile, setIsMobile] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize state from localStorage or responsive default
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if mobile
    const mobile = window.innerWidth < LAYOUT.BREAKPOINTS.LG;
    setIsMobile(mobile);

    // Restore sidebar state from localStorage
    const stored = localStorage.getItem(STORAGE_KEYS.MAIN_SIDEBAR_STATE);
    if (stored && ['expanded', 'collapsed'].includes(stored)) {
      // On mobile, always start collapsed regardless of stored state
      if (mobile) {
        setSidebarStateInternal('collapsed');
      } else {
        setSidebarStateInternal(stored as AppSidebarState);
      }
    } else {
      setSidebarStateInternal(getDefaultStateForWidth(window.innerWidth));
    }

    setIsInitialized(true);
  }, []);

  // Handle responsive changes
  useEffect(() => {
    if (typeof window === 'undefined' || !isInitialized) return;

    const handleResize = () => {
      const width = window.innerWidth;
      const mobile = width < LAYOUT.BREAKPOINTS.LG;
      setIsMobile(mobile);

      // Auto-collapse on mobile
      if (mobile && sidebarState === 'expanded') {
        setSidebarStateInternal('collapsed');
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isInitialized, sidebarState]);

  const setSidebarState = useCallback((state: AppSidebarState) => {
    setSidebarStateInternal(state);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.MAIN_SIDEBAR_STATE, state);
    }
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarState(sidebarState === 'expanded' ? 'collapsed' : 'expanded');
  }, [sidebarState, setSidebarState]);

  // Calculate sidebar width based on state
  const sidebarWidth = sidebarState === 'expanded'
    ? LAYOUT.APP_SIDEBAR.EXPANDED_WIDTH
    : LAYOUT.APP_SIDEBAR.COLLAPSED_WIDTH;

  return {
    sidebarState,
    setSidebarState,
    toggleSidebar,
    isExpanded: sidebarState === 'expanded',
    isCollapsed: sidebarState === 'collapsed',
    sidebarWidth,
    isMobile,
  };
}
