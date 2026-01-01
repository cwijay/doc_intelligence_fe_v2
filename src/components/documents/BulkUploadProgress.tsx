'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  XMarkIcon,
  ArrowPathRoundedSquareIcon,
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import Button from '@/components/ui/Button';
import {
  BulkJobStatusResponse,
  BulkJobInfo,
  DocumentItemInfo,
} from '@/lib/api/bulk';

// =============================================================================
// Types
// =============================================================================

interface BulkUploadProgressProps {
  /** Job status response from API */
  jobStatus: BulkJobStatusResponse | null;
  /** Whether currently polling */
  isPolling: boolean;
  /** Callback to cancel the job */
  onCancel?: () => void;
  /** Callback to retry failed documents */
  onRetryFailed?: (documentIds?: string[]) => void;
  /** Callback to dismiss/close the progress display */
  onDismiss?: () => void;
  /** Whether cancellation is in progress */
  isCancelling?: boolean;
  /** Whether retry is in progress */
  isRetrying?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// Status to display info mapping
const STATUS_CONFIG: Record<string, { icon: typeof CheckCircleIcon; color: string; label: string }> = {
  pending: { icon: ClockIcon, color: 'text-secondary-400', label: 'Pending' },
  processing: { icon: ArrowPathIcon, color: 'text-primary-500', label: 'Processing' },
  parsing: { icon: ArrowPathIcon, color: 'text-blue-500', label: 'Parsing' },
  indexing: { icon: ArrowPathIcon, color: 'text-indigo-500', label: 'Indexing' },
  generating: { icon: ArrowPathIcon, color: 'text-purple-500', label: 'Generating' },
  completed: { icon: CheckCircleIcon, color: 'text-success-500', label: 'Completed' },
  failed: { icon: XCircleIcon, color: 'text-error-500', label: 'Failed' },
  skipped: { icon: ExclamationTriangleIcon, color: 'text-warning-500', label: 'Skipped' },
};

const JOB_STATUS_CONFIG: Record<string, { bgColor: string; textColor: string; label: string }> = {
  pending: { bgColor: 'bg-secondary-100', textColor: 'text-secondary-700', label: 'Pending' },
  processing: { bgColor: 'bg-primary-100', textColor: 'text-primary-700', label: 'Processing' },
  completed: { bgColor: 'bg-success-100', textColor: 'text-success-700', label: 'Completed' },
  partial_failure: { bgColor: 'bg-warning-100', textColor: 'text-warning-700', label: 'Partial Failure' },
  failed: { bgColor: 'bg-error-100', textColor: 'text-error-700', label: 'Failed' },
  cancelled: { bgColor: 'bg-secondary-100', textColor: 'text-secondary-700', label: 'Cancelled' },
};

// =============================================================================
// Component
// =============================================================================

export default function BulkUploadProgress({
  jobStatus,
  isPolling,
  onCancel,
  onRetryFailed,
  onDismiss,
  isCancelling = false,
  isRetrying = false,
  className,
}: BulkUploadProgressProps) {
  // Don't render if no job status
  if (!jobStatus) return null;

  const { job, documents, progress_percentage, estimated_remaining_seconds } = jobStatus;

  // Computed values
  const isJobActive = ['pending', 'processing'].includes(job.status);
  const hasFailedDocs = job.failed_count > 0;
  const failedDocuments = documents?.filter((d) => d.status === 'failed') || [];

  // Format time remaining
  const formatTimeRemaining = (seconds: number | undefined): string => {
    if (!seconds || seconds <= 0) return '';
    if (seconds < 60) return `~${seconds}s remaining`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `~${minutes}m ${secs}s remaining`;
  };

  // Get job status badge
  const jobStatusConfig = JOB_STATUS_CONFIG[job.status] || JOB_STATUS_CONFIG.pending;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={clsx(
        'bg-white rounded-xl border border-secondary-200 shadow-sm overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <div className="px-4 py-3 bg-secondary-50 border-b border-secondary-200 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <DocumentTextIcon className="w-5 h-5 text-secondary-500" />
          <div>
            <h3 className="text-sm font-medium text-secondary-900">
              Bulk Processing: {job.folder_name}
            </h3>
            <p className="text-xs text-secondary-500">
              Job ID: {job.id.slice(0, 8)}...
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span
            className={clsx(
              'px-2 py-0.5 text-xs font-medium rounded-full',
              jobStatusConfig.bgColor,
              jobStatusConfig.textColor
            )}
          >
            {jobStatusConfig.label}
          </span>
          {onDismiss && !isJobActive && (
            <button
              onClick={onDismiss}
              className="p-1 text-secondary-400 hover:text-secondary-600 transition-colors"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Progress Section */}
      <div className="px-4 py-4">
        {/* Overall Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-secondary-600">
              {job.completed_count} of {job.total_documents} documents processed
            </span>
            <span className="font-medium text-secondary-900">
              {Math.round(progress_percentage)}%
            </span>
          </div>
          <div className="w-full bg-secondary-200 rounded-full h-2.5">
            <motion.div
              className={clsx(
                'h-2.5 rounded-full transition-colors',
                job.status === 'failed'
                  ? 'bg-error-500'
                  : job.status === 'partial_failure'
                  ? 'bg-warning-500'
                  : 'bg-primary-600'
              )}
              initial={{ width: 0 }}
              animate={{ width: `${progress_percentage}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
          {estimated_remaining_seconds && isJobActive && (
            <p className="text-xs text-secondary-500 mt-1">
              {formatTimeRemaining(estimated_remaining_seconds)}
            </p>
          )}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <StatCard
            label="Total"
            value={job.total_documents}
            icon={DocumentTextIcon}
            color="text-secondary-600"
          />
          <StatCard
            label="Completed"
            value={job.completed_count}
            icon={CheckCircleIcon}
            color="text-success-600"
          />
          <StatCard
            label="Failed"
            value={job.failed_count}
            icon={XCircleIcon}
            color="text-error-600"
          />
          <StatCard
            label="Skipped"
            value={job.skipped_count}
            icon={ExclamationTriangleIcon}
            color="text-warning-600"
          />
        </div>

        {/* Error Message */}
        {job.error_message && (
          <div className="mb-4 p-3 bg-error-50 border border-error-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <XCircleIcon className="w-5 h-5 text-error-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-error-800">Job Error</p>
                <p className="text-xs text-error-700 mt-1">{job.error_message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Document List */}
        {documents && documents.length > 0 && (
          <div className="border border-secondary-200 rounded-lg overflow-hidden">
            <div className="px-3 py-2 bg-secondary-50 border-b border-secondary-200">
              <h4 className="text-xs font-medium text-secondary-700">Document Status</h4>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {documents.map((doc) => (
                <DocumentStatusRow key={doc.id} document={doc} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="px-4 py-3 bg-secondary-50 border-t border-secondary-200 flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs text-secondary-500">
          {isPolling && (
            <>
              <ArrowPathIcon className="w-3 h-3 animate-spin" />
              <span>Auto-refreshing...</span>
            </>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {/* Cancel button - only show for active jobs */}
          {isJobActive && onCancel && (
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              disabled={isCancelling}
            >
              {isCancelling ? 'Cancelling...' : 'Cancel Job'}
            </Button>
          )}

          {/* Retry button - only show for completed jobs with failures */}
          {!isJobActive && hasFailedDocs && onRetryFailed && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRetryFailed()}
              disabled={isRetrying}
            >
              {isRetrying ? (
                <>
                  <ArrowPathIcon className="w-4 h-4 mr-1 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <ArrowPathRoundedSquareIcon className="w-4 h-4 mr-1" />
                  Retry Failed ({failedDocuments.length})
                </>
              )}
            </Button>
          )}

          {/* Dismiss button - only show for completed jobs */}
          {!isJobActive && onDismiss && (
            <Button variant="primary" size="sm" onClick={onDismiss}>
              Done
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

interface StatCardProps {
  label: string;
  value: number;
  icon: typeof CheckCircleIcon;
  color: string;
}

function StatCard({ label, value, icon: Icon, color }: StatCardProps) {
  return (
    <div className="text-center p-2 bg-secondary-50 rounded-lg">
      <Icon className={clsx('w-4 h-4 mx-auto mb-1', color)} />
      <p className="text-lg font-semibold text-secondary-900">{value}</p>
      <p className="text-xs text-secondary-500">{label}</p>
    </div>
  );
}

interface DocumentStatusRowProps {
  document: DocumentItemInfo;
}

function DocumentStatusRow({ document }: DocumentStatusRowProps) {
  const statusConfig = STATUS_CONFIG[document.status] || STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;
  const isProcessing = ['processing', 'parsing', 'indexing', 'generating'].includes(document.status);

  return (
    <div className="px-3 py-2 border-b border-secondary-100 last:border-b-0 flex items-center justify-between">
      <div className="flex items-center space-x-2 min-w-0 flex-1">
        <StatusIcon
          className={clsx(
            'w-4 h-4 flex-shrink-0',
            statusConfig.color,
            isProcessing && 'animate-spin'
          )}
        />
        <span className="text-sm text-secondary-700 truncate">
          {document.original_filename}
        </span>
      </div>
      <div className="flex items-center space-x-2">
        {document.total_time_ms && document.status === 'completed' && (
          <span className="text-xs text-secondary-400">
            {(document.total_time_ms / 1000).toFixed(1)}s
          </span>
        )}
        <span
          className={clsx(
            'px-1.5 py-0.5 text-xs rounded',
            statusConfig.color,
            document.status === 'completed'
              ? 'bg-success-50'
              : document.status === 'failed'
              ? 'bg-error-50'
              : 'bg-secondary-100'
          )}
        >
          {statusConfig.label}
        </span>
      </div>
      {document.error_message && (
        <div className="w-full mt-1 ml-6">
          <p className="text-xs text-error-600 truncate" title={document.error_message}>
            {document.error_message}
          </p>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Export utilities
// =============================================================================

export type { BulkUploadProgressProps };
