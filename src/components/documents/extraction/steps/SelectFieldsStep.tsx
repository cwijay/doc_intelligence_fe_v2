'use client';

import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import { clsx } from 'clsx';
import {
  CheckIcon,
  DocumentDuplicateIcon,
  PlusIcon,
  BookmarkIcon,
} from '@heroicons/react/24/outline';
import { UseExtractionReturn } from '@/hooks/extraction';
import { useTemplates } from '@/hooks/extraction';
import { DiscoveredField, TemplateInfo } from '@/types/extraction';

export interface SelectFieldsStepProps {
  extraction: UseExtractionReturn;
}

// =============================================================================
// Field Row Component
// =============================================================================

interface FieldRowProps {
  field: DiscoveredField;
  isSelected: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

function FieldRow({ field, isSelected, onToggle, disabled }: FieldRowProps) {
  return (
    <tr
      className={clsx(
        'cursor-pointer transition-colors',
        isSelected
          ? 'bg-primary-50 dark:bg-primary-900/20'
          : 'hover:bg-secondary-50 dark:hover:bg-secondary-800/50',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      onClick={disabled ? undefined : onToggle}
    >
      <td className="px-4 py-3 whitespace-nowrap">
        <div
          className={clsx(
            'h-5 w-5 rounded border-2 flex items-center justify-center transition-colors',
            isSelected
              ? 'bg-primary-600 border-primary-600'
              : 'border-secondary-300 dark:border-secondary-600'
          )}
        >
          {isSelected && <CheckIcon className="h-3 w-3 text-white" />}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
          {field.display_name}
        </div>
        <div className="text-xs text-secondary-500 dark:text-secondary-400">
          {field.field_name}
        </div>
      </td>
      <td className="px-4 py-3">
        <span
          className={clsx(
            'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
            {
              'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400':
                field.data_type === 'string',
              'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400':
                field.data_type === 'number',
              'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400':
                field.data_type === 'date',
              'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400':
                field.data_type === 'currency',
              'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400':
                field.data_type === 'boolean',
              'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400':
                field.data_type === 'array',
            }
          )}
        >
          {field.data_type}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-secondary-600 dark:text-secondary-400">
          {field.location.replace(/_/g, ' ')}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-16 h-1.5 bg-secondary-200 dark:bg-secondary-700 rounded-full overflow-hidden">
            <div
              className={clsx(
                'h-full rounded-full',
                field.confidence >= 0.8
                  ? 'bg-green-500'
                  : field.confidence >= 0.5
                  ? 'bg-amber-500'
                  : 'bg-red-500'
              )}
              style={{ width: `${field.confidence * 100}%` }}
            />
          </div>
          <span className="text-xs text-secondary-500 dark:text-secondary-400">
            {Math.round(field.confidence * 100)}%
          </span>
        </div>
      </td>
      <td className="px-4 py-3">
        <span
          className="text-sm text-secondary-500 dark:text-secondary-400 max-w-[150px] truncate block"
          title={field.sample_value || '-'}
        >
          {field.sample_value || '-'}
        </span>
      </td>
    </tr>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function SelectFieldsStep({ extraction }: SelectFieldsStepProps) {
  const {
    isLoading,
    discoveredFields,
    lineItemFields,
    selectedFields,
    selectedTemplate,
    documentType,
    toggleFieldSelection,
    selectAllFields,
    clearFieldSelections,
    selectTemplate,
    generateSchema,
  } = extraction;

  const { templates, isLoading: templatesLoading } = useTemplates();

  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [saveAsTemplate, setSaveAsTemplate] = useState(true);

  const allFields = [...discoveredFields, ...lineItemFields];
  const selectedFieldNames = new Set(selectedFields.map((f) => f.field_name));

  const isFieldSelected = (field: DiscoveredField) =>
    selectedFieldNames.has(field.field_name);

  // Template selection disables manual field selection
  const isManualSelectionDisabled = !!selectedTemplate;

  const handleGenerateSchema = async () => {
    if (!templateName.trim()) {
      return;
    }
    await generateSchema(templateName, saveAsTemplate);
  };

  const handleTemplateSelect = (template: TemplateInfo | null) => {
    selectTemplate(template);
    if (template) {
      setShowSaveTemplate(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Template selector */}
      <div className="bg-secondary-50 dark:bg-secondary-800/50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <DocumentDuplicateIcon className="h-5 w-5 text-secondary-500" />
            <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
              Use Existing Template
            </span>
          </div>
          {selectedTemplate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleTemplateSelect(null)}
            >
              Clear
            </Button>
          )}
        </div>

        {templatesLoading ? (
          <div className="text-sm text-secondary-500">Loading templates...</div>
        ) : templates.length === 0 ? (
          <div className="text-sm text-secondary-500 dark:text-secondary-400">
            No saved templates. Select fields below to create one.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {templates.map((template) => (
              <button
                key={template.name}
                onClick={() => handleTemplateSelect(template)}
                className={clsx(
                  'inline-flex items-center px-3 py-1.5 rounded-lg text-sm transition-colors',
                  selectedTemplate?.name === template.name
                    ? 'bg-primary-600 text-white'
                    : 'bg-white dark:bg-secondary-700 border border-secondary-300 dark:border-secondary-600 text-secondary-700 dark:text-secondary-300 hover:border-primary-500 hover:text-primary-600'
                )}
              >
                <BookmarkIcon className="h-4 w-4 mr-1.5" />
                {template.name}
                <span className="ml-1.5 text-xs opacity-75">
                  ({template.field_count} fields)
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-secondary-200 dark:border-secondary-700" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white dark:bg-brand-navy-600 text-secondary-500">
            or select fields manually
          </span>
        </div>
      </div>

      {/* Field selection controls */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-secondary-600 dark:text-secondary-400">
          {selectedFields.length} of {allFields.length} fields selected
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFieldSelections}
            disabled={selectedFields.length === 0 || isManualSelectionDisabled}
          >
            Clear All
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={selectAllFields}
            disabled={
              selectedFields.length === allFields.length || isManualSelectionDisabled
            }
          >
            Select All
          </Button>
        </div>
      </div>

      {/* Fields table */}
      <div className="border border-secondary-200 dark:border-secondary-700 rounded-lg overflow-hidden">
        <div className="max-h-[400px] min-h-[200px] overflow-y-auto">
          <table className="min-w-full divide-y divide-secondary-200 dark:divide-secondary-700">
            <thead className="bg-secondary-50 dark:bg-secondary-800 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider w-12">
                  <span className="sr-only">Select</span>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                  Field
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                  Confidence
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                  Sample
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-brand-navy-600 divide-y divide-secondary-200 dark:divide-secondary-700">
              {discoveredFields.length > 0 && (
                <>
                  <tr className="bg-secondary-100 dark:bg-secondary-800/80">
                    <td
                      colSpan={6}
                      className="px-4 py-2 text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase"
                    >
                      Header / Footer Fields
                    </td>
                  </tr>
                  {discoveredFields.map((field) => (
                    <FieldRow
                      key={field.field_name}
                      field={field}
                      isSelected={isFieldSelected(field)}
                      onToggle={() => toggleFieldSelection(field)}
                      disabled={isManualSelectionDisabled}
                    />
                  ))}
                </>
              )}
              {lineItemFields.length > 0 && (
                <>
                  <tr className="bg-secondary-100 dark:bg-secondary-800/80">
                    <td
                      colSpan={6}
                      className="px-4 py-2 text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase"
                    >
                      Line Item Fields
                    </td>
                  </tr>
                  {lineItemFields.map((field) => (
                    <FieldRow
                      key={field.field_name}
                      field={field}
                      isSelected={isFieldSelected(field)}
                      onToggle={() => toggleFieldSelection(field)}
                      disabled={isManualSelectionDisabled}
                    />
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Save as template section */}
      {selectedFields.length > 0 && !selectedTemplate && (
        <div className="border border-secondary-200 dark:border-secondary-700 rounded-lg p-4">
          {!showSaveTemplate ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSaveTemplate(true)}
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Save as Template
            </Button>
          ) : (
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="template-name"
                  className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1"
                >
                  Template Name
                </label>
                <input
                  type="text"
                  id="template-name"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder={`${documentType || 'document'}_template`}
                  className="block w-full rounded-lg border-secondary-300 dark:border-secondary-600
                             bg-white dark:bg-brand-navy-600 text-secondary-900 dark:text-secondary-100
                             shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="save-template"
                  checked={saveAsTemplate}
                  onChange={(e) => setSaveAsTemplate(e.target.checked)}
                  className="h-4 w-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                />
                <label
                  htmlFor="save-template"
                  className="text-sm text-secondary-600 dark:text-secondary-400"
                >
                  Save for future use
                </label>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowSaveTemplate(false);
                    setTemplateName('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleGenerateSchema}
                  disabled={!templateName.trim() || isLoading}
                >
                  {isLoading ? 'Generating...' : 'Generate Schema'}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Continue with template */}
      {selectedTemplate && (
        <div className="text-center text-sm text-secondary-600 dark:text-secondary-400">
          Using template &quot;{selectedTemplate.name}&quot; with {selectedTemplate.field_count} fields.
          Click &quot;Next&quot; to extract data.
        </div>
      )}
    </div>
  );
}
