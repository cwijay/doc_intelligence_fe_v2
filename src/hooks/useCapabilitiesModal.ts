'use client';

import { useState, useCallback } from 'react';

/**
 * Hook for managing the Capabilities Modal visibility state.
 * Used by both Navbar and Dashboard to trigger the modal.
 */
export function useCapabilitiesModal() {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return {
    isOpen,
    open,
    close,
    toggle,
  };
}

export type UseCapabilitiesModalReturn = ReturnType<typeof useCapabilitiesModal>;
