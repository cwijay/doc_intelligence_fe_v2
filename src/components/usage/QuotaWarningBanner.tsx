'use client';

import { ExclamationTriangleIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface QuotaWarningBannerProps {
  approaching: string[];
  exceeded: string[];
}

const RESOURCE_LABELS: Record<string, string> = {
  tokens: 'API Tokens',
  llamaparse_pages: 'Document Parsing Pages',
  file_search_queries: 'File Search Queries',
  storage: 'Storage Space',
};

export function QuotaWarningBanner({ approaching, exceeded }: QuotaWarningBannerProps) {
  if (approaching.length === 0 && exceeded.length === 0) return null;

  const formatResources = (resources: string[]) =>
    resources.map((r) => RESOURCE_LABELS[r] || r).join(', ');

  return (
    <div className="space-y-3">
      {/* Exceeded Warning - Critical */}
      {exceeded.length > 0 && (
        <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <XCircleIcon className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-red-800 dark:text-red-200">Quota Exceeded</p>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              You have exceeded your limit for: <strong>{formatResources(exceeded)}</strong>.
              Please upgrade your plan to continue using these features.
            </p>
            <button className="mt-3 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors">
              Upgrade Now
            </button>
          </div>
        </div>
      )}

      {/* Approaching Warning */}
      {approaching.length > 0 && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
          <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-amber-800 dark:text-amber-200">
              Approaching Quota Limit
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
              You are approaching your limit for: <strong>{formatResources(approaching)}</strong>.
              Consider upgrading your plan to avoid service interruption.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
