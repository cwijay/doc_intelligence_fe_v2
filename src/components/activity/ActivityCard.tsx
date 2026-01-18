'use client';

import React from 'react';
import { ActivityItem } from '@/types/insights';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import { getActivityIcon, getIconBackground, getStatusBadgeColor } from './helpers';

interface ActivityCardProps {
  activity: ActivityItem;
  index?: number;
}

export function ActivityCard({ activity, index = 0 }: ActivityCardProps) {
  return (
    <div
      className={clsx(
        'rounded-xl border p-4 transition-all duration-200',
        'bg-white dark:bg-secondary-800',
        'border-secondary-200 dark:border-secondary-700',
        'hover:shadow-soft dark:hover:shadow-dark-soft',
        'hover:border-secondary-300 dark:hover:border-secondary-600'
      )}
      style={{
        animationDelay: `${index * 0.05}s`,
      }}
    >
      {/* Header Row: Icon + Title + Status */}
      <div className="flex items-start justify-between gap-3">
        {/* Icon */}
        <div className={clsx(
          'flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-full',
          getIconBackground(activity.status_color || activity.event_type)
        )}>
          {getActivityIcon(activity.icon || activity.event_type)}
        </div>

        {/* Title and Status */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-medium text-secondary-900 dark:text-secondary-100 truncate">
              {activity.title}
            </h4>
            {activity.status && (
              <span className={clsx(
                'flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                getStatusBadgeColor(activity.status_color || activity.status)
              )}>
                {activity.status}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Description (truncated 2 lines) */}
      {activity.description && (
        <p className="mt-2 text-sm text-secondary-500 dark:text-secondary-400 line-clamp-2">
          {activity.description}
        </p>
      )}

      {/* Footer: File + Timestamp */}
      <div className="mt-3 pt-3 border-t border-secondary-100 dark:border-secondary-700 flex items-center justify-between text-xs text-secondary-400 dark:text-secondary-500">
        {activity.file_name ? (
          <span className="flex items-center gap-1 truncate max-w-[60%]" title={activity.file_name}>
            <DocumentTextIcon className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{activity.file_name}</span>
          </span>
        ) : (
          <span />
        )}
        <span className="flex-shrink-0" title={activity.timestamp}>
          {activity.timestamp_ago}
        </span>
      </div>
    </div>
  );
}

export function ActivityCardSkeleton() {
  return (
    <div className={clsx(
      'rounded-xl border p-4 animate-pulse',
      'bg-white dark:bg-secondary-800',
      'border-secondary-200 dark:border-secondary-700'
    )}>
      {/* Header skeleton */}
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 bg-secondary-200 dark:bg-secondary-700 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-3/4" />
            <div className="h-5 bg-secondary-200 dark:bg-secondary-700 rounded w-16" />
          </div>
        </div>
      </div>

      {/* Description skeleton */}
      <div className="mt-3 space-y-1.5">
        <div className="h-3 bg-secondary-200 dark:bg-secondary-700 rounded w-full" />
        <div className="h-3 bg-secondary-200 dark:bg-secondary-700 rounded w-4/5" />
      </div>

      {/* Footer skeleton */}
      <div className="mt-3 pt-3 border-t border-secondary-100 dark:border-secondary-700 flex items-center justify-between">
        <div className="h-3 bg-secondary-200 dark:bg-secondary-700 rounded w-32" />
        <div className="h-3 bg-secondary-200 dark:bg-secondary-700 rounded w-16" />
      </div>
    </div>
  );
}
