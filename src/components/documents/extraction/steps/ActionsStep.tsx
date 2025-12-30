'use client';

import React from 'react';
import Button from '@/components/ui/Button';
import {
  CloudArrowUpIcon,
  ArrowDownTrayIcon,
  DocumentDuplicateIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { UseExtractionReturn } from '@/hooks/extraction';

export interface ActionsStepProps {
  extraction: UseExtractionReturn;
}

export function ActionsStep({ extraction }: ActionsStepProps) {
  const {
    isLoading,
    extractedData,
    extractionJobId,
    selectedTemplate,
    saveExtractedData,
    exportToExcel,
  } = extraction;

  const [savedToDb, setSavedToDb] = React.useState(false);
  const [exportedExcel, setExportedExcel] = React.useState(false);

  const handleSave = async () => {
    await saveExtractedData();
    setSavedToDb(true);
  };

  const handleExport = async () => {
    await exportToExcel();
    setExportedExcel(true);
  };

  const handleCopyJson = () => {
    if (extractedData) {
      navigator.clipboard.writeText(JSON.stringify(extractedData, null, 2));
    }
  };

  if (!extractedData) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <p className="text-secondary-500 dark:text-secondary-400">
            No extracted data available. Please go back and extract data first.
          </p>
        </div>
      </div>
    );
  }

  const fieldCount = Object.keys(extractedData).length;

  return (
    <div className="space-y-8">
      {/* Summary */}
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
          <CheckCircleIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100">
          Extraction Complete!
        </h3>
        <p className="mt-2 text-secondary-600 dark:text-secondary-400">
          Successfully extracted {fieldCount} field{fieldCount !== 1 ? 's' : ''} from the document
        </p>
        {selectedTemplate && (
          <p className="text-sm text-secondary-500 dark:text-secondary-400 mt-1">
            Using template: {selectedTemplate.name}
          </p>
        )}
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Save to Database */}
        <div className="border border-secondary-200 dark:border-secondary-700 rounded-lg p-6 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
            <CloudArrowUpIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h4 className="text-sm font-medium text-secondary-900 dark:text-secondary-100 mb-2">
            Save to Database
          </h4>
          <p className="text-xs text-secondary-500 dark:text-secondary-400 mb-4">
            Store extracted data for later querying and analysis
          </p>
          <Button
            onClick={handleSave}
            disabled={isLoading || savedToDb}
            variant={savedToDb ? 'outline' : 'primary'}
            size="sm"
            className="w-full"
          >
            {savedToDb ? (
              <>
                <CheckCircleIcon className="h-4 w-4 mr-2" />
                Saved
              </>
            ) : isLoading ? (
              'Saving...'
            ) : (
              <>
                <CloudArrowUpIcon className="h-4 w-4 mr-2" />
                Save
              </>
            )}
          </Button>
        </div>

        {/* Export to Excel */}
        <div className="border border-secondary-200 dark:border-secondary-700 rounded-lg p-6 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
            <ArrowDownTrayIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <h4 className="text-sm font-medium text-secondary-900 dark:text-secondary-100 mb-2">
            Export to Excel
          </h4>
          <p className="text-xs text-secondary-500 dark:text-secondary-400 mb-4">
            Download extracted data as an Excel spreadsheet
          </p>
          <Button
            onClick={handleExport}
            disabled={isLoading || !extractionJobId}
            variant={exportedExcel ? 'outline' : 'primary'}
            size="sm"
            className="w-full"
          >
            {exportedExcel ? (
              <>
                <CheckCircleIcon className="h-4 w-4 mr-2" />
                Downloaded
              </>
            ) : isLoading ? (
              'Exporting...'
            ) : (
              <>
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                Download
              </>
            )}
          </Button>
        </div>

        {/* Copy JSON */}
        <div className="border border-secondary-200 dark:border-secondary-700 rounded-lg p-6 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 mb-4">
            <DocumentDuplicateIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <h4 className="text-sm font-medium text-secondary-900 dark:text-secondary-100 mb-2">
            Copy JSON
          </h4>
          <p className="text-xs text-secondary-500 dark:text-secondary-400 mb-4">
            Copy extracted data as JSON to clipboard
          </p>
          <Button
            onClick={handleCopyJson}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <DocumentDuplicateIcon className="h-4 w-4 mr-2" />
            Copy
          </Button>
        </div>
      </div>

      {/* JSON Preview */}
      <div className="border border-secondary-200 dark:border-secondary-700 rounded-lg overflow-hidden">
        <div className="bg-secondary-50 dark:bg-secondary-800 px-4 py-2 border-b border-secondary-200 dark:border-secondary-700 flex items-center justify-between">
          <h4 className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
            Extracted Data (JSON)
          </h4>
          <Button variant="ghost" size="sm" onClick={handleCopyJson}>
            <DocumentDuplicateIcon className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-4 bg-secondary-900 dark:bg-brand-navy-800 max-h-[200px] overflow-auto">
          <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">
            {JSON.stringify(extractedData, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
