'use client';

import React from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { clsx } from 'clsx';
import {
  BookmarkIcon,
  DocumentMagnifyingGlassIcon,
  CheckCircleIcon,
  FolderIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { UseTemplateSelectionReturn } from '@/hooks/extraction/useTemplateSelection';
import { TemplateInfo, TemplateField } from '@/types/extraction';

// =============================================================================
// Types
// =============================================================================

export interface TemplateSelectionModalProps {
  selection: UseTemplateSelectionReturn;
}

// =============================================================================
// Field Type Badge Component
// =============================================================================

interface FieldTypeBadgeProps {
  dataType: string;
}

function FieldTypeBadge({ dataType }: FieldTypeBadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
        {
          'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400':
            dataType === 'string',
          'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400':
            dataType === 'number',
          'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400':
            dataType === 'date',
          'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400':
            dataType === 'currency',
          'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400':
            dataType === 'boolean',
          'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400':
            dataType === 'array' || dataType === 'object',
        }
      )}
    >
      {dataType}
    </span>
  );
}

// =============================================================================
// Location Badge Component
// =============================================================================

interface LocationBadgeProps {
  location?: string;
}

function LocationBadge({ location }: LocationBadgeProps) {
  if (!location) return null;

  const locationLabel = location.replace(/_/g, ' ');

  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary-100 text-secondary-600 dark:bg-secondary-800 dark:text-secondary-400">
      {locationLabel}
    </span>
  );
}

// =============================================================================
// Template Card Component
// =============================================================================

interface TemplateCardProps {
  template: TemplateInfo;
  isSelected: boolean;
  onSelect: () => void;
}

function TemplateCard({ template, isSelected, onSelect }: TemplateCardProps) {
  return (
    <button
      onClick={onSelect}
      className={clsx(
        'w-full text-left p-4 rounded-lg border-2 transition-all',
        isSelected
          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
          : 'border-secondary-200 dark:border-secondary-700 hover:border-primary-300 dark:hover:border-primary-700 bg-white dark:bg-brand-navy-600'
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={clsx(
              'flex items-center justify-center w-8 h-8 rounded-full',
              isSelected
                ? 'bg-primary-500 text-white'
                : 'bg-secondary-100 dark:bg-secondary-800 text-secondary-500 dark:text-secondary-400'
            )}
          >
            {isSelected ? (
              <CheckCircleIcon className="w-5 h-5" />
            ) : (
              <BookmarkIcon className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="font-medium text-secondary-900 dark:text-secondary-100">
              {template.name}
            </div>
            <div className="text-xs text-secondary-500 dark:text-secondary-400">
              {template.document_type} &middot; {template.field_count} fields
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

// =============================================================================
// Fields Preview Component
// =============================================================================

interface FieldsPreviewProps {
  fields: TemplateField[];
  isLoading: boolean;
}

function FieldsPreview({ fields, isLoading }: FieldsPreviewProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center gap-2 text-secondary-500 dark:text-secondary-400">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-secondary-300 border-t-primary-500" />
          <span>Loading template fields...</span>
        </div>
      </div>
    );
  }

  if (fields.length === 0) {
    return (
      <div className="text-center py-8 text-secondary-500 dark:text-secondary-400">
        Select a template to preview its fields
      </div>
    );
  }

  // Group fields by location
  const groupedFields: Record<string, TemplateField[]> = {
    header: [],
    body: [],
    footer: [],
    line_item: [],
  };

  for (const field of fields) {
    const location = field.location || 'body';
    if (groupedFields[location]) {
      groupedFields[location].push(field);
    } else {
      groupedFields.body.push(field);
    }
  }

  const locationOrder = ['header', 'body', 'footer', 'line_item'];
  const locationLabels: Record<string, string> = {
    header: 'Header Fields',
    body: 'Body Fields',
    footer: 'Footer Fields',
    line_item: 'Line Item Fields',
  };

  return (
    <div className="space-y-4">
      {locationOrder.map(location => {
        const locationFields = groupedFields[location];
        if (locationFields.length === 0) return null;

        return (
          <div key={location}>
            <h4 className="text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase mb-2">
              {locationLabels[location]} ({locationFields.length})
            </h4>
            <div className="space-y-1">
              {locationFields.map(field => (
                <div
                  key={field.field_name}
                  className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-secondary-50 dark:bg-secondary-800/50"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-secondary-900 dark:text-secondary-100">
                      {field.display_name}
                    </span>
                    {field.required && (
                      <span className="text-xs text-red-500">*</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <FieldTypeBadge dataType={field.data_type} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// =============================================================================
// Empty State Component
// =============================================================================

interface EmptyStateProps {
  folderName: string | null;
}

function EmptyState({ folderName }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <ExclamationCircleIcon className="mx-auto h-12 w-12 text-secondary-300 dark:text-secondary-600" />
      <h3 className="mt-4 text-sm font-medium text-secondary-900 dark:text-secondary-100">
        No matching templates
      </h3>
      <p className="mt-2 text-sm text-secondary-500 dark:text-secondary-400">
        No templates found for the &quot;{folderName}&quot; folder.
        <br />
        Click &quot;Analyze New Document&quot; to discover extractable fields.
      </p>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function TemplateSelectionModal({ selection }: TemplateSelectionModalProps) {
  const {
    isModalOpen,
    closeModal,
    document,
    folderName,
    filteredTemplates,
    isLoadingTemplates,
    selectedTemplate,
    templateFields,
    isLoadingFields,
    error,
    selectTemplate,
    proceedWithTemplate,
    proceedWithAnalyze,
  } = selection;

  const hasTemplates = filteredTemplates.length > 0;
  const canUseTemplate = selectedTemplate !== null && templateFields.length > 0 && !isLoadingFields;

  if (!document) return null;

  return (
    <Modal
      isOpen={isModalOpen}
      onClose={closeModal}
      title="Select Extraction Template"
      size="3xl"
      className="max-h-[90vh]"
    >
      <div className="space-y-6">
        {/* Document & Folder context */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 text-secondary-600 dark:text-secondary-400">
            <span className="font-medium">Document:</span>
            <span>{document.name}</span>
          </div>
          <div className="flex items-center gap-2 text-secondary-600 dark:text-secondary-400">
            <FolderIcon className="w-4 h-4" />
            <span className="font-medium">Folder:</span>
            <span>{folderName}</span>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Main content area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Template list */}
          <div>
            <h3 className="text-sm font-medium text-secondary-900 dark:text-secondary-100 mb-3">
              Available Templates
              {!isLoadingTemplates && (
                <span className="ml-2 text-secondary-500 dark:text-secondary-400">
                  ({filteredTemplates.length} matching)
                </span>
              )}
            </h3>

            {isLoadingTemplates ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-2 text-secondary-500 dark:text-secondary-400">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-secondary-300 border-t-primary-500" />
                  <span>Loading templates...</span>
                </div>
              </div>
            ) : hasTemplates ? (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                {filteredTemplates.map(template => (
                  <TemplateCard
                    key={template.name}
                    template={template}
                    isSelected={selectedTemplate?.name === template.name}
                    onSelect={() => selectTemplate(template)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState folderName={folderName} />
            )}
          </div>

          {/* Right: Fields preview */}
          <div>
            <h3 className="text-sm font-medium text-secondary-900 dark:text-secondary-100 mb-3">
              Template Fields Preview
              {selectedTemplate && templateFields.length > 0 && (
                <span className="ml-2 text-secondary-500 dark:text-secondary-400">
                  ({templateFields.length} fields)
                </span>
              )}
            </h3>

            <div className="border border-secondary-200 dark:border-secondary-700 rounded-lg p-4 max-h-[300px] overflow-y-auto bg-white dark:bg-brand-navy-600">
              <FieldsPreview fields={templateFields} isLoading={isLoadingFields} />
            </div>
          </div>
        </div>

        {/* Footer with actions */}
        <div className="flex justify-between items-center pt-6 border-t border-secondary-200 dark:border-secondary-700">
          <Button onClick={closeModal} variant="outline">
            Cancel
          </Button>

          <div className="flex gap-3">
            <Button
              onClick={proceedWithAnalyze}
              variant="outline"
              className="flex items-center gap-2"
            >
              <DocumentMagnifyingGlassIcon className="w-4 h-4" />
              Analyze New Document
            </Button>

            <Button
              onClick={proceedWithTemplate}
              variant="primary"
              disabled={!canUseTemplate}
              className="flex items-center gap-2"
            >
              <BookmarkIcon className="w-4 h-4" />
              Use Selected Template
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default TemplateSelectionModal;
