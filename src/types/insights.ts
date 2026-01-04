/**
 * Insights API Types
 * Types for the audit/insights endpoints (dashboard stats, activity timeline, jobs)
 */

/**
 * Audit Event (from backend /api/v1/audit/trail)
 * Raw event from the audit trail endpoint
 */
export interface AuditEvent {
  id: string;
  organization_id?: string;
  created_at: string;
  event_type: string;
  document_hash?: string;
  file_name?: string;
  job_id?: string;
  details?: Record<string, unknown>;
}

/**
 * Audit Trail Response (from backend /api/v1/audit/trail)
 */
export interface AuditTrailResponse {
  success: boolean;
  events: AuditEvent[];
  total: number;
  limit: number;
  offset: number;
  error?: string;
}

/**
 * Dashboard Stats
 * Computed from aggregating jobs, generations, and documents
 */
export interface InsightsDashboardStats {
  total_documents: number;
  total_jobs: number;
  total_generations: number;
  jobs_by_status: Record<string, number>;
  generations_by_type: Record<string, number>;
  cache_hit_rate: number;
  avg_processing_time_ms: number;
}

/**
 * Processing Job
 * Represents a document processing job
 */
export interface ProcessingJob {
  id: string;
  organization_id?: string;
  document_hash?: string;
  file_name: string;
  model: string;
  complexity?: string;
  status: string;
  started_at: string;
  completed_at?: string;
  cached?: boolean;
  output_path?: string;
  duration_ms?: number;
  duration_formatted?: string;
  error_message?: string;
}

/**
 * Document Generation
 * Represents a generated content record (summary, faqs, questions)
 */
export interface DocumentGeneration {
  id: string;
  organization_id?: string;
  document_hash?: string;
  document_name: string;
  source_path?: string;
  generation_type: string;
  content?: Record<string, unknown>;
  options?: Record<string, unknown>;
  model: string;
  processing_time_ms?: number;
  session_id?: string;
  created_at: string;
}

/**
 * Activity Timeline Item
 * Frontend-friendly activity event from GET /api/v1/audit/activity
 */
export interface ActivityItem {
  id: string;
  timestamp: string;
  timestamp_ago: string;
  event_type: string;
  title: string;
  description?: string;
  file_name?: string;
  status?: string;
  status_color?: string;
  icon?: string;
}

/**
 * Document Record
 * Processed document metadata
 */
export interface DocumentRecord {
  id?: string;
  filename: string;
  file_name?: string;
  document_hash?: string;
  storage_path?: string;
  file_path?: string;
  status?: string;
  file_size?: number;
  mime_type?: string;
  page_count?: number;
  created_at?: string;
  updated_at?: string;
}

// =============================================================================
// API Response Types
// =============================================================================

/**
 * Dashboard Response
 * Response from GET /api/v1/audit/dashboard
 */
export interface InsightsDashboardResponse {
  success: boolean;
  stats: InsightsDashboardStats;
  recent_jobs: ProcessingJob[];
  recent_generations: DocumentGeneration[];
  error?: string;
}

/**
 * Activity Timeline Response
 * Response from GET /api/v1/audit/activity
 */
export interface ActivityTimelineResponse {
  success: boolean;
  activities: ActivityItem[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
  start_date?: string;
  end_date?: string;
  error?: string;
}

/**
 * Jobs List Response
 * Response from GET /api/v1/audit/jobs
 */
export interface JobsListResponse {
  success: boolean;
  jobs: ProcessingJob[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
  error?: string;
}

/**
 * Single Job Response
 * Response from GET /api/v1/audit/jobs/{job_id}
 */
export interface JobDetailResponse {
  success: boolean;
  job: ProcessingJob;
  error?: string;
}

/**
 * Documents List Response
 * Response from GET /api/v1/audit/documents
 */
export interface DocumentsListResponse {
  success: boolean;
  documents: DocumentRecord[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
  error?: string;
}

/**
 * Generations List Response
 * Response from GET /api/v1/audit/generations
 */
export interface GenerationsListResponse {
  success: boolean;
  generations: DocumentGeneration[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
  error?: string;
}

// =============================================================================
// Query Parameter Types
// =============================================================================

export type InsightsPeriod = '7d' | '30d' | '90d' | 'all';

export const INSIGHTS_PERIODS: { value: InsightsPeriod; label: string }[] = [
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
  { value: 'all', label: 'All Time' },
];

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | '';

export const JOB_STATUSES: { value: JobStatus; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
];

export interface ActivityQueryParams {
  limit?: number;
  offset?: number;
  event_type?: string;
  file_name?: string;
  start_date?: string;
  end_date?: string;
}

export interface JobsQueryParams {
  limit?: number;
  offset?: number;
  status?: JobStatus;
  start_date?: string;
  end_date?: string;
}
