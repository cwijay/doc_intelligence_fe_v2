'use client';

import { useState, useCallback, useEffect } from 'react';
import { extractionApi } from '@/lib/api/ai-features';
import { TemplateInfo } from '@/types/extraction';
import { useAuth } from '@/hooks/useAuth';
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
 * Normalize error message for organization-related errors
 */
function normalizeTemplateError(err: unknown): string {
  const errorMessage = err instanceof Error ? err.message : 'Failed to load templates';

  // Check for organization not found error (404)
  if (errorMessage.includes('Organization not found')) {
    return 'Organization not registered with AI service. Please contact support to enable extraction templates.';
  }

  // Check for authentication errors
  if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
    return 'Authentication required. Please log in to access templates.';
  }

  return errorMessage;
}

/**
 * Hook for managing extraction templates
 */
export function useTemplates(): UseTemplatesReturn {
  const { isAuthenticated, user } = useAuth();
  const [templates, setTemplates] = useState<TemplateInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshTemplates = useCallback(async () => {
    // Don't attempt to load templates if not authenticated or no org_name
    if (!isAuthenticated || !user?.org_name) {
      console.log('🔍 Skipping template load - not authenticated or missing org_name');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('🔍 Loading templates for organization:', user.org_name);
      const response = await extractionApi.listTemplates();

      if (!response.success) {
        throw new Error(response.error || 'Failed to load templates');
      }

      setTemplates(response.templates);
      console.log('✅ Loaded', response.templates.length, 'templates');
    } catch (err) {
      const errorMessage = normalizeTemplateError(err);
      setError(errorMessage);
      console.error('Failed to load templates:', err);

      // Only show toast for unexpected errors (not org not found which is common during setup)
      if (!errorMessage.includes('not registered')) {
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.org_name]);

  const getTemplate = useCallback((name: string): TemplateInfo | undefined => {
    return templates.find(t => t.name === name);
  }, [templates]);

  // Load templates when authenticated
  useEffect(() => {
    if (isAuthenticated && user?.org_name) {
      refreshTemplates();
    }
  }, [isAuthenticated, user?.org_name, refreshTemplates]);

  return {
    templates,
    isLoading,
    error,
    refreshTemplates,
    getTemplate,
  };
}
