'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import {
  bulkApi,
  BulkUploadOptions,
  BulkUploadResponse,
  BulkJobStatusResponse,
  BulkJobInfo,
} from '@/lib/api/bulk';
import toast from 'react-hot-toast';

// =============================================================================
// Types
// =============================================================================

export interface UseBulkUploadOptions {
  /** Callback when job completes (success or failure) */
  onComplete?: (job: BulkJobInfo) => void;
  /** Callback when job fails */
  onError?: (error: string) => void;
  /** Polling interval in milliseconds (default: 2000ms) */
  pollInterval?: number;
}

export interface BulkUploadState {
  /** Currently uploading files */
  isUploading: boolean;
  /** Active job ID (if any) */
  jobId: string | null;
  /** Latest job status response */
  jobStatus: BulkJobStatusResponse | null;
  /** Currently polling for job status */
  isPolling: boolean;
  /** Error message (if any) */
  error: string | null;
  /** Upload progress percentage (0-100) */
  uploadProgress: number;
}

export interface UseBulkUploadReturn extends BulkUploadState {
  /** Upload files and optionally start processing */
  upload: (
    folderName: string,
    orgName: string,
    files: File[],
    options?: Partial<Omit<BulkUploadOptions, 'folderName' | 'orgName' | 'files'>>
  ) => Promise<BulkUploadResponse | null>;
  /** Stop polling for job status */
  stopPolling: () => void;
  /** Start polling for a specific job */
  startPolling: (jobId: string) => void;
  /** Reset all state */
  reset: () => void;
  /** Refresh job status manually */
  refreshStatus: () => Promise<void>;
}

// =============================================================================
// Hook Implementation
// =============================================================================

export function useBulkUpload(options: UseBulkUploadOptions = {}): UseBulkUploadReturn {
  const { onComplete, onError, pollInterval = 20000 } = options;
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // State
  const [isUploading, setIsUploading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<BulkJobStatusResponse | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Refs for cleanup
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, []);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  // Fetch job status
  const fetchJobStatus = useCallback(async (id: string): Promise<BulkJobStatusResponse | null> => {
    try {
      const status = await bulkApi.getJobStatus(id, true);
      if (isMountedRef.current) {
        setJobStatus(status);
        setError(null);
      }
      return status;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to fetch job status';
      if (isMountedRef.current) {
        setError(errorMsg);
      }
      console.error('Error fetching bulk job status:', err);
      return null;
    }
  }, []);

  // Start polling for job status
  const startPolling = useCallback((id: string) => {
    // Clear any existing polling
    stopPolling();

    setJobId(id);
    setIsPolling(true);

    // Fetch immediately
    fetchJobStatus(id);

    // Set up polling interval
    pollingIntervalRef.current = setInterval(async () => {
      const status = await fetchJobStatus(id);

      if (!status || !isMountedRef.current) return;

      const jobState = status.job.status;

      // Check if job is complete
      if (['completed', 'partial_failure', 'failed', 'cancelled'].includes(jobState)) {
        stopPolling();

        // Notify via callback
        if (onComplete) {
          onComplete(status.job);
        }

        // Show toast notification
        if (jobState === 'completed') {
          toast.success(`Bulk processing complete! ${status.job.completed_count} documents processed.`);
        } else if (jobState === 'partial_failure') {
          toast.error(`Bulk processing completed with errors. ${status.job.failed_count} documents failed.`);
        } else if (jobState === 'failed') {
          toast.error(`Bulk processing failed: ${status.job.error_message || 'Unknown error'}`);
          if (onError) {
            onError(status.job.error_message || 'Job failed');
          }
        } else if (jobState === 'cancelled') {
          toast('Bulk processing was cancelled.', { icon: '!' });
        }

        // Invalidate document queries to refresh UI
        queryClient.invalidateQueries({ queryKey: ['documents'] });
        queryClient.invalidateQueries({ queryKey: ['folders'] });
      }
    }, pollInterval);
  }, [fetchJobStatus, stopPolling, pollInterval, onComplete, onError, queryClient]);

  // Upload files
  const upload = useCallback(async (
    folderName: string,
    orgName: string,
    files: File[],
    uploadOptions?: Partial<Omit<BulkUploadOptions, 'folderName' | 'orgName' | 'files'>>
  ): Promise<BulkUploadResponse | null> => {
    if (!user) {
      const errorMsg = 'No authenticated user. Please login first.';
      setError(errorMsg);
      toast.error(errorMsg);
      return null;
    }

    // Reset state
    setError(null);
    setIsUploading(true);
    setUploadProgress(0);
    setJobId(null);
    setJobStatus(null);

    try {
      const result = await bulkApi.upload({
        folderName,
        orgName,
        files,
        generateSummary: uploadOptions?.generateSummary ?? true,
        generateFaqs: uploadOptions?.generateFaqs ?? true,
        generateQuestions: uploadOptions?.generateQuestions ?? true,
        numFaqs: uploadOptions?.numFaqs ?? 10,
        numQuestions: uploadOptions?.numQuestions ?? 10,
        summaryMaxWords: uploadOptions?.summaryMaxWords ?? 500,
        autoStart: uploadOptions?.autoStart ?? true,
        onUploadProgress: (progress) => {
          if (isMountedRef.current) {
            setUploadProgress(progress);
          }
        },
      });

      if (!isMountedRef.current) return null;

      setIsUploading(false);

      if (!result.success) {
        setError(result.error);
        toast.error(result.error);
        if (onError) {
          onError(result.error);
        }
        return null;
      }

      const response = result.response;

      // Show upload result toast
      if (response.failed_files.length > 0 && response.uploaded_files.length > 0) {
        toast.error(
          `Uploaded ${response.uploaded_files.length} files. ${response.failed_files.length} files failed.`
        );
      } else if (response.failed_files.length > 0) {
        toast.error(`All ${response.failed_files.length} files failed to upload.`);
        setError('All files failed to upload');
        return response;
      } else {
        toast.success(`Uploaded ${response.uploaded_files.length} files successfully!`);
      }

      // Start polling if job was created and auto-started
      if (response.job_id && response.status && response.status !== 'pending') {
        setJobId(response.job_id);
        startPolling(response.job_id);
      } else if (response.job_id) {
        // Job created but not started - just save the ID
        setJobId(response.job_id);
      }

      // Invalidate document queries to show newly uploaded files
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['folders'] });

      return response;
    } catch (err: any) {
      if (!isMountedRef.current) return null;

      const errorMsg = err.message || 'Upload failed. Please try again.';
      setError(errorMsg);
      setIsUploading(false);
      toast.error(errorMsg);

      if (onError) {
        onError(errorMsg);
      }

      return null;
    }
  }, [user, startPolling, onError, queryClient]);

  // Refresh status manually
  const refreshStatus = useCallback(async () => {
    if (jobId) {
      await fetchJobStatus(jobId);
    }
  }, [jobId, fetchJobStatus]);

  // Reset all state
  const reset = useCallback(() => {
    stopPolling();
    setIsUploading(false);
    setJobId(null);
    setJobStatus(null);
    setError(null);
    setUploadProgress(0);
  }, [stopPolling]);

  return {
    // State
    isUploading,
    jobId,
    jobStatus,
    isPolling,
    error,
    uploadProgress,
    // Actions
    upload,
    stopPolling,
    startPolling,
    reset,
    refreshStatus,
  };
}

// =============================================================================
// Utility Hooks
// =============================================================================

/**
 * Hook to list bulk jobs with optional filtering
 */
export function useBulkJobs(status?: string, limit = 20, offset = 0) {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<BulkJobInfo[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await bulkApi.listJobs(status, limit, offset);
      setJobs(result.jobs);
      setTotal(result.total);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch jobs');
      console.error('Error fetching bulk jobs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, status, limit, offset]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return {
    jobs,
    total,
    isLoading,
    error,
    refetch: fetchJobs,
  };
}

/**
 * Hook to cancel a bulk job
 */
export function useCancelBulkJob() {
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cancelJob = useCallback(async (jobId: string): Promise<boolean> => {
    setIsCancelling(true);
    setError(null);

    try {
      const result = await bulkApi.cancelJob(jobId);
      if (result.success) {
        toast.success('Job cancelled successfully');
        return true;
      } else {
        setError(result.message);
        toast.error(result.message);
        return false;
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to cancel job';
      setError(errorMsg);
      toast.error(errorMsg);
      return false;
    } finally {
      setIsCancelling(false);
    }
  }, []);

  return {
    cancelJob,
    isCancelling,
    error,
  };
}

/**
 * Hook to retry failed documents in a bulk job
 */
export function useRetryBulkJob() {
  const [isRetrying, setIsRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const retryFailed = useCallback(async (
    jobId: string,
    documentIds?: string[]
  ): Promise<{ success: boolean; retriedCount: number }> => {
    setIsRetrying(true);
    setError(null);

    try {
      const result = await bulkApi.retryFailed(jobId, documentIds);
      if (result.success) {
        toast.success(`Retrying ${result.retried_count} documents`);
        return { success: true, retriedCount: result.retried_count };
      } else {
        setError(result.message);
        toast.error(result.message);
        return { success: false, retriedCount: 0 };
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to retry documents';
      setError(errorMsg);
      toast.error(errorMsg);
      return { success: false, retriedCount: 0 };
    } finally {
      setIsRetrying(false);
    }
  }, []);

  return {
    retryFailed,
    isRetrying,
    error,
  };
}
