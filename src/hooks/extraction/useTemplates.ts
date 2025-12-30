'use client';

import { useState, useCallback, useEffect } from 'react';
import { extractionApi } from '@/lib/api/ai-features';
import { TemplateInfo } from '@/types/extraction';
import toast from 'react-hot-toast';

export interface UseTemplatesReturn {
  /** List of available templates */
  templates: TemplateInfo[];
  /** Whether templates are loading */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Refresh templates list */
  refreshTemplates: () => Promise<void>;
  /** Get template by name */
  getTemplate: (name: string) => TemplateInfo | undefined;
}

/**
 * Hook for managing extraction templates
 */
export function useTemplates(): UseTemplatesReturn {
  const [templates, setTemplates] = useState<TemplateInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshTemplates = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await extractionApi.listTemplates();

      if (!response.success) {
        throw new Error(response.error || 'Failed to load templates');
      }

      setTemplates(response.templates);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load templates';
      setError(errorMessage);
      console.error('Failed to load templates:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getTemplate = useCallback((name: string): TemplateInfo | undefined => {
    return templates.find(t => t.name === name);
  }, [templates]);

  // Load templates on mount
  useEffect(() => {
    refreshTemplates();
  }, [refreshTemplates]);

  return {
    templates,
    isLoading,
    error,
    refreshTemplates,
    getTemplate,
  };
}
