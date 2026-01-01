/**
 * TypeScript types for document extraction feature
 */

// =============================================================================
// Field Types
// =============================================================================

/**
 * A field discovered during document analysis
 */
export interface DiscoveredField {
  field_name: string;
  display_name: string;
  data_type: 'string' | 'number' | 'date' | 'currency' | 'boolean' | 'array';
  sample_value: string | null;
  confidence: number;
  location: 'header' | 'line_item' | 'footer' | 'body';
  required: boolean;
}

/**
 * A field selected by the user for extraction
 */
export interface FieldSelection {
  field_name: string;
  display_name: string;
  data_type: string;
  location: string;
  required: boolean;
}

// =============================================================================
// Analyze Fields
// =============================================================================

export interface AnalyzeFieldsRequest {
  document_name: string;
  parsed_file_path: string;
  document_type_hint?: string;
  session_id?: string;
}

export interface AnalyzeFieldsResponse {
  success: boolean;
  document_name: string;
  document_type?: string;
  fields?: DiscoveredField[];
  has_line_items: boolean;
  line_item_fields?: DiscoveredField[];
  processing_time_ms: number;
  error?: string;
  session_id?: string;
}

// =============================================================================
// Generate Schema
// =============================================================================

export interface GenerateSchemaRequest {
  template_name: string;
  document_type: string;
  folder_name: string;
  selected_fields: FieldSelection[];
  save_template?: boolean;
  session_id?: string;
}

export interface GenerateSchemaResponse {
  success: boolean;
  template_name: string;
  document_type?: string;
  schema?: Record<string, any>;
  gcs_uri?: string;
  processing_time_ms: number;
  error?: string;
  session_id?: string;
}

// =============================================================================
// Extract Data
// =============================================================================

export interface ExtractDataRequest {
  document_name: string;
  parsed_file_path: string;
  template_name?: string;
  schema?: Record<string, any>;
  session_id?: string;
}

export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  estimated_cost_usd?: number;
}

export interface ExtractDataResponse {
  success: boolean;
  extraction_job_id?: string;
  document_name: string;
  schema_title?: string;
  extracted_data?: Record<string, any>;
  extracted_field_count: number;
  token_usage?: TokenUsage;
  processing_time_ms: number;
  error?: string;
  session_id?: string;
}

// =============================================================================
// Templates
// =============================================================================

export interface TemplateInfo {
  name: string;
  document_type: string;
  created_at?: string;
  gcs_path?: string;
  field_count: number;
}

export interface TemplateListResponse {
  success: boolean;
  templates: TemplateInfo[];
  total: number;
  error?: string;
}

export interface TemplateResponse {
  success: boolean;
  name?: string;
  document_type?: string;
  schema?: Record<string, any>;
  gcs_path?: string;
  error?: string;
}

// =============================================================================
// Save Extracted Data
// =============================================================================

export interface SaveExtractedDataRequest {
  extraction_job_id: string;
  document_id: string;
  extracted_data: Record<string, any>;
  template_id?: string;
  folder_name?: string;
  source_file_path?: string;
}

export interface SaveExtractedDataResponse {
  success: boolean;
  record_id?: string;
  message: string;
  error?: string;
}

// =============================================================================
// Extraction State (for UI)
// =============================================================================

export type ExtractionStep = 'analyze' | 'select' | 'extract' | 'actions';

export interface ExtractionState {
  step: ExtractionStep;
  isLoading: boolean;
  error: string | null;
  discoveredFields: DiscoveredField[];
  lineItemFields: DiscoveredField[];
  documentType: string | null;
  hasLineItems: boolean;
  selectedFields: FieldSelection[];
  selectedTemplate: TemplateInfo | null;
  schema: Record<string, any> | null;
  extractedData: Record<string, any> | null;
  extractionJobId: string | null;
}

// =============================================================================
// Document Type Hints
// =============================================================================

export const DOCUMENT_TYPE_HINTS = [
  'invoice',
  'purchase_order',
  'receipt',
  'contract',
  'bill_of_lading',
  'packing_list',
  'quotation',
  'other'
] as const;

export type DocumentTypeHint = typeof DOCUMENT_TYPE_HINTS[number];
