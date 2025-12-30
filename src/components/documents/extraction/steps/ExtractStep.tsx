'use client';

import React from 'react';
import Button from '@/components/ui/Button';
import { clsx } from 'clsx';
import {
  DocumentTextIcon,
  PlayIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import { UseExtractionReturn } from '@/hooks/extraction';

export interface ExtractStepProps {
  extraction: UseExtractionReturn;
}

// =============================================================================
// Extracted Data Display
// =============================================================================

interface DataDisplayProps {
  data: Record<string, unknown>;
  level?: number;
}

function DataDisplay({ data, level = 0 }: DataDisplayProps) {
  const entries = Object.entries(data);

  return (
    <div className={clsx(level > 0 && 'ml-4 pl-4 border-l-2 border-secondary-200 dark:border-secondary-700')}>
      {entries.map(([key, value]) => {
        const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

        if (value === null || value === undefined) {
          return (
            <div key={key} className="py-1.5">
              <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                {displayKey}:
              </span>
              <span className="text-sm text-secondary-400 dark:text-secondary-500 ml-2">
                Not found
              </span>
            </div>
          );
        }

        if (typeof value === 'object' && !Array.isArray(value)) {
          return (
            <div key={key} className="py-1.5">
              <div className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                {displayKey}
              </div>
              <DataDisplay data={value as Record<string, unknown>} level={level + 1} />
            </div>
          );
        }

        if (Array.isArray(value)) {
          return (
            <div key={key} className="py-1.5">
              <div className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                {displayKey} ({value.length} items)
              </div>
              <div className="space-y-2">
                {value.map((item, index) => (
                  <div
                    key={index}
                    className="bg-secondary-50 dark:bg-secondary-800/50 rounded-lg p-3"
                  >
                    <div className="text-xs font-medium text-secondary-500 dark:text-secondary-400 mb-2">
                      Item {index + 1}
                    </div>
                    {typeof item === 'object' ? (
                      <DataDisplay data={item as Record<string, unknown>} level={level + 1} />
                    ) : (
                      <span className="text-sm text-secondary-900 dark:text-secondary-100">
                        {String(item)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        }

        return (
          <div key={key} className="py-1.5 flex items-start">
            <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300 min-w-[140px]">
              {displayKey}:
            </span>
            <span className="text-sm text-secondary-900 dark:text-secondary-100 ml-2">
              {String(value)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function ExtractStep({ extraction }: ExtractStepProps) {
  const {
    isLoading,
    extractedData,
    tokenUsage,
    schema,
    selectedTemplate,
    extractData,
  } = extraction;

  const hasSchema = !!schema || !!selectedTemplate;

  // If already extracted, show results
  if (extractedData) {
    return (
      <div className="space-y-6">
        {/* Success header */}
        <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
          <div>
            <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
              Extraction Complete
            </h3>
            <p className="text-xs text-green-600 dark:text-green-400">
              Data has been successfully extracted from the document
            </p>
          </div>
        </div>

        {/* Token usage */}
        {tokenUsage && (
          <div className="flex items-center gap-4 text-sm text-secondary-600 dark:text-secondary-400">
            <div className="flex items-center gap-1">
              <span className="font-medium">Tokens:</span>
              <span>{tokenUsage.total_tokens.toLocaleString()}</span>
            </div>
            {tokenUsage.estimated_cost_usd !== undefined && (
              <div className="flex items-center gap-1">
                <CurrencyDollarIcon className="h-4 w-4" />
                <span>${tokenUsage.estimated_cost_usd.toFixed(4)}</span>
              </div>
            )}
          </div>
        )}

        {/* Extracted data display */}
        <div className="border border-secondary-200 dark:border-secondary-700 rounded-lg overflow-hidden">
          <div className="bg-secondary-50 dark:bg-secondary-800 px-4 py-2 border-b border-secondary-200 dark:border-secondary-700">
            <h4 className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
              Extracted Data
            </h4>
          </div>
          <div className="p-4 max-h-[400px] overflow-y-auto">
            <DataDisplay data={extractedData} />
          </div>
        </div>

        <p className="text-sm text-secondary-500 dark:text-secondary-400 text-center">
          Click &quot;Next&quot; to save or export the extracted data
        </p>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-lg font-medium text-secondary-900 dark:text-secondary-100 mb-2">
            Extracting Data...
          </p>
          <p className="text-secondary-500 dark:text-secondary-400">
            AI is extracting structured data from the document
          </p>
        </div>
      </div>
    );
  }

  // Initial state - show extract button
  return (
    <div className="space-y-6">
      <div className="text-center py-8">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-primary-100 dark:bg-primary-900/30 mb-4">
          <DocumentTextIcon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
        </div>
        <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100">
          Extract Data
        </h3>
        <p className="mt-2 text-secondary-600 dark:text-secondary-400 max-w-md mx-auto">
          {hasSchema
            ? 'Ready to extract structured data using the selected schema.'
            : 'Please go back and select fields or a template first.'}
        </p>
      </div>

      {/* Schema preview */}
      {selectedTemplate && (
        <div className="bg-secondary-50 dark:bg-secondary-800/50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-secondary-600 dark:text-secondary-400">Using template:</span>
            <span className="font-medium text-secondary-900 dark:text-secondary-100">
              {selectedTemplate.name}
            </span>
            <span className="text-secondary-500 dark:text-secondary-400">
              ({selectedTemplate.field_count} fields)
            </span>
          </div>
        </div>
      )}

      {/* Extract button */}
      <div className="flex justify-center pt-4">
        <Button
          onClick={extractData}
          disabled={!hasSchema || isLoading}
          variant="primary"
          size="lg"
        >
          <PlayIcon className="h-5 w-5 mr-2" />
          Extract Data
        </Button>
      </div>
    </div>
  );
}
