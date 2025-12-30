'use client';

import React from 'react';
import Button from '@/components/ui/Button';
import { MagnifyingGlassIcon, DocumentMagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { UseExtractionReturn } from '@/hooks/extraction';
import { DOCUMENT_TYPE_HINTS, DocumentTypeHint } from '@/types/extraction';

export interface AnalyzeStepProps {
  extraction: UseExtractionReturn;
}

export function AnalyzeStep({ extraction }: AnalyzeStepProps) {
  const {
    isLoading,
    discoveredFields,
    lineItemFields,
    analyzeFields,
  } = extraction;

  const [selectedTypeHint, setSelectedTypeHint] = React.useState<DocumentTypeHint | ''>('');

  const handleAnalyze = async () => {
    await analyzeFields();
  };

  // If already analyzed, show summary
  if (discoveredFields.length > 0 || lineItemFields.length > 0) {
    const totalFields = discoveredFields.length + lineItemFields.length;

    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
            <DocumentMagnifyingGlassIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100">
            Analysis Complete
          </h3>
          <p className="mt-2 text-secondary-600 dark:text-secondary-400">
            Found {totalFields} extractable field{totalFields !== 1 ? 's' : ''}
          </p>

          <div className="mt-4 flex justify-center gap-4 text-sm">
            <div className="bg-secondary-100 dark:bg-secondary-800 rounded-lg px-4 py-2">
              <span className="font-medium text-secondary-900 dark:text-secondary-100">
                {discoveredFields.length}
              </span>
              <span className="text-secondary-600 dark:text-secondary-400 ml-1">
                header/footer fields
              </span>
            </div>
            {lineItemFields.length > 0 && (
              <div className="bg-secondary-100 dark:bg-secondary-800 rounded-lg px-4 py-2">
                <span className="font-medium text-secondary-900 dark:text-secondary-100">
                  {lineItemFields.length}
                </span>
                <span className="text-secondary-600 dark:text-secondary-400 ml-1">
                  line item fields
                </span>
              </div>
            )}
          </div>

          <p className="mt-6 text-sm text-secondary-500 dark:text-secondary-400">
            Click &quot;Next&quot; to select which fields to extract
          </p>
        </div>
      </div>
    );
  }

  // Initial state - show analyze button
  return (
    <div className="space-y-6">
      <div className="text-center py-8">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-primary-100 dark:bg-primary-900/30 mb-4">
          <MagnifyingGlassIcon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
        </div>
        <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100">
          Analyze Document
        </h3>
        <p className="mt-2 text-secondary-600 dark:text-secondary-400 max-w-md mx-auto">
          AI will analyze the document to discover all extractable fields including header
          information, line items, and totals.
        </p>
      </div>

      {/* Document type hint selector */}
      <div className="max-w-sm mx-auto">
        <label
          htmlFor="document-type"
          className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2"
        >
          Document Type (optional)
        </label>
        <select
          id="document-type"
          value={selectedTypeHint}
          onChange={(e) => setSelectedTypeHint(e.target.value as DocumentTypeHint | '')}
          className="block w-full rounded-lg border-secondary-300 dark:border-secondary-600
                     bg-white dark:bg-brand-navy-600 text-secondary-900 dark:text-secondary-100
                     shadow-sm focus:border-primary-500 focus:ring-primary-500"
          disabled={isLoading}
        >
          <option value="">Auto-detect</option>
          {DOCUMENT_TYPE_HINTS.map((hint) => (
            <option key={hint} value={hint}>
              {hint.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-secondary-500 dark:text-secondary-400">
          Providing a hint can improve field detection accuracy
        </p>
      </div>

      {/* Analyze button */}
      <div className="flex justify-center pt-4">
        <Button
          onClick={handleAnalyze}
          disabled={isLoading}
          variant="primary"
          size="lg"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Analyzing...
            </>
          ) : (
            <>
              <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
              Analyze Document
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
