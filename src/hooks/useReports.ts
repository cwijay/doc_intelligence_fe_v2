/**
 * Reports Hooks
 * React Query hooks for business intelligence reports with auto-refresh
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportsApi, isReportInProgress } from '@/lib/api/reports';
import {
  CreateReportRequest,
  CreateReportResponse,
  ReportDetailResponse,
  ListReportsResponse,
  DownloadReportResponse,
  QuickAnalyzeRequest,
  QuickAnalyzeResponse,
  DashboardDataRequest,
  DashboardDataResponse,
  ReportStatisticsResponse,
  ReportType,
  ReportStatus,
} from '@/types/reports';

// Auto-refresh interval: 30 seconds for lists, 5 seconds for in-progress reports
const LIST_REFETCH_INTERVAL = 30 * 1000;
const IN_PROGRESS_REFETCH_INTERVAL = 5 * 1000;
// Stale time slightly less than refetch to ensure fresh data
const STALE_TIME = 25 * 1000;

// Query keys
const QUERY_KEYS = {
  all: ['reports'] as const,
  lists: () => [...QUERY_KEYS.all, 'list'] as const,
  list: (params: { status?: ReportStatus; report_type?: ReportType; limit?: number; offset?: number }) =>
    [...QUERY_KEYS.lists(), params] as const,
  details: () => [...QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...QUERY_KEYS.details(), id] as const,
  statistics: () => [...QUERY_KEYS.all, 'statistics'] as const,
  dashboard: (folderId: string, reportType?: ReportType) =>
    [...QUERY_KEYS.all, 'dashboard', folderId, reportType] as const,
  quickAnalysis: (folderId: string, analysisType?: string) =>
    [...QUERY_KEYS.all, 'quick-analysis', folderId, analysisType] as const,
};

// =============================================================================
// List Hooks
// =============================================================================

/**
 * Hook to fetch list of reports
 * @param params - Query parameters for filtering and pagination
 * @param enabled - Whether to enable the query
 * @returns Query result with reports list data
 */
export const useReportsList = (
  params: {
    status?: ReportStatus;
    report_type?: ReportType;
    limit?: number;
    offset?: number;
  } = {},
  enabled = true
) => {
  return useQuery<ListReportsResponse>({
    queryKey: QUERY_KEYS.list(params),
    queryFn: () => reportsApi.listReports(params),
    enabled,
    staleTime: STALE_TIME,
    refetchInterval: LIST_REFETCH_INTERVAL,
    refetchOnWindowFocus: true,
  });
};

/**
 * Hook to fetch report statistics
 * @param enabled - Whether to enable the query
 * @returns Query result with statistics data
 */
export const useReportStatistics = (enabled = true) => {
  return useQuery<ReportStatisticsResponse>({
    queryKey: QUERY_KEYS.statistics(),
    queryFn: () => reportsApi.getStatistics(),
    enabled,
    staleTime: STALE_TIME,
    refetchInterval: LIST_REFETCH_INTERVAL,
    refetchOnWindowFocus: true,
  });
};

// =============================================================================
// Detail Hooks
// =============================================================================

/**
 * Hook to fetch a single report by ID
 * Auto-refreshes more frequently when report is in progress
 * @param reportId - The report ID
 * @param enabled - Whether to enable the query
 * @returns Query result with report details
 */
export const useReportDetail = (reportId: string, enabled = true) => {
  return useQuery<ReportDetailResponse>({
    queryKey: QUERY_KEYS.detail(reportId),
    queryFn: () => reportsApi.getReport(reportId),
    enabled: enabled && !!reportId,
    staleTime: STALE_TIME,
    refetchOnWindowFocus: true,
    // Poll more frequently when report is in progress
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.report && isReportInProgress(data.report.status)) {
        return IN_PROGRESS_REFETCH_INTERVAL;
      }
      return false; // Stop polling when complete
    },
  });
};

/**
 * Hook to get download URL for a report
 * @param reportId - The report ID
 * @param format - Output format
 * @param enabled - Whether to enable the query
 * @returns Query result with download URL
 */
export const useReportDownload = (
  reportId: string,
  format: 'pdf' | 'excel' | 'json' = 'pdf',
  enabled = true
) => {
  return useQuery<DownloadReportResponse>({
    queryKey: [...QUERY_KEYS.detail(reportId), 'download', format],
    queryFn: () => reportsApi.downloadReport(reportId, format),
    enabled: enabled && !!reportId,
    staleTime: 5 * 60 * 1000, // 5 minutes (URLs expire in 1 hour)
    refetchOnWindowFocus: false,
  });
};

// =============================================================================
// Dashboard & Analysis Hooks
// =============================================================================

/**
 * Hook to fetch dashboard data for a folder
 * @param request - Dashboard data request parameters
 * @param enabled - Whether to enable the query
 * @returns Query result with dashboard data
 */
export const useDashboardData = (request: DashboardDataRequest, enabled = true) => {
  return useQuery<DashboardDataResponse>({
    queryKey: QUERY_KEYS.dashboard(request.folder_id, request.report_type),
    queryFn: () => reportsApi.getDashboardData(request),
    enabled: enabled && !!request.folder_id,
    staleTime: STALE_TIME,
    refetchOnWindowFocus: true,
  });
};

/**
 * Hook to run quick analysis on a folder
 * @param request - Quick analysis request parameters
 * @param enabled - Whether to enable the query
 * @returns Query result with analysis results
 */
export const useQuickAnalysis = (request: QuickAnalyzeRequest, enabled = true) => {
  return useQuery<QuickAnalyzeResponse>({
    queryKey: QUERY_KEYS.quickAnalysis(request.folder_id, request.analysis_type),
    queryFn: () => reportsApi.quickAnalyze(request),
    enabled: enabled && !!request.folder_id,
    staleTime: 60 * 1000, // 1 minute
    refetchOnWindowFocus: false,
  });
};

// =============================================================================
// Mutation Hooks
// =============================================================================

/**
 * Hook to create a new report
 * @returns Mutation for creating reports
 */
export const useCreateReport = () => {
  const queryClient = useQueryClient();

  return useMutation<CreateReportResponse, Error, CreateReportRequest>({
    mutationFn: (request) => reportsApi.createReport(request),
    onSuccess: (data) => {
      // Invalidate reports list to show new report
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
      // Invalidate statistics
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.statistics() });
      console.log('✅ Report created:', data.report_id);
    },
    onError: (error) => {
      console.error('❌ Failed to create report:', error);
    },
  });
};

/**
 * Hook to delete a report
 * @returns Mutation for deleting reports
 */
export const useDeleteReport = () => {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean; message: string }, Error, string>({
    mutationFn: (reportId) => reportsApi.deleteReport(reportId),
    onSuccess: (_, reportId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: QUERY_KEYS.detail(reportId) });
      // Invalidate reports list
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
      // Invalidate statistics
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.statistics() });
      console.log('✅ Report deleted:', reportId);
    },
    onError: (error) => {
      console.error('❌ Failed to delete report:', error);
    },
  });
};

/**
 * Hook to run quick analysis (mutation version for on-demand analysis)
 * @returns Mutation for running quick analysis
 */
export const useRunQuickAnalysis = () => {
  return useMutation<QuickAnalyzeResponse, Error, QuickAnalyzeRequest>({
    mutationFn: (request) => reportsApi.quickAnalyze(request),
    onError: (error) => {
      console.error('❌ Quick analysis failed:', error);
    },
  });
};

// =============================================================================
// Combined Hooks
// =============================================================================

/**
 * Combined hook for the reports page
 * Fetches list and statistics needed for the main view
 * @param params - List query parameters
 * @param enabled - Whether to enable all queries
 */
export const useReportsPageData = (
  params: {
    status?: ReportStatus;
    report_type?: ReportType;
    limit?: number;
    offset?: number;
  } = {},
  enabled = true
) => {
  const list = useReportsList(params, enabled);
  const statistics = useReportStatistics(enabled);

  return {
    list,
    statistics,
    reports: list.data?.reports || [],
    total: list.data?.total || 0,
    stats: statistics.data?.statistics,
    isLoading: list.isLoading || statistics.isLoading,
    isError: list.isError || statistics.isError,
    error: list.error || statistics.error,
    refetch: () => {
      list.refetch();
      statistics.refetch();
    },
  };
};

/**
 * Hook to track report generation progress
 * Polls the report detail until completion or failure
 * @param reportId - The report ID to track
 * @param enabled - Whether to enable tracking
 */
export const useReportProgress = (reportId: string | null, enabled = true) => {
  const { data, isLoading, isError, error } = useReportDetail(reportId || '', enabled && !!reportId);

  const report = data?.report;
  const status = report?.status;
  const isInProgress = status ? isReportInProgress(status) : false;
  const isComplete = status === 'completed';
  const isFailed = status === 'failed';

  return {
    report,
    summary: data?.summary,
    insights: data?.insights || [],
    charts: data?.charts || [],
    progress: data?.progress_percentage || 0,
    status,
    isLoading,
    isError,
    error,
    isInProgress,
    isComplete,
    isFailed,
    pdfPath: data?.pdf_path,
    excelPath: data?.excel_path,
  };
};
