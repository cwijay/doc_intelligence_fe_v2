'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import FileUpload from '@/components/ui/FileUpload';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useDocumentUpload } from '@/hooks/useDocumentUpload';
import { Folder } from '@/types/api';

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
  const {
    handleUpload,
    duplicateConflict,
    isReplacing,
    handleForceUpload,
    clearDuplicateConflict
  } = useDocumentUpload();

  if (!isVisible) return null;

  const onUpload = (files: File[]) => {
    handleUpload(files, selectedUploadFolder, selectedViewFolder);
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
              Upload your business documents, spreadsheets (Excel/CSV), and files for AI-powered analysis and data extraction
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileUpload
              onUpload={onUpload}
              folders={folders}
              selectedFolder={selectedUploadFolder}
              onFolderChange={onFolderChange}
              showFolderSelection={true}
            />
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