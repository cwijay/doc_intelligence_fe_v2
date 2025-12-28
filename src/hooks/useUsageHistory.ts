/**
 * Usage History Hook
 * React Query hook for fetching usage history data
 */

import { useQuery } from '@tanstack/react-query';
import { usageApi } from '@/lib/api/usage';
import { UsagePeriod, UsageHistoryResponse, UsageSummaryResponse } from '@/types/usage';

const QUERY_KEYS = {
  usageHistory: (period: UsagePeriod) => ['usage', 'history', period],
  usageSummary: () => ['usage', 'summary'],
};

/**
 * Hook to fetch usage history for a specified period
 * @param period - Time period: '7d', '14d', '21d', or '28d'
 * @param enabled - Whether to enable the query
 * @returns Query result with usage history data
 */
export const useUsageHistory = (period: UsagePeriod = '7d', enabled = true) => {
  console.log('🔍 useUsageHistory Hook:', { period, enabled });

  return useQuery<UsageHistoryResponse>({
    queryKey: QUERY_KEYS.usageHistory(period),
    queryFn: async () => {
      console.log('🔍 useUsageHistory queryFn executing:', { period });
      try {
        const result = await usageApi.getHistory(period);
        console.log('✅ useUsageHistory Success:', {
          period,
          historyCount: result?.history?.length || 0,
          totalTokens: result?.total_tokens || 0,
        });
        return result;
      } catch (error) {
        console.error('❌ useUsageHistory Error:', {
          error: error instanceof Error ? error.message : 'Unknown error',
          period,
        });
        throw error;
      }
    },
    enabled,
    staleTime: 60 * 1000, // 1 minute - usage data doesn't change frequently
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook to fetch current usage summary
 * @param enabled - Whether to enable the query
 * @returns Query result with usage summary data
 */
export const useUsageSummary = (enabled = true) => {
  console.log('🔍 useUsageSummary Hook:', { enabled });

  return useQuery<UsageSummaryResponse>({
    queryKey: QUERY_KEYS.usageSummary(),
    queryFn: async () => {
      console.log('🔍 useUsageSummary queryFn executing');
      try {
        const result = await usageApi.getSummary();
        console.log('✅ useUsageSummary Success:', {
          tokensUsed: result?.tokens_used || 0,
          tokensLimit: result?.tokens_limit || 0,
        });
        return result;
      } catch (error) {
        console.error('❌ useUsageSummary Error:', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
      }
    },
    enabled,
    staleTime: 60 * 1000, // 1 minute
    refetchOnWindowFocus: false,
  });
};
