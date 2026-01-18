'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ChartBarIcon,
  PlusIcon,
  ArrowPathIcon,
  DocumentChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';
import { AppLayout } from '@/components/layout';
import { useAuth } from '@/contexts/AuthContext';
import { useReportsPageData } from '@/hooks/useReports';
import { ReportsTable } from './ReportsTable';
import { CreateReportModal } from './CreateReportModal';
import { ReportStatusBadge } from './ReportStatusBadge';
import { formatCompactNumber, formatProcessingTime } from '@/lib/api/reports';

export default function ReportsPage() {
  const { user } = useAuth();
  const orgId = user?.org_id || '';
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);

  const { reports, total, stats, isLoading, isError, error, refetch } = useReportsPageData(
    { status: statusFilter as any, limit: 20 },
    !!orgId
  );

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-secondary-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <nav className="flex mb-4" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
              <li className="inline-flex items-center">
                <Link
                  href="/dashboard"
                  className="text-sm font-medium text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <div className="flex items-center">
                  <span className="mx-2 text-gray-400">/</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Reports
                  </span>
                </div>
              </li>
            </ol>
          </nav>

          {/* Under Construction Banner */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-700/50 rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 p-2 bg-amber-100 dark:bg-amber-800/30 rounded-lg">
                <WrenchScrewdriverIcon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                  Under Construction
                </h3>
                <p className="text-sm text-amber-700 dark:text-amber-400/80">
                  The Business Intelligence Reports module is currently under active development. Some features may be limited or unavailable.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <ChartBarIcon className="h-8 w-8 text-primary-600" />
                Business Intelligence
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Generate expense summaries, vendor analysis, and other business reports from your documents
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex gap-3">
              <button
                onClick={() => refetch()}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-secondary-800 hover:bg-gray-50 dark:hover:bg-secondary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <ArrowPathIcon className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                New Report
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-secondary-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-secondary-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Total Reports
                  </p>
                  <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                    {stats?.total_reports ?? total ?? 0}
                  </p>
                </div>
                <div className="p-3 bg-primary-50 dark:bg-primary-900/30 rounded-lg">
                  <DocumentChartBarIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-secondary-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-secondary-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Completed
                  </p>
                  <p className="mt-1 text-2xl font-bold text-green-600 dark:text-green-400">
                    {stats?.completed_reports ?? 0}
                  </p>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-lg">
                  <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-secondary-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-secondary-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    In Progress
                  </p>
                  <p className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {stats?.pending_reports ?? 0}
                  </p>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  <ClockIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white dark:bg-secondary-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-secondary-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Avg. Processing
                  </p>
                  <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                    {formatProcessingTime(stats?.avg_processing_time_ms)}
                  </p>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                  <ChartBarIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {[
              { label: 'All', value: undefined },
              { label: 'Completed', value: 'completed' },
              { label: 'In Progress', value: 'pending' },
              { label: 'Failed', value: 'failed' },
            ].map((filter) => (
              <button
                key={filter.label}
                onClick={() => setStatusFilter(filter.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  statusFilter === filter.value
                    ? 'bg-primary-600 text-white'
                    : 'bg-white dark:bg-secondary-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-secondary-700 hover:bg-gray-50 dark:hover:bg-secondary-700'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Reports Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm border border-gray-100 dark:border-secondary-700"
          >
            {isError ? (
              <div className="p-8 text-center">
                <ExclamationCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Failed to load reports
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {error?.message || 'An error occurred while loading reports.'}
                </p>
                <button
                  onClick={() => refetch()}
                  className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  <ArrowPathIcon className="h-4 w-4 mr-2" />
                  Try Again
                </button>
              </div>
            ) : reports.length === 0 && !isLoading ? (
              <div className="p-12 text-center">
                <DocumentChartBarIcon className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No reports yet
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  Create your first business intelligence report to analyze your documents.
                </p>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create Report
                </button>
              </div>
            ) : (
              <ReportsTable
                reports={reports}
                isLoading={isLoading}
                onRefresh={refetch}
              />
            )}
          </motion.div>

          {/* Pagination Info */}
          {total > 0 && (
            <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center">
              Showing {reports.length} of {total} reports
            </div>
          )}
        </div>
      </div>

      {/* Create Report Modal */}
      <CreateReportModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        orgId={orgId}
      />
    </AppLayout>
  );
}
