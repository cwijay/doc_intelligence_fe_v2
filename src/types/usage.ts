/**
 * Usage API Types
 * Types for the usage history and tracking endpoints
 */

export interface UsageHistoryItem {
  date: string;
  tokens_used: number;
  llamaparse_pages: number;
  file_search_queries: number;
  cost_usd: number;
  request_count: number;
}

export interface UsageHistoryResponse {
  success: boolean;
  period: string;
  start_date: string;
  end_date: string;
  history: UsageHistoryItem[];
  total_tokens: number;
  total_cost_usd: number;
  error?: string;
}

export type UsagePeriod = '7d' | '14d' | '21d' | '28d';

export const USAGE_PERIODS: { value: UsagePeriod; label: string }[] = [
  { value: '7d', label: '7 Days' },
  { value: '14d', label: '14 Days' },
  { value: '21d', label: '21 Days' },
  { value: '28d', label: '28 Days' },
];

/**
 * Usage Summary Response
 * Response from GET /api/v1/usage/summary endpoint
 */
export interface UsageSummaryResponse {
  success: boolean;
  organization_id?: string;
  tier?: string;
  tier_display_name?: string;
  period_start?: string;
  period_end?: string;
  days_remaining?: number;

  // Token usage
  tokens_used: number;
  tokens_limit: number;
  tokens_percentage: number;
  tokens_remaining: number;

  // LlamaParse pages
  llamaparse_pages_used: number;
  llamaparse_pages_limit: number;
  llamaparse_pages_percentage: number;

  // File search queries
  file_search_queries_used: number;
  file_search_queries_limit: number;
  file_search_queries_percentage: number;

  // Storage
  storage_used_bytes: number;
  storage_limit_bytes: number;
  storage_percentage: number;
  storage_used_gb: number;
  storage_limit_gb: number;

  error?: string;
}
