/**
 * Reports API module
 * Handles business intelligence report endpoints for generating and managing reports
 *
 * Note: Uses ai-base client to include X-Organization-ID header
 * required by the multi-tenant backend API.
 */

import aiApi from './ai-base';
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

// =============================================================================
// Reports API
// =============================================================================

export const reportsApi = {
  /**
   * Create a new business intelligence report
   * @param request - Report creation parameters
   * @returns Created report ID and status
   */
  createReport: async (request: CreateReportRequest): Promise<CreateReportResponse> => {
    console.log('📊 reportsApi.createReport: Creating report', {
      folder_id: request.folder_id,
      report_type: request.report_type,
    });
    try {
      const response = await aiApi.post('/api/v1/intelligence/reports', request);
      console.log('✅ reportsApi.createReport: Success', {
        report_id: response.data?.report_id,
        status: response.data?.status,
      });
      return response.data;
    } catch (error) {
      console.error('❌ reportsApi.createReport: Error', {
        request,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  },

  /**
   * Get report details by ID
   * @param reportId - The report ID
   * @returns Report details including summary, insights, and charts
   */
  getReport: async (reportId: string): Promise<ReportDetailResponse> => {
    console.log('📊 reportsApi.getReport: Fetching report', reportId);
    try {
      const response = await aiApi.get(`/api/v1/intelligence/reports/${reportId}`);
      console.log('✅ reportsApi.getReport: Success', {
        reportId,
        status: response.data?.report?.status,
        progress: response.data?.progress_percentage,
      });
      return response.data;
    } catch (error) {
      console.error('❌ reportsApi.getReport: Error', {
        reportId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  },

  /**
   * List all reports for the organization
   * @param params - Query parameters for filtering and pagination
   * @returns Reports list with pagination info
   */
  listReports: async (params: {
    status?: ReportStatus;
    report_type?: ReportType;
    limit?: number;
    offset?: number;
  } = {}): Promise<ListReportsResponse> => {
    console.log('📊 reportsApi.listReports: Fetching reports', params);
    try {
      const response = await aiApi.get('/api/v1/intelligence/reports', { params });
      console.log('✅ reportsApi.listReports: Success', {
        count: response.data?.reports?.length || 0,
        total: response.data?.total || 0,
      });
      return response.data;
    } catch (error) {
      console.error('❌ reportsApi.listReports: Error', {
        params,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  },

  /**
   * Get download URL for a report
   * @param reportId - The report ID
   * @param format - Output format: 'pdf', 'excel', or 'json'
   * @returns Signed download URL
   */
  downloadReport: async (reportId: string, format: 'pdf' | 'excel' | 'json' = 'pdf'): Promise<DownloadReportResponse> => {
    console.log('📊 reportsApi.downloadReport: Getting download URL', { reportId, format });
    try {
      const response = await aiApi.get(`/api/v1/intelligence/reports/${reportId}/download`, {
        params: { format },
      });
      console.log('✅ reportsApi.downloadReport: Success', {
        reportId,
        format,
        expires_in: response.data?.expires_in_seconds,
      });
      return response.data;
    } catch (error) {
      console.error('❌ reportsApi.downloadReport: Error', {
        reportId,
        format,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  },

  /**
   * Delete a report
   * @param reportId - The report ID
   * @returns Success status
   */
  deleteReport: async (reportId: string): Promise<{ success: boolean; message: string }> => {
    console.log('📊 reportsApi.deleteReport: Deleting report', reportId);
    try {
      const response = await aiApi.delete(`/api/v1/intelligence/reports/${reportId}`);
      console.log('✅ reportsApi.deleteReport: Success', { reportId });
      return response.data;
    } catch (error) {
      console.error('❌ reportsApi.deleteReport: Error', {
        reportId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  },

  /**
   * Run quick analysis without generating a full report
   * @param request - Analysis parameters
   * @returns Quick analysis results with insights
   */
  quickAnalyze: async (request: QuickAnalyzeRequest): Promise<QuickAnalyzeResponse> => {
    console.log('📊 reportsApi.quickAnalyze: Running quick analysis', {
      folder_id: request.folder_id,
      analysis_type: request.analysis_type,
    });
    try {
      const response = await aiApi.post('/api/v1/intelligence/analyze', request);
      console.log('✅ reportsApi.quickAnalyze: Success', {
        analysis_type: response.data?.analysis_type,
        processing_time_ms: response.data?.processing_time_ms,
      });
      return response.data;
    } catch (error) {
      console.error('❌ reportsApi.quickAnalyze: Error', {
        request,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  },

  /**
   * Get dashboard data for UI display
   * @param request - Dashboard data parameters
   * @returns Dashboard metrics, charts, tables, and insights
   */
  getDashboardData: async (request: DashboardDataRequest): Promise<DashboardDataResponse> => {
    console.log('📊 reportsApi.getDashboardData: Fetching dashboard data', {
      folder_id: request.folder_id,
      report_type: request.report_type,
    });
    try {
      const response = await aiApi.post('/api/v1/intelligence/dashboard', request);
      console.log('✅ reportsApi.getDashboardData: Success', {
        metrics_count: response.data?.summary_metrics?.length || 0,
        charts_count: response.data?.charts?.length || 0,
      });
      return response.data;
    } catch (error) {
      console.error('❌ reportsApi.getDashboardData: Error', {
        request,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  },

  /**
   * Get report statistics for the organization
   * @returns Aggregate statistics about reports
   */
  getStatistics: async (): Promise<ReportStatisticsResponse> => {
    console.log('📊 reportsApi.getStatistics: Fetching statistics');
    try {
      const response = await aiApi.get('/api/v1/intelligence/statistics');
      console.log('✅ reportsApi.getStatistics: Success', {
        total_reports: response.data?.statistics?.total_reports,
      });
      return response.data;
    } catch (error) {
      console.error('❌ reportsApi.getStatistics: Error', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  },
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Format report status for display
 */
export function formatReportStatus(status: ReportStatus): string {
  const statusLabels: Record<ReportStatus, string> = {
    pending: 'Pending',
    extracting: 'Extracting Data',
    aggregating: 'Aggregating',
    analyzing: 'Analyzing',
    generating: 'Generating Report',
    completed: 'Completed',
    failed: 'Failed',
  };
  return statusLabels[status] || status;
}

/**
 * Get status color classes for Tailwind
 */
export function getStatusColorClasses(status: ReportStatus): { text: string; bg: string } {
  const colors: Record<ReportStatus, { text: string; bg: string }> = {
    pending: { text: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
    extracting: { text: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    aggregating: { text: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    analyzing: { text: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/30' },
    generating: { text: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-100 dark:bg-indigo-900/30' },
    completed: { text: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' },
    failed: { text: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' },
  };
  return colors[status] || { text: 'text-gray-600', bg: 'bg-gray-100' };
}

/**
 * Format report type for display
 */
export function formatReportType(type: ReportType): string {
  const typeLabels: Record<ReportType, string> = {
    expense_summary: 'Expense Summary',
    vendor_analysis: 'Vendor Analysis',
    invoice_reconciliation: 'Invoice Reconciliation',
    spend_trends: 'Spending Trends',
    cash_flow_projection: 'Cash Flow Projection',
    tax_preparation: 'Tax Preparation',
  };
  return typeLabels[type] || type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Format currency value
 */
export function formatCurrency(value: number, currency: string = '$'): string {
  return `${currency}${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Format large numbers (e.g., 1.2K, 3.5M)
 */
export function formatCompactNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toLocaleString();
}

/**
 * Format processing time
 */
export function formatProcessingTime(ms: number | undefined): string {
  if (!ms) return 'N/A';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
}

/**
 * Check if report is in progress
 */
export function isReportInProgress(status: ReportStatus): boolean {
  return ['pending', 'extracting', 'aggregating', 'analyzing', 'generating'].includes(status);
}

/**
 * Get progress percentage based on status
 */
export function getProgressPercentage(status: ReportStatus): number {
  const progressMap: Record<ReportStatus, number> = {
    pending: 0,
    extracting: 20,
    aggregating: 40,
    analyzing: 60,
    generating: 80,
    completed: 100,
    failed: 0,
  };
  return progressMap[status] || 0;
}
