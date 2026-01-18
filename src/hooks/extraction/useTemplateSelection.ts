'use client';

import { useState, useCallback, useMemo } from 'react';
import { Document, DocumentParseResponse } from '@/types/api';
import { TemplateInfo, TemplateField } from '@/types/extraction';
import { extractionApi } from '@/lib/api/ai-features';
import { filterTemplatesByFolder } from '@/lib/utils/templateMatcher';
import { parseSchemaToFields } from '@/lib/utils/schemaParser';
import { useTemplates } from './useTemplates';
import toast from 'react-hot-toast';

// =============================================================================
// Types
// =============================================================================

export interface UseTemplateSelectionReturn {
  // Modal state
  isModalOpen: boolean;
  isLoadingFields: boolean;
  error: string | null;

  // Document context
  document: Document | null;
  folderName: string | null;
  parseData: DocumentParseResponse | null;

  // Templates
  allTemplates: TemplateInfo[];
  filteredTemplates: TemplateInfo[];
  isLoadingTemplates: boolean;

  // Selected template
  selectedTemplate: TemplateInfo | null;
  templateFields: TemplateField[];
  schema: Record<string, unknown> | null;

  // Actions
  openSelection: (document: Document, folderName: string, parseData?: DocumentParseResponse) => void;
  selectTemplate: (template: TemplateInfo | null) => Promise<void>;
  closeModal: () => void;
  refreshTemplates: () => Promise<void>;

  // Proceed actions (signal parent to continue)
  proceedWithTemplate: () => void;
  proceedWithAnalyze: () => void;

  // Proceed flags (for parent to react to)
  shouldProceedWithTemplate: boolean;
  shouldProceedWithAnalyze: boolean;

  // Reset proceed flags
  resetProceedFlags: () => void;
}

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * Hook for managing template selection before extraction
 * Allows users to preview and select templates filtered by folder
 */
export function useTemplateSelection(): UseTemplateSelectionReturn {
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingFields, setIsLoadingFields] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Document context
  const [document, setDocument] = useState<Document | null>(null);
  const [folderName, setFolderName] = useState<string | null>(null);
  const [parseData, setParseData] = useState<DocumentParseResponse | null>(null);

  // Selected template details
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateInfo | null>(null);
  const [templateFields, setTemplateFields] = useState<TemplateField[]>([]);
  const [schema, setSchema] = useState<Record<string, unknown> | null>(null);

  // Proceed flags
  const [shouldProceedWithTemplate, setShouldProceedWithTemplate] = useState(false);
  const [shouldProceedWithAnalyze, setShouldProceedWithAnalyze] = useState(false);

  // Use existing templates hook
  const {
    templates: allTemplates,
    isLoading: isLoadingTemplates,
    refreshTemplates,
  } = useTemplates();

  // Filter templates by folder name
  const filteredTemplates = useMemo(() => {
    if (!folderName) return [];
    return filterTemplatesByFolder(allTemplates, folderName);
  }, [allTemplates, folderName]);

  // =============================================================================
  // Actions
  // =============================================================================

  const resetState = useCallback(() => {
    setSelectedTemplate(null);
    setTemplateFields([]);
    setSchema(null);
    setError(null);
    setShouldProceedWithTemplate(false);
    setShouldProceedWithAnalyze(false);
  }, []);

  const openSelection = useCallback((
    doc: Document,
    folder: string,
    parse?: DocumentParseResponse
  ) => {
    resetState();
    setDocument(doc);
    setFolderName(folder);
    setParseData(parse || null);
    setIsModalOpen(true);
  }, [resetState]);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setDocument(null);
    setFolderName(null);
    setParseData(null);
    resetState();
  }, [resetState]);

  const selectTemplate = useCallback(async (template: TemplateInfo | null) => {
    console.log('🔍 selectTemplate called:', {
      templateName: template?.name,
      folderName,
      folderNameType: typeof folderName,
    });

    setSelectedTemplate(template);
    setTemplateFields([]);
    setSchema(null);
    setError(null);

    if (!template) {
      return;
    }

    try {
      setIsLoadingFields(true);

      // Fetch full template details including schema
      // Pass folder name to scope the template search
      console.log('📤 Calling getTemplate with:', { templateName: template.name, folderName });
      const response = await extractionApi.getTemplate(template.name, folderName || undefined);

      if (!response.success) {
        throw new Error(response.error || 'Failed to load template');
      }

      if (!response.schema) {
        throw new Error('Template has no schema');
      }

      setSchema(response.schema);

      // Parse schema to get field list for preview
      const fields = parseSchemaToFields(response.schema);
      setTemplateFields(fields);

      console.log('📋 Template loaded:', {
        name: template.name,
        folderName,
        fieldCount: fields.length,
        fields: fields.map(f => f.field_name),
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load template details';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Failed to load template:', err);
    } finally {
      setIsLoadingFields(false);
    }
  }, [folderName]);

  const proceedWithTemplate = useCallback(() => {
    if (!selectedTemplate || !schema) {
      toast.error('Please select a template first');
      return;
    }
    setShouldProceedWithTemplate(true);
    setIsModalOpen(false);
  }, [selectedTemplate, schema]);

  const proceedWithAnalyze = useCallback(() => {
    setShouldProceedWithAnalyze(true);
    setIsModalOpen(false);
  }, []);

  const resetProceedFlags = useCallback(() => {
    setShouldProceedWithTemplate(false);
    setShouldProceedWithAnalyze(false);
  }, []);

  // =============================================================================
  // Return
  // =============================================================================

  return useMemo(() => ({
    // Modal state
    isModalOpen,
    isLoadingFields,
    error,

    // Document context
    document,
    folderName,
    parseData,

    // Templates
    allTemplates,
    filteredTemplates,
    isLoadingTemplates,

    // Selected template
    selectedTemplate,
    templateFields,
    schema,

    // Actions
    openSelection,
    selectTemplate,
    closeModal,
    refreshTemplates,

    // Proceed actions
    proceedWithTemplate,
    proceedWithAnalyze,

    // Proceed flags
    shouldProceedWithTemplate,
    shouldProceedWithAnalyze,

    // Reset
    resetProceedFlags,
  }), [
    isModalOpen,
    isLoadingFields,
    error,
    document,
    folderName,
    parseData,
    allTemplates,
    filteredTemplates,
    isLoadingTemplates,
    selectedTemplate,
    templateFields,
    schema,
    openSelection,
    selectTemplate,
    closeModal,
    refreshTemplates,
    proceedWithTemplate,
    proceedWithAnalyze,
    shouldProceedWithTemplate,
    shouldProceedWithAnalyze,
    resetProceedFlags,
  ]);
}
