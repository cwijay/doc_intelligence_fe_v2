/**
 * Auto-generated TypeScript types from OpenAPI specifications.
 *
 * Regenerate with: npm run generate:types
 *
 * Main API (port 8000): npm run generate:types:main
 * AI API (port 8001): npm run generate:types:ai
 */

// Re-export types from AI API (ingestion, RAG, Excel)
export type * as AIAPI from './ai-api';

// Re-export types from main platform API (documents, auth, users, etc.)
export type * as MainAPI from './main-api';
