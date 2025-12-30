'use client';

import { useState, useCallback, useMemo } from 'react';
import { Document } from '@/types/api';
import { extractionApi } from '@/lib/api/ai-features';
import { useAuth } from '@/hooks/useAuth';
import { resolveFolderName } from '@/hooks/ai/utils';
import toast from 'react-hot-toast';
import {
  DiscoveredField,
  FieldSelection,
  TemplateInfo,
  ExtractionStep,
  ExtractionState,
  TokenUsage,
} from '@/types/extraction';

// =============================================================================
// Types
// =============================================================================

export interface ExtractionActions {
  /** Start extraction workflow for a document */
  startExtraction: (document: Document, documentTypeHint?: string) => void;
  /** Analyze document to discover fields */
  analyzeFields: () => Promise<void>;
  /** Toggle field selection */
  toggleFieldSelection: (field: DiscoveredField) => void;
  /** Select all fields */
  selectAllFields: () => void;
  /** Clear all field selections */
  clearFieldSelections: () => void;
  /** Select an existing template */
  selectTemplate: (template: TemplateInfo | null) => void;
  /** Generate schema from selected fields */
  generateSchema: (templateName: string, saveTemplate?: boolean) => Promise<void>;
  /** Extract data using current schema */
  extractData: () => Promise<void>;
  /** Save extracted data to database */
  saveExtractedData: () => Promise<void>;
  /** Export to Excel */
  exportToExcel: () => Promise<void>;
  /** Close extraction modal and reset state */
  closeExtraction: () => void;
  /** Complete extraction and close modal, preserving document reference */
  completeExtraction: () => void;
  /** Go to a specific step */
  goToStep: (step: ExtractionStep) => void;
  /** Go to previous step */
  previousStep: () => void;
  /** Go to next step */
  nextStep: () => void;
}

export interface UseExtractionReturn extends ExtractionState, ExtractionActions {
  /** Whether the extraction modal is open */
  isModalOpen: boolean;
  /** Whether any async operation is in progress */
  isProcessing: boolean;
  /** Currently selected document */
  selectedDocument: Document | null;
  /** Current session ID */
  sessionId: string | null;
  /** Token usage from extraction */
  tokenUsage: TokenUsage | null;
}

// =============================================================================
// Step Order
// =============================================================================

const STEP_ORDER: ExtractionStep[] = ['analyze', 'select', 'extract', 'actions'];

function getStepIndex(step: ExtractionStep): number {
  return STEP_ORDER.indexOf(step);
}

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * Main extraction workflow hook
 * Manages the entire extraction process: analyze → select → extract → actions
 */
export function useExtraction(): UseExtractionReturn {
  const { user } = useAuth();

  // Core state
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState<ExtractionStep>('analyze');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Analysis state
  const [discoveredFields, setDiscoveredFields] = useState<DiscoveredField[]>([]);
  const [lineItemFields, setLineItemFields] = useState<DiscoveredField[]>([]);
  const [documentType, setDocumentType] = useState<string | null>(null);
  const [hasLineItems, setHasLineItems] = useState(false);

  // Selection state
  const [selectedFields, setSelectedFields] = useState<FieldSelection[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateInfo | null>(null);

  // Schema state
  const [schema, setSchema] = useState<Record<string, unknown> | null>(null);

  // Extraction state
  const [extractedData, setExtractedData] = useState<Record<string, unknown> | null>(null);
  const [extractionJobId, setExtractionJobId] = useState<string | null>(null);
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | null>(null);

  // Session
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Document type hint for analysis
  const [documentTypeHint, setDocumentTypeHint] = useState<string | undefined>();

  // =============================================================================
  // Derived State
  // =============================================================================

  const isProcessing = isLoading;

  // =============================================================================
  // Actions
  // =============================================================================

  const resetState = useCallback(() => {
    setStep('analyze');
    setIsLoading(false);
    setError(null);
    setDiscoveredFields([]);
    setLineItemFields([]);
    setDocumentType(null);
    setHasLineItems(false);
    setSelectedFields([]);
    setSelectedTemplate(null);
    setSchema(null);
    setExtractedData(null);
    setExtractionJobId(null);
    setTokenUsage(null);
    setSessionId(null);
    setDocumentTypeHint(undefined);
  }, []);

  const startExtraction = useCallback((document: Document, typeHint?: string) => {
    resetState();
    setSelectedDocument(document);
    setDocumentTypeHint(typeHint);
    setIsModalOpen(true);
  }, [resetState]);

  const closeExtraction = useCallback(() => {
    setIsModalOpen(false);
    setSelectedDocument(null);
    resetState();
  }, [resetState]);

  /**
   * Complete extraction workflow - closes modal but preserves document reference
   * so the parent can reopen the parse modal for mandatory indexing
   */
  const completeExtraction = useCallback(() => {
    setIsModalOpen(false);
    // Note: We don't clear selectedDocument here so parent can access it
    // Parent should call closeExtraction when truly done with the document
    resetState();
  }, [resetState]);

  const goToStep = useCallback((newStep: ExtractionStep) => {
    setStep(newStep);
    setError(null);
  }, []);

  const previousStep = useCallback(() => {
    const currentIndex = getStepIndex(step);
    if (currentIndex > 0) {
      setStep(STEP_ORDER[currentIndex - 1]);
      setError(null);
    }
  }, [step]);

  const nextStep = useCallback(() => {
    const currentIndex = getStepIndex(step);
    if (currentIndex < STEP_ORDER.length - 1) {
      setStep(STEP_ORDER[currentIndex + 1]);
      setError(null);
    }
  }, [step]);

  // =============================================================================
  // Field Analysis
  // =============================================================================

  const analyzeFields = useCallback(async () => {
    if (!selectedDocument || !user?.org_name || !user?.org_id) {
      toast.error('Please select a document and ensure you are logged in');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      toast.loading(`Analyzing fields in ${selectedDocument.name}...`, { id: 'analyze-fields' });

      const folderName = await resolveFolderName(selectedDocument, user.org_id);

      const response = await extractionApi.analyzeFieldsFromDocument(
        selectedDocument.name,
        user.org_name,
        folderName,
        documentTypeHint,
        sessionId || undefined
      );

      if (!response.success) {
        throw new Error(response.error || 'Field analysis failed');
      }

      setDiscoveredFields(response.fields || []);
      setLineItemFields(response.line_item_fields || []);
      setDocumentType(response.document_type || null);
      setHasLineItems(response.has_line_items);
      setSessionId(response.session_id || null);

      toast.success(
        `Found ${(response.fields?.length || 0) + (response.line_item_fields?.length || 0)} fields`,
        { id: 'analyze-fields' }
      );

      // Auto-advance to selection step
      setStep('select');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze document';
      setError(errorMessage);
      toast.error(errorMessage, { id: 'analyze-fields' });
    } finally {
      setIsLoading(false);
    }
  }, [selectedDocument, user, documentTypeHint, sessionId]);

  // =============================================================================
  // Field Selection
  // =============================================================================

  const toggleFieldSelection = useCallback((field: DiscoveredField) => {
    setSelectedFields(prev => {
      const existingIndex = prev.findIndex(f => f.field_name === field.field_name);

      if (existingIndex >= 0) {
        // Remove field
        return prev.filter((_, i) => i !== existingIndex);
      } else {
        // Add field
        const selection: FieldSelection = {
          field_name: field.field_name,
          display_name: field.display_name,
          data_type: field.data_type,
          location: field.location,
          required: field.required,
        };
        return [...prev, selection];
      }
    });

    // Clear selected template when manually selecting fields
    setSelectedTemplate(null);
  }, []);

  const selectAllFields = useCallback(() => {
    const allFields = [...discoveredFields, ...lineItemFields];
    const selections: FieldSelection[] = allFields.map(field => ({
      field_name: field.field_name,
      display_name: field.display_name,
      data_type: field.data_type,
      location: field.location,
      required: field.required,
    }));
    setSelectedFields(selections);
    setSelectedTemplate(null);
  }, [discoveredFields, lineItemFields]);

  const clearFieldSelections = useCallback(() => {
    setSelectedFields([]);
    setSelectedTemplate(null);
  }, []);

  const selectTemplate = useCallback(async (template: TemplateInfo | null) => {
    setSelectedTemplate(template);

    if (template) {
      // Clear manual field selections when template is selected
      setSelectedFields([]);

      // Load template schema
      try {
        const response = await extractionApi.getTemplate(template.name);
        if (response.success && response.schema) {
          setSchema(response.schema);
        }
      } catch (err) {
        console.error('Failed to load template:', err);
      }
    } else {
      setSchema(null);
    }
  }, []);

  // =============================================================================
  // Schema Generation
  // =============================================================================

  const generateSchema = useCallback(async (templateName: string, saveTemplate: boolean = true) => {
    if (selectedFields.length === 0) {
      toast.error('Please select at least one field');
      return;
    }

    if (!documentType) {
      toast.error('Document type is required');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      toast.loading('Generating extraction schema...', { id: 'generate-schema' });

      const response = await extractionApi.generateSchema(
        templateName,
        documentType,
        selectedFields,
        saveTemplate,
        sessionId || undefined
      );

      if (!response.success) {
        throw new Error(response.error || 'Schema generation failed');
      }

      setSchema(response.schema || null);

      // Set selectedTemplate so template_name is available when saving
      if (saveTemplate) {
        setSelectedTemplate({
          name: templateName,
          document_type: documentType,
          field_count: selectedFields.length,
        });
      }

      toast.success(
        saveTemplate
          ? `Schema saved as "${templateName}"`
          : 'Schema generated successfully',
        { id: 'generate-schema' }
      );

      // Auto-advance to extract step
      setStep('extract');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate schema';
      setError(errorMessage);
      toast.error(errorMessage, { id: 'generate-schema' });
    } finally {
      setIsLoading(false);
    }
  }, [selectedFields, documentType, sessionId]);

  // =============================================================================
  // Data Extraction
  // =============================================================================

  const extractData = useCallback(async () => {
    if (!selectedDocument || !user?.org_name || !user?.org_id) {
      toast.error('Document and user information required');
      return;
    }

    if (!schema && !selectedTemplate) {
      toast.error('Schema or template is required');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      toast.loading(`Extracting data from ${selectedDocument.name}...`, { id: 'extract-data' });

      const folderName = await resolveFolderName(selectedDocument, user.org_id);

      const response = await extractionApi.extractDataFromDocument(
        selectedDocument.name,
        user.org_name,
        folderName,
        selectedTemplate?.name,
        schema || undefined,
        sessionId || undefined
      );

      if (!response.success) {
        throw new Error(response.error || 'Data extraction failed');
      }

      setExtractedData(response.extracted_data || null);
      setExtractionJobId(response.extraction_job_id || null);
      setTokenUsage(response.token_usage || null);

      toast.success(
        `Extracted ${response.extracted_field_count} fields`,
        { id: 'extract-data' }
      );

      // Auto-advance to actions step
      setStep('actions');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to extract data';
      setError(errorMessage);
      toast.error(errorMessage, { id: 'extract-data' });
    } finally {
      setIsLoading(false);
    }
  }, [selectedDocument, user, schema, selectedTemplate, sessionId]);

  // =============================================================================
  // Save & Export
  // =============================================================================

  const saveExtractedData = useCallback(async () => {
    if (!extractedData || !extractionJobId || !selectedDocument) {
      toast.error('No extracted data to save');
      return;
    }

    try {
      setIsLoading(true);
      toast.loading('Saving extracted data...', { id: 'save-data' });

      const response = await extractionApi.saveExtractedData(
        extractionJobId,
        selectedDocument.id,
        extractedData,
        selectedTemplate?.name
      );

      if (!response.success) {
        throw new Error(response.error || 'Failed to save data');
      }

      toast.success('Data saved successfully', { id: 'save-data' });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save data';
      toast.error(errorMessage, { id: 'save-data' });
    } finally {
      setIsLoading(false);
    }
  }, [extractedData, extractionJobId, selectedDocument, selectedTemplate]);

  const exportToExcel = useCallback(async () => {
    if (!extractionJobId) {
      toast.error('No extraction job to export');
      return;
    }

    try {
      setIsLoading(true);
      toast.loading('Generating Excel file...', { id: 'export-excel' });

      const blob = await extractionApi.exportToExcel(extractionJobId);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `extraction_${extractionJobId}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Excel file downloaded', { id: 'export-excel' });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export to Excel';
      toast.error(errorMessage, { id: 'export-excel' });
    } finally {
      setIsLoading(false);
    }
  }, [extractionJobId]);

  // =============================================================================
  // Return
  // =============================================================================

  return useMemo(() => ({
    // State
    step,
    isLoading,
    error,
    discoveredFields,
    lineItemFields,
    documentType,
    hasLineItems,
    selectedFields,
    selectedTemplate,
    schema,
    extractedData,
    extractionJobId,

    // Derived
    isProcessing,
    selectedDocument,
    sessionId,
    tokenUsage,
    isModalOpen,

    // Actions
    startExtraction,
    analyzeFields,
    toggleFieldSelection,
    selectAllFields,
    clearFieldSelections,
    selectTemplate,
    generateSchema,
    extractData,
    saveExtractedData,
    exportToExcel,
    closeExtraction,
    completeExtraction,
    goToStep,
    previousStep,
    nextStep,
  }), [
    step,
    isLoading,
    error,
    discoveredFields,
    lineItemFields,
    documentType,
    hasLineItems,
    selectedFields,
    selectedTemplate,
    schema,
    extractedData,
    extractionJobId,
    isProcessing,
    selectedDocument,
    sessionId,
    tokenUsage,
    isModalOpen,
    startExtraction,
    analyzeFields,
    toggleFieldSelection,
    selectAllFields,
    clearFieldSelections,
    selectTemplate,
    generateSchema,
    extractData,
    saveExtractedData,
    exportToExcel,
    closeExtraction,
    completeExtraction,
    goToStep,
    previousStep,
    nextStep,
  ]);
}
