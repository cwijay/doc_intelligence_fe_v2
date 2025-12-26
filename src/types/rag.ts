// Enhanced RAG API Types

// Enhanced request for /api/v1/simple-rag/query - supports multiple documents with path-based indexing and answer generation
export interface EnhancedRAGRequest {
  query: string;
  organization: string;
  document_paths: string[]; // Array of GCS paths like "{org}/parsed/{folder}/{doc}.md"
  document_name_list: string[]; // Array of document names with extensions (matches Pinecone metadata)
  bm_25_paths: string[]; // Array of BM25 index paths like "{org}/bm-25/{folder}/{doc}.pkl"
  max_sources?: number; // default: 5
  search_type?: 'semantic' | 'keyword' | 'hybrid'; // default: hybrid
}

// Legacy simplified request - keeping for backward compatibility
export interface SimpleRAGRequest {
  query: string;
  organization: string;
  max_sources?: number; // default: 5
  filters?: Record<string, any>; // optional
}

// Simplified source document
export interface SimpleSourceDocument {
  content: string;
  source: string;
  relevance_score: number; // 0-1
  search_type: 'semantic' | 'keyword' | 'hybrid';
  metadata: Record<string, any>;
  chunk_id?: number;
}

// Simplified response - much cleaner!
export interface SimpleRAGResponse {
  answer: string;
  sources: SimpleSourceDocument[];
  confidence_score: number;
  processing_time: number; // Now 5-10s instead of 40+s!
  search_strategy: string;
  organization: string;
  timestamp: string;
  error?: string;
}

// Error structure
export interface SimpleRAGError {
  error: string;
  error_type: string;
  timestamp: string;
  organization?: string;
}

// Health check types
export interface SimpleRAGStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  retriever_ready: boolean;
  pinecone_connected: boolean;
  bm25_ready: boolean;
  timestamp: string;
}

// Stats response
export interface SimpleRAGStats {
  total_queries: number;
  average_response_time: number;
  cache_hits: number;
  cache_misses: number;
  timestamp: string;
}

// Message type for chat UI
export interface RagMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  citations?: DocumentChatCitation[];  // Structured citations from RAG search
  timestamp: Date;
  metadata?: {
    processing_time?: number;
    confidence_score?: number;
    sources_count?: number;
    search_strategy?: string;
  };
}

// Enhanced query options for multi-document RAG
export interface EnhancedRAGQueryOptions {
  maxSources?: number;
  searchType?: 'semantic' | 'keyword' | 'hybrid';
}

// Legacy simplified query options - keeping for backward compatibility
export interface SimpleRAGQueryOptions {
  maxSources?: number;
  filters?: Record<string, any>;
}

// =============================================================================
// Gemini File Search Store Types
// =============================================================================

// Request type for auto store upload
export interface StoreUploadRequest {
  file_paths: string[];
  org_name: string;
  folder_name?: string;
  original_gcs_paths?: string[];
  parser_version?: string;
}

// File info in upload response
export interface StoreFileInfo {
  file_name: string;
  status: string;
  content_hash?: string;
  original_file_extension?: string;
  original_gcs_path?: string;
  parsed_gcs_path?: string;
  org_name?: string;
  folder_name?: string;
}

// Response type from store upload
export interface StoreUploadResponse {
  success: boolean;
  store_id: string;
  store_name: string;
  uploaded: number;
  skipped: number;
  files: StoreFileInfo[];
  errors?: string[];
  error?: string;
}

// =============================================================================
// Save and Index Types
// =============================================================================

// Request type for save and index operation
export interface SaveAndIndexRequest {
  content: string;                    // Parsed/edited markdown content
  target_path: string;                // e.g., "Acme Corp/parsed/invoices/Sample.md"
  org_name: string;                   // Organization name for store naming
  folder_name?: string;               // Folder name for metadata
  original_filename: string;          // Original document filename
  original_gcs_path?: string;         // Original file GCS path
  parser_version?: string;            // Parser version for metadata
  metadata?: Record<string, unknown>; // Additional metadata
}

// Response type from save and index operation
export interface SaveAndIndexResponse {
  success: boolean;
  saved_path?: string;                // Full GCS path where content was saved
  store_id?: string;                  // Gemini File Search store ID
  store_name?: string;                // Gemini File Search store name
  indexed: boolean;                   // Whether document was indexed in store
  message?: string;                   // Success/info message
  error?: string;                     // Error message if operation failed
}

// =============================================================================
// Gemini File Search Types
// =============================================================================

// Search mode options
export type GeminiSearchMode = 'semantic' | 'keyword' | 'hybrid';

// Request type for Gemini File Search
export interface GeminiSearchRequest {
  query: string;
  top_k?: number;
  file_filter?: string;
  folder_name?: string;
  folder_id?: string;
  search_mode?: GeminiSearchMode;
  generate_answer?: boolean;
}

// Citation from search results
export interface GeminiCitation {
  file: string;
  text: string;
  relevance_score?: number;
  page?: number;
  chunk_id?: string;
  folder_name?: string;
}

// Response from Gemini File Search
export interface GeminiSearchResponse {
  success: boolean;
  query: string;
  response?: string;
  citations: GeminiCitation[];
  processing_time_ms: number;
  search_mode: GeminiSearchMode;
  error?: string;
}

// Store info for org store lookup
export interface GeminiStoreInfo {
  store_id: string;
  display_name: string;
  organization_id?: string;
  gemini_store_id?: string;
  created_at: string;
  status: string;
}

// Search history item for session persistence
export interface SearchHistoryItem {
  id: string;
  query: string;
  response: string;
  citations: GeminiCitation[];
  timestamp: Date;
  filters: {
    folder?: string;
    file?: string;
    searchMode: GeminiSearchMode;
  };
}

// =============================================================================
// DocumentAgent Chat Types (Consolidated RAG)
// =============================================================================

// Request type for DocumentAgent /chat endpoint
export interface DocumentChatRequest {
  query: string;
  organization_name: string;
  session_id?: string;
  folder_filter?: string;
  file_filter?: string;
  search_mode?: GeminiSearchMode;
  max_sources?: number;
}

// Citation from DocumentAgent chat
export interface DocumentChatCitation {
  text: string;
  file: string;
  relevance_score: number;
  folder_name?: string;
  page?: number;
}

// Response from DocumentAgent /chat endpoint
export interface DocumentChatResponse {
  success: boolean;
  answer: string;
  citations: DocumentChatCitation[];
  query: string;
  search_mode: GeminiSearchMode;
  filters: {
    folder?: string;
    file?: string;
  };
  session_id: string;
  processing_time_ms: number;
  timestamp: string;
  error?: string;
}