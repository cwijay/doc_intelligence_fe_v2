'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  DocumentChartBarIcon,
  FolderIcon,
  CalendarIcon,
  Cog6ToothIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import Modal from '@/components/ui/Modal';
import FormModalHeader from '@/components/ui/FormModalHeader';
import FormModalFooter from '@/components/ui/FormModalFooter';
import { useCreateReport } from '@/hooks/useReports';
import { useFolders } from '@/hooks/useFolders';
import { CreateReportRequest, ReportType, REPORT_TYPE_OPTIONS } from '@/types/reports';
import toast from 'react-hot-toast';

interface CreateReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgId: string;
}

interface CreateReportFormData {
  folder_id: string;
  report_type: ReportType;
  date_range_start?: string;
  date_range_end?: string;
  include_charts: boolean;
  include_recommendations: boolean;
  output_format: 'pdf' | 'excel' | 'json';
}

export function CreateReportModal({ isOpen, onClose, orgId }: CreateReportModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'folder' | 'type' | 'options'>('folder');
  const createReport = useCreateReport();
  const { data: foldersData, isLoading: foldersLoading } = useFolders(orgId, {}, isOpen);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateReportFormData>({
    mode: 'onChange',
    defaultValues: {
      folder_id: '',
      report_type: 'expense_summary',
      include_charts: true,
      include_recommendations: true,
      output_format: 'pdf',
    },
  });

  const selectedFolderId = watch('folder_id');
  const selectedReportType = watch('report_type');

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      reset();
      setStep('folder');
    }
  }, [isOpen, reset]);

  const onSubmit = async (data: CreateReportFormData) => {
    if (!orgId) {
      toast.error('Organization ID is required');
      return;
    }

    try {
      setIsSubmitting(true);

      const request: CreateReportRequest = {
        folder_id: data.folder_id,
        report_type: data.report_type,
        include_charts: data.include_charts,
        include_recommendations: data.include_recommendations,
        output_format: data.output_format,
      };

      if (data.date_range_start) {
        request.date_range_start = data.date_range_start;
      }
      if (data.date_range_end) {
        request.date_range_end = data.date_range_end;
      }

      const result = await createReport.mutateAsync(request);

      toast.success(`Report generation started! ID: ${result.report_id.slice(0, 8)}...`);
      reset();
      onClose();
    } catch (error) {
      console.error('Failed to create report:', error);
      let errorMessage = 'Failed to create report. Please try again.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      reset();
      setStep('folder');
      onClose();
    }
  };

  const folders = foldersData?.folders || [];

  const selectedReportOption = REPORT_TYPE_OPTIONS.find(
    (opt) => opt.value === selectedReportType
  );

  const canProceedFromFolder = !!selectedFolderId;
  const canProceedFromType = !!selectedReportType;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg" title="Generate Report">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <FormModalHeader
          icon={<DocumentChartBarIcon className="w-6 h-6" />}
          title="Business Intelligence Report"
          description="Generate insights from your document data"
        />

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {['folder', 'type', 'options'].map((s, i) => (
            <React.Fragment key={s}>
              <button
                type="button"
                onClick={() => {
                  if (s === 'folder') setStep('folder');
                  else if (s === 'type' && canProceedFromFolder) setStep('type');
                  else if (s === 'options' && canProceedFromFolder && canProceedFromType)
                    setStep('options');
                }}
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                  step === s
                    ? 'bg-primary-600 text-white'
                    : s === 'folder' ||
                      (s === 'type' && canProceedFromFolder) ||
                      (s === 'options' && canProceedFromFolder && canProceedFromType)
                    ? 'bg-gray-200 dark:bg-secondary-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-secondary-600'
                    : 'bg-gray-100 dark:bg-secondary-800 text-gray-400 cursor-not-allowed'
                }`}
              >
                {i + 1}
              </button>
              {i < 2 && (
                <div
                  className={`w-12 h-1 rounded ${
                    (s === 'folder' && canProceedFromFolder) ||
                    (s === 'type' && canProceedFromFolder && canProceedFromType)
                      ? 'bg-primary-600'
                      : 'bg-gray-200 dark:bg-secondary-700'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step 1: Select Folder */}
        {step === 'folder' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <FolderIcon className="h-5 w-5 text-primary-600" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Select Document Folder
              </h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Choose a folder containing documents to analyze for this report.
            </p>

            {foldersLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : folders.length === 0 ? (
              <div className="text-center p-8 bg-gray-50 dark:bg-secondary-800 rounded-lg">
                <FolderIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">
                  No folders found. Please create a folder and upload documents first.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
                {folders.map((folder) => (
                  <label
                    key={folder.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedFolderId === folder.id
                        ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-secondary-700 hover:border-primary-300 dark:hover:border-primary-700'
                    }`}
                  >
                    <input
                      type="radio"
                      {...register('folder_id', { required: 'Please select a folder' })}
                      value={folder.id}
                      className="sr-only"
                    />
                    <div
                      className={`flex items-center justify-center w-5 h-5 rounded-full border-2 ${
                        selectedFolderId === folder.id
                          ? 'border-primary-600 bg-primary-600'
                          : 'border-gray-300 dark:border-secondary-600'
                      }`}
                    >
                      {selectedFolderId === folder.id && (
                        <CheckIcon className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <FolderIcon className="h-5 w-5 text-yellow-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {folder.name}
                      </p>
                      {folder.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {folder.description}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {folder.document_count || 0} docs
                    </span>
                  </label>
                ))}
              </div>
            )}
            {errors.folder_id && (
              <p className="text-sm text-red-600">{errors.folder_id.message}</p>
            )}

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => setStep('type')}
                disabled={!canProceedFromFolder}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next: Select Report Type
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Select Report Type */}
        {step === 'type' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <DocumentChartBarIcon className="h-5 w-5 text-primary-600" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Select Report Type
              </h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Choose the type of analysis you want to run on your documents.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {REPORT_TYPE_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`flex flex-col p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedReportType === option.value
                      ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-secondary-700 hover:border-primary-300 dark:hover:border-primary-700'
                  }`}
                >
                  <input
                    type="radio"
                    {...register('report_type', { required: 'Please select a report type' })}
                    value={option.value}
                    className="sr-only"
                  />
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {option.label}
                    </span>
                    {selectedReportType === option.value && (
                      <CheckIcon className="w-5 h-5 text-primary-600" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{option.description}</p>
                </label>
              ))}
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep('folder')}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-secondary-600 rounded-lg hover:bg-gray-50 dark:hover:bg-secondary-700"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep('options')}
                disabled={!canProceedFromType}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next: Options
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Options */}
        {step === 'options' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Cog6ToothIcon className="h-5 w-5 text-primary-600" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Report Options
              </h3>
            </div>

            {/* Selected Summary */}
            <div className="p-4 bg-gray-50 dark:bg-secondary-800 rounded-lg">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-medium">Report Type:</span> {selectedReportOption?.label}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {selectedReportOption?.description}
              </p>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Start Date (Optional)
                </label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="date"
                    {...register('date_range_start')}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  End Date (Optional)
                </label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="date"
                    {...register('date_range_end')}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
            </div>

            {/* Checkboxes */}
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('include_charts')}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Include charts and visualizations
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('include_recommendations')}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Include AI-generated recommendations
                </span>
              </label>
            </div>

            {/* Output Format */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Output Format
              </label>
              <div className="flex gap-3">
                {[
                  { value: 'pdf', label: 'PDF' },
                  { value: 'excel', label: 'Excel' },
                  { value: 'json', label: 'JSON' },
                ].map((format) => (
                  <label
                    key={format.value}
                    className={`flex-1 flex items-center justify-center p-3 rounded-lg border cursor-pointer transition-all ${
                      watch('output_format') === format.value
                        ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-secondary-700 hover:border-primary-300'
                    }`}
                  >
                    <input
                      type="radio"
                      {...register('output_format')}
                      value={format.value}
                      className="sr-only"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {format.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep('type')}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-secondary-600 rounded-lg hover:bg-gray-50 dark:hover:bg-secondary-700"
              >
                Back
              </button>
            </div>
          </div>
        )}

        {step === 'options' && (
          <FormModalFooter
            onCancel={handleClose}
            isSubmitting={isSubmitting}
            isDisabled={!canProceedFromFolder || !canProceedFromType}
            submitText="Generate Report"
            submittingText="Starting..."
            cancelVariant="outline"
          />
        )}
      </form>
    </Modal>
  );
}
