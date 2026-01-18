'use client';

import React from 'react';
import { clsx } from 'clsx';
import Button from '@/components/ui/Button';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  CheckIcon,
  BookmarkIcon,
  DocumentMagnifyingGlassIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { UseExtractionPageReturn } from '@/hooks/extraction/useExtractionPage';
import { TemplateInfo, TemplateField } from '@/types/extraction';
import { ExtractionHeader } from './ExtractionHeader';

// Step components
import { AnalyzeStep } from './steps/AnalyzeStep';
import { SelectFieldsStep } from './steps/SelectFieldsStep';
import { ExtractStep } from './steps/ExtractStep';
import { ActionsStep } from './steps/ActionsStep';

// =============================================================================
// Types
// =============================================================================

export interface ExtractionPageProps {
  pageState: UseExtractionPageReturn;
}

// =============================================================================
// Template Selection Panel
// =============================================================================

interface TemplateSelectionPanelProps {
  templates: TemplateInfo[];
  selectedTemplate: TemplateInfo | null;
  templateFields: TemplateField[];
  isLoadingTemplates: boolean;
  isLoadingFields: boolean;
  folderName: string | null;
  onSelectTemplate: (template: TemplateInfo) => void;
  onUseTemplate: () => void;
  onAnalyzeNew: () => void;
  onCancel: () => void;
  error: string | null;
}

function TemplateSelectionPanel({
  templates,
  selectedTemplate,
  templateFields,
  isLoadingTemplates,
  isLoadingFields,
  folderName,
  onSelectTemplate,
  onUseTemplate,
  onAnalyzeNew,
  onCancel,
  error,
}: TemplateSelectionPanelProps) {
  const hasTemplates = templates.length > 0;
  const canUseTemplate = selectedTemplate !== null && templateFields.length > 0 && !isLoadingFields;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-gray-200 dark:border-brand-navy-500">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Choose Extraction Method
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Select an existing template or analyze the document to discover fields
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Error */}
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Templates */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">
              Available Templates for "{folderName}"
              {!isLoadingTemplates && (
                <span className="ml-2 text-gray-500">({templates.length})</span>
              )}
            </h3>

            {isLoadingTemplates ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-2 text-gray-500">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-primary-500" />
                  <span>Loading templates...</span>
                </div>
              </div>
            ) : hasTemplates ? (
              <div className="space-y-3">
                {templates.map(template => (
                  <button
                    key={template.name}
                    onClick={() => onSelectTemplate(template)}
                    className={clsx(
                      'w-full text-left p-4 rounded-lg border-2 transition-all',
                      selectedTemplate?.name === template.name
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 bg-white dark:bg-brand-navy-700'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={clsx(
                          'flex items-center justify-center w-10 h-10 rounded-full',
                          selectedTemplate?.name === template.name
                            ? 'bg-primary-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                        )}
                      >
                        {selectedTemplate?.name === template.name ? (
                          <CheckIcon className="w-5 h-5" />
                        ) : (
                          <BookmarkIcon className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {template.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {template.document_type} &middot; {template.field_count} fields
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
                <h3 className="mt-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                  No templates for this folder
                </h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Click "Analyze Document" to discover extractable fields.
                </p>
              </div>
            )}
          </div>

          {/* Right: Template preview */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">
              Template Preview
              {selectedTemplate && templateFields.length > 0 && (
                <span className="ml-2 text-gray-500">({templateFields.length} fields)</span>
              )}
            </h3>

            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 min-h-[300px] bg-white dark:bg-brand-navy-700">
              {isLoadingFields ? (
                <div className="flex items-center justify-center h-full">
                  <div className="flex items-center gap-2 text-gray-500">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-primary-500" />
                    <span>Loading fields...</span>
                  </div>
                </div>
              ) : templateFields.length > 0 ? (
                <div className="space-y-3">
                  {templateFields.map(field => (
                    <div
                      key={field.field_name}
                      className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {field.display_name}
                        </span>
                        {field.required && (
                          <span className="text-xs text-red-500">*</span>
                        )}
                      </div>
                      <span
                        className={clsx(
                          'text-xs px-2 py-0.5 rounded',
                          {
                            'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400': field.data_type === 'string',
                            'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400': field.data_type === 'number',
                            'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400': field.data_type === 'date',
                            'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400': field.data_type === 'currency',
                          }
                        )}
                      >
                        {field.data_type}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                  Select a template to preview its fields
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 p-6 border-t border-gray-200 dark:border-brand-navy-500 bg-gray-50 dark:bg-brand-navy-700">
        <div className="flex items-center justify-between">
          <Button onClick={onCancel} variant="outline">
            Cancel
          </Button>

          <div className="flex items-center gap-3">
            <Button
              onClick={onAnalyzeNew}
              variant="outline"
              className="flex items-center gap-2"
            >
              <DocumentMagnifyingGlassIcon className="w-4 h-4" />
              Analyze Document
            </Button>

            <Button
              onClick={onUseTemplate}
              variant="primary"
              disabled={!canUseTemplate}
              className="flex items-center gap-2"
            >
              <BookmarkIcon className="w-4 h-4" />
              Use Template
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Extraction Workflow Component
// =============================================================================

interface ExtractionWorkflowProps {
  pageState: UseExtractionPageReturn;
}

function ExtractionWorkflow({ pageState }: ExtractionWorkflowProps) {
  const { extraction, handleCancel, handleComplete } = pageState;
  const { step, isLoading, previousStep, nextStep } = extraction;

  // Get step index for navigation
  const stepOrder = ['analyze', 'select', 'extract', 'actions'] as const;
  const currentStepIndex = stepOrder.indexOf(step);
  const canGoBack = currentStepIndex > 0;
  const canGoForward = currentStepIndex < stepOrder.length - 1 && !isLoading;

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

  return (
    <div className="flex flex-col h-full">
      {/* Error message */}
      {extraction.error && (
        <div className="flex-shrink-0 mx-6 mt-4 rounded-lg bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-400">{extraction.error}</p>
        </div>
      )}

      {/* Step content - full viewport height */}
      <div className="flex-1 overflow-hidden p-6 flex flex-col">
        {renderStepContent()}
      </div>

      {/* Footer with navigation */}
      <div className="flex-shrink-0 border-t border-gray-200 dark:border-brand-navy-500 bg-gray-50 dark:bg-brand-navy-700 px-6 py-4">
        <div className="flex items-center justify-between">
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
              <XMarkIcon className="w-4 h-4 mr-2" />
              Cancel
            </Button>

            {step === 'actions' ? (
              <Button onClick={handleComplete} variant="primary">
                <CheckIcon className="w-4 h-4 mr-2" />
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
    </div>
  );
}

// =============================================================================
// Loading State
// =============================================================================

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-primary-500 mb-4" />
      <p className="text-gray-600 dark:text-gray-400">Loading extraction context...</p>
    </div>
  );
}

// =============================================================================
// Error State
// =============================================================================

interface ErrorStateProps {
  error: string;
  onBack: () => void;
}

function ErrorState({ error, onBack }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mb-4" />
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        Error Loading Extraction
      </h2>
      <p className="text-gray-600 dark:text-gray-400 text-center max-w-md mb-6">
        {error}
      </p>
      <Button onClick={onBack} variant="primary">
        <ArrowLeftIcon className="w-4 h-4 mr-2" />
        Go Back
      </Button>
    </div>
  );
}

// Need to import ArrowLeftIcon for ErrorState
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

// =============================================================================
// Main Component
// =============================================================================

export function ExtractionPage({ pageState }: ExtractionPageProps) {
  const {
    document,
    folderName,
    isInitialized,
    isInitializing,
    initError,
    showTemplateSelection,
    extraction,
    templateSelection,
    handleBack,
    handleCancel,
    handleAnalyzeNew,
  } = pageState;

  // Loading state
  if (isInitializing) {
    return (
      <div className="flex flex-col h-screen bg-gray-50 dark:bg-brand-navy-700">
        <LoadingState />
      </div>
    );
  }

  // Error state
  if (initError) {
    return (
      <div className="flex flex-col h-screen bg-gray-50 dark:bg-brand-navy-700">
        <ErrorState error={initError} onBack={handleBack} />
      </div>
    );
  }

  // Template selection mode
  if (showTemplateSelection && !extraction.isModalOpen) {
    return (
      <div className="flex flex-col h-screen bg-gray-50 dark:bg-brand-navy-700">
        <ExtractionHeader
          document={document}
          folderName={folderName}
          currentStep="analyze"
          onBack={handleBack}
        />
        <div className="flex-1 overflow-hidden">
          <TemplateSelectionPanel
            templates={templateSelection.filteredTemplates}
            selectedTemplate={templateSelection.selectedTemplate}
            templateFields={templateSelection.templateFields}
            isLoadingTemplates={templateSelection.isLoadingTemplates}
            isLoadingFields={templateSelection.isLoadingFields}
            folderName={folderName}
            onSelectTemplate={(template) => templateSelection.selectTemplate(template)}
            onUseTemplate={templateSelection.proceedWithTemplate}
            onAnalyzeNew={handleAnalyzeNew}
            onCancel={handleCancel}
            error={templateSelection.error}
          />
        </div>
      </div>
    );
  }

  // Main extraction workflow
  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-brand-navy-700">
      <ExtractionHeader
        document={document}
        folderName={folderName}
        currentStep={extraction.step}
        onBack={handleBack}
      />
      <div className="flex-1 overflow-hidden">
        <ExtractionWorkflow pageState={pageState} />
      </div>
    </div>
  );
}

export default ExtractionPage;
