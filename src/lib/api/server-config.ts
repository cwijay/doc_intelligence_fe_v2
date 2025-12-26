/**
 * Server-side configuration for API routes.
 *
 * This file centralizes backend API URL configuration for Next.js API routes.
 * For client-side config, use '@/lib/config' instead.
 */

/**
 * Backend API base URL (without /api/v1 suffix).
 * Used by API route handlers to proxy requests to the backend.
 */
export const API_BASE_URL = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8000';

/**
 * AI API base URL for AI-specific endpoints.
 */
export const AI_API_BASE_URL = process.env.AI_API_BASE_URL || process.env.NEXT_PUBLIC_AI_API_URL || 'http://localhost:8001';
