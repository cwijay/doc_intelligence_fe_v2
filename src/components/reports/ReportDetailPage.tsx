'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ChartBarIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  LightBulbIcon,
  ChartPieIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import { AppLayout } from '@/components/layout';
import { useReportProgress } from '@/hooks/useReports';
import { ReportStatusBadge } from './ReportStatusBadge';
import { formatReportType, formatProcessingTime, formatCurrency } from '@/lib/api/reports';
import { reportsApi } from '@/lib/api/reports';

export function ReportDetailPage() {
  const params = useParams();
  const reportId = params.reportId as string;
  const [downloadFormat, setDownloadFormat] = useState<'pdf' | 'excel' | 'json'>('pdf');
  const [isDownloading, setIsDownloading] = useState(false);

  const {
    report,
    summary,
    insights,
    charts,
    progress,
    status,
    isLoading,
    isError,
    error,
    isInProgress,
    isComplete,
    isFailed,
    pdfPath,
    excelPath,
  } = useReportProgress(reportId);

  const handleDownload = async (format: 'pdf' | 'excel' | 'json') => {
    try {
      setIsDownloading(true);
      const response = await reportsApi.downloadReport(reportId, format);
      if (response.download_url) {
        window.open(response.download_url, '_blank');
      }
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

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
                  <Link
                    href="/reports"
                    className="text-sm font-medium text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
                  >
                    Reports
                  </Link>
                </div>
              </li>
              <li>
                <div className="flex items-center">
                  <span className="mx-2 text-gray-400">/</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {report ? formatReportType(report.report_type) : 'Loading...'}
                  </span>
                </div>
              </li>
            </ol>
          </nav>

          {/* Back Button */}
          <Link
            href="/reports"
            className="inline-flex items-center text-sm text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 mb-6"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Reports
          </Link>

          {/* Loading State */}
          {isLoading && !report && (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <ArrowPathIcon className="h-12 w-12 text-primary-600 animate-spin mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Loading report...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {isError && (
            <div className="bg-white dark:bg-secondary-800 rounded-xl p-8 text-center">
              <ExclamationCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Failed to load report
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {error?.message || 'An error occurred while loading the report.'}
              </p>
            </div>
          )}

          {/* Report Content */}
          {report && (
            <>
              {/* Header */}
              <div className="bg-white dark:bg-secondary-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-secondary-700 mb-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary-50 dark:bg-primary-900/30 rounded-lg">
                      <ChartBarIcon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {formatReportType(report.report_type)}
                      </h1>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Report ID: {report.id.slice(0, 8)}...
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <ReportStatusBadge status={report.status} size="lg" />
                    {isComplete && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDownload('pdf')}
                          disabled={isDownloading}
                          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                        >
                          <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                          PDF
                        </button>
                        <button
                          onClick={() => handleDownload('excel')}
                          disabled={isDownloading}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-secondary-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-secondary-700 disabled:opacity-50"
                        >
                          <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                          Excel
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress Bar for In-Progress Reports */}
                {isInProgress && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Generating report...
                      </span>
                      <span className="text-sm font-medium text-primary-600">
                        {progress}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-secondary-700 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5 }}
                        className="bg-primary-600 h-2 rounded-full"
                      />
                    </div>
                  </div>
                )}

                {/* Failed State */}
                {isFailed && report.error_message && (
                  <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div className="flex items-start gap-3">
                      <ExclamationCircleIcon className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-800 dark:text-red-200">
                          Report generation failed
                        </p>
                        <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                          {report.error_message}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white dark:bg-secondary-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-secondary-700"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                      <DocumentTextIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Documents</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {report.document_count}
                      </p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white dark:bg-secondary-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-secondary-700"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                      <ChartPieIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Records</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {report.extracted_record_count}
                      </p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white dark:bg-secondary-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-secondary-700"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg">
                      <ClockIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Processing Time</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {formatProcessingTime(report.processing_time_ms)}
                      </p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white dark:bg-secondary-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-secondary-700"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg">
                      <CurrencyDollarIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Amount</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {summary?.total_amount
                          ? formatCurrency(summary.total_amount)
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Summary Section */}
              {isComplete && summary && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-white dark:bg-secondary-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-secondary-700 mb-6"
                >
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <ChartBarIcon className="h-5 w-5 text-primary-600" />
                    Report Summary
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {summary.vendor_count !== undefined && (
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Vendors</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {summary.vendor_count}
                        </p>
                      </div>
                    )}
                    {summary.category_count !== undefined && (
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Categories</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {summary.category_count}
                        </p>
                      </div>
                    )}
                    {summary.top_vendor && (
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Top Vendor</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                          {summary.top_vendor}
                        </p>
                      </div>
                    )}
                    {summary.top_category && (
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Top Category</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                          {summary.top_category}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Insights Section */}
              {isComplete && insights && insights.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="bg-white dark:bg-secondary-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-secondary-700 mb-6"
                >
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <LightBulbIcon className="h-5 w-5 text-yellow-500" />
                    AI-Generated Insights
                  </h2>
                  <div className="space-y-4">
                    {insights.map((insight, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg ${
                          insight.severity === 'critical'
                            ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                            : insight.severity === 'warning'
                            ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                            : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded ${
                              insight.severity === 'critical'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                : insight.severity === 'warning'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            }`}
                          >
                            {insight.category}
                          </span>
                        </div>
                        <h3 className="font-medium text-gray-900 dark:text-white mt-2">
                          {insight.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {insight.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Report Metadata */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="bg-white dark:bg-secondary-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-secondary-700"
              >
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Report Details
                </h2>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm text-gray-500 dark:text-gray-400">Created</dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatDate(report.created_at)}
                    </dd>
                  </div>
                  {report.completed_at && (
                    <div>
                      <dt className="text-sm text-gray-500 dark:text-gray-400">Completed</dt>
                      <dd className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatDate(report.completed_at)}
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-sm text-gray-500 dark:text-gray-400">Report Type</dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatReportType(report.report_type)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500 dark:text-gray-400">Folder ID</dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-white font-mono">
                      {report.folder_id.slice(0, 8)}...
                    </dd>
                  </div>
                </dl>
              </motion.div>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
