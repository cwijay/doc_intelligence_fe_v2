'use client';

import React from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { clsx } from 'clsx';
import {
  MagnifyingGlassIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { UseExtractionReturn } from '@/hooks/extraction';
import { ExtractionStep } from '@/types/extraction';

// Step components
import { AnalyzeStep } from './steps/AnalyzeStep';
import { SelectFieldsStep } from './steps/SelectFieldsStep';
import { ExtractStep } from './steps/ExtractStep';
import { ActionsStep } from './steps/ActionsStep';

// =============================================================================
// Types
// =============================================================================

export interface ExtractionModalProps {
  extraction: UseExtractionReturn;
  /** Callback when extraction is completed (Done button clicked) */
  onComplete?: () => void;
}

// =============================================================================
// Step Configuration
// =============================================================================

interface StepConfig {
  id: ExtractionStep;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const STEPS: StepConfig[] = [
  {
    id: 'analyze',
    label: 'Analyze',
    icon: MagnifyingGlassIcon,
    description: 'Discover extractable fields',
  },
  {
    id: 'select',
    label: 'Select',
    icon: CheckCircleIcon,
    description: 'Choose fields or template',
  },
  {
    id: 'extract',
    label: 'Extract',
    icon: DocumentTextIcon,
    description: 'Extract structured data',
  },
  {
    id: 'actions',
    label: 'Actions',
    icon: ArrowDownTrayIcon,
    description: 'Save or export results',
  },
];

function getStepIndex(step: ExtractionStep): number {
  return STEPS.findIndex(s => s.id === step);
}

// =============================================================================
// Component
// =============================================================================

export function ExtractionModal({ extraction, onComplete }: ExtractionModalProps) {
  const {
    isModalOpen,
    completeExtraction,
    selectedDocument,
    step,
    isLoading,
    error,
    previousStep,
    nextStep,
  } = extraction;

  /**
   * Handle Done button click - complete extraction and notify parent
   */
  const handleDone = () => {
    // Call parent callback first (to reopen parse modal)
    onComplete?.();
    // Then close extraction modal (preserves document reference)
    completeExtraction();
  };

  /**
   * Handle Cancel button - returns to parse modal without completing
   */
  const handleCancel = () => {
    // Call parent callback to return to parse modal
    onComplete?.();
    // Close extraction modal
    completeExtraction();
  };

  const currentStepIndex = getStepIndex(step);

  // Determine if we can navigate
  const canGoBack = currentStepIndex > 0;
  const canGoForward = currentStepIndex < STEPS.length - 1 && !isLoading;

  // Render step content
  const renderStepContent = () => {
    switch (step) {
      case 'analyze':
        return <AnalyzeStep extraction={extraction} />;
      case 'select':
        return <SelectFieldsStep extraction={extraction} />;
      case 'extract':
        return <ExtractStep extraction={extraction} />;
      case 'actions':
        return <ActionsStep extraction={extraction} />;
      default:
        return null;
    }
  };

  if (!selectedDocument) return null;

  return (
    <Modal
      isOpen={isModalOpen}
      onClose={handleCancel}
      title="Extract Data"
      size="3xl"
      className="max-h-[90vh]"
    >
      <div className="space-y-6">
        {/* Document name */}
        <div className="text-sm text-secondary-600 dark:text-secondary-400">
          <span className="font-medium">{selectedDocument.name}</span>
        </div>

        {/* Step indicator */}
        <nav aria-label="Progress">
          <ol className="flex items-center">
            {STEPS.map((stepConfig, index) => {
              const Icon = stepConfig.icon;
              const isCurrent = stepConfig.id === step;
              const isComplete = index < currentStepIndex;
              const isFuture = index > currentStepIndex;

              return (
                <li
                  key={stepConfig.id}
                  className={clsx(
                    'relative flex-1',
                    index !== STEPS.length - 1 && 'pr-8 sm:pr-20'
                  )}
                >
                  {/* Connector line */}
                  {index !== STEPS.length - 1 && (
                    <div
                      className="absolute top-4 left-7 -right-3 h-0.5"
                      aria-hidden="true"
                    >
                      <div
                        className={clsx(
                          'h-full',
                          isComplete
                            ? 'bg-primary-600 dark:bg-primary-500'
                            : 'bg-secondary-200 dark:bg-secondary-700'
                        )}
                      />
                    </div>
                  )}

                  <div className="relative flex items-start group">
                    <span className="flex h-9 items-center" aria-hidden="true">
                      <span
                        className={clsx(
                          'relative z-10 flex h-8 w-8 items-center justify-center rounded-full',
                          isComplete
                            ? 'bg-primary-600 dark:bg-primary-500'
                            : isCurrent
                            ? 'border-2 border-primary-600 dark:border-primary-500 bg-white dark:bg-brand-navy-600'
                            : 'border-2 border-secondary-300 dark:border-secondary-600 bg-white dark:bg-brand-navy-600'
                        )}
                      >
                        <Icon
                          className={clsx(
                            'h-4 w-4',
                            isComplete
                              ? 'text-white'
                              : isCurrent
                              ? 'text-primary-600 dark:text-primary-400'
                              : 'text-secondary-400 dark:text-secondary-500'
                          )}
                        />
                      </span>
                    </span>
                    <span className="ml-3 flex min-w-0 flex-col">
                      <span
                        className={clsx(
                          'text-sm font-medium',
                          isCurrent
                            ? 'text-primary-600 dark:text-primary-400'
                            : isComplete
                            ? 'text-secondary-900 dark:text-secondary-100'
                            : 'text-secondary-500 dark:text-secondary-400'
                        )}
                      >
                        {stepConfig.label}
                      </span>
                      <span className="text-xs text-secondary-500 dark:text-secondary-400 hidden sm:block">
                        {stepConfig.description}
                      </span>
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>
        </nav>

        {/* Error message */}
        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Step content */}
        <div className="min-h-[300px] max-h-[50vh] overflow-y-auto">
          {renderStepContent()}
        </div>

        {/* Footer with navigation */}
        <div className="flex justify-between items-center pt-6 border-t border-secondary-200 dark:border-secondary-700">
          <Button
            onClick={previousStep}
            disabled={!canGoBack || isLoading}
            variant="outline"
            className={clsx(!canGoBack && 'invisible')}
          >
            <ChevronLeftIcon className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="flex gap-3">
            <Button onClick={handleCancel} variant="outline">
              Cancel
            </Button>
            {step === 'actions' ? (
              <Button onClick={handleDone} variant="primary">
                Done
              </Button>
            ) : (
              <Button
                onClick={nextStep}
                disabled={!canGoForward}
                variant="primary"
                className={clsx(step === 'analyze' && 'invisible')}
              >
                Next
                <ChevronRightIcon className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default ExtractionModal;
