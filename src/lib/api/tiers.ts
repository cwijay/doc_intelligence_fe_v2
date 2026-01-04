/**
 * Tiers API module
 * Public endpoint for fetching subscription tier information
 *
 * Note: Uses ai-base client but the endpoint is public (no auth required)
 */

import aiApi from './ai-base';

// =============================================================================
// Types
// =============================================================================

export interface TierLimits {
  monthly_tokens: number;
  monthly_tokens_display: string;
  llamaparse_pages: number;
  file_search_queries: number;
  storage_gb: number;
  requests_per_minute: number;
  requests_per_day: number;
  max_file_size_mb: number;
  max_concurrent_jobs: number;
}

export interface TierFeatures {
  document_agent: boolean;
  sheets_agent: boolean;
  rag_search: boolean;
  api_access: boolean;
  custom_models: boolean;
  priority_support: boolean;
  advanced_analytics: boolean;
  team_management: boolean;
  sso: boolean;
  audit_logs: boolean;
  custom_integrations: boolean;
  dedicated_support: boolean;
}

export interface TierResponse {
  id: string;
  name: string;
  description?: string;
  monthly_price_usd: number;
  annual_price_usd: number;
  limits: TierLimits;
  features: TierFeatures;
  highlighted: boolean;
  key_features: string[];
}

export interface TiersListResponse {
  success: boolean;
  tiers: TierResponse[];
  error?: string;
}

// =============================================================================
// API Functions
// =============================================================================

export const tiersApi = {
  /**
   * Get all available subscription tiers
   * This is a public endpoint - no authentication required
   * @returns List of subscription tiers with pricing and limits
   */
  list: async (): Promise<TiersListResponse> => {
    console.log('📋 tiersApi.list: Fetching subscription tiers');
    try {
      const response = await aiApi.get('/api/v1/tiers');
      console.log('✅ tiersApi.list: Success', {
        tiersCount: response.data?.tiers?.length || 0,
      });
      return response.data;
    } catch (error) {
      console.error('❌ tiersApi.list: Error', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  },
};

export default tiersApi;
