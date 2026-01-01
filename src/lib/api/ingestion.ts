/**
 * @deprecated This file re-exports from the ingestion/ module for backward compatibility.
 * Import directly from '@/lib/api/ingestion' instead.
 */

// Re-export everything from the new modular structure
export {
  ingestApi,
  ragApi,
  uploadToGeminiStore,
  saveAndIndexDocument,
  getOrgStore,
  chatWithDocuments,
  ingestionApi,
  constructGCSPath,
  constructGcsFileUrl
} from './ingestion/index';

// Default export
export { default } from './ingestion/index';
