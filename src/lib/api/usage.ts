/**
 * Usage API module
 * Handles usage history and tracking endpoints
 *
 * Note: Uses ai-base client instead of base to include X-Organization-ID header
 * required by the multi-tenant backend API.
 */

import aiApi from './ai-base';
import {
  UsageHistoryResponse,
  UsagePeriod,
  UsageSummaryResponse,
  SubscriptionResponse,
  QuotaStatusResponse,
} from '@/types/usage';

export const usageApi = {
  /**
   * Get usage history for a specified period
   * @param period - Time period: '7d', '14d', '21d', or '28d'
   * @returns Usage history data
   */
  getHistory: async (period: UsagePeriod = '7d'): Promise<UsageHistoryResponse> => {
    console.log('📊 usageApi.getHistory: Fetching usage for period:', period);
    try {
      const response = await aiApi.get('/api/v1/usage/history', { params: { period } });
      console.log('✅ usageApi.getHistory: Success', {
        period,
        historyCount: response.data?.history?.length || 0,
        totalTokens: response.data?.total_tokens || 0,
      });
      return response.data;
    } catch (error) {
      console.error('❌ usageApi.getHistory: Error', {
        period,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  },

  /**
   * Get current period usage summary
   * @returns Usage summary with limits and current usage
   */
  getSummary: async (): Promise<UsageSummaryResponse> => {
    console.log('📊 usageApi.getSummary: Fetching usage summary');
    try {
      const response = await aiApi.get('/api/v1/usage/summary');
      console.log('✅ usageApi.getSummary: Success', {
        tokensUsed: response.data?.tokens_used || 0,
        tokensLimit: response.data?.tokens_limit || 0,
      });
      return response.data;
    } catch (error) {
      console.error('❌ usageApi.getSummary: Error', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  },

  /**
   * Get subscription details and limits
   * @returns Subscription tier info, limits, and pricing
   */
  getSubscription: async (): Promise<SubscriptionResponse> => {
    console.log('📊 usageApi.getSubscription: Fetching subscription details');
    try {
      const response = await aiApi.get('/api/v1/usage/subscription');
      console.log('✅ usageApi.getSubscription: Success', {
        tier: response.data?.tier || 'unknown',
        tokenLimit: response.data?.monthly_token_limit || 0,
      });
      return response.data;
    } catch (error) {
      console.error('❌ usageApi.getSubscription: Error', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  },

  /**
   * Get quota limits and status
   * @returns Quota status with approaching/exceeded warnings
   */
  getLimits: async (): Promise<QuotaStatusResponse> => {
    console.log('📊 usageApi.getLimits: Fetching quota limits');
    try {
      const response = await aiApi.get('/api/v1/usage/limits');
      console.log('✅ usageApi.getLimits: Success', {
        allWithinLimits: response.data?.all_within_limits || false,
        approaching: response.data?.approaching_limit || [],
        exceeded: response.data?.exceeded || [],
      });
      return response.data;
    } catch (error) {
      console.error('❌ usageApi.getLimits: Error', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  },

  /**
   * Get usage breakdown by feature/model
   * @returns Usage breakdown with feature-level details
   */
  getBreakdown: async (): Promise<UsageSummaryResponse> => {
    console.log('📊 usageApi.getBreakdown: Fetching usage breakdown');
    try {
      const response = await aiApi.get('/api/v1/usage/breakdown');
      console.log('✅ usageApi.getBreakdown: Success', {
        breakdownCount: response.data?.feature_breakdown?.length || 0,
      });
      return response.data;
    } catch (error) {
      console.error('❌ usageApi.getBreakdown: Error', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  },
};
