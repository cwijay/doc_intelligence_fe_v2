'use client';

import React from 'react';
import { ActivityItem } from '@/types/insights';
import { ClockIcon } from '@heroicons/react/24/outline';
import { ActivityCard, ActivityCardSkeleton } from './ActivityCard';

interface ActivityCardsGridProps {
  activities: ActivityItem[];
  maxItems?: number;
  isLoading?: boolean;
}

export function ActivityCardsGrid({
  activities,
  maxItems = 10,
  isLoading = false,
}: ActivityCardsGridProps) {
  // Limit to maxItems
  const displayedActivities = activities.slice(0, maxItems);

  if (isLoading) {
    return <ActivityCardsGridSkeleton count={6} />;
  }

  if (displayedActivities.length === 0) {
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {displayedActivities.map((activity, index) => (
        <ActivityCard
          key={activity.id}
          activity={activity}
          index={index}
        />
      ))}
    </div>
  );
}

interface ActivityCardsGridSkeletonProps {
  count?: number;
}

export function ActivityCardsGridSkeleton({ count = 6 }: ActivityCardsGridSkeletonProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(count)].map((_, i) => (
        <ActivityCardSkeleton key={i} />
      ))}
    </div>
  );
}
