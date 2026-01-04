/**
 * Centralized configuration constants for the application
 * All hard-coded values should be defined here for easy maintenance
 */

// =============================================================================
// FILE EXTENSIONS AND FORMATS
// =============================================================================

export const FILE_EXTENSIONS = {
  /** Extension for parsed document files */
  PARSED: '.md',
  /** Extension for summary files */
  SUMMARY: '.md',
  /** Extension for FAQ files */
  FAQ: '.json',
  /** Extension for question files */
  QUESTIONS: '.json',
  /** Supported Excel file extensions */
  EXCEL: ['.xlsx', '.xls', '.csv'] as const,
  /** Supported image extensions */
  IMAGES: ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.svg'] as const,
  /** Supported document extensions */
  DOCUMENTS: ['.pdf'] as const,
} as const;

export const MIME_TYPES = {
  PDF: 'application/pdf',
  EXCEL_XLSX: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  EXCEL_XLS: 'application/vnd.ms-excel',
  PNG: 'image/png',
  JPEG: 'image/jpeg',
  GIF: 'image/gif',
  WEBP: 'image/webp',
  BMP: 'image/bmp',
  SVG: 'image/svg+xml',
} as const;

// =============================================================================
// STORAGE PATH STRUCTURE
// =============================================================================

export const STORAGE_PATHS = {
  /** Folder name for original documents */
  ORIGINAL_FOLDER: 'original',
  /** Folder name for parsed documents */
  PARSED_FOLDER: 'parsed',
  /** Folder name for document summaries */
  SUMMARY_FOLDER: 'summary',
  /** Folder name for generated FAQs (singular) */
  FAQ_FOLDER: 'faq',
  /** Folder name for generated questions */
  QUESTIONS_FOLDER: 'questions',
  /** GCS path prefix */
  GCS_PREFIX: 'gs://',
  /** Default GCS bucket name */
  DEFAULT_BUCKET: 'biz-to-bricks-document-store',
} as const;

// =============================================================================
// API CONFIGURATION
// =============================================================================

export const API_CONFIG = {
  /** API version path prefix */
  VERSION: '/api/v1',
  /** Default main API port */
  DEFAULT_MAIN_PORT: 8000,
  /** Default AI API port */
  DEFAULT_AI_PORT: 8001,
  /** Default local API host */
  DEFAULT_HOST: 'localhost',
} as const;

export const API_ENDPOINTS = {
  // AI API endpoints (port 8001)
  SUMMARIZE: '/api/v1/documents/summarize',
  FAQS: '/api/v1/documents/faqs',
  QUESTIONS: '/api/v1/documents/questions',
  SIMPLE_RAG: '/api/v1/simple-rag',
  INGEST: '/api/v1/ingest',
  DOCUMENT_CHAT: '/api/v1/documents/chat',
  // Extraction endpoints
  EXTRACTION: {
    ANALYZE: '/api/v1/extraction/analyze',
    GENERATE_SCHEMA: '/api/v1/extraction/generate-schema',
    TEMPLATES: '/api/v1/extraction/templates',
    EXTRACT: '/api/v1/extraction/extract',
    SAVE: '/api/v1/extraction/save',
    EXPORT: '/api/v1/extraction/export',
  },
} as const;

// =============================================================================
// TIMEOUT VALUES (in milliseconds)
// =============================================================================

export const TIMEOUTS = {
  /** AI API operations (5 minutes) - increased for LLM operations */
  AI_API: 300000,
  /** Authentication operations (2 minutes) */
  AUTH_API: 120000,
  /** Excel chat operations (10 minutes) */
  EXCEL_CHAT: 600000,
  /** Document parsing operations (10 minutes) - LlamaParse can be slow */
  PARSE_API: 600000,
  /** RAG API operations (2 minutes) */
  RAG_API: 120000,
  /** Base API operations (2 minutes) */
  BASE_API: 120000,
  /** Diagnostics checks (2 minutes) */
  DIAGNOSTICS: 120000,
  /** Backend monitor health checks (2 minutes) */
  BACKEND_MONITOR: 120000,
  /** Registration dev delay (3 seconds) */
  REGISTRATION_DEV: 3000,
  /** Session cleanup delay (5 seconds) */
  SESSION_CLEANUP: 5000,
} as const;

// =============================================================================
// PAGINATION DEFAULTS
// =============================================================================

export const PAGINATION = {
  /** Default items per page */
  DEFAULT_PER_PAGE: 20,
  /** Maximum results for queries */
  MAX_RESULTS: 100,
  /** Default page number */
  DEFAULT_PAGE: 1,
} as const;

// =============================================================================
// AI GENERATION LIMITS
// =============================================================================

export const AI_LIMITS = {
  SUMMARY: {
    MIN_WORDS: 50,
    MAX_WORDS: 2000,
    DEFAULT_WORDS: 500,
  },
  FAQ: {
    MIN: 1,
    MAX: 50,
    DEFAULT: 10,
  },
  QUESTIONS: {
    MIN: 1,
    MAX: 100,
    DEFAULT: 10,
  },
} as const;

export const GENERATION_PREFERENCES = {
  /** Default FAQ count */
  DEFAULT_FAQ_COUNT: 10,
  /** Default questions count */
  DEFAULT_QUESTIONS_COUNT: 10,
  /** Maximum FAQ count */
  MAX_FAQ_COUNT: 50,
  /** Maximum questions count */
  MAX_QUESTIONS_COUNT: 50,
  /** Minimum count for any generation */
  MIN_COUNT: 1,
  /** Default recent counts for selector */
  RECENT_COUNTS_DEFAULTS: [5, 10, 15, 20] as const,
  /** Optimal FAQ count range */
  FAQ_RANGE: { min: 5, max: 20, optimal: 10 },
  /** Optimal questions count range */
  QUESTIONS_RANGE: { min: 5, max: 25, optimal: 15 },
} as const;

// =============================================================================
// QUERY CONFIGURATION (TanStack Query)
// =============================================================================

export const QUERY_CONFIG = {
  STALE_TIMES: {
    /** Users data stale time (1 minute) */
    USERS: 60000,
    /** Documents list stale time (5 minutes) */
    DOCUMENTS: 5 * 60 * 1000,
    /** Folders always fresh */
    FOLDERS: 0,
    /** Stats stale time (2 minutes) */
    STATS: 2 * 60 * 1000,
  },
  /** Default retry count */
  RETRY_COUNT: 2,
} as const;

// =============================================================================
// LOCAL STORAGE KEYS
// =============================================================================

export const STORAGE_KEYS = {
  // Auth tokens
  ACCESS_TOKEN: 'biz_to_bricks_access_token',
  REFRESH_TOKEN: 'biz_to_bricks_refresh_token',
  USER: 'biz_to_bricks_user',
  ACCESS_EXPIRY: 'biz_to_bricks_access_expiry',
  REFRESH_EXPIRY: 'biz_to_bricks_refresh_expiry',
  // Session
  SESSION_TOKEN: 'biz_to_bricks_session_token',
  SESSION_USER: 'biz_to_bricks_session_user',
  SESSION_EXPIRY: 'biz_to_bricks_session_expiry',
  // Theme
  THEME: 'biz-to-bricks-theme',
  // Generation preferences prefix
  GENERATION_COUNT_PREFIX: 'generation_count_',
  RECENT_COUNTS_PREFIX: 'recent_counts_',
  // Sidebar state
  SIDEBAR_STATE: 'document-tree-sidebar-state',
  SIDEBAR_WIDTH: 'document-tree-sidebar-width',
} as const;

// =============================================================================
// LAYOUT DIMENSIONS
// =============================================================================

export const LAYOUT = {
  /** Navbar height in pixels */
  NAVBAR_HEIGHT: 64,
  /** Sidebar dimensions */
  SIDEBAR: {
    MIN_WIDTH: 200,
    MAX_WIDTH: 500,
    DEFAULT_WIDTH: 280,
    COLLAPSED_WIDTH: 64,
  },
  /** Responsive breakpoints */
  BREAKPOINTS: {
    XL: 1280,
    LG: 1024,
    MD: 768,
  },
} as const;

// =============================================================================
// HTTP HEADERS
// =============================================================================

export const HEADERS = {
  /** Organization ID header name (used by Main API - expects UUID) */
  ORG_ID: 'X-Organization-ID',
  /** Organization Name header name (used by AI API - expects org name string) */
  ORG_NAME: 'X-Organization-Name',
  /** Authorization scheme */
  AUTH_SCHEME: 'Bearer',
} as const;

// =============================================================================
// FILE UPLOAD LIMITS
// =============================================================================

export const UPLOAD_LIMITS = {
  /** Maximum files per upload */
  MAX_FILES: 10,
  /** Maximum file size in bytes (100MB) */
  MAX_FILE_SIZE: 100 * 1024 * 1024,
  /** Bytes per KB */
  BYTES_PER_KB: 1024,
} as const;

// =============================================================================
// CONTENT PROCESSING
// =============================================================================

export const CONTENT_LIMITS = {
  /** Content summary length for previews */
  SUMMARY_LENGTH: 500,
  /** Maximum keywords to extract */
  MAX_KEYWORDS: 20,
  /** Maximum entities to extract */
  MAX_ENTITIES: 15,
  /** Content edit detection threshold (5%) */
  EDIT_THRESHOLD: 0.05,
  /** Query substring length for logging */
  QUERY_PREVIEW_LENGTH: 100,
  /** Request data preview length */
  REQUEST_PREVIEW_LENGTH: 200,
} as const;

// =============================================================================
// AUTH CONFIGURATION
// =============================================================================

export const AUTH_CONFIG = {
  /** Token refresh buffer time (1 minute before expiry) */
  TOKEN_REFRESH_BUFFER: 1 * 60 * 1000,
  /** Session expiration check interval (5 minutes) */
  SESSION_CHECK_INTERVAL: 5 * 60 * 1000,
  /** Default session hours */
  DEFAULT_SESSION_HOURS: 12,
} as const;

// =============================================================================
// RAG CONFIGURATION
// =============================================================================

export const RAG_CONFIG = {
  /** Default max results for RAG search */
  DEFAULT_MAX_RESULTS: 10,
} as const;

// =============================================================================
// UI TIMING & DELAYS
// =============================================================================

export const UI_TIMING = {
  /** Delay before focusing input elements (ms) */
  INPUT_FOCUS_DELAY: 100,
  /** Microtask delay for event listener registration (ms) */
  MICROTASK_DELAY: 0,
} as const;

// =============================================================================
// POPOVER CONFIGURATION
// =============================================================================

export const POPOVER_CONFIG = {
  /** Estimated height for position calculations (px) */
  HEIGHT_ESTIMATE: 300,
  /** Offset from anchor element (px) */
  OFFSET: 8,
} as const;
