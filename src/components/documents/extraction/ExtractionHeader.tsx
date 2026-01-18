'use client';

import React from 'react';
import Link from 'next/link';
import { clsx } from 'clsx';
import {
  ArrowLeftIcon,
  ChevronRightIcon,
  FolderIcon,
  DocumentTextIcon,
  TableCellsIcon,
} from '@heroicons/react/24/outline';
import { Document } from '@/types/api';
import { ExtractionStep } from '@/types/extraction';

// =============================================================================
// Types
// =============================================================================

export interface ExtractionHeaderProps {
  document: Document | null;
  folderName: string | null;
  currentStep: ExtractionStep;
  onBack: () => void;
}

// =============================================================================
// Step Configuration
// =============================================================================

interface StepInfo {
  id: ExtractionStep;
  label: string;
}

const STEPS: StepInfo[] = [
  { id: 'analyze', label: 'Analyze' },
  { id: 'select', label: 'Select Fields' },
  { id: 'extract', label: 'Extract' },
  { id: 'actions', label: 'Actions' },
];

function getStepIndex(step: ExtractionStep): number {
  return STEPS.findIndex(s => s.id === step);
}

// =============================================================================
// Component
// =============================================================================

export function ExtractionHeader({
  document,
  folderName,
  currentStep,
  onBack,
}: ExtractionHeaderProps) {
  const currentStepIndex = getStepIndex(currentStep);

  return (
    <div className="bg-white dark:bg-brand-navy-600 border-b border-gray-200 dark:border-brand-navy-500 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left: Back button and breadcrumbs */}
        <div className="flex items-center gap-4">
          {/* Back button */}
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span className="text-sm font-medium">Back</span>
          </button>

          {/* Vertical divider */}
          <div className="h-6 w-px bg-gray-200 dark:bg-gray-600" />

          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-sm">
            <Link
              href="/documents"
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              Documents
            </Link>

            {folderName && (
              <>
                <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                  <FolderIcon className="w-4 h-4" />
                  {folderName}
                </span>
              </>
            )}

            {document && (
              <>
                <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                  <DocumentTextIcon className="w-4 h-4" />
                  {document.name}
                </span>
              </>
            )}

            <ChevronRightIcon className="w-4 h-4 text-gray-400" />
            <span className="flex items-center gap-1 text-gray-900 dark:text-gray-100 font-medium">
              <TableCellsIcon className="w-4 h-4" />
              Extract Data
            </span>
          </nav>
        </div>

        {/* Right: Step indicator */}
        <div className="hidden md:flex items-center gap-1">
          {STEPS.map((step, index) => {
            const isComplete = index < currentStepIndex;
            const isCurrent = index === currentStepIndex;
            const isFuture = index > currentStepIndex;

            return (
              <React.Fragment key={step.id}>
                {/* Step */}
                <div
                  className={clsx(
                    'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                    {
                      'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400': isCurrent,
                      'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400': isComplete,
                      'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400': isFuture,
                    }
                  )}
                >
                  <span
                    className={clsx(
                      'flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold',
                      {
                        'bg-primary-500 text-white': isCurrent,
                        'bg-green-500 text-white': isComplete,
                        'bg-gray-300 text-gray-600 dark:bg-gray-600 dark:text-gray-400': isFuture,
                      }
                    )}
                  >
                    {isComplete ? '✓' : index + 1}
                  </span>
                  <span>{step.label}</span>
                </div>

                {/* Connector */}
                {index < STEPS.length - 1 && (
                  <div
                    className={clsx(
                      'w-6 h-0.5',
                      isComplete ? 'bg-green-400 dark:bg-green-500' : 'bg-gray-200 dark:bg-gray-600'
                    )}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Mobile step indicator */}
      <div className="md:hidden mt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Step {currentStepIndex + 1} of {STEPS.length}: {STEPS[currentStepIndex]?.label}
          </span>
        </div>
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-500 transition-all duration-300"
            style={{ width: `${((currentStepIndex + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default ExtractionHeader;
