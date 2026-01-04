'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import FileUpload from '@/components/ui/FileUpload';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Button from '@/components/ui/Button';
import BulkUploadProgress from '@/components/documents/BulkUploadProgress';
import { useDocumentUpload } from '@/hooks/useDocumentUpload';
import { useBulkUpload, useCancelBulkJob, useRetryBulkJob } from '@/hooks/useBulkUpload';
import { useAuth } from '@/hooks/useAuth';
import { Folder } from '@/types/api';
import {
  InformationCircleIcon,
  PencilSquareIcon,
  DocumentDuplicateIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

interface DocumentUploadSectionProps {
  isVisible: boolean;
  folders: Folder[];
  selectedUploadFolder: string | null;
  onFolderChange: (folderId: string | null) => void;
  selectedViewFolder?: string | null;
}

export default function DocumentUploadSection({
  isVisible,
  folders,
  selectedUploadFolder,
  onFolderChange,
  selectedViewFolder,
}: DocumentUploadSectionProps) {
  // Auth hook to get org_name
  const { user } = useAuth();

  // Single upload hook
  const {
    handleUpload,
    duplicateConflict,
    isReplacing,
    handleForceUpload,
    clearDuplicateConflict
  } = useDocumentUpload();

  // Bulk upload state
  const [isBulkMode, setIsBulkMode] = useState(false);

  // Bulk upload hook
  const {
    isUploading: isBulkUploading,
    jobId,
    jobStatus,
    isPolling,
    uploadProgress,
    upload: bulkUpload,
    reset: resetBulkUpload,
  } = useBulkUpload({
    onComplete: (job) => {
      console.log('Bulk job completed:', job);
    },
  });

  // Cancel and retry hooks
  const { cancelJob, isCancelling } = useCancelBulkJob();
  const { retryFailed, isRetrying } = useRetryBulkJob();

  console.log('📦 DocumentUploadSection render:', { isVisible, isBulkMode, jobStatus, isBulkUploading });

  if (!isVisible) return null;

  const onUpload = (files: File[]) => {
    handleUpload(files, selectedUploadFolder, selectedViewFolder);
  };

  // Handle bulk upload
  const onBulkUpload = async (files: File[], folderName: string) => {
    const orgName = user?.org_name;
    if (!orgName) {
      throw new Error('Organization name not available. Please refresh the page and try again.');
    }
    const result = await bulkUpload(folderName, orgName, files);
    if (!result) {
      throw new Error('Bulk upload failed');
    }
  };

  // Handle cancel bulk job
  const handleCancelJob = async () => {
    if (jobId) {
      await cancelJob(jobId);
    }
  };

  // Handle retry failed documents
  const handleRetryFailed = async (documentIds?: string[]) => {
    if (jobId) {
      await retryFailed(jobId, documentIds);
    }
  };

  // Handle dismiss progress
  const handleDismissProgress = () => {
    resetBulkUpload();
    setIsBulkMode(false);
  };

  // Format the upload date for display
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="mb-8"
      >
        <Card>
          <CardHeader>
            <CardTitle>Upload New Documents</CardTitle>
            <CardDescription>
              Choose an upload mode below, then drag and drop your files for AI-powered analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Upload Mode Selection Cards */}
            {!jobStatus && !isBulkUploading && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Single Document Card */}
                <button
                  type="button"
                  onClick={() => setIsBulkMode(false)}
                  className={`relative p-5 rounded-xl border-2 text-left transition-all duration-200 ${
                    !isBulkMode
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-md'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm'
                  }`}
                >
                  {/* Selected indicator */}
                  {!isBulkMode && (
                    <div className="absolute top-3 right-3 flex items-center space-x-1 bg-primary-500 text-white text-xs font-medium px-2 py-1 rounded-full">
                      <CheckIcon className="w-3 h-3" />
                      <span>Selected</span>
                    </div>
                  )}

                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
                    !isBulkMode
                      ? 'bg-primary-100 dark:bg-primary-800'
                      : 'bg-gray-100 dark:bg-gray-800'
                  }`}>
                    <PencilSquareIcon className={`w-6 h-6 ${
                      !isBulkMode
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-gray-500 dark:text-gray-400'
                    }`} />
                  </div>

                  {/* Title */}
                  <h3 className={`font-semibold text-lg mb-2 ${
                    !isBulkMode
                      ? 'text-primary-900 dark:text-primary-100'
                      : 'text-gray-900 dark:text-gray-100'
                  }`}>
                    Single Document
                  </h3>

                  {/* Benefits */}
                  <ul className={`space-y-1.5 text-sm ${
                    !isBulkMode
                      ? 'text-primary-700 dark:text-primary-300'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Best for <strong>handwritten</strong> content</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Extract data to <strong>tables/Excel</strong></span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Advanced OCR processing</span>
                    </li>
                  </ul>
                </button>

                {/* Bulk Upload Card */}
                <button
                  type="button"
                  onClick={() => {
                    console.log('🔘 Bulk Upload card clicked, setting isBulkMode to true');
                    setIsBulkMode(true);
                  }}
                  className={`relative p-5 rounded-xl border-2 text-left transition-all duration-200 ${
                    isBulkMode
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-md'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm'
                  }`}
                >
                  {/* Selected indicator */}
                  {isBulkMode && (
                    <div className="absolute top-3 right-3 flex items-center space-x-1 bg-primary-500 text-white text-xs font-medium px-2 py-1 rounded-full">
                      <CheckIcon className="w-3 h-3" />
                      <span>Selected</span>
                    </div>
                  )}

                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
                    isBulkMode
                      ? 'bg-primary-100 dark:bg-primary-800'
                      : 'bg-gray-100 dark:bg-gray-800'
                  }`}>
                    <DocumentDuplicateIcon className={`w-6 h-6 ${
                      isBulkMode
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-gray-500 dark:text-gray-400'
                    }`} />
                  </div>

                  {/* Title */}
                  <h3 className={`font-semibold text-lg mb-2 ${
                    isBulkMode
                      ? 'text-primary-900 dark:text-primary-100'
                      : 'text-gray-900 dark:text-gray-100'
                  }`}>
                    Bulk Upload
                  </h3>

                  {/* Benefits */}
                  <ul className={`space-y-1.5 text-sm ${
                    isBulkMode
                      ? 'text-primary-700 dark:text-primary-300'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Upload up to <strong>10 documents</strong> at once</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>For <strong>typed/readable</strong> documents</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Batch AI processing (summary, FAQs, Q&A)</span>
                    </li>
                  </ul>
                </button>
              </div>
            )}

            {/* Bulk mode instructions */}
            {isBulkMode && !jobStatus && !isBulkUploading && (
              <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-start space-x-3">
                  <InformationCircleIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    <p className="font-medium mb-2">Bulk Upload Workflow:</p>
                    <ol className="list-decimal list-inside space-y-1 text-blue-700 dark:text-blue-300">
                      <li>Select a destination folder from the dropdown below</li>
                      <li>Drag & drop or select multiple files (up to 10)</li>
                      <li>Review the files in the list that appears</li>
                      <li>Click <span className="font-semibold">"Start Bulk Upload"</span> to begin processing</li>
                    </ol>
                    <p className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                      All files will be uploaded and processed together with AI-powered analysis (summary, FAQs, questions).
                    </p>
                  </div>
                </div>
              </div>
            )}

            <AnimatePresence mode="wait">
              {/* Show bulk upload progress if job is active */}
              {jobStatus ? (
                <motion.div
                  key="bulk-progress"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <BulkUploadProgress
                    jobStatus={jobStatus}
                    isPolling={isPolling}
                    onCancel={handleCancelJob}
                    onRetryFailed={handleRetryFailed}
                    onDismiss={handleDismissProgress}
                    isCancelling={isCancelling}
                    isRetrying={isRetrying}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key={isBulkMode ? 'bulk-upload' : 'single-upload'}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <FileUpload
                    key={`file-upload-${isBulkMode ? 'bulk' : 'single'}`}
                    onUpload={onUpload}
                    folders={folders}
                    selectedFolder={selectedUploadFolder}
                    onFolderChange={onFolderChange}
                    showFolderSelection={true}
                    mode={isBulkMode ? 'bulk' : 'single'}
                    onBulkUpload={onBulkUpload}
                    isBulkUploading={isBulkUploading}
                    bulkUploadProgress={uploadProgress}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      {/* Duplicate File Conflict Dialog */}
      <ConfirmDialog
        isOpen={!!duplicateConflict}
        onClose={clearDuplicateConflict}
        onConfirm={handleForceUpload}
        title="File Already Exists"
        message={
          duplicateConflict?.existingDocument?.filename
            ? `A file named "${duplicateConflict.existingDocument.filename}" already exists in this folder. It was uploaded on ${formatDate(duplicateConflict.existingDocument.created_at || '')}. Do you want to replace it with the new file?`
            : duplicateConflict
              ? `A file named "${duplicateConflict.file.name}" already exists in this folder. Do you want to replace it?`
              : ''
        }
        confirmText="Replace"
        cancelText="Cancel"
        variant="warning"
        loading={isReplacing}
      />
    </>
  );
}