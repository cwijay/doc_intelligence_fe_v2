'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useInsightsData, useActivityTimeline, useProcessingJobs } from '@/hooks/useInsights';
import { InsightsPeriod, INSIGHTS_PERIODS, JobStatus, ActivityQueryParams, JobsQueryParams } from '@/types/insights';
import { InsightsDashboard, InsightsDashboardSkeleton } from './InsightsDashboard';
import { ActivityTimeline, ActivityTimelineSkeleton } from './ActivityTimeline';
import { JobsTable, JobsTableSkeleton } from './JobsTable';
import Navbar from '@/components/layout/Navbar';
import {
  ChartBarIcon,
  ClockIcon,
  CpuChipIcon,
  ArrowPathIcon,
  LightBulbIcon,
  HomeIcon,
  ChevronLeftIcon,
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

type TabId = 'overview' | 'activity' | 'jobs';

interface Tab {
  id: TabId;
  name: string;
  icon: React.ReactNode;
}

const TABS: Tab[] = [
  { id: 'overview', name: 'Overview', icon: <ChartBarIcon className="w-4 h-4" /> },
  { id: 'activity', name: 'Activity', icon: <ClockIcon className="w-4 h-4" /> },
  { id: 'jobs', name: 'Jobs', icon: <CpuChipIcon className="w-4 h-4" /> },
];

export function InsightsPage() {
  console.log('📊 InsightsPage: Component rendering');

  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [period, setPeriod] = useState<InsightsPeriod>('7d');

  // Activity pagination state
  const [activityParams, setActivityParams] = useState<ActivityQueryParams>({
    limit: 20,
    offset: 0,
  });

  // Jobs filter and pagination state
  const [jobsParams, setJobsParams] = useState<JobsQueryParams>({
    limit: 10,
    offset: 0,
    status: '',
  });

  // Fetch data based on active tab
  const { dashboard, isLoading: isDashboardLoading, isError: isDashboardError } = useInsightsData(period);
  const activity = useActivityTimeline(activityParams, activeTab === 'activity');
  const jobs = useProcessingJobs(jobsParams, activeTab === 'jobs');

  console.log('📊 InsightsPage: Data loaded', {
    activeTab,
    period,
    isDashboardLoading,
    hasStats: !!dashboard.data?.stats,
  });

  // Error state
  if (isDashboardError && activeTab === 'overview') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f5f5f5] via-[#f0fafa] to-[#fef6f3] dark:from-brand-navy-500 dark:via-brand-navy-600 dark:to-brand-navy-700">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Breadcrumb Navigation */}
            <nav className="flex items-center space-x-2 text-sm text-secondary-600 dark:text-secondary-400 mb-6">
              <Link
                href="/dashboard"
                className="flex items-center space-x-1 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200"
              >
                <HomeIcon className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>
              <ChevronLeftIcon className="w-4 h-4 rotate-180" />
              <span className="text-secondary-900 dark:text-secondary-100 font-medium">Insights</span>
            </nav>

            <PageHeader period={period} onPeriodChange={setPeriod} />
            <div className="mt-8 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-8 text-center">
              <p className="text-red-800 dark:text-red-200 font-medium">
                Failed to load insights data
              </p>
              <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                Please try refreshing the page or contact support if the issue persists.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2"
              >
                <ArrowPathIcon className="w-4 h-4" />
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f5f5] via-[#f0fafa] to-[#fef6f3] dark:from-brand-navy-500 dark:via-brand-navy-600 dark:to-brand-navy-700">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center space-x-2 text-sm text-secondary-600 dark:text-secondary-400 mb-6">
            <Link
              href="/dashboard"
              className="flex items-center space-x-1 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200"
            >
              <HomeIcon className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>
            <ChevronLeftIcon className="w-4 h-4 rotate-180" />
            <span className="text-secondary-900 dark:text-secondary-100 font-medium">Insights</span>
          </nav>

          {/* Page Header */}
          <PageHeader period={period} onPeriodChange={setPeriod} />

          {/* Tabs */}
          <div className="mt-6 border-b border-secondary-200 dark:border-secondary-700">
            <nav className="-mb-px flex space-x-8">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={clsx(
                    'flex items-center gap-2 py-4 px-1 border-b-2 text-sm font-medium transition-colors',
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-secondary-500 dark:text-secondary-400 hover:text-secondary-700 dark:hover:text-secondary-300 hover:border-secondary-300 dark:hover:border-secondary-600'
                  )}
                >
                  {tab.icon}
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="mt-6">
            {activeTab === 'overview' && (
              isDashboardLoading ? (
                <InsightsDashboardSkeleton />
              ) : dashboard.data?.stats ? (
                <InsightsDashboard stats={dashboard.data.stats} />
              ) : (
                <EmptyState message="No insights data available yet" />
              )
            )}

            {activeTab === 'activity' && (
              <div className="rounded-xl border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 overflow-hidden">
                <div className="p-4 border-b border-secondary-100 dark:border-secondary-700">
                  <h3 className="font-semibold text-secondary-900 dark:text-secondary-100">
                    Recent Activity
                  </h3>
                  <p className="text-sm text-secondary-500 dark:text-secondary-400 mt-1">
                    Document processing events and content generation activity
                  </p>
                </div>
                <div className="p-4">
                  {activity.isLoading ? (
                    <ActivityTimelineSkeleton />
                  ) : activity.data?.activities ? (
                    <ActivityTimeline
                      activities={activity.data.activities}
                      showLoadMore={activity.data.has_more}
                      onLoadMore={() => {
                        setActivityParams((prev) => ({
                          ...prev,
                          offset: (prev.offset || 0) + (prev.limit || 20),
                        }));
                      }}
                      isLoadingMore={activity.isFetching && !activity.isLoading}
                    />
                  ) : (
                    <EmptyState message="No activity recorded yet" />
                  )}
                </div>
              </div>
            )}

            {activeTab === 'jobs' && (
              <div className="rounded-xl border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 overflow-hidden">
                <div className="p-4 border-b border-secondary-100 dark:border-secondary-700">
                  <h3 className="font-semibold text-secondary-900 dark:text-secondary-100">
                    Processing Jobs
                  </h3>
                  <p className="text-sm text-secondary-500 dark:text-secondary-400 mt-1">
                    Document processing jobs and their current status
                  </p>
                </div>
                <div className="p-4">
                  {jobs.isLoading ? (
                    <JobsTableSkeleton />
                  ) : jobs.data ? (
                    <JobsTable
                      jobs={jobs.data.jobs}
                      total={jobs.data.total}
                      limit={jobs.data.limit}
                      offset={jobs.data.offset}
                      hasMore={jobs.data.has_more}
                      status={jobsParams.status}
                      onStatusChange={(status) => {
                        setJobsParams((prev) => ({
                          ...prev,
                          status,
                          offset: 0, // Reset to first page on filter change
                        }));
                      }}
                      onPageChange={(offset) => {
                        setJobsParams((prev) => ({
                          ...prev,
                          offset,
                        }));
                      }}
                      isLoading={jobs.isFetching && !jobs.isLoading}
                    />
                  ) : (
                    <EmptyState message="No jobs found" />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Auto-refresh indicator */}
          <div className="mt-6 text-center text-xs text-secondary-500 dark:text-secondary-400">
            Auto-refreshes every 30 seconds
          </div>
        </div>
      </div>
    </div>
  );
}

// Page Header Component
interface PageHeaderProps {
  period: InsightsPeriod;
  onPeriodChange: (period: InsightsPeriod) => void;
}

function PageHeader({ period, onPeriodChange }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
            <LightBulbIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
              Insights
            </h1>
            <p className="text-secondary-500 dark:text-secondary-400 text-sm">
              Monitor document processing activity and performance
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <label className="text-sm text-secondary-600 dark:text-secondary-400">
          Period:
        </label>
        <select
          value={period}
          onChange={(e) => onPeriodChange(e.target.value as InsightsPeriod)}
          className="px-3 py-1.5 text-sm border border-secondary-200 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {INSIGHTS_PERIODS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

// Empty State Component
function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-12">
      <LightBulbIcon className="w-12 h-12 mx-auto text-secondary-300 dark:text-secondary-600" />
      <p className="mt-4 text-secondary-500 dark:text-secondary-400">
        {message}
      </p>
      <p className="text-sm text-secondary-400 dark:text-secondary-500">
        Start processing documents to see insights
      </p>
    </div>
  );
}

export default InsightsPage;
