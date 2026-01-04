'use client';

import { useState, useCallback } from 'react';
import { Document } from '@/types/api';
import { useAuth } from '@/hooks/useAuth';
import { resolveFolderName } from './utils';
import toast from 'react-hot-toast';
import { AIGenerationConfig, AIGenerationState, AIGenerationActions } from './types';

/**
 * Generic hook for AI content generation (summary, FAQ, questions)
 *
 * Provides common state management and handlers for AI generation features.
 * Specific hooks can extend this with custom save handlers and success messages.
 */
export function useAIGeneration<TData extends { cached?: boolean }, TOptions = Record<string, unknown>>(
  config: AIGenerationConfig<TData, TOptions>
): AIGenerationState<TData> & AIGenerationActions<TData, TOptions> & { setData: React.Dispatch<React.SetStateAction<TData | null>> } {
  const { featureName, displayName, generateFn, formatSuccessMessage } = config;
  const { user } = useAuth();

  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [data, setData] = useState<TData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  /**
   * Generate AI content for a document
   */
  const handleGenerate = useCallback(async (document: Document, options?: TOptions) => {
    if (!user?.org_name || !user?.org_id) {
      toast.error('Organization information not available. Please log in again.');
      return;
    }

    const toastId = `${featureName}-${document.id}`;

    try {
      setSelectedDocument(document);
      setIsGenerating(true);
      setIsModalOpen(true);
      setData(null);

      console.log(`Starting ${featureName} generation for:`, document.name);
      toast.loading(`Generating ${displayName.toLowerCase()} for: ${document.name}`, { id: toastId });

      const folderName = await resolveFolderName(document, user.org_id);

      const result = await generateFn(document, user.org_name, folderName, options);

      setData(result);

      const successMessage = formatSuccessMessage
        ? formatSuccessMessage(result, result.cached ?? false)
        : `${displayName} generated${result.cached ? ' (cached)' : ''}`;

      toast.success(successMessage, { id: toastId });
      console.log(`${displayName} generated successfully for:`, document.name);

    } catch (error) {
      console.error(`${displayName} operation failed:`, error);

      const errorMessage = error instanceof Error ? error.message : `Failed to generate ${displayName.toLowerCase()}`;

      toast.error(`Failed to generate ${displayName.toLowerCase()} for ${document.name}: ${errorMessage}`, {
        id: toastId
      });

      setData(null);
    } finally {
      setIsGenerating(false);
    }
  }, [user, featureName, displayName, generateFn, formatSuccessMessage]);

  /**
   * Close modal and reset state
   */
  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setSelectedDocument(null);
    setData(null);
    setIsGenerating(false);
  }, []);

  /**
   * Regenerate AI content with force flag
   */
  const handleRegenerate = useCallback(async (options?: TOptions) => {
    if (!selectedDocument || !user?.org_name || !user?.org_id) return;

    const toastId = `regen-${featureName}-${selectedDocument.id}`;

    try {
      setIsGenerating(true);
      console.log(`Regenerating ${featureName} for:`, selectedDocument.name);
      toast.loading(`Regenerating ${displayName.toLowerCase()} for: ${selectedDocument.name}`, {
        id: toastId
      });

      const folderName = await resolveFolderName(selectedDocument, user.org_id);

      // Note: The force flag is typically added in the generateFn implementation
      const result = await generateFn(selectedDocument, user.org_name, folderName, options);

      setData(result);

      const successMessage = formatSuccessMessage
        ? formatSuccessMessage(result, false) // Never show cached on regenerate
        : `${displayName} regenerated`;

      toast.success(successMessage, { id: toastId });
      console.log(`${displayName} regenerated successfully`);

    } catch (error) {
      console.error(`${displayName} regeneration failed:`, error);

      const errorMessage = error instanceof Error ? error.message : `Failed to regenerate ${displayName.toLowerCase()}`;

      toast.error(`Failed to regenerate ${displayName.toLowerCase()}: ${errorMessage}`, {
        id: toastId
      });
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, [selectedDocument, user, featureName, displayName, generateFn, formatSuccessMessage]);

  return {
    selectedDocument,
    data,
    setData, // Exposed for custom save handlers
    isModalOpen,
    isGenerating,
    handleGenerate,
    handleModalClose,
    handleRegenerate,
  };
}

/**
 * Helper to create a save handler that updates local state
 */
export function createSaveHandler<TData>(
  selectedDocument: Document | null,
  data: TData | null,
  setData: React.Dispatch<React.SetStateAction<TData | null>>,
  updateFn: (current: TData, newData: unknown) => TData,
  displayName: string
) {
  return async (newData: unknown) => {
    if (!selectedDocument || !data) return;

    setData(updateFn(data, newData));
    toast.success(`${displayName} updated for: ${selectedDocument.name}`);
  };
}
