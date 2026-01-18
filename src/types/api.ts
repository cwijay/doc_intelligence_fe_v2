export type PlanType = 'free' | 'pro' | 'enterprise';

export interface Organization {
  id: string;
  name: string;
  domain?: string;
  settings: Record<string, any>;
  plan_type: PlanType;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrganizationCreateRequest {
  name: string;
  domain?: string;
  settings?: Record<string, any>;
  plan_type?: PlanType;
}

export interface OrganizationUpdateRequest {
  name?: string;
  domain?: string;
  settings?: Record<string, any>;
  plan_type?: PlanType;
}

export interface OrganizationDeleteResponse {
  success: boolean;
  message: string;
}

export interface OrganizationList {
  organizations: Organization[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface PaginationParams {
  page?: number;
  per_page?: number;
}

export interface OrganizationFilters extends PaginationParams {
  name?: string;
  domain?: string;
  plan_type?: PlanType;
  is_active?: boolean;
}

export interface ApiError {
  detail: Array<{
    loc: (string | number)[];
    msg: string;
    type: string;
  }>;
}

export interface HealthCheck {
  status: string;
  timestamp: string;
}

// User-related types
export type UserRole = 'admin' | 'user' | 'viewer';

export interface User {
  id: string;
  org_id: string;
  email: string;
  username: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

export interface UserCreateRequest {
  email: string;
  username: string;
  full_name: string;
  password: string;
  role?: UserRole;
}

export interface UserUpdateRequest {
  email?: string;
  username?: string;
  full_name?: string;
  password?: string;
  role?: UserRole;
}

export interface UserDeleteResponse {
  success: boolean;
  message: string;
}

export interface UserList {
  users: User[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface UserFilters extends PaginationParams {
  email?: string;
  username?: string;
  full_name?: string;
  role?: UserRole;
  is_active?: boolean;
}

// Folder-related types
export interface Folder {
  id: string;
  name: string;
  description?: string;
  organization_id: string;
  parent_folder_id?: string;
  created_at: string;
  updated_at: string;
  document_count?: number;
}

export interface FolderCreateRequest {
  name: string;
  description?: string;
  parent_folder_id?: string;
}

export interface FolderUpdateRequest {
  name?: string;
  description?: string;
}

export interface FolderDeleteResponse {
  success: boolean;
  message: string;
}

export interface FolderList {
  folders: Folder[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface FolderFilters extends PaginationParams {
  name?: string;
  parent_folder_id?: string;
}

export interface FolderTree {
  folders: FolderWithChildren[];
}

export interface FolderWithChildren {
  id: string;
  name: string;
  description?: string;
  organization_id: string;
  parent_folder_id?: string;
  created_at: string;
  updated_at: string;
  document_count?: number;
  path: string;
  children: FolderWithChildren[];
}

export interface FolderMoveRequest {
  parent_folder_id?: string;
}

export interface FolderStats {
  total_folders: number;
  total_documents: number;
  storage_used: number;
  created_this_month: number;
  most_active_folder?: {
    id: string;
    name: string;
    document_count: number;
  };
}

// Document Management Types
export type DocumentStatus = 'uploaded' | 'processing' | 'processed' | 'parsed' | 'error' | 'failed';

export interface ExtractedData {
  type: string;
  amount?: string;
  confidence: number;
  [key: string]: any;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  status: DocumentStatus;
  uploaded_at: string;
  extracted_data?: ExtractedData | null;
  organization_id: string;
  tags: string[];
  error?: string;
  folder_id?: string;
  processed_at?: string;
  created_by?: string;
  // Storage path properties (added during normalization)
  storage_path?: string;
  gcs_path?: string;
  path?: string;
  folder_name?: string;
  // Gemini File Search indexing status
  indexed_at?: string;
  // Parsed content properties
  parsed_content?: string;
  parsed_content_path?: string;
  parsed_at?: string;
  // Summary properties
  summary_content?: string;
  summary_id?: string;
  summarized_at?: string;
  ai_summary?: unknown;
  // FAQ properties
  faq_content?: string;
  faq_id?: string;
  faq_generated_at?: string;
  ai_faq?: unknown;
  // Questions properties
  questions_content?: string;
  questions_id?: string;
  questions_generated_at?: string;
  ai_questions?: unknown;
}

export interface DocumentCreateRequest {
  name: string;
  type: string;
  size: number;
  folder_id?: string;
  tags?: string[];
}

export interface DocumentUpdateRequest {
  name?: string;
  tags?: string[];
  folder_id?: string;
}

export interface DocumentDeleteResponse {
  success: boolean;
  message: string;
}

export interface DocumentRenameRequest {
  new_name: string;
}

export interface DocumentRenameResponse {
  success: boolean;
  document: Document;
  renamed_paths: Record<string, string>;
  store_reindexed: boolean;
  message?: string;
}

export interface DocumentList {
  documents: Document[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface DocumentFilters extends PaginationParams {
  name?: string;
  status?: DocumentStatus;
  type?: string;
  folder_path?: string;
  tags?: string[];
  organization_id?: string;
}

export interface DocumentUploadResponse {
  document: Document;
  upload_url?: string;
}

// Duplicate file handling types
export interface ExistingDocumentInfo {
  id: string;
  filename: string;
  created_at: string;
  uploaded_by: string;
}

export interface DuplicateFileErrorDetail {
  detail: string;
  existing_document: ExistingDocumentInfo;
  hint: string;
}

export interface DocumentStats {
  total_documents: number;
  by_status: Record<DocumentStatus, number>;
  total_size: number;
  processing_queue: number;
  recent_uploads: number;
  most_common_types: Array<{
    type: string;
    count: number;
  }>;
}

// Document Summary Types
export interface DocumentSummary {
  id: string;
  document_id: string;
  content: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  // New AI API metadata
  word_count?: number;
  cached?: boolean;
  processing_time_ms?: number;
}

export interface DocumentSummaryUpdateRequest {
  content: string;
  metadata?: Record<string, any>;
}

// Backend response for POST/PUT summarize operations
export interface DocumentSummarizeResponse {
  success: boolean;
  document_id: string;
  filename: string;
  ai_summary: string;           // Markdown format
  summary_metadata: {
    model?: string;
    generation_time?: number;
    tokens_used?: number;
    [key: string]: any;
  };
  timestamp: string;            // ISO format
}

// Document FAQ Types
// FAQ Item Structure (matches backend)
export interface FAQItem {
  question: string;
  answer: string;
}

// Frontend DocumentFAQ interface (for internal use)
export interface DocumentFAQ {
  id: string;
  document_id: string;
  faqs: Array<{
    question: string;
    answer: string;
    confidence?: number;
  }>;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  // New AI API metadata
  count?: number;
  cached?: boolean;
  processing_time_ms?: number;
}

export interface DocumentFAQUpdateRequest {
  faq?: FAQItem[];        // Direct FAQ items to set
  prompt?: string;        // Custom prompt for regeneration
  faq_count?: number;     // Number of FAQs when using prompt (1-10)
}

// Backend response for GET FAQ operations
export interface DocumentFAQRetrievalResponse {
  document_id: string;
  filename: string;
  ai_faq: FAQItem[] | null;            // Can be null if no FAQ exists
  faq_metadata: Record<string, any>;
  has_faq: boolean;
  faq_count: number;
  faq_preview: string;                 // First question and partial answer
  updated_at?: string;                 // ISO format
}

// Document Questions Types (supports both legacy and new AI API formats)
export interface DocumentQuestions {
  id: string;
  document_id: string;
  questions: Array<{
    question: string;
    type?: 'multiple_choice' | 'short_answer' | 'essay' | 'true_false';
    options?: string[];
    correct_answer?: string | number;
    explanation?: string;
    // New AI API fields
    expected_answer?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
  }>;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  // New AI API metadata
  count?: number;
  difficulty_distribution?: {
    easy: number;
    medium: number;
    hard: number;
  };
  cached?: boolean;
  processing_time_ms?: number;
}

export interface DocumentQuestionsUpdateRequest {
  questions?: string[];   // Direct questions array to set
  prompt?: string;        // Custom prompt for regeneration
  question_count?: number; // Number of questions when using prompt (1-20)
  metadata?: Record<string, any>; // Optional metadata
}

// Backend response for POST/PUT questions operations (API Documentation)
export interface DocumentQuestionsResponse {
  success: boolean;
  document_id: string;
  filename: string;
  ai_questions: string[];               // Array of question strings
  questions_metadata: {
    model?: string;
    generation_time?: number;
    tokens_used?: number;
    question_count?: number;
    custom_prompt?: string;
    [key: string]: any;
  };
  timestamp: string;                    // ISO format
  source?: string;                      // 'existing' or 'generated'
  update_type?: string;                 // Type of update performed (for PUT operations)
  processing_time?: number;             // Processing time in seconds
  message?: string;                     // Success/error message
  questions?: any;                      // Legacy compatibility field
}

// Backend response for GET questions operations
export interface DocumentQuestionsRetrievalResponse {
  document_id: string;
  filename: string;
  ai_questions: string[] | null;        // Can be null if no questions exist
  questions_metadata: Record<string, any>;
  has_questions: boolean;
  questions_count: number;
  questions_preview: string;            // First 3 questions preview
  updated_at?: string;                  // ISO format
}

// ============================================================================
// NEW AI API Types (Port 8001) - Document Intelligence API
// ============================================================================

// Difficulty level for generated questions
export type DifficultyLevel = 'easy' | 'medium' | 'hard';

// New Summarize Request (AI API)
// Note: API now uses org_name + folder_name instead of parsed_file_path
export interface AISummarizeRequest {
  document_name: string;
  org_name: string;          // Organization name for GCS path
  folder_name: string;       // Folder name within organization
  max_words?: number;        // 50-2000, default: 500
  session_id?: string;       // For conversation continuity
}

// New Summarize Response (AI API)
export interface AISummarizeResponse {
  success: boolean;
  summary?: string;
  message?: string;  // Backend may return summary content in message field
  word_count: number;
  cached: boolean;
  processing_time_ms: number;
  error?: string;
}

// New FAQs Request (AI API)
// Note: API now uses org_name + folder_name instead of parsed_file_path
export interface AIFAQsRequest {
  document_name: string;
  org_name: string;          // Organization name for GCS path
  folder_name: string;       // Folder name within organization
  num_faqs?: number;         // 1-50, default: 5
  session_id?: string;
}

// New FAQs Response (AI API)
export interface AIFAQsResponse {
  success: boolean;
  faqs?: Array<{
    question: string;
    answer: string;
  }>;
  count: number;
  cached: boolean;
  processing_time_ms: number;
  error?: string;
}

// New Questions Request (AI API)
// Note: API now uses org_name + folder_name instead of parsed_file_path
export interface AIQuestionsRequest {
  document_name: string;
  org_name: string;          // Organization name for GCS path
  folder_name: string;       // Folder name within organization
  num_questions?: number;    // 1-100, default: 10
  session_id?: string;
}

// Question with difficulty level
export interface AIQuestion {
  question: string;
  expected_answer: string;
  difficulty: DifficultyLevel;
}

// Difficulty distribution
export interface DifficultyDistribution {
  easy: number;
  medium: number;
  hard: number;
}

// New Questions Response (AI API)
export interface AIQuestionsResponse {
  success: boolean;
  questions?: AIQuestion[];
  count: number;
  difficulty_distribution: DifficultyDistribution;
  cached: boolean;
  processing_time_ms: number;
  error?: string;
}

// Extended metadata for frontend state (includes API response metadata)
export interface AIGenerationMetadata {
  cached: boolean;
  processing_time_ms: number;
  word_count?: number;                    // For summaries
  count?: number;                         // For FAQs and questions
  difficulty_distribution?: DifficultyDistribution;  // For questions
}

// Document Save Parsed Content Request/Response
export interface DocumentSaveParsedRequest {
  target_path: string;
  content: string;
  original_filename: string;
  metadata?: Record<string, any>;
}

export interface DocumentSaveParsedResponse {
  success: boolean;
  message: string;
  saved_path: string;
  content_length: number;
  metadata?: Record<string, any>;
}

// Document Parse Response Interfaces (Backend-aligned)
export interface DocumentParseResponse {
  success: boolean;
  storage_path: string;
  parsed_storage_path: string;
  parsed_content: string;
  parsing_metadata: {
    total_pages: number;
    has_headers: boolean;
    has_footers: boolean;
    content_length: number;
    parsing_duration: number;
  };
  gcs_metadata: {
    size: number;
    content_type: string;
    created: string;
    updated: string;
  };
  file_info: {
    original_size: number;
    parsed_size: number;
    file_type: string;
    content_type: string;
  };
  timestamp: string;
}

export interface DocumentParseRequest {
  storage_path: string;
}

// Ingest API Parse Types (Port 8001)
export interface IngestParseRequest {
  file_path: string;
  folder_name: string;
  output_format?: 'markdown' | 'text' | 'json';
  language?: string;
  save_to_parsed?: boolean;
}

export interface IngestParseResponse {
  success: boolean;
  file_path: string;
  output_path: string | null;
  parsed_content: string | null;
  content_preview: string | null;
  pages: number | null;
  format: string;
  extraction_time_ms: number | null;
  error: string | null;
}

export interface ParseOptions {
  outputFormat?: 'markdown' | 'text' | 'json';
  language?: string;
  saveToParsed?: boolean;
}

// Legacy save parse request (deprecated)
export interface DocumentSaveParseRequest {
  target_path: string;
  content: string;
  original_filename: string;
  metadata?: Record<string, any>;
}

// New REST-style content update request (as per API specification)
export interface DocumentContentUpdateRequest {
  content: string;
  sync_to_gcs: boolean;
  metadata?: {
    target_path?: string;
    original_filename?: string;
    updated_at?: string;
    [key: string]: any;
  };
}

// Document Ingestion API Types
export interface IngestRequest {
  gcs_path: string;
  organization: string;
  folder?: string;
  metadata?: Record<string, any>;
  replace_existing?: boolean;
  user_reviewed?: boolean;
}

export interface IngestResponse {
  job_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  message: string;
  organization: string;
  document?: string;
  result?: any;
  timestamp: string;
}

export interface JobStatusResponse {
  job_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress?: number;
  organization: string;
  document: string;
  started_at: string;
  completed_at?: string;
  failed_at?: string;
  error?: string;
  result?: any;
}

export interface ErrorResponse {
  success: false;
  error_type: string;
  message: string;
  detail?: any;
  timestamp: string;
  path?: string;
}

// ============================================================================
// Load Parsed Content Types (Content API)
// ============================================================================

/**
 * Request to load pre-parsed content from GCS
 */
export interface LoadParsedRequest {
  org_name: string;
  folder_name: string;
  document_name: string;
}

/**
 * Response with loaded parsed content - matches DocumentParseResponse format
 */
export interface LoadParsedResponse extends DocumentParseResponse {
  // Inherits all fields from DocumentParseResponse
  // parsing_metadata.source will be 'gcs_load' to indicate loaded content
}

/**
 * Response for checking if parsed content exists
 */
export interface CheckParsedExistsResponse {
  exists: boolean;
  path: string;
  error?: string;
}