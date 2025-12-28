/**
 * Usage API module
 * Handles usage history and tracking endpoints
 *
 * Note: Uses ai-base client instead of base to include X-Organization-ID header
 * required by the multi-tenant backend API.
 */

import aiApi from './ai-base';
import { UsageHistoryResponse, UsagePeriod, UsageSummaryResponse } from '@/types/usage';

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
};
