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
  // Feature breakdown for the selected period (optional, requires backend support)
  feature_breakdown?: UsageBreakdownItem[];
  error?: string;
}

export type UsagePeriod = '7d' | '14d' | '21d' | '28d' | '30d' | '90d';

export const USAGE_PERIODS: { value: UsagePeriod; label: string }[] = [
  { value: '7d', label: '7 Days' },
  { value: '14d', label: '14 Days' },
  { value: '21d', label: '21 Days' },
  { value: '28d', label: '28 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
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

  // Feature breakdown (optional)
  feature_breakdown?: UsageBreakdownItem[];

  error?: string;
}

/**
 * Usage Breakdown Item
 * Represents token usage for a specific feature or model
 */
export interface UsageBreakdownItem {
  name: string;
  tokens_used: number;
  percentage: number;
  cost_usd: number;
}

/**
 * Subscription Response
 * Response from GET /api/v1/usage/subscription endpoint
 */
export interface SubscriptionResponse {
  success: boolean;
  organization_id?: string;
  tier?: string;
  tier_display_name?: string;
  status?: string;
  billing_cycle?: string;
  period_start?: string;
  period_end?: string;

  // Limits
  monthly_token_limit: number;
  monthly_llamaparse_pages: number;
  monthly_file_search_queries: number;
  storage_gb_limit: number;
  max_file_size_mb: number;
  max_concurrent_jobs: number;
  requests_per_minute: number;
  requests_per_day: number;

  // Features
  features?: Record<string, unknown>;

  // Pricing
  monthly_price_usd: number;
  annual_price_usd: number;

  error?: string;
}

/**
 * Quota Resource Status
 * Status for a single quota resource type
 */
export interface QuotaResourceStatus {
  used: number;
  limit: number;
  remaining: number;
  percentage: number;
  allowed: boolean;
}

/**
 * Storage Quota Status
 * Extended quota status for storage with byte/GB conversions
 */
export interface StorageQuotaStatus extends QuotaResourceStatus {
  used_bytes: number;
  limit_bytes: number;
  remaining_bytes: number;
  used_gb: number;
  limit_gb: number;
}

/**
 * Quota Status Response
 * Response from GET /api/v1/usage/limits endpoint
 */
export interface QuotaStatusResponse {
  success: boolean;
  tokens?: QuotaResourceStatus;
  llamaparse_pages?: QuotaResourceStatus;
  file_search_queries?: QuotaResourceStatus;
  storage?: StorageQuotaStatus;
  all_within_limits: boolean;
  approaching_limit: string[];
  exceeded: string[];
  error?: string;
}
