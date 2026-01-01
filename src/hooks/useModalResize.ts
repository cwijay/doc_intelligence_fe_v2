'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

export type ResizeHandle =
  | 'top'
  | 'right'
  | 'bottom'
  | 'left'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

export interface UseModalResizeOptions {
  initialWidth: number;
  initialHeight: number;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  onResize?: (width: number, height: number) => void;
}

export interface UseModalResizeReturn {
  width: number;
  height: number;
  isDragging: boolean;
  activeHandle: ResizeHandle | null;
  getHandleProps: (handle: ResizeHandle) => {
    onMouseDown: (e: React.MouseEvent) => void;
    style?: React.CSSProperties;
  };
  resetSize: () => void;
}

const getCursorForHandle = (handle: ResizeHandle): string => {
  switch (handle) {
    case 'top':
    case 'bottom':
      return 'ns-resize';
    case 'left':
    case 'right':
      return 'ew-resize';
    case 'top-left':
    case 'bottom-right':
      return 'nwse-resize';
    case 'top-right':
    case 'bottom-left':
      return 'nesw-resize';
    default:
      return 'default';
  }
};

export function useModalResize({
  initialWidth,
  initialHeight,
  minWidth = 400,
  maxWidth = window.innerWidth * 0.95,
  minHeight = 300,
  maxHeight = window.innerHeight * 0.95,
  onResize,
}: UseModalResizeOptions): UseModalResizeReturn {
  const [width, setWidth] = useState(initialWidth);
  const [height, setHeight] = useState(initialHeight);
  const [isDragging, setIsDragging] = useState(false);
  const [activeHandle, setActiveHandle] = useState<ResizeHandle | null>(null);

  // Store start position and dimensions for drag calculation
  const dragStartRef = useRef<{
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
  } | null>(null);

  // Handle mouse move during drag
  useEffect(() => {
    if (!isDragging || !activeHandle || !dragStartRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      const { startX, startY, startWidth, startHeight } = dragStartRef.current!;

      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      let newWidth = startWidth;
      let newHeight = startHeight;

      // For centered modals, we double the delta since resizing one edge
      // effectively moves both edges (the modal stays centered)
      switch (activeHandle) {
        case 'right':
          newWidth = startWidth + deltaX * 2;
          break;
        case 'left':
          newWidth = startWidth - deltaX * 2;
          break;
        case 'bottom':
          newHeight = startHeight + deltaY * 2;
          break;
        case 'top':
          newHeight = startHeight - deltaY * 2;
          break;
        case 'top-left':
          newWidth = startWidth - deltaX * 2;
          newHeight = startHeight - deltaY * 2;
          break;
        case 'top-right':
          newWidth = startWidth + deltaX * 2;
          newHeight = startHeight - deltaY * 2;
          break;
        case 'bottom-left':
          newWidth = startWidth - deltaX * 2;
          newHeight = startHeight + deltaY * 2;
          break;
        case 'bottom-right':
          newWidth = startWidth + deltaX * 2;
          newHeight = startHeight + deltaY * 2;
          break;
      }

      // Apply constraints
      newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      newHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));

      setWidth(newWidth);
      setHeight(newHeight);
      onResize?.(newWidth, newHeight);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setActiveHandle(null);
      dragStartRef.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    // Set cursor and disable text selection during drag
    document.body.style.cursor = getCursorForHandle(activeHandle);
    document.body.style.userSelect = 'none';

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, activeHandle, minWidth, maxWidth, minHeight, maxHeight, onResize]);

  // Start drag handler
  const handleDragStart = useCallback(
    (handle: ResizeHandle) => (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
      setActiveHandle(handle);
      dragStartRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startWidth: width,
        startHeight: height,
      };
    },
    [width, height]
  );

  // Get props for a resize handle
  const getHandleProps = useCallback(
    (handle: ResizeHandle) => ({
      onMouseDown: handleDragStart(handle),
    }),
    [handleDragStart]
  );

  // Reset to initial size
  const resetSize = useCallback(() => {
    setWidth(initialWidth);
    setHeight(initialHeight);
    onResize?.(initialWidth, initialHeight);
  }, [initialWidth, initialHeight, onResize]);

  return {
    width,
    height,
    isDragging,
    activeHandle,
    getHandleProps,
    resetSize,
  };
}
