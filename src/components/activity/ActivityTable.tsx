'use client';

import React from 'react';
import { ActivityItem } from '@/types/insights';
import {
  ClockIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import { getActivityIcon, getIconBackground, getStatusBadgeColor } from './helpers';

interface ActivityTableProps {
  activities: ActivityItem[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
  onPageChange?: (offset: number) => void;
  isLoading?: boolean;
}

export function ActivityTable({
  activities,
  total,
  limit,
  offset,
  hasMore,
  onPageChange,
  isLoading,
}: ActivityTableProps) {
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-secondary-200 dark:divide-secondary-700">
          <thead className="bg-secondary-50 dark:bg-secondary-800">
            <tr>
              <th className="w-12 px-3 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                Activity
              </th>
              <th className="w-44 px-4 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                File
              </th>
              <th className="w-24 px-4 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                Status
              </th>
              <th className="w-24 px-4 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                Time
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-secondary-800 divide-y divide-secondary-200 dark:divide-secondary-700">
            {isLoading ? (
              // Loading skeleton rows
              [...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-3 py-3">
                    <div className="h-7 w-7 bg-secondary-200 dark:bg-secondary-700 rounded-full" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1.5">
                      <div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-48" />
                      <div className="h-3 bg-secondary-200 dark:bg-secondary-700 rounded w-64" />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-32" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-5 bg-secondary-200 dark:bg-secondary-700 rounded w-16" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-14" />
                  </td>
                </tr>
              ))
            ) : activities.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center">
                  <ClockIcon className="w-10 h-10 mx-auto text-secondary-300 dark:text-secondary-600" />
                  <p className="mt-3 text-secondary-500 dark:text-secondary-400">
                    No activities found
                  </p>
                </td>
              </tr>
            ) : (
              activities.map((activity) => (
                <tr
                  key={activity.id}
                  className="hover:bg-secondary-50 dark:hover:bg-secondary-700/50 transition-colors"
                >
                  {/* Type Icon */}
                  <td className="px-3 py-3">
                    <div className={clsx(
                      'flex h-7 w-7 items-center justify-center rounded-full',
                      getIconBackground(activity.status_color || activity.event_type)
                    )}>
                      {getActivityIcon(activity.icon || activity.event_type)}
                    </div>
                  </td>

                  {/* Activity (Title + Description) */}
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                        {activity.title}
                      </p>
                      {activity.description && (
                        <p className="text-xs text-secondary-500 dark:text-secondary-400 truncate max-w-xs">
                          {activity.description}
                        </p>
                      )}
                    </div>
                  </td>

                  {/* File */}
                  <td className="px-4 py-3">
                    {activity.file_name ? (
                      <span
                        className="flex items-center gap-1 text-sm text-secondary-600 dark:text-secondary-400 truncate max-w-[160px]"
                        title={activity.file_name}
                      >
                        <DocumentTextIcon className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{activity.file_name}</span>
                      </span>
                    ) : (
                      <span className="text-sm text-secondary-400">-</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    {activity.status ? (
                      <span className={clsx(
                        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                        getStatusBadgeColor(activity.status_color || activity.status)
                      )}>
                        {activity.status}
                      </span>
                    ) : (
                      <span className="text-sm text-secondary-400">-</span>
                    )}
                  </td>

                  {/* Time */}
                  <td className="px-4 py-3">
                    <span
                      className="text-sm text-secondary-500 dark:text-secondary-400"
                      title={activity.timestamp}
                    >
                      {activity.timestamp_ago}
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

export function ActivityTableSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-64 bg-secondary-200 dark:bg-secondary-700 rounded-xl" />
    </div>
  );
}
