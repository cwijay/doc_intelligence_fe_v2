'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { ingestionApi } from '@/lib/api/ingestion';
import { IngestResponse, JobStatusResponse, Document } from '@/types/api';
import toast from 'react-hot-toast';

export interface IngestionJob {
  jobId: string;
  documentId: string;
  documentName: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress?: number;
  startedAt: string;
  completedAt?: string;
  failedAt?: string;
  error?: string;
  toastId?: string;
}

interface UseIngestionJobsReturn {
  // Active jobs management
  activeJobs: Map<string, IngestionJob>;
  
  // Job actions
  startIngestionJob: (document: Document, orgName: string, folderName?: string) => Promise<string>;
  getJobStatus: (jobId: string) => IngestionJob | undefined;
  clearCompletedJobs: () => void;
  
  // Statistics
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  processingJobs: number;
}

export function useIngestionJobs(): UseIngestionJobsReturn {
  const [activeJobs, setActiveJobs] = useState<Map<string, IngestionJob>>(new Map());
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef(false);

  // Keep a ref of activeJobs for reading in async callbacks (avoids stale closure)
  const activeJobsRef = useRef<Map<string, IngestionJob>>(new Map());
  useEffect(() => {
    activeJobsRef.current = activeJobs;
  }, [activeJobs]);

  // Start polling for job status updates
  const startPolling = useCallback(() => {
    if (isPollingRef.current) {
      return; // Already polling
    }

    isPollingRef.current = true;
    console.log('🔄 Starting ingestion job polling...');

    pollIntervalRef.current = setInterval(async () => {
      // Read current jobs from ref (avoids nested setState)
      const currentJobs = activeJobsRef.current;
      const jobsToCheck = Array.from(currentJobs.values()).filter(
        job => job.status === 'queued' || job.status === 'processing'
      );

      if (jobsToCheck.length === 0) {
        console.log('⏸️ No active jobs to check, stopping polling');
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        isPollingRef.current = false;
        return;
      }

      // Check status for all active jobs (async operations outside setState)
      for (const job of jobsToCheck) {
        try {
          const statusResponse = await ingestionApi.getJobStatus(job.jobId);

          // Single setState call per job (no nested setState)
          setActiveJobs(prevJobs => {
            const updatedJobs = new Map(prevJobs);
            const existingJob = updatedJobs.get(job.jobId);

            if (!existingJob) return prevJobs;

            const updatedJob: IngestionJob = {
              ...existingJob,
              status: statusResponse.status,
              progress: statusResponse.progress,
              completedAt: statusResponse.completed_at,
              failedAt: statusResponse.failed_at,
              error: statusResponse.error
            };

            // Handle status changes
            if (existingJob.status !== statusResponse.status) {
              console.log('📊 Job status changed:', {
                jobId: job.jobId,
                document: job.documentName,
                from: existingJob.status,
                to: statusResponse.status
              });

              // Update toast notifications based on status
              if (statusResponse.status === 'completed') {
                // Dismiss any existing loading toast
                if (existingJob.toastId) {
                  toast.dismiss(existingJob.toastId);
                }

                toast.success(`Document indexed successfully: ${job.documentName}`, {
                  duration: 4000,
                  id: `complete-${job.jobId}`
                });
              } else if (statusResponse.status === 'failed') {
                // Dismiss any existing loading toast
                if (existingJob.toastId) {
                  toast.dismiss(existingJob.toastId);
                }

                const errorMsg = statusResponse.error || 'Unknown error occurred';
                toast.error(`Document indexing failed: ${job.documentName}\n${errorMsg}`, {
                  duration: 6000,
                  id: `failed-${job.jobId}`
                });
              } else if (statusResponse.status === 'processing' && existingJob.status === 'queued') {
                // Job moved from queued to processing
                if (existingJob.toastId) {
                  const progressMsg = statusResponse.progress ? `${statusResponse.progress}% complete` : 'Indexing content...';
                  toast.loading(
                    `Processing document: ${job.documentName}\n${progressMsg}`,
                    {
                      id: existingJob.toastId
                    }
                  );
                }
              } else if (statusResponse.status === 'processing' && statusResponse.progress) {
                // Update progress for processing job
                if (existingJob.toastId && statusResponse.progress !== existingJob.progress) {
                  toast.loading(
                    `Processing document: ${job.documentName}\n${statusResponse.progress}% complete`,
                    {
                      id: existingJob.toastId
                    }
                  );
                }
              }
            }

            updatedJobs.set(job.jobId, updatedJob);
            return updatedJobs;
          });
        } catch (error) {
          console.error('🚫 Failed to check job status:', {
            jobId: job.jobId,
            error: error instanceof Error ? error.message : String(error)
          });

          // Don't fail the entire polling for one job error
          // The job will be retried on the next poll cycle
        }
      }
    }, 4000); // Poll every 4 seconds
  }, []);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    isPollingRef.current = false;
    console.log('⏹️ Stopped ingestion job polling');
  }, []);

  // Start a new ingestion job
  const startIngestionJob = useCallback(async (
    document: Document,
    orgName: string,
    folderName?: string
  ): Promise<string> => {
    console.log('🚀 Starting ingestion job:', {
      documentName: document.name,
      documentId: document.id,
      orgName,
      folderName
    });

    try {
      const response: IngestResponse = await ingestionApi.ingestDocument(
        document,
        orgName,
        folderName
      );

      // Show initial loading toast
      const toastId = toast.loading(
        `Indexing document: ${document.name}\nPreparing document for search indexing...`,
        {
          id: `ingest-${response.job_id}`
        }
      );

      // Create new job entry
      const newJob: IngestionJob = {
        jobId: response.job_id,
        documentId: document.id,
        documentName: document.name,
        status: response.status,
        startedAt: response.timestamp,
        toastId
      };

      // Add job to active jobs
      setActiveJobs(prevJobs => {
        const updatedJobs = new Map(prevJobs);
        updatedJobs.set(response.job_id, newJob);
        return updatedJobs;
      });

      // Start polling if not already running
      startPolling();

      console.log('✅ Ingestion job started:', {
        jobId: response.job_id,
        status: response.status,
        message: response.message
      });

      return response.job_id;
    } catch (error) {
      console.error('🚫 Failed to start ingestion job:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to start document indexing';
      toast.error(`Indexing failed: ${document.name}\n${errorMessage}`, {
        duration: 6000
      });
      
      throw error;
    }
  }, [startPolling]);

  // Get job status
  const getJobStatus = useCallback((jobId: string): IngestionJob | undefined => {
    return activeJobs.get(jobId);
  }, [activeJobs]);

  // Clear completed and failed jobs
  const clearCompletedJobs = useCallback(() => {
    setActiveJobs(prevJobs => {
      const updatedJobs = new Map();
      
      // Only keep jobs that are still active (queued or processing)
      prevJobs.forEach((job, jobId) => {
        if (job.status === 'queued' || job.status === 'processing') {
          updatedJobs.set(jobId, job);
        } else {
          // Dismiss any remaining toasts for completed jobs
          if (job.toastId) {
            toast.dismiss(job.toastId);
          }
        }
      });
      
      console.log('🧹 Cleared completed/failed ingestion jobs:', {
        before: prevJobs.size,
        after: updatedJobs.size
      });
      
      return updatedJobs;
    });
  }, []);

  // Statistics
  const stats = Array.from(activeJobs.values()).reduce(
    (acc, job) => {
      acc.totalJobs++;
      switch (job.status) {
        case 'completed':
          acc.completedJobs++;
          break;
        case 'failed':
          acc.failedJobs++;
          break;
        case 'processing':
        case 'queued':
          acc.processingJobs++;
          break;
      }
      return acc;
    },
    { totalJobs: 0, completedJobs: 0, failedJobs: 0, processingJobs: 0 }
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
      // Dismiss all active toasts
      activeJobs.forEach(job => {
        if (job.toastId) {
          toast.dismiss(job.toastId);
        }
      });
    };
  }, [stopPolling, activeJobs]);

  return {
    activeJobs,
    startIngestionJob,
    getJobStatus,
    clearCompletedJobs,
    ...stats
  };
}