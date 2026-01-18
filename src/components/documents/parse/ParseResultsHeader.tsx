'use client';

import { ArrowLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Document } from '@/types/api';
import { clsx } from 'clsx';

interface ParseResultsHeaderProps {
  document: Document | null;
  onBack: () => void;
  hasUnsavedChanges?: boolean;
}

export default function ParseResultsHeader({
  document,
  onBack,
  hasUnsavedChanges = false,
}: ParseResultsHeaderProps) {
  return (
    <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-brand-navy-600 border-b border-gray-200 dark:border-brand-navy-500">
      {/* Left side - Back button and breadcrumbs */}
      <div className="flex items-center space-x-4">
        <button
          onClick={onBack}
          className={clsx(
            'flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
            'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white',
            'hover:bg-gray-100 dark:hover:bg-brand-navy-500'
          )}
        >
          <ArrowLeftIcon className="w-4 h-4" />
          <span>Back</span>
        </button>

        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-2 text-sm">
          <a
            href="/documents"
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            Documents
          </a>

          {document?.folder_name && (
            <>
              <ChevronRightIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              <span className="text-gray-500 dark:text-gray-400">
                {document.folder_name}
              </span>
            </>
          )}

          <ChevronRightIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />

          <span className="text-gray-700 dark:text-gray-200 font-medium truncate max-w-[200px]">
            {document?.name || 'Document'}
          </span>

          <ChevronRightIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />

          <span className="text-primary-600 dark:text-primary-400 font-medium">
            Parse Results
          </span>
        </nav>
      </div>

      {/* Right side - Status indicators */}
      <div className="flex items-center space-x-3">
        {hasUnsavedChanges && (
          <span className="flex items-center space-x-1 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-full">
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
            <span>Unsaved changes</span>
          </span>
        )}
      </div>
    </div>
  );
}
