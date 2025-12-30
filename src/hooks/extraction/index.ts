'use client';

/**
 * Extraction Hooks Module
 *
 * Provides hooks for document data extraction workflow:
 * - useExtraction: Main workflow hook (analyze → select → extract → actions)
 * - useTemplates: Template management hook
 */

export { useExtraction } from './useExtraction';
export type { UseExtractionReturn, ExtractionActions } from './useExtraction';

export { useTemplates } from './useTemplates';
export type { UseTemplatesReturn } from './useTemplates';
