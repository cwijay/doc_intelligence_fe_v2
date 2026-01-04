'use client';

import { useState } from 'react';
import { useUsageDashboard } from '@/hooks/useUsageHistory';
import { UsagePeriod, USAGE_PERIODS } from '@/types/usage';
import { UsageTrendsChart, UsageBreakdownChart } from '@/components/charts';
import { UsageOverviewCard } from './UsageOverviewCard';
import { QuotaProgressBar } from './QuotaProgressBar';
import { SubscriptionCard } from './SubscriptionCard';
import { CostSummaryCard } from './CostSummaryCard';
import { QuotaWarningBanner } from './QuotaWarningBanner';
import {
  CpuChipIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  CircleStackIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

export function UsageDashboard() {
  console.log('📊 UsageDashboard: Component rendering');
  const [period, setPeriod] = useState<UsagePeriod>('7d');

  console.log('📊 UsageDashboard: Calling useUsageDashboard hook');
  const { summary, subscription, limits, history, breakdown, isLoading, isError } =
    useUsageDashboard(period);

  console.log('📊 UsageDashboard: Hook returned', { isLoading, isError, hasSummary: !!summary.data });

  // Loading skeleton
  if (isLoading) {
    return <UsageDashboardSkeleton />;
  }

  // Error state
  if (isError) {
    return (
      <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-8 text-center">
        <p className="text-red-800 dark:text-red-200 font-medium">
          Failed to load usage data
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
    );
  }

  const summaryData = summary.data;
  const subscriptionData = subscription.data;
  const limitsData = limits.data;
  const historyData = history.data;
  const breakdownData = breakdown.data;

  // Helper to determine card variant based on quota status
  const getCardVariant = (resource: string): 'default' | 'warning' | 'danger' => {
    if (limitsData?.exceeded?.includes(resource)) return 'danger';
    if (limitsData?.approaching_limit?.includes(resource)) return 'warning';
    return 'default';
  };

  return (
    <div className="space-y-6">
      {/* Warning Banners */}
      {limitsData && (
        <QuotaWarningBanner
          approaching={limitsData.approaching_limit || []}
          exceeded={limitsData.exceeded || []}
        />
      )}

      {/* Overview Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <UsageOverviewCard
          title="Tokens Used"
          value={summaryData?.tokens_used || 0}
          subtitle={`${(summaryData?.tokens_percentage || 0).toFixed(1)}% of limit`}
          icon={<CpuChipIcon className="w-6 h-6" />}
          variant={getCardVariant('tokens')}
        />
        <UsageOverviewCard
          title="Parse Pages"
          value={summaryData?.llamaparse_pages_used || 0}
          subtitle={`${(summaryData?.llamaparse_pages_percentage || 0).toFixed(1)}% of limit`}
          icon={<DocumentTextIcon className="w-6 h-6" />}
          variant={getCardVariant('llamaparse_pages')}
        />
        <UsageOverviewCard
          title="Search Queries"
          value={summaryData?.file_search_queries_used || 0}
          subtitle={`${(summaryData?.file_search_queries_percentage || 0).toFixed(1)}% of limit`}
          icon={<MagnifyingGlassIcon className="w-6 h-6" />}
          variant={getCardVariant('file_search_queries')}
        />
        <UsageOverviewCard
          title="Storage"
          value={`${(summaryData?.storage_used_gb || 0).toFixed(2)} GB`}
          subtitle={`${(summaryData?.storage_percentage || 0).toFixed(1)}% of limit`}
          icon={<CircleStackIcon className="w-6 h-6" />}
          variant={getCardVariant('storage')}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Usage Trends */}
          <div className="rounded-xl border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 overflow-hidden">
            <div className="p-4 border-b border-secondary-100 dark:border-secondary-700 flex items-center justify-between">
              <h3 className="font-semibold text-secondary-900 dark:text-secondary-100">
                Usage Trends
              </h3>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as UsagePeriod)}
                className="px-3 py-1.5 text-sm border border-secondary-200 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {USAGE_PERIODS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="p-4">
              {historyData?.history && historyData.history.length > 0 ? (
                <UsageTrendsChart data={historyData.history} height={320} />
              ) : (
                <div className="h-[320px] flex items-center justify-center text-secondary-500 dark:text-secondary-400">
                  No usage data for this period
                </div>
              )}
            </div>
          </div>

          {/* Quota Progress Bars */}
          <div className="rounded-xl border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 overflow-hidden">
            <div className="p-4 border-b border-secondary-100 dark:border-secondary-700">
              <h3 className="font-semibold text-secondary-900 dark:text-secondary-100">
                Quota Status
              </h3>
            </div>
            <div className="p-4 space-y-6">
              <QuotaProgressBar
                label="API Tokens"
                used={summaryData?.tokens_used || 0}
                limit={summaryData?.tokens_limit || 1}
                percentage={summaryData?.tokens_percentage || 0}
                showWarning={limitsData?.approaching_limit?.includes('tokens')}
                isExceeded={limitsData?.exceeded?.includes('tokens')}
              />
              <QuotaProgressBar
                label="Document Parse Pages"
                used={summaryData?.llamaparse_pages_used || 0}
                limit={summaryData?.llamaparse_pages_limit || 1}
                percentage={summaryData?.llamaparse_pages_percentage || 0}
                showWarning={limitsData?.approaching_limit?.includes('llamaparse_pages')}
                isExceeded={limitsData?.exceeded?.includes('llamaparse_pages')}
              />
              <QuotaProgressBar
                label="File Search Queries"
                used={summaryData?.file_search_queries_used || 0}
                limit={summaryData?.file_search_queries_limit || 1}
                percentage={summaryData?.file_search_queries_percentage || 0}
                showWarning={limitsData?.approaching_limit?.includes('file_search_queries')}
                isExceeded={limitsData?.exceeded?.includes('file_search_queries')}
              />
              <QuotaProgressBar
                label="Storage"
                used={summaryData?.storage_used_gb || 0}
                limit={summaryData?.storage_limit_gb || 1}
                percentage={summaryData?.storage_percentage || 0}
                unit="GB"
                formatValue={(v) => v.toFixed(2)}
                showWarning={limitsData?.approaching_limit?.includes('storage')}
                isExceeded={limitsData?.exceeded?.includes('storage')}
              />
            </div>
          </div>
        </div>

        {/* Right Column - Sidebar Cards */}
        <div className="space-y-6">
          {/* Subscription Card */}
          {subscriptionData && <SubscriptionCard subscription={subscriptionData} />}

          {/* Cost Summary Card */}
          <CostSummaryCard
            totalCost={historyData?.total_cost_usd || 0}
            periodLabel={`Last ${period}`}
            breakdown={breakdownData?.feature_breakdown?.map((f) => ({
              name: f.name,
              cost: f.cost_usd,
            }))}
          />

          {/* Feature Breakdown Pie Chart */}
          {breakdownData?.feature_breakdown && breakdownData.feature_breakdown.length > 0 && (
            <div className="rounded-xl border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 overflow-hidden">
              <div className="p-4 border-b border-secondary-100 dark:border-secondary-700">
                <h3 className="font-semibold text-secondary-900 dark:text-secondary-100">
                  Usage by Feature
                </h3>
              </div>
              <div className="p-4">
                <UsageBreakdownChart data={breakdownData.feature_breakdown} height={260} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Last Updated Indicator */}
      <div className="text-center text-xs text-secondary-500 dark:text-secondary-400">
        Auto-refreshes every 30 seconds
      </div>
    </div>
  );
}

// Skeleton loading component
function UsageDashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-28 bg-secondary-200 dark:bg-secondary-700 rounded-xl"
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="h-96 bg-secondary-200 dark:bg-secondary-700 rounded-xl" />
          <div className="h-72 bg-secondary-200 dark:bg-secondary-700 rounded-xl" />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <div className="h-64 bg-secondary-200 dark:bg-secondary-700 rounded-xl" />
          <div className="h-48 bg-secondary-200 dark:bg-secondary-700 rounded-xl" />
          <div className="h-72 bg-secondary-200 dark:bg-secondary-700 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
