/**
 * Insights API module
 * Handles audit/insights endpoints for dashboard stats, activity timeline, and jobs
 *
 * Note: Uses ai-base client to include X-Organization-ID header
 * required by the multi-tenant backend API.
 */

import aiApi from './ai-base';
import {
  InsightsDashboardResponse,
  InsightsDashboardStats,
  ActivityTimelineResponse,
  JobsListResponse,
  JobDetailResponse,
  DocumentsListResponse,
  GenerationsListResponse,
  InsightsPeriod,
  ActivityQueryParams,
  JobsQueryParams,
  AuditEvent,
  ProcessingJob,
  DocumentGeneration,
} from '@/types/insights';

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Format a date string to a relative time (e.g., "5m ago", "2h ago", "3d ago")
 */
function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

/**
 * Format event type to a human-readable title
 */
function formatEventTitle(eventType: string, fileName?: string): string {
  const typeLabels: Record<string, string> = {
    'document_uploaded': 'Document uploaded',
    'document_processed': 'Document processed',
    'document_parsed': 'Document parsed',
    'summary_generated': 'Summary generated',
    'faq_generated': 'FAQs generated',
    'questions_generated': 'Questions generated',
    'job_started': 'Job started',
    'job_completed': 'Job completed',
    'job_failed': 'Job failed',
  };
  const label = typeLabels[eventType] || eventType.replace(/_/g, ' ');
  return fileName ? `${label}: ${fileName}` : label;
}

/**
 * Count items by a specific field value
 */
function countByField<T>(items: T[], field: keyof T): Record<string, number> {
  return items.reduce((acc, item) => {
    const value = item[field];
    const key = String(value ?? 'unknown');
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

/**
 * Calculate cache hit rate from jobs
 */
function calculateCacheHitRate(jobs: ProcessingJob[]): number {
  if (jobs.length === 0) return 0;
  const cachedCount = jobs.filter(job => job.cached).length;
  return Math.round((cachedCount / jobs.length) * 100);
}

/**
 * Calculate average processing time from generations
 */
function calculateAvgProcessingTime(generations: DocumentGeneration[]): number {
  const times = generations
    .map(g => g.processing_time_ms)
    .filter((t): t is number => typeof t === 'number' && t > 0);
  if (times.length === 0) return 0;
  return Math.round(times.reduce((sum, t) => sum + t, 0) / times.length);
}

export const insightsApi = {
  /**
   * Get dashboard stats and recent activity
   * Aggregates data from jobs, generations, and documents endpoints
   * @param period - Time period: '7d', '30d', '90d', or 'all' (currently unused by backend)
   * @returns Dashboard stats with recent jobs and generations
   */
  getDashboard: async (period: InsightsPeriod = '7d'): Promise<InsightsDashboardResponse> => {
    console.log('📊 insightsApi.getDashboard: Fetching dashboard for period:', period);
    try {
      // Fetch data from available endpoints in parallel
      const [jobsRes, generationsRes, documentsRes] = await Promise.all([
        aiApi.get('/api/v1/audit/jobs', { params: { limit: 100 } }),
        aiApi.get('/api/v1/audit/generations', { params: { limit: 100 } }),
        aiApi.get('/api/v1/audit/documents', { params: { limit: 100 } }),
      ]);

      // Extract data from responses
      const jobs: ProcessingJob[] = jobsRes.data?.jobs || [];
      const generations: DocumentGeneration[] = generationsRes.data?.generations || [];

      // Compute aggregate stats
      const stats: InsightsDashboardStats = {
        total_documents: documentsRes.data?.total || 0,
        total_jobs: jobsRes.data?.total || 0,
        total_generations: generationsRes.data?.total || 0,
        jobs_by_status: countByField(jobs, 'status'),
        generations_by_type: countByField(generations, 'generation_type'),
        cache_hit_rate: calculateCacheHitRate(jobs),
        avg_processing_time_ms: calculateAvgProcessingTime(generations),
      };

      console.log('✅ insightsApi.getDashboard: Success (aggregated)', {
        period,
        totalJobs: stats.total_jobs,
        totalDocuments: stats.total_documents,
        totalGenerations: stats.total_generations,
      });

      return {
        success: true,
        stats,
        recent_jobs: jobs.slice(0, 5),
        recent_generations: generations.slice(0, 5),
      };
    } catch (error) {
      console.error('❌ insightsApi.getDashboard: Error', {
        period,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  },

  /**
   * Get activity timeline
   * Uses /api/v1/audit/activity endpoint which returns pre-formatted ActivityItem data
   * @param params - Query parameters for filtering and pagination
   * @returns Activity timeline with pagination info
   */
  getActivity: async (params: ActivityQueryParams = {}): Promise<ActivityTimelineResponse> => {
    console.log('📊 insightsApi.getActivity: Fetching activity timeline', params);
    try {
      const response = await aiApi.get('/api/v1/audit/activity', { params });

      // Backend /activity endpoint returns pre-formatted ActivityTimelineItem[]
      // No transformation needed - just pass through
      const activities = response.data?.activities || [];

      const total = response.data?.total || 0;
      const limit = response.data?.limit || params.limit || 20;
      const offset = response.data?.offset || params.offset || 0;

      console.log('✅ insightsApi.getActivity: Success', {
        activityCount: activities.length,
        total,
      });

      return {
        success: response.data?.success ?? true,
        activities,
        total,
        limit,
        offset,
        has_more: response.data?.has_more ?? (offset + activities.length < total),
      };
    } catch (error) {
      console.error('❌ insightsApi.getActivity: Error', {
        params,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  },

  /**
   * Get processing jobs list
   * @param params - Query parameters for filtering and pagination
   * @returns Jobs list with pagination info
   */
  getJobs: async (params: JobsQueryParams = {}): Promise<JobsListResponse> => {
    console.log('📊 insightsApi.getJobs: Fetching jobs', params);
    try {
      const response = await aiApi.get('/api/v1/audit/jobs', { params });
      console.log('✅ insightsApi.getJobs: Success', {
        jobsCount: response.data?.jobs?.length || 0,
        total: response.data?.total || 0,
      });
      return response.data;
    } catch (error) {
      console.error('❌ insightsApi.getJobs: Error', {
        params,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  },

  /**
   * Get single job by ID
   * @param jobId - The job ID
   * @returns Job details
   */
  getJobById: async (jobId: string): Promise<JobDetailResponse> => {
    console.log('📊 insightsApi.getJobById: Fetching job', jobId);
    try {
      const response = await aiApi.get(`/api/v1/audit/jobs/${jobId}`);
      console.log('✅ insightsApi.getJobById: Success', {
        jobId,
        status: response.data?.job?.status,
      });
      return response.data;
    } catch (error) {
      console.error('❌ insightsApi.getJobById: Error', {
        jobId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  },

  /**
   * Get documents list
   * @param params - Query parameters for filtering and pagination
   * @returns Documents list with pagination info
   */
  getDocuments: async (params: { limit?: number; offset?: number; status?: string } = {}): Promise<DocumentsListResponse> => {
    console.log('📊 insightsApi.getDocuments: Fetching documents', params);
    try {
      const response = await aiApi.get('/api/v1/audit/documents', { params });
      console.log('✅ insightsApi.getDocuments: Success', {
        documentsCount: response.data?.documents?.length || 0,
        total: response.data?.total || 0,
      });
      return response.data;
    } catch (error) {
      console.error('❌ insightsApi.getDocuments: Error', {
        params,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  },

  /**
   * Get generations list
   * @param params - Query parameters for filtering and pagination
   * @returns Generations list with pagination info
   */
  getGenerations: async (params: { limit?: number; offset?: number; generation_type?: string } = {}): Promise<GenerationsListResponse> => {
    console.log('📊 insightsApi.getGenerations: Fetching generations', params);
    try {
      const response = await aiApi.get('/api/v1/audit/generations', { params });
      console.log('✅ insightsApi.getGenerations: Success', {
        generationsCount: response.data?.generations?.length || 0,
        total: response.data?.total || 0,
      });
      return response.data;
    } catch (error) {
      console.error('❌ insightsApi.getGenerations: Error', {
        params,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  },
};
