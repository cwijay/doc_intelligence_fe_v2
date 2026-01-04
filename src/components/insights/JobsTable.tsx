'use client';

import { ProcessingJob, JobStatus, JOB_STATUSES } from '@/types/insights';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

interface JobsTableProps {
  jobs: ProcessingJob[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
  status?: JobStatus;
  onStatusChange?: (status: JobStatus) => void;
  onPageChange?: (offset: number) => void;
  isLoading?: boolean;
}

export function JobsTable({
  jobs,
  total,
  limit,
  offset,
  hasMore,
  status = '',
  onStatusChange,
  onPageChange,
  isLoading,
}: JobsTableProps) {
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (ms?: number): string => {
    if (!ms) return '-';
    if (ms < 1000) return `${Math.round(ms)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.round(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
  };

  return (
    <div>
      {/* Filters */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="text-sm text-secondary-600 dark:text-secondary-400">
            Status:
          </label>
          <select
            value={status}
            onChange={(e) => onStatusChange?.(e.target.value as JobStatus)}
            className="px-3 py-1.5 text-sm border border-secondary-200 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {JOB_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <p className="text-sm text-secondary-500 dark:text-secondary-400">
          {total} total jobs
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-secondary-200 dark:divide-secondary-700">
          <thead className="bg-secondary-50 dark:bg-secondary-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                File
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                Model
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                Duration
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                Started
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-secondary-800 divide-y divide-secondary-200 dark:divide-secondary-700">
            {isLoading ? (
              // Loading skeleton rows
              [...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-4 py-4">
                    <div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-40" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-20" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-24" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-16" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-28" />
                  </td>
                </tr>
              ))
            ) : jobs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center">
                  <ClockIcon className="w-10 h-10 mx-auto text-secondary-300 dark:text-secondary-600" />
                  <p className="mt-3 text-secondary-500 dark:text-secondary-400">
                    No jobs found
                  </p>
                </td>
              </tr>
            ) : (
              jobs.map((job) => (
                <tr
                  key={job.id}
                  className="hover:bg-secondary-50 dark:hover:bg-secondary-700/50 transition-colors"
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center">
                      <span
                        className="text-sm font-medium text-secondary-900 dark:text-secondary-100 truncate max-w-[250px]"
                        title={job.file_name}
                      >
                        {job.file_name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge status={job.status} />
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-secondary-600 dark:text-secondary-400">
                      {job.model}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-secondary-600 dark:text-secondary-400">
                      {job.duration_formatted || formatDuration(job.duration_ms)}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-secondary-500 dark:text-secondary-400">
                      {formatDate(job.started_at)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-secondary-500 dark:text-secondary-400">
            Showing {offset + 1} - {Math.min(offset + limit, total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange?.(Math.max(0, offset - limit))}
              disabled={offset === 0}
              className={clsx(
                'p-2 rounded-lg transition-colors',
                'text-secondary-600 dark:text-secondary-400',
                'hover:bg-secondary-100 dark:hover:bg-secondary-700',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <span className="text-sm text-secondary-600 dark:text-secondary-400">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => onPageChange?.(offset + limit)}
              disabled={!hasMore}
              className={clsx(
                'p-2 rounded-lg transition-colors',
                'text-secondary-600 dark:text-secondary-400',
                'hover:bg-secondary-100 dark:hover:bg-secondary-700',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const getStatusConfig = (status: string) => {
    const configs: Record<string, { icon: React.ReactNode; className: string }> = {
      completed: {
        icon: <CheckCircleIcon className="w-4 h-4" />,
        className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      },
      processing: {
        icon: <ArrowPathIcon className="w-4 h-4 animate-spin" />,
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      },
      pending: {
        icon: <ClockIcon className="w-4 h-4" />,
        className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      },
      failed: {
        icon: <ExclamationCircleIcon className="w-4 h-4" />,
        className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      },
    };

    return configs[status.toLowerCase()] || {
      icon: <ClockIcon className="w-4 h-4" />,
      className: 'bg-secondary-100 text-secondary-800 dark:bg-secondary-700 dark:text-secondary-300',
    };
  };

  const config = getStatusConfig(status);

  return (
    <span className={clsx(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
      config.className
    )}>
      {config.icon}
      <span className="capitalize">{status}</span>
    </span>
  );
}

// Skeleton Loading Component
export function JobsTableSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="mb-4 flex items-center justify-between">
        <div className="h-8 bg-secondary-200 dark:bg-secondary-700 rounded w-40" />
        <div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-24" />
      </div>
      <div className="h-64 bg-secondary-200 dark:bg-secondary-700 rounded-xl" />
    </div>
  );
}
