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
import { DocumentArrowUpIcon, ArrowLeftIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

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
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>
                  {isBulkMode ? 'Bulk Upload Documents' : 'Upload New Documents'}
                </CardTitle>
                <CardDescription>
                  {isBulkMode
                    ? 'Upload multiple files at once for batch processing with AI-powered analysis'
                    : 'Upload your business documents, spreadsheets (Excel/CSV), and files for AI-powered analysis and data extraction'
                  }
                </CardDescription>
              </div>
              {/* Toggle between single and bulk mode */}
              {!isBulkMode && !jobStatus && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    console.log('🔘 Bulk Upload button clicked, setting isBulkMode to true');
                    setIsBulkMode(true);
                  }}
                  className="flex items-center space-x-2"
                >
                  <DocumentArrowUpIcon className="w-4 h-4" />
                  <span>Bulk Upload</span>
                </Button>
              )}
              {isBulkMode && !jobStatus && !isBulkUploading && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsBulkMode(false)}
                  className="flex items-center space-x-2"
                >
                  <ArrowLeftIcon className="w-4 h-4" />
                  <span>Back to Single Upload</span>
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
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