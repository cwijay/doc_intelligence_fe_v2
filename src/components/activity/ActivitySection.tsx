'use client';

import React, { useState, useCallback } from 'react';
import { ActivityItem } from '@/types/insights';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import { ActivityCardsGrid, ActivityCardsGridSkeleton } from './ActivityCardsGrid';
import { ActivityTable } from './ActivityTable';

const CARDS_LIMIT = 10;
const TABLE_PAGE_SIZE = 20;

interface ActivitySectionProps {
  activities: ActivityItem[];
  total: number;
  hasMore: boolean;
  isLoading?: boolean;
}

export function ActivitySection({
  activities,
  total,
  hasMore,
  isLoading = false,
}: ActivitySectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [tableOffset, setTableOffset] = useState(0);

  // Check if there are more activities beyond the cards limit
  const showSeeMore = total > CARDS_LIMIT || hasMore;
  const remainingCount = total > CARDS_LIMIT ? total - CARDS_LIMIT : 0;

  // Handle page change in table view
  const handlePageChange = useCallback((newOffset: number) => {
    setTableOffset(newOffset);
  }, []);

  // Handle toggle between cards and table
  const handleToggle = useCallback(() => {
    setIsExpanded(prev => !prev);
    // Reset table offset when collapsing
    if (isExpanded) {
      setTableOffset(0);
    }
  }, [isExpanded]);

  // Show loading state
  if (isLoading) {
    return <ActivityCardsGridSkeleton count={6} />;
  }

  // Empty state
  if (activities.length === 0) {
    return (
      <ActivityCardsGrid activities={[]} isLoading={false} />
    );
  }

  return (
    <div className="transition-all duration-300">
      {/* Cards View (default) */}
      {!isExpanded && (
        <div className="animate-fade-in">
          <ActivityCardsGrid
            activities={activities}
            maxItems={CARDS_LIMIT}
            isLoading={isLoading}
          />
        </div>
      )}

      {/* Table View (expanded) */}
      {isExpanded && (
        <div className="animate-fade-in">
          <ActivityTable
            activities={activities}
            total={total}
            limit={TABLE_PAGE_SIZE}
            offset={tableOffset}
            hasMore={tableOffset + TABLE_PAGE_SIZE < total}
            onPageChange={handlePageChange}
            isLoading={isLoading}
          />
        </div>
      )}

      {/* See More / Show Less Button */}
      {showSeeMore && (
        <button
          onClick={handleToggle}
          className={clsx(
            'w-full mt-4 py-2.5 text-sm font-medium rounded-lg transition-colors',
            'flex items-center justify-center gap-2',
            'text-primary-600 dark:text-primary-400',
            'bg-primary-50 dark:bg-primary-900/20',
            'hover:bg-primary-100 dark:hover:bg-primary-900/30',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-secondary-800'
          )}
        >
          {isExpanded ? (
            <>
              <ChevronUpIcon className="w-4 h-4" />
              Show Less
            </>
          ) : (
            <>
              <ChevronDownIcon className="w-4 h-4" />
              {remainingCount > 0 ? `See More (${remainingCount} more)` : 'See More'}
            </>
          )}
        </button>
      )}
    </div>
  );
}

export function ActivitySectionSkeleton() {
  return <ActivityCardsGridSkeleton count={6} />;
}
