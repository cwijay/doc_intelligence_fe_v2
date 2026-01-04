/**
 * Usage History Hooks
 * React Query hooks for fetching usage data with auto-refresh
 */

import { useQuery } from '@tanstack/react-query';
import { usageApi } from '@/lib/api/usage';
import {
  UsagePeriod,
  UsageHistoryResponse,
  UsageSummaryResponse,
  SubscriptionResponse,
  QuotaStatusResponse,
} from '@/types/usage';

// Auto-refresh interval: 30 seconds
const REFETCH_INTERVAL = 30 * 1000;
// Stale time slightly less than refetch to ensure fresh data
const STALE_TIME = 25 * 1000;
// Subscription changes rarely, use longer stale time
const SUBSCRIPTION_STALE_TIME = 5 * 60 * 1000;

const QUERY_KEYS = {
  usageHistory: (period: UsagePeriod) => ['usage', 'history', period],
  usageSummary: () => ['usage', 'summary'],
  subscription: () => ['usage', 'subscription'],
  limits: () => ['usage', 'limits'],
  breakdown: () => ['usage', 'breakdown'],
};

/**
 * Hook to fetch usage history for a specified period
 * @param period - Time period: '7d', '14d', '21d', '28d', '30d', or '90d'
 * @param enabled - Whether to enable the query
 * @returns Query result with usage history data
 */
export const useUsageHistory = (period: UsagePeriod = '7d', enabled = true) => {
  return useQuery<UsageHistoryResponse>({
    queryKey: QUERY_KEYS.usageHistory(period),
    queryFn: () => usageApi.getHistory(period),
    enabled,
    staleTime: STALE_TIME,
    refetchInterval: REFETCH_INTERVAL,
    refetchOnWindowFocus: true,
  });
};

/**
 * Hook to fetch current usage summary
 * @param enabled - Whether to enable the query
 * @returns Query result with usage summary data
 */
export const useUsageSummary = (enabled = true) => {
  return useQuery<UsageSummaryResponse>({
    queryKey: QUERY_KEYS.usageSummary(),
    queryFn: () => usageApi.getSummary(),
    enabled,
    staleTime: STALE_TIME,
    refetchInterval: REFETCH_INTERVAL,
    refetchOnWindowFocus: true,
  });
};

/**
 * Hook to fetch subscription details
 * @param enabled - Whether to enable the query
 * @returns Query result with subscription data
 */
export const useSubscription = (enabled = true) => {
  return useQuery<SubscriptionResponse>({
    queryKey: QUERY_KEYS.subscription(),
    queryFn: () => usageApi.getSubscription(),
    enabled,
    staleTime: SUBSCRIPTION_STALE_TIME,
    refetchOnWindowFocus: true,
  });
};

/**
 * Hook to fetch quota limits and status
 * @param enabled - Whether to enable the query
 * @returns Query result with quota status and warnings
 */
export const useQuotaLimits = (enabled = true) => {
  return useQuery<QuotaStatusResponse>({
    queryKey: QUERY_KEYS.limits(),
    queryFn: () => usageApi.getLimits(),
    enabled,
    staleTime: STALE_TIME,
    refetchInterval: REFETCH_INTERVAL,
    refetchOnWindowFocus: true,
  });
};

/**
 * Hook to fetch usage breakdown by feature
 * @param enabled - Whether to enable the query
 * @returns Query result with feature breakdown
 */
export const useUsageBreakdown = (enabled = true) => {
  return useQuery<UsageSummaryResponse>({
    queryKey: QUERY_KEYS.breakdown(),
    queryFn: () => usageApi.getBreakdown(),
    enabled,
    staleTime: STALE_TIME,
    refetchInterval: REFETCH_INTERVAL,
    refetchOnWindowFocus: true,
  });
};

/**
 * Combined hook for the usage dashboard
 * Fetches all usage data needed for the dashboard
 * @param period - Time period for history
 * @param enabled - Whether to enable all queries
 */
export const useUsageDashboard = (period: UsagePeriod = '7d', enabled = true) => {
  const summary = useUsageSummary(enabled);
  const subscription = useSubscription(enabled);
  const limits = useQuotaLimits(enabled);
  const history = useUsageHistory(period, enabled);
  const breakdown = useUsageBreakdown(enabled);

  return {
    summary,
    subscription,
    limits,
    history,
    breakdown,
    isLoading:
      summary.isLoading ||
      subscription.isLoading ||
      limits.isLoading ||
      history.isLoading ||
      breakdown.isLoading,
    isError:
      summary.isError ||
      subscription.isError ||
      limits.isError ||
      history.isError ||
      breakdown.isError,
    // Helper to check if any data is available
    hasData: !!(summary.data || subscription.data || limits.data || history.data),
  };
};
