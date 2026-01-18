'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  EyeIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  DocumentTextIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { ReportInfo } from '@/types/reports';
import { ReportStatusBadge } from './ReportStatusBadge';
import { formatReportType, formatProcessingTime } from '@/lib/api/reports';
import { useDeleteReport, useReportDownload } from '@/hooks/useReports';

interface ReportsTableProps {
  reports: ReportInfo[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function ReportsTable({ reports, isLoading, onRefresh }: ReportsTableProps) {
  const deleteReport = useDeleteReport();

  const handleDelete = async (reportId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (window.confirm('Are you sure you want to delete this report?')) {
      try {
        await deleteReport.mutateAsync(reportId);
      } catch (error) {
        console.error('Failed to delete report:', error);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse flex items-center space-x-4">
              <div className="h-10 w-10 bg-gray-200 dark:bg-secondary-700 rounded-lg"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-secondary-700 rounded w-1/4"></div>
                <div className="h-3 bg-gray-200 dark:bg-secondary-700 rounded w-1/2"></div>
              </div>
              <div className="h-6 w-20 bg-gray-200 dark:bg-secondary-700 rounded-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-secondary-700">
        <thead className="bg-gray-50 dark:bg-secondary-800/50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Report
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Documents
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Created
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Processing Time
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-secondary-800 divide-y divide-gray-200 dark:divide-secondary-700">
          {reports.map((report, index) => (
            <motion.tr
              key={report.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="hover:bg-gray-50 dark:hover:bg-secondary-700/50 transition-colors"
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <Link
                  href={`/reports/${report.id}`}
                  className="flex items-center gap-3 group"
                >
                  <div className="p-2 bg-primary-50 dark:bg-primary-900/30 rounded-lg group-hover:bg-primary-100 dark:group-hover:bg-primary-900/50 transition-colors">
                    <DocumentTextIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {formatReportType(report.report_type)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      ID: {report.id.slice(0, 8)}...
                    </p>
                  </div>
                </Link>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <ReportStatusBadge status={report.status} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900 dark:text-white">
                  {report.document_count} docs
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {report.extracted_record_count} records
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900 dark:text-white">
                  {formatDate(report.created_at)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                  <ClockIcon className="h-4 w-4" />
                  {formatProcessingTime(report.processing_time_ms)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right">
                <div className="flex items-center justify-end gap-2">
                  <Link
                    href={`/reports/${report.id}`}
                    className="p-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    title="View Report"
                  >
                    <EyeIcon className="h-5 w-5" />
                  </Link>
                  {report.status === 'completed' && (
                    <DownloadButton reportId={report.id} />
                  )}
                  <button
                    onClick={(e) => handleDelete(report.id, e)}
                    disabled={deleteReport.isPending}
                    className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                    title="Delete Report"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DownloadButton({ reportId }: { reportId: string }) {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleDownload = async (format: 'pdf' | 'excel' | 'json') => {
    try {
      const response = await fetch(`/api/reports/${reportId}/download?format=${format}`);
      const data = await response.json();
      if (data.download_url) {
        window.open(data.download_url, '_blank');
      }
    } catch (error) {
      console.error('Download failed:', error);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
        title="Download Report"
      >
        <ArrowDownTrayIcon className="h-5 w-5" />
      </button>
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-secondary-800 rounded-lg shadow-lg border border-gray-200 dark:border-secondary-700 z-20">
            <button
              onClick={() => handleDownload('pdf')}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-secondary-700 rounded-t-lg"
            >
              PDF
            </button>
            <button
              onClick={() => handleDownload('excel')}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-secondary-700"
            >
              Excel
            </button>
            <button
              onClick={() => handleDownload('json')}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-secondary-700 rounded-b-lg"
            >
              JSON
            </button>
          </div>
        </>
      )}
    </div>
  );
}
