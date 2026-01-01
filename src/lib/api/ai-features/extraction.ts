/**
 * Extraction API Client
 * Handles document data extraction workflow: analyze fields → generate schema → extract data
 */

import { AxiosResponse } from 'axios';
import aiApi from '../ai-base';
import { API_ENDPOINTS, TIMEOUTS } from '@/lib/constants';
import {
  AnalyzeFieldsRequest,
  AnalyzeFieldsResponse,
  GenerateSchemaRequest,
  GenerateSchemaResponse,
  ExtractDataRequest,
  ExtractDataResponse,
  TemplateListResponse,
  TemplateResponse,
  SaveExtractedDataRequest,
  SaveExtractedDataResponse,
  FieldSelection,
} from '@/types/extraction';
import { validateParsedFilePath } from '../utils/path-utils';
import { constructParsedFilePath } from '../utils/path-utils';

/**
 * Validate extraction inputs
 */
function validateExtractionInputs(documentName: string, parsedFilePath: string): void {
  if (!documentName || documentName.trim() === '') {
    throw new Error('document_name is required and cannot be empty');
  }
  validateParsedFilePath(parsedFilePath);
}

/**
 * Log extraction operation
 */
function logExtractionStart(operation: string, documentName: string, details?: Record<string, unknown>): void {
  console.log(`🔍 Extraction ${operation}:`, { documentName, ...details });
}

/**
 * Log extraction success
 */
function logExtractionSuccess(operation: string, documentName: string, metadata?: Record<string, unknown>): void {
  console.log(`✅ Extraction ${operation} completed:`, { documentName, ...metadata });
}

/**
 * Log extraction error
 */
function logExtractionError(operation: string, error: unknown): void {
  console.error(`🚫 Extraction ${operation} failed:`, error);
}

export const extractionApi = {
  /**
   * Analyze document to discover extractable fields
   * First step in the extraction workflow
   */
  analyzeFields: async (
    documentName: string,
    parsedFilePath: string,
    documentTypeHint?: string,
    sessionId?: string
  ): Promise<AnalyzeFieldsResponse> => {
    validateExtractionInputs(documentName, parsedFilePath);

    try {
      logExtractionStart('analyzeFields', documentName, { parsedFilePath, documentTypeHint });

      const requestData: AnalyzeFieldsRequest = {
        document_name: documentName,
        parsed_file_path: parsedFilePath,
        ...(documentTypeHint && { document_type_hint: documentTypeHint }),
        ...(sessionId && { session_id: sessionId }),
      };

      const response: AxiosResponse<AnalyzeFieldsResponse> = await aiApi.post(
        API_ENDPOINTS.EXTRACTION.ANALYZE,
        requestData,
        { timeout: TIMEOUTS.AI_API }
      );

      logExtractionSuccess('analyzeFields', documentName, {
        fieldCount: response.data.fields?.length || 0,
        hasLineItems: response.data.has_line_items,
        documentType: response.data.document_type,
        processingTime: response.data.processing_time_ms,
      });

      return response.data;
    } catch (error) {
      logExtractionError('analyzeFields', error);
      throw error;
    }
  },

  /**
   * Generate schema from selected fields
   * Optionally saves as a reusable template
   */
  generateSchema: async (
    templateName: string,
    documentType: string,
    selectedFields: FieldSelection[],
    folderName: string,
    saveTemplate: boolean = true,
    sessionId?: string
  ): Promise<GenerateSchemaResponse> => {
    if (!templateName || templateName.trim() === '') {
      throw new Error('template_name is required');
    }
    if (!documentType || documentType.trim() === '') {
      throw new Error('document_type is required');
    }
    if (!folderName || folderName.trim() === '') {
      throw new Error('folder_name is required');
    }
    if (!selectedFields || selectedFields.length === 0) {
      throw new Error('At least one field must be selected');
    }

    try {
      logExtractionStart('generateSchema', templateName, {
        documentType,
        folderName,
        fieldCount: selectedFields.length,
        saveTemplate,
      });

      const requestData: GenerateSchemaRequest = {
        template_name: templateName,
        document_type: documentType,
        folder_name: folderName,
        selected_fields: selectedFields,
        save_template: saveTemplate,
        ...(sessionId && { session_id: sessionId }),
      };

      const response: AxiosResponse<GenerateSchemaResponse> = await aiApi.post(
        API_ENDPOINTS.EXTRACTION.GENERATE_SCHEMA,
        requestData,
        { timeout: TIMEOUTS.AI_API }
      );

      logExtractionSuccess('generateSchema', templateName, {
        gcsUri: response.data.gcs_uri,
        processingTime: response.data.processing_time_ms,
      });

      return response.data;
    } catch (error) {
      logExtractionError('generateSchema', error);
      throw error;
    }
  },

  /**
   * List all extraction templates for the organization
   */
  listTemplates: async (): Promise<TemplateListResponse> => {
    try {
      logExtractionStart('listTemplates', 'organization');

      const response: AxiosResponse<TemplateListResponse> = await aiApi.get(
        API_ENDPOINTS.EXTRACTION.TEMPLATES,
        { timeout: TIMEOUTS.AI_API }
      );

      logExtractionSuccess('listTemplates', 'organization', {
        templateCount: response.data.total,
      });

      return response.data;
    } catch (error) {
      logExtractionError('listTemplates', error);
      throw error;
    }
  },

  /**
   * Get a specific template by name
   */
  getTemplate: async (templateName: string): Promise<TemplateResponse> => {
    if (!templateName || templateName.trim() === '') {
      throw new Error('template_name is required');
    }

    try {
      logExtractionStart('getTemplate', templateName);

      const response: AxiosResponse<TemplateResponse> = await aiApi.get(
        `${API_ENDPOINTS.EXTRACTION.TEMPLATES}/${encodeURIComponent(templateName)}`,
        { timeout: TIMEOUTS.AI_API }
      );

      logExtractionSuccess('getTemplate', templateName, {
        documentType: response.data.document_type,
      });

      return response.data;
    } catch (error) {
      logExtractionError('getTemplate', error);
      throw error;
    }
  },

  /**
   * Extract data from document using schema or template
   * Either templateName or schema must be provided
   */
  extractData: async (
    documentName: string,
    parsedFilePath: string,
    templateName?: string,
    schema?: Record<string, unknown>,
    sessionId?: string
  ): Promise<ExtractDataResponse> => {
    validateExtractionInputs(documentName, parsedFilePath);

    if (!templateName && !schema) {
      throw new Error('Either template_name or schema must be provided');
    }

    try {
      logExtractionStart('extractData', documentName, {
        parsedFilePath,
        templateName,
        hasSchema: !!schema,
      });

      const requestData: ExtractDataRequest = {
        document_name: documentName,
        parsed_file_path: parsedFilePath,
        ...(templateName && { template_name: templateName }),
        ...(schema && { schema }),
        ...(sessionId && { session_id: sessionId }),
      };

      const response: AxiosResponse<ExtractDataResponse> = await aiApi.post(
        API_ENDPOINTS.EXTRACTION.EXTRACT,
        requestData,
        { timeout: TIMEOUTS.AI_API }
      );

      logExtractionSuccess('extractData', documentName, {
        extractionJobId: response.data.extraction_job_id,
        fieldCount: response.data.extracted_field_count,
        processingTime: response.data.processing_time_ms,
        tokenUsage: response.data.token_usage,
      });

      return response.data;
    } catch (error) {
      logExtractionError('extractData', error);
      throw error;
    }
  },

  /**
   * Save extracted data to database
   */
  saveExtractedData: async (
    extractionJobId: string,
    documentId: string,
    extractedData: Record<string, unknown>,
    templateId?: string,
    folderName?: string,
    sourceFilePath?: string
  ): Promise<SaveExtractedDataResponse> => {
    if (!extractionJobId || extractionJobId.trim() === '') {
      throw new Error('extraction_job_id is required');
    }
    if (!documentId || documentId.trim() === '') {
      throw new Error('document_id is required');
    }

    try {
      logExtractionStart('saveExtractedData', documentId, { extractionJobId, folderName });

      const requestData: SaveExtractedDataRequest = {
        extraction_job_id: extractionJobId,
        document_id: documentId,
        extracted_data: extractedData,
        ...(templateId && { template_id: templateId }),
        ...(folderName && { folder_name: folderName }),
        ...(sourceFilePath && { source_file_path: sourceFilePath }),
      };

      const response: AxiosResponse<SaveExtractedDataResponse> = await aiApi.post(
        API_ENDPOINTS.EXTRACTION.SAVE,
        requestData,
        { timeout: TIMEOUTS.AI_API }
      );

      logExtractionSuccess('saveExtractedData', documentId, {
        recordId: response.data.record_id,
      });

      return response.data;
    } catch (error) {
      logExtractionError('saveExtractedData', error);
      throw error;
    }
  },

  /**
   * Export extracted data as Excel file
   */
  exportToExcel: async (extractionJobId: string): Promise<Blob> => {
    if (!extractionJobId || extractionJobId.trim() === '') {
      throw new Error('extraction_job_id is required');
    }

    try {
      logExtractionStart('exportToExcel', extractionJobId);

      const response = await aiApi.get(
        `${API_ENDPOINTS.EXTRACTION.EXPORT}/${encodeURIComponent(extractionJobId)}`,
        {
          timeout: TIMEOUTS.AI_API,
          responseType: 'blob',
        }
      );

      logExtractionSuccess('exportToExcel', extractionJobId);

      return response.data;
    } catch (error) {
      logExtractionError('exportToExcel', error);
      throw error;
    }
  },

  /**
   * Convenience method: Analyze fields with document path construction
   */
  analyzeFieldsFromDocument: async (
    documentName: string,
    orgName: string,
    folderName: string,
    documentTypeHint?: string,
    sessionId?: string
  ): Promise<AnalyzeFieldsResponse> => {
    const parsedFilePath = constructParsedFilePath(orgName, folderName, documentName);

    return extractionApi.analyzeFields(
      documentName,
      parsedFilePath,
      documentTypeHint,
      sessionId
    );
  },

  /**
   * Convenience method: Extract data with document path construction
   */
  extractDataFromDocument: async (
    documentName: string,
    orgName: string,
    folderName: string,
    templateName?: string,
    schema?: Record<string, unknown>,
    sessionId?: string
  ): Promise<ExtractDataResponse> => {
    const parsedFilePath = constructParsedFilePath(orgName, folderName, documentName);

    return extractionApi.extractData(
      documentName,
      parsedFilePath,
      templateName,
      schema,
      sessionId
    );
  },
};
