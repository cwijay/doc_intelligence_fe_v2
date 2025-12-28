'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Tab types for AI feature modals (Summary, FAQ, Questions)
 */
export type AIModalTab = 'content' | 'metadata' | 'actions';

/**
 * Preview mode for content editing
 */
export type PreviewMode = 'split' | 'preview' | 'edit';

/**
 * Options for the useAIModalState hook
 */
interface UseAIModalStateOptions<TData, TRegenerateOptions> {
  /** Initial data to populate the modal */
  initialData?: TData;
  /** Callback when save is triggered */
  onSave?: (data: TData) => Promise<void>;
  /** Callback when regenerate is triggered */
  onRegenerate?: (options: TRegenerateOptions) => Promise<void>;
  /** Default regeneration options */
  defaultRegenerationOptions: TRegenerateOptions;
}

/**
 * Return type for the useAIModalState hook
 */
interface UseAIModalStateReturn<TData, TRegenerateOptions> {
  // Tab state
  activeTab: AIModalTab;
  setActiveTab: (tab: AIModalTab) => void;

  // Edit state
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  editedData: TData | undefined;
  setEditedData: (data: TData | undefined) => void;

  // Preview mode
  previewMode: PreviewMode;
  setPreviewMode: (mode: PreviewMode) => void;

  // Save state
  isSaving: boolean;
  handleSave: () => Promise<void>;

  // Regeneration
  regenerationOptions: TRegenerateOptions;
  setRegenerationOptions: (options: TRegenerateOptions) => void;
  updateRegenerationOption: <K extends keyof TRegenerateOptions>(
    key: K,
    value: TRegenerateOptions[K]
  ) => void;
  handleRegenerate: () => Promise<void>;

  // Utilities
  resetState: () => void;
  hasUnsavedChanges: boolean;
}

/**
 * Shared hook for AI modal state management.
 *
 * This hook consolidates the common state and handlers used by
 * the unified DocumentAIContentModal for Summary, FAQ, and Questions.
 *
 * @example
 * ```tsx
 * const {
 *   activeTab,
 *   setActiveTab,
 *   isEditing,
 *   isSaving,
 *   handleSave,
 *   handleRegenerate,
 *   regenerationOptions,
 *   setRegenerationOptions,
 * } = useAIModalState({
 *   initialData: summaryData?.content,
 *   onSave: async (content) => await saveSummary(content),
 *   onRegenerate: async (options) => await regenerateSummary(options),
 *   defaultRegenerationOptions: { length: 'medium', format: 'paragraphs' },
 * });
 * ```
 */
export function useAIModalState<TData, TRegenerateOptions>({
  initialData,
  onSave,
  onRegenerate,
  defaultRegenerationOptions,
}: UseAIModalStateOptions<TData, TRegenerateOptions>): UseAIModalStateReturn<TData, TRegenerateOptions> {
  // Tab state
  const [activeTab, setActiveTab] = useState<AIModalTab>('content');

  // Edit state
  const [editedData, setEditedData] = useState<TData | undefined>(initialData);
  const [isEditing, setIsEditing] = useState(false);

  // Preview mode
  const [previewMode, setPreviewMode] = useState<PreviewMode>('split');

  // Save state
  const [isSaving, setIsSaving] = useState(false);

  // Regeneration options
  const [regenerationOptions, setRegenerationOptions] = useState<TRegenerateOptions>(
    defaultRegenerationOptions
  );

  // Track if there are unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Track previous initialData to avoid infinite loops with array/object references
  const prevInitialDataRef = useRef<string | undefined>(undefined);

  // Sync editedData with initialData when it actually changes (by value, not reference)
  useEffect(() => {
    if (initialData === undefined) return;

    const serialized = JSON.stringify(initialData);
    // Only update if the actual value changed, not just the reference
    if (prevInitialDataRef.current !== serialized) {
      prevInitialDataRef.current = serialized;
      setEditedData(initialData);
      setHasUnsavedChanges(false);
    }
  }, [initialData]);

  // Track changes to editedData (compare by value)
  const checkForChanges = useCallback(() => {
    if (initialData !== undefined && editedData !== undefined) {
      const hasChanges = JSON.stringify(editedData) !== JSON.stringify(initialData);
      setHasUnsavedChanges(hasChanges);
    }
  }, [editedData, initialData]);

  // Only run change detection when editedData changes, not initialData
  useEffect(() => {
    checkForChanges();
  }, [editedData]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Handle save operation with loading state
   */
  const handleSave = useCallback(async () => {
    if (!onSave || editedData === undefined) return;

    setIsSaving(true);
    try {
      await onSave(editedData);
      setIsEditing(false);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to save:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [onSave, editedData]);

  /**
   * Handle regeneration operation
   */
  const handleRegenerate = useCallback(async () => {
    if (!onRegenerate) return;

    try {
      await onRegenerate(regenerationOptions);
    } catch (error) {
      console.error('Failed to regenerate:', error);
      throw error;
    }
  }, [onRegenerate, regenerationOptions]);

  /**
   * Update a single regeneration option
   */
  const updateRegenerationOption = useCallback(<K extends keyof TRegenerateOptions>(
    key: K,
    value: TRegenerateOptions[K]
  ) => {
    setRegenerationOptions(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  /**
   * Reset all state to initial values
   */
  const resetState = useCallback(() => {
    setActiveTab('content');
    setIsEditing(false);
    setIsSaving(false);
    setPreviewMode('split');
    setEditedData(initialData);
    setRegenerationOptions(defaultRegenerationOptions);
    setHasUnsavedChanges(false);
  }, [initialData, defaultRegenerationOptions]);

  return {
    // Tab state
    activeTab,
    setActiveTab,

    // Edit state
    isEditing,
    setIsEditing,
    editedData,
    setEditedData,

    // Preview mode
    previewMode,
    setPreviewMode,

    // Save state
    isSaving,
    handleSave,

    // Regeneration
    regenerationOptions,
    setRegenerationOptions,
    updateRegenerationOption,
    handleRegenerate,

    // Utilities
    resetState,
    hasUnsavedChanges,
  };
}
