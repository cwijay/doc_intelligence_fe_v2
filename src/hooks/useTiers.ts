/**
 * Tiers Hook
 * React Query hook for fetching subscription tier data
 */

import { useQuery } from '@tanstack/react-query';
import { tiersApi, TiersListResponse, TierResponse } from '@/lib/api/tiers';

// Tiers rarely change, use long stale time
const STALE_TIME = 10 * 60 * 1000; // 10 minutes

const QUERY_KEYS = {
  tiers: () => ['tiers'],
};

/**
 * Hook to fetch all available subscription tiers
 * @param enabled - Whether to enable the query
 * @returns Query result with tiers data
 */
export const useTiers = (enabled = true) => {
  return useQuery<TiersListResponse>({
    queryKey: QUERY_KEYS.tiers(),
    queryFn: () => tiersApi.list(),
    enabled,
    staleTime: STALE_TIME,
    refetchOnWindowFocus: false, // Tiers don't change often
  });
};

/**
 * Helper to convert API tier to frontend PlanInfo format
 * Used for compatibility with existing PlanSelector component
 */
export const convertTierToPlanInfo = (tier: TierResponse) => ({
  id: tier.id as 'free' | 'pro' | 'enterprise',
  name: tier.name,
  description: tier.description || '',
  monthlyPrice: tier.monthly_price_usd,
  annualPrice: tier.annual_price_usd,
  limits: {
    monthlyTokens: tier.limits.monthly_tokens_display,
    llamaParsePages: tier.limits.llamaparse_pages.toString(),
    fileSearchQueries: tier.limits.file_search_queries.toString(),
    storage: `${tier.limits.storage_gb} GB`,
    requestsPerMinute: tier.limits.requests_per_minute.toString(),
    requestsPerDay: tier.limits.requests_per_day.toLocaleString(),
    maxFileSize: `${tier.limits.max_file_size_mb} MB`,
    concurrentJobs: tier.limits.max_concurrent_jobs.toString(),
  },
  highlighted: tier.highlighted,
  keyFeatures: tier.key_features,
});

/**
 * Helper to convert API features to frontend format
 */
export const convertTierFeatures = (tiers: TierResponse[]) => {
  const featureNames = [
    { key: 'document_agent', name: 'Document Agent' },
    { key: 'sheets_agent', name: 'Sheets Agent' },
    { key: 'rag_search', name: 'RAG Search' },
    { key: 'api_access', name: 'API Access' },
    { key: 'custom_models', name: 'Custom Models' },
    { key: 'priority_support', name: 'Priority Support' },
    { key: 'advanced_analytics', name: 'Advanced Analytics' },
    { key: 'team_management', name: 'Team Management' },
    { key: 'sso', name: 'SSO' },
    { key: 'audit_logs', name: 'Audit Logs' },
    { key: 'custom_integrations', name: 'Custom Integrations' },
    { key: 'dedicated_support', name: 'Dedicated Support' },
  ];

  const freeTier = tiers.find(t => t.id === 'free');
  const proTier = tiers.find(t => t.id === 'pro');
  const enterpriseTier = tiers.find(t => t.id === 'enterprise');

  return featureNames.map(({ key, name }) => ({
    name,
    free: freeTier?.features[key as keyof typeof freeTier.features] ?? false,
    pro: proTier?.features[key as keyof typeof proTier.features] ?? false,
    enterprise: enterpriseTier?.features[key as keyof typeof enterpriseTier.features] ?? false,
  }));
};

export default useTiers;
