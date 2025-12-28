'use client';

import { useState, useEffect, useCallback } from 'react';
import { STORAGE_KEYS, LAYOUT } from '@/lib/constants';

export type SidebarState = 'expanded' | 'collapsed' | 'hidden';

function getDefaultStateForWidth(width: number): SidebarState {
  if (width >= LAYOUT.BREAKPOINTS.XL) return 'expanded';
  if (width >= LAYOUT.BREAKPOINTS.LG) return 'collapsed';
  return 'hidden';
}

export interface UseSidebarStateReturn {
  sidebarState: SidebarState;
  setSidebarState: (state: SidebarState) => void;
  toggleCollapse: () => void;
  toggleVisibility: () => void;
  isExpanded: boolean;
  isCollapsed: boolean;
  isHidden: boolean;
  sidebarWidth: number;
  // Resizable sidebar
  customWidth: number;
  setCustomWidth: (width: number) => void;
  minWidth: number;
  maxWidth: number;
}

export function useSidebarState(): UseSidebarStateReturn {
  const [sidebarState, setSidebarStateInternal] = useState<SidebarState>('expanded');
  const [customWidth, setCustomWidthInternal] = useState<number>(LAYOUT.SIDEBAR.DEFAULT_WIDTH);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize state from localStorage or responsive default
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Restore sidebar state
    const stored = localStorage.getItem(STORAGE_KEYS.SIDEBAR_STATE);
    if (stored && ['expanded', 'collapsed', 'hidden'].includes(stored)) {
      setSidebarStateInternal(stored as SidebarState);
    } else {
      setSidebarStateInternal(getDefaultStateForWidth(window.innerWidth));
    }

    // Restore custom width
    const storedWidth = localStorage.getItem(STORAGE_KEYS.SIDEBAR_WIDTH);
    if (storedWidth) {
      const width = parseInt(storedWidth, 10);
      if (!isNaN(width) && width >= LAYOUT.SIDEBAR.MIN_WIDTH && width <= LAYOUT.SIDEBAR.MAX_WIDTH) {
        setCustomWidthInternal(width);
      }
    }

    setIsInitialized(true);
  }, []);

  // Handle responsive changes
  useEffect(() => {
    if (typeof window === 'undefined' || !isInitialized) return;

    const handleResize = () => {
      const width = window.innerWidth;
      const stored = localStorage.getItem(STORAGE_KEYS.SIDEBAR_STATE);

      // Only auto-adjust if user hasn't manually set a preference
      // or if we're going to a smaller screen that requires hiding
      if (!stored) {
        setSidebarStateInternal(getDefaultStateForWidth(width));
      } else if (width < LAYOUT.BREAKPOINTS.MD && stored !== 'hidden') {
        // Force hidden on very small screens
        setSidebarStateInternal('hidden');
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isInitialized]);

  const setSidebarState = useCallback((state: SidebarState) => {
    setSidebarStateInternal(state);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.SIDEBAR_STATE, state);
    }
  }, []);

  const toggleCollapse = useCallback(() => {
    setSidebarState(sidebarState === 'expanded' ? 'collapsed' : 'expanded');
  }, [sidebarState, setSidebarState]);

  const toggleVisibility = useCallback(() => {
    if (sidebarState === 'hidden') {
      setSidebarState('expanded');
    } else {
      setSidebarState('hidden');
    }
  }, [sidebarState, setSidebarState]);

  // Set custom width with constraints and persistence
  const setCustomWidth = useCallback((width: number) => {
    const constrainedWidth = Math.min(LAYOUT.SIDEBAR.MAX_WIDTH, Math.max(LAYOUT.SIDEBAR.MIN_WIDTH, width));
    setCustomWidthInternal(constrainedWidth);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.SIDEBAR_WIDTH, constrainedWidth.toString());
    }
  }, []);

  // Calculate sidebar width based on state
  const sidebarWidth = sidebarState === 'expanded' ? customWidth : sidebarState === 'collapsed' ? LAYOUT.SIDEBAR.COLLAPSED_WIDTH : 0;

  return {
    sidebarState,
    setSidebarState,
    toggleCollapse,
    toggleVisibility,
    isExpanded: sidebarState === 'expanded',
    isCollapsed: sidebarState === 'collapsed',
    isHidden: sidebarState === 'hidden',
    sidebarWidth,
    // Resizable sidebar
    customWidth,
    setCustomWidth,
    minWidth: LAYOUT.SIDEBAR.MIN_WIDTH,
    maxWidth: LAYOUT.SIDEBAR.MAX_WIDTH,
  };
}
