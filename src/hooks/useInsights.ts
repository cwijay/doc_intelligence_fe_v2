/**
 * Insights Hooks
 * React Query hooks for fetching insights/audit data with auto-refresh
 */

import { useQuery } from '@tanstack/react-query';
import { insightsApi } from '@/lib/api/insights';
import {
  InsightsPeriod,
  InsightsDashboardResponse,
  ActivityTimelineResponse,
  JobsListResponse,
  JobDetailResponse,
  ActivityQueryParams,
  JobsQueryParams,
} from '@/types/insights';

// Auto-refresh interval: 30 seconds
const REFETCH_INTERVAL = 30 * 1000;
// Stale time slightly less than refetch to ensure fresh data
const STALE_TIME = 25 * 1000;

const QUERY_KEYS = {
  dashboard: (period: InsightsPeriod) => ['insights', 'dashboard', period],
  activity: (params: ActivityQueryParams) => ['insights', 'activity', params],
  jobs: (params: JobsQueryParams) => ['insights', 'jobs', params],
  job: (id: string) => ['insights', 'job', id],
};

/**
 * Hook to fetch insights dashboard stats
 * @param period - Time period: '7d', '30d', '90d', or 'all'
 * @param enabled - Whether to enable the query
 * @returns Query result with dashboard data
 */
export const useInsightsDashboard = (period: InsightsPeriod = '7d', enabled = true) => {
  return useQuery<InsightsDashboardResponse>({
    queryKey: QUERY_KEYS.dashboard(period),
    queryFn: () => insightsApi.getDashboard(period),
    enabled,
    staleTime: STALE_TIME,
    refetchInterval: REFETCH_INTERVAL,
    refetchOnWindowFocus: true,
  });
};

/**
 * Hook to fetch activity timeline
 * @param params - Query parameters for filtering and pagination
 * @param enabled - Whether to enable the query
 * @returns Query result with activity timeline data
 */
export const useActivityTimeline = (params: ActivityQueryParams = {}, enabled = true) => {
  return useQuery<ActivityTimelineResponse>({
    queryKey: QUERY_KEYS.activity(params),
    queryFn: () => insightsApi.getActivity(params),
    enabled,
    staleTime: STALE_TIME,
    refetchInterval: REFETCH_INTERVAL,
    refetchOnWindowFocus: true,
  });
};

/**
 * Hook to fetch processing jobs list
 * @param params - Query parameters for filtering and pagination
 * @param enabled - Whether to enable the query
 * @returns Query result with jobs list data
 */
export const useProcessingJobs = (params: JobsQueryParams = {}, enabled = true) => {
  return useQuery<JobsListResponse>({
    queryKey: QUERY_KEYS.jobs(params),
    queryFn: () => insightsApi.getJobs(params),
    enabled,
    staleTime: STALE_TIME,
    refetchInterval: REFETCH_INTERVAL,
    refetchOnWindowFocus: true,
  });
};

/**
 * Hook to fetch a single job by ID
 * @param jobId - The job ID
 * @param enabled - Whether to enable the query
 * @returns Query result with job details
 */
export const useJobDetail = (jobId: string, enabled = true) => {
  return useQuery<JobDetailResponse>({
    queryKey: QUERY_KEYS.job(jobId),
    queryFn: () => insightsApi.getJobById(jobId),
    enabled: enabled && !!jobId,
    staleTime: STALE_TIME,
    refetchOnWindowFocus: true,
  });
};

/**
 * Combined hook for the insights page
 * Fetches dashboard and activity data needed for the main view
 * @param period - Time period for dashboard stats
 * @param enabled - Whether to enable all queries
 */
export const useInsightsData = (period: InsightsPeriod = '7d', enabled = true) => {
  const dashboard = useInsightsDashboard(period, enabled);
  const activity = useActivityTimeline({ limit: 10 }, enabled);
  const jobs = useProcessingJobs({ limit: 10 }, enabled);

  return {
    dashboard,
    activity,
    jobs,
    isLoading: dashboard.isLoading || activity.isLoading || jobs.isLoading,
    isError: dashboard.isError || activity.isError || jobs.isError,
    // Helper to check if any data is available
    hasData: !!(dashboard.data || activity.data || jobs.data),
  };
};
