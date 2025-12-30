/**
 * Ingestion API module
 *
 * This module provides document ingestion, parsing, and Gemini store operations.
 * Split into focused sub-modules for better maintainability.
 */

// Re-export API clients (for advanced usage)
export { ingestApi, ragApi } from './clients';

// Re-export store operations
export {
  uploadToGeminiStore,
  saveAndIndexDocument,
  getOrgStore
} from './store-api';

// Re-export document chat
export { chatWithDocuments } from './document-chat';

// Re-export ingestion operations
export {
  ingestionApi,
  constructGCSPath,
  constructGcsFileUrl
} from './operations';

// Re-export content operations (load pre-parsed documents)
export {
  loadParsedContent,
  checkParsedExists,
  createLoadParsedRequest,
} from './content';

// Default export for backward compatibility
export { default } from './operations';
