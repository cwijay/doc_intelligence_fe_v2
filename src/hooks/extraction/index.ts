'use client';

/**
 * Extraction Hooks Module
 *
 * Provides hooks for document data extraction workflow:
 * - useExtraction: Main workflow hook (analyze → select → extract → actions)
 * - useTemplates: Template management hook
 * - useTemplateSelection: Pre-extraction template selection with folder filtering
 * - useExtractionPage: Full-page extraction workflow hook
 */

export { useExtraction } from './useExtraction';
export type { UseExtractionReturn, ExtractionActions } from './useExtraction';

export { useTemplates } from './useTemplates';
export type { UseTemplatesReturn } from './useTemplates';

export { useTemplateSelection } from './useTemplateSelection';
export type { UseTemplateSelectionReturn } from './useTemplateSelection';

export { useExtractionPage, storeExtractionContext, clearExtractionContext } from './useExtractionPage';
export type { UseExtractionPageReturn, ExtractionContext } from './useExtractionPage';
