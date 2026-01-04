'use client';

import { Document } from '@/types/api';

/**
 * Feature types for AI generation
 */
export type AIFeatureType = 'summary' | 'faq' | 'questions';

/**
 * Base state for all AI generation hooks
 */
export interface AIGenerationState<TData> {
  selectedDocument: Document | null;
  data: TData | null;
  isModalOpen: boolean;
  isGenerating: boolean;
}

/**
 * Configuration for the generic AI generation hook
 */
export interface AIGenerationConfig<TData, TOptions = Record<string, unknown>> {
  /** Feature name for logging and toast IDs */
  featureName: AIFeatureType;

  /** Display name for toast messages (e.g., "Summary", "FAQ", "Questions") */
  displayName: string;

  /** Generate function that calls the API */
  generateFn: (
    document: Document,
    orgName: string,
    folderName: string,
    options?: TOptions
  ) => Promise<TData>;

  /** Optional function to format success message */
  formatSuccessMessage?: (data: TData, cached: boolean) => string;
}

/**
 * Base actions returned by AI generation hooks
 */
export interface AIGenerationActions<TData, TOptions = Record<string, unknown>> {
  handleGenerate: (document: Document, options?: TOptions) => Promise<void>;
  handleModalClose: () => void;
  handleRegenerate: (options?: TOptions) => Promise<void>;
}

/**
 * Combined return type for AI generation hooks
 */
export type AIGenerationReturn<TData, TSaveData = TData, TOptions = Record<string, unknown>> =
  AIGenerationState<TData> &
  AIGenerationActions<TData, TOptions> & {
    handleSave: (data: TSaveData) => Promise<void>;
  };
