'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeftIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  FolderIcon,
  SparklesIcon,
  QuestionMarkCircleIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import { AIContentType, CONTENT_CONFIG } from '../ai-modal/types';

interface AIContentHeaderProps {
  contentType: AIContentType;
  documentName: string;
  folderName: string | null;
  onBack: () => void;
  itemCount?: number;
  cached?: boolean;
  processingTime?: number;
}

const getContentIcon = (contentType: AIContentType) => {
  switch (contentType) {
    case 'summary':
      return SparklesIcon;
    case 'faq':
      return QuestionMarkCircleIcon;
    case 'questions':
      return AcademicCapIcon;
  }
};

export default function AIContentHeader({
  contentType,
  documentName,
  folderName,
  onBack,
  itemCount,
  cached,
  processingTime,
}: AIContentHeaderProps) {
  const config = CONTENT_CONFIG[contentType];
  const ContentIcon = getContentIcon(contentType);

  return (
    <header className="bg-white dark:bg-brand-navy-600 border-b border-gray-200 dark:border-brand-navy-500 px-4 sm:px-6 py-4 flex-shrink-0">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          {/* Left side: Back button and breadcrumbs */}
          <div className="flex items-center space-x-4">
            {/* Back button */}
            <button
              onClick={onBack}
              className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              <span className="text-sm font-medium hidden sm:inline">Back</span>
            </button>

            {/* Divider */}
            <div className="h-6 w-px bg-gray-300 dark:bg-brand-navy-500" />

            {/* Breadcrumbs */}
            <nav className="flex items-center space-x-2 text-sm">
              <span className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer hidden sm:inline">
                Documents
              </span>
              {folderName && (
                <>
                  <ChevronRightIcon className="w-4 h-4 text-gray-400 hidden sm:block" />
                  <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400 hidden sm:flex">
                    <FolderIcon className="w-4 h-4" />
                    <span>{folderName}</span>
                  </div>
                </>
              )}
              <ChevronRightIcon className="w-4 h-4 text-gray-400" />
              <div className="flex items-center space-x-1 text-gray-700 dark:text-gray-200">
                <DocumentTextIcon className="w-4 h-4" />
                <span className="font-medium truncate max-w-[200px]">{documentName}</span>
              </div>
              <ChevronRightIcon className="w-4 h-4 text-gray-400" />
              <div className="flex items-center space-x-1 text-brand-coral-600 dark:text-brand-coral-400 font-medium">
                <ContentIcon className="w-4 h-4" />
                <span>{config.title}</span>
              </div>
            </nav>
          </div>

          {/* Right side: Status badges */}
          <div className="flex items-center space-x-2">
            {cached && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                Cached
              </span>
            )}
            {itemCount !== undefined && itemCount > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                {itemCount} {config.countLabel}
              </span>
            )}
            {processingTime && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                {(processingTime / 1000).toFixed(1)}s
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
