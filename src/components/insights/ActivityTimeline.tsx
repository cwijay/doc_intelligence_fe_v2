'use client';

import { ActivityItem } from '@/types/insights';
import {
  DocumentTextIcon,
  SparklesIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  DocumentDuplicateIcon,
  ChatBubbleBottomCenterTextIcon,
  QuestionMarkCircleIcon,
  DocumentCheckIcon,
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

interface ActivityTimelineProps {
  activities: ActivityItem[];
  showLoadMore?: boolean;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
}

export function ActivityTimeline({
  activities,
  showLoadMore,
  onLoadMore,
  isLoadingMore,
}: ActivityTimelineProps) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-12">
        <ClockIcon className="w-12 h-12 mx-auto text-secondary-300 dark:text-secondary-600" />
        <p className="mt-4 text-secondary-500 dark:text-secondary-400">
          No activity recorded yet
        </p>
        <p className="text-sm text-secondary-400 dark:text-secondary-500">
          Activity will appear here as documents are processed
        </p>
      </div>
    );
  }

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {activities.map((activity, index) => (
          <li key={activity.id}>
            <div className="relative pb-8">
              {/* Connecting line */}
              {index !== activities.length - 1 && (
                <span
                  className="absolute left-5 top-10 -ml-px h-full w-0.5 bg-secondary-200 dark:bg-secondary-700"
                  aria-hidden="true"
                />
              )}
              <div className="relative flex items-start space-x-3">
                {/* Icon */}
                <div className={clsx(
                  'relative flex h-10 w-10 items-center justify-center rounded-full',
                  getIconBackground(activity.status_color || activity.event_type)
                )}>
                  {getActivityIcon(activity.icon || activity.event_type)}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                      {activity.title}
                    </p>
                    {activity.status && (
                      <span className={clsx(
                        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                        getStatusBadgeColor(activity.status_color || activity.status)
                      )}>
                        {activity.status}
                      </span>
                    )}
                  </div>

                  {activity.description && (
                    <p className="mt-0.5 text-sm text-secondary-500 dark:text-secondary-400">
                      {activity.description}
                    </p>
                  )}

                  <div className="mt-1 flex items-center gap-3 text-xs text-secondary-400 dark:text-secondary-500">
                    <span title={activity.timestamp}>
                      {activity.timestamp_ago}
                    </span>
                    {activity.file_name && (
                      <span className="flex items-center gap-1">
                        <DocumentTextIcon className="w-3 h-3" />
                        <span className="truncate max-w-[200px]" title={activity.file_name}>
                          {activity.file_name}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* Load More Button */}
      {showLoadMore && (
        <div className="mt-6 text-center">
          <button
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className={clsx(
              'inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors',
              'text-primary-600 dark:text-primary-400',
              'hover:bg-primary-50 dark:hover:bg-primary-900/20',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {isLoadingMore ? (
              <>
                <ArrowPathIcon className="w-4 h-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                Load more activity
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

// Helper to get icon based on event type or icon hint
function getActivityIcon(iconOrType: string): React.ReactNode {
  const iconClass = 'w-5 h-5 text-white';

  // Map icon names from API to actual icons
  const iconMap: Record<string, React.ReactNode> = {
    // Icon names from backend
    'file-text': <DocumentTextIcon className={iconClass} />,
    'sparkles': <SparklesIcon className={iconClass} />,
    'help-circle': <QuestionMarkCircleIcon className={iconClass} />,
    'message-circle': <ChatBubbleBottomCenterTextIcon className={iconClass} />,
    'search': <MagnifyingGlassIcon className={iconClass} />,
    'check-circle': <CheckCircleIcon className={iconClass} />,
    'alert-circle': <ExclamationCircleIcon className={iconClass} />,
    'file-check': <DocumentCheckIcon className={iconClass} />,
    'copy': <DocumentDuplicateIcon className={iconClass} />,
    'clock': <ClockIcon className={iconClass} />,

    // Event types fallback
    'document_loaded': <DocumentTextIcon className={iconClass} />,
    'parse_started': <ArrowPathIcon className={iconClass} />,
    'parse_completed': <DocumentCheckIcon className={iconClass} />,
    'summary_generated': <SparklesIcon className={iconClass} />,
    'faqs_generated': <ChatBubbleBottomCenterTextIcon className={iconClass} />,
    'questions_generated': <QuestionMarkCircleIcon className={iconClass} />,
    'content_generated': <SparklesIcon className={iconClass} />,
    'generation_started': <ArrowPathIcon className={iconClass} />,
    'generation_completed': <CheckCircleIcon className={iconClass} />,
    'generation_cache_hit': <DocumentDuplicateIcon className={iconClass} />,
    'cache_hit': <DocumentDuplicateIcon className={iconClass} />,
    'document_agent_query': <MagnifyingGlassIcon className={iconClass} />,
    'error': <ExclamationCircleIcon className={iconClass} />,
  };

  return iconMap[iconOrType] || <DocumentTextIcon className={iconClass} />;
}

// Helper to get icon background color
function getIconBackground(colorOrType: string): string {
  const colorMap: Record<string, string> = {
    // Color names from API
    'green': 'bg-green-500',
    'blue': 'bg-blue-500',
    'purple': 'bg-purple-500',
    'yellow': 'bg-yellow-500',
    'orange': 'bg-orange-500',
    'red': 'bg-red-500',
    'gray': 'bg-secondary-500',

    // Event types fallback
    'document_loaded': 'bg-blue-500',
    'parse_started': 'bg-yellow-500',
    'parse_completed': 'bg-green-500',
    'summary_generated': 'bg-purple-500',
    'faqs_generated': 'bg-purple-500',
    'questions_generated': 'bg-purple-500',
    'content_generated': 'bg-purple-500',
    'generation_started': 'bg-yellow-500',
    'generation_completed': 'bg-green-500',
    'generation_cache_hit': 'bg-blue-500',
    'cache_hit': 'bg-blue-500',
    'document_agent_query': 'bg-blue-500',
    'error': 'bg-red-500',
  };

  return colorMap[colorOrType] || 'bg-secondary-500';
}

// Helper to get status badge color
function getStatusBadgeColor(status: string): string {
  const colorMap: Record<string, string> = {
    'green': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    'blue': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    'yellow': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    'orange': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    'red': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    'completed': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    'processing': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    'pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    'failed': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  };

  return colorMap[status.toLowerCase()] || 'bg-secondary-100 text-secondary-800 dark:bg-secondary-700 dark:text-secondary-300';
}

// Skeleton Loading Component
export function ActivityTimelineSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-start gap-3">
          <div className="w-10 h-10 bg-secondary-200 dark:bg-secondary-700 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-3/4" />
            <div className="h-3 bg-secondary-200 dark:bg-secondary-700 rounded w-1/2" />
            <div className="h-3 bg-secondary-200 dark:bg-secondary-700 rounded w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}
