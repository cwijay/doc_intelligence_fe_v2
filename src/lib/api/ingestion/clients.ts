/**
 * Axios clients for Ingestion and RAG APIs
 * Uses the centralized client factory for consistent behavior
 */

import { createApiClient, INGESTION_API_CONFIG, RAG_API_CONFIG } from '../client-factory';

/**
 * Ingestion API client
 */
export const ingestApi = createApiClient(INGESTION_API_CONFIG);

/**
 * RAG API client (Gemini File Search)
 */
export const ragApi = createApiClient(RAG_API_CONFIG);
