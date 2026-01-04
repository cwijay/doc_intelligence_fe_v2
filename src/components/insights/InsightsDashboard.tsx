'use client';

import { InsightsDashboardStats } from '@/types/insights';
import {
  DocumentTextIcon,
  CpuChipIcon,
  SparklesIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

interface InsightsDashboardProps {
  stats: InsightsDashboardStats;
}

export function InsightsDashboard({ stats }: InsightsDashboardProps) {
  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.round(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
  };

  const formatPercentage = (rate: number): string => {
    return `${(rate * 100).toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Documents */}
        <StatsCard
          title="Documents Processed"
          value={stats.total_documents}
          icon={<DocumentTextIcon className="w-6 h-6" />}
          color="blue"
        />

        {/* Total Jobs */}
        <StatsCard
          title="Processing Jobs"
          value={stats.total_jobs}
          icon={<CpuChipIcon className="w-6 h-6" />}
          color="purple"
          subtitle={
            <JobStatusBreakdown jobsByStatus={stats.jobs_by_status} />
          }
        />

        {/* Total Generations */}
        <StatsCard
          title="Content Generated"
          value={stats.total_generations}
          icon={<SparklesIcon className="w-6 h-6" />}
          color="green"
          subtitle={
            <GenerationTypeBreakdown generationsByType={stats.generations_by_type} />
          }
        />

        {/* Performance */}
        <StatsCard
          title="Avg Processing Time"
          value={formatDuration(stats.avg_processing_time_ms)}
          icon={<ClockIcon className="w-6 h-6" />}
          color="orange"
          subtitle={
            <span className="text-secondary-500 dark:text-secondary-400">
              Cache hit rate: {formatPercentage(stats.cache_hit_rate)}
            </span>
          }
        />
      </div>

      {/* Status Breakdown Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Jobs by Status */}
        <div className="rounded-xl border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 overflow-hidden">
          <div className="p-4 border-b border-secondary-100 dark:border-secondary-700">
            <h3 className="font-semibold text-secondary-900 dark:text-secondary-100">
              Jobs by Status
            </h3>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {Object.entries(stats.jobs_by_status).map(([status, count]) => (
                <StatusBar
                  key={status}
                  label={status}
                  count={count}
                  total={stats.total_jobs}
                  color={getStatusColor(status)}
                />
              ))}
              {Object.keys(stats.jobs_by_status).length === 0 && (
                <p className="text-secondary-500 dark:text-secondary-400 text-sm">
                  No jobs recorded yet
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Generations by Type */}
        <div className="rounded-xl border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 overflow-hidden">
          <div className="p-4 border-b border-secondary-100 dark:border-secondary-700">
            <h3 className="font-semibold text-secondary-900 dark:text-secondary-100">
              Generated Content
            </h3>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {Object.entries(stats.generations_by_type).map(([type, count]) => (
                <StatusBar
                  key={type}
                  label={formatGenerationType(type)}
                  count={count}
                  total={stats.total_generations}
                  color={getGenerationColor(type)}
                />
              ))}
              {Object.keys(stats.generations_by_type).length === 0 && (
                <p className="text-secondary-500 dark:text-secondary-400 text-sm">
                  No content generated yet
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Stats Card Component
interface StatsCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: 'blue' | 'purple' | 'green' | 'orange';
  subtitle?: React.ReactNode;
}

function StatsCard({ title, value, icon, color, subtitle }: StatsCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
  };

  return (
    <div className="rounded-xl border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 p-4">
      <div className="flex items-center justify-between">
        <div className={clsx('p-2 rounded-lg', colorClasses[color])}>
          {icon}
        </div>
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
        <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">
          {title}
        </p>
        {subtitle && <div className="mt-2 text-xs">{subtitle}</div>}
      </div>
    </div>
  );
}

// Job Status Breakdown Mini Component
function JobStatusBreakdown({ jobsByStatus }: { jobsByStatus: Record<string, number> }) {
  const completed = jobsByStatus['completed'] || 0;
  const failed = jobsByStatus['failed'] || 0;
  const processing = jobsByStatus['processing'] || 0;

  return (
    <div className="flex items-center gap-2 text-xs">
      {completed > 0 && (
        <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
          <CheckCircleIcon className="w-3 h-3" />
          {completed}
        </span>
      )}
      {processing > 0 && (
        <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
          <ArrowPathIcon className="w-3 h-3" />
          {processing}
        </span>
      )}
      {failed > 0 && (
        <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
          <ExclamationCircleIcon className="w-3 h-3" />
          {failed}
        </span>
      )}
    </div>
  );
}

// Generation Type Breakdown Mini Component
function GenerationTypeBreakdown({ generationsByType }: { generationsByType: Record<string, number> }) {
  const types = Object.entries(generationsByType).slice(0, 3);

  return (
    <div className="flex items-center gap-2 text-xs text-secondary-500 dark:text-secondary-400">
      {types.map(([type, count]) => (
        <span key={type}>
          {formatGenerationType(type)}: {count}
        </span>
      ))}
    </div>
  );
}

// Status Progress Bar Component
interface StatusBarProps {
  label: string;
  count: number;
  total: number;
  color: string;
}

function StatusBar({ label, count, total, color }: StatusBarProps) {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300 capitalize">
          {label}
        </span>
        <span className="text-sm text-secondary-500 dark:text-secondary-400">
          {count} ({percentage.toFixed(1)}%)
        </span>
      </div>
      <div className="h-2 bg-secondary-100 dark:bg-secondary-700 rounded-full overflow-hidden">
        <div
          className={clsx('h-full rounded-full transition-all duration-300', color)}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}

// Helper functions
function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    completed: 'bg-green-500',
    processing: 'bg-blue-500',
    pending: 'bg-yellow-500',
    failed: 'bg-red-500',
  };
  return colors[status.toLowerCase()] || 'bg-secondary-500';
}

function getGenerationColor(type: string): string {
  const colors: Record<string, string> = {
    summary: 'bg-blue-500',
    faqs: 'bg-purple-500',
    questions: 'bg-green-500',
    all: 'bg-orange-500',
  };
  return colors[type.toLowerCase()] || 'bg-secondary-500';
}

function formatGenerationType(type: string): string {
  const labels: Record<string, string> = {
    summary: 'Summaries',
    faqs: 'FAQs',
    questions: 'Questions',
    all: 'All Types',
  };
  return labels[type.toLowerCase()] || type;
}

// Skeleton Loading Component
export function InsightsDashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-32 bg-secondary-200 dark:bg-secondary-700 rounded-xl"
          />
        ))}
      </div>

      {/* Breakdown Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-64 bg-secondary-200 dark:bg-secondary-700 rounded-xl" />
        <div className="h-64 bg-secondary-200 dark:bg-secondary-700 rounded-xl" />
      </div>
    </div>
  );
}
