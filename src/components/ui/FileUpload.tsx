'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CloudArrowUpIcon,
  DocumentTextIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  FolderIcon,
  ChevronDownIcon,
  TableCellsIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import Button from './Button';
import { Folder, Document } from '@/types/api';
import { fileUtils } from '@/lib/file-utils';
import { formatFileSize } from '@/lib/file-types';
import toast from 'react-hot-toast';

interface FileWithProgress extends File {
  id: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

interface PendingFileWithName {
  file: File;
  editedName: string; // Name without extension
  extension: string;  // File extension (e.g., '.pdf')
}

interface FileUploadProps {
  onUpload?: (files: File[], folderId?: string) => void;
  maxFiles?: number;
  maxSize?: number;
  acceptedTypes?: string[];
  className?: string;
  folders?: Folder[];
  selectedFolder?: string | null;
  onFolderChange?: (folderId: string | null) => void;
  showFolderSelection?: boolean;
  /** Upload mode: 'single' uploads immediately, 'bulk' collects files for batch upload */
  mode?: 'single' | 'bulk';
  /** Callback for bulk mode - called when user clicks "Start Bulk Upload" */
  onBulkUpload?: (files: File[], folderName: string) => Promise<void>;
  /** Whether bulk upload is in progress */
  isBulkUploading?: boolean;
  /** Bulk upload progress (0-100) */
  bulkUploadProgress?: number;
}

export default function FileUpload({
  onUpload,
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024, // 10MB
  acceptedTypes = [
    'application/pdf',
    'image/*',
    'text/*',
    // Excel files
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'application/msexcel',
    'application/x-excel',
    'application/x-msexcel',
    // CSV files
    'text/csv',
    'application/csv',
    'text/comma-separated-values'
  ],
  className,
  folders = [],
  selectedFolder,
  onFolderChange,
  showFolderSelection = true,
  mode = 'single',
  onBulkUpload,
  isBulkUploading = false,
  bulkUploadProgress = 0,
}: FileUploadProps) {
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const [showFolderDropdown, setShowFolderDropdown] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<PendingFileWithName[]>([]); // For bulk mode with editable names
  const [editingIndex, setEditingIndex] = useState<number | null>(null); // Track which file is being edited
  const fileIdCounter = useRef(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  const isBulkMode = mode === 'bulk';

  console.log('🔄 FileUpload render - mode:', mode, 'isBulkMode:', isBulkMode);

  // Simple onDrop handler - recreated when mode changes to ensure correct behavior
  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
    console.log('📥 onDrop called - mode:', mode, 'isBulkMode:', isBulkMode, 'files:', acceptedFiles.length);

    // Check if folder is selected before proceeding
    if (!selectedFolder) {
      toast.error('Please select a folder before uploading documents');
      return;
    }

    if (rejectedFiles.length > 0) {
      console.error('Some files were rejected:', rejectedFiles);
      rejectedFiles.forEach(rejection => {
        const errors = rejection.errors.map(e => e.message).join(', ');
        toast.error(`${rejection.file.name}: ${errors}`);
      });
    }

    // In bulk mode, collect files without uploading
    console.log('📋 Checking bulk mode - isBulkMode:', isBulkMode, 'mode:', mode);
    if (isBulkMode) {
      console.log('✅ BULK MODE ACTIVE - collecting files instead of uploading');
      // Check max files limit
      const totalFiles = pendingFiles.length + acceptedFiles.length;
      if (totalFiles > maxFiles) {
        toast.error(`Maximum ${maxFiles} files allowed. You have ${pendingFiles.length} files, trying to add ${acceptedFiles.length}.`);
        return;
      }

      // Add to pending files (avoid duplicates by name)
      const existingNames = new Set(pendingFiles.map(f => f.file.name));
      const newFiles = acceptedFiles.filter(f => !existingNames.has(f.name));
      const duplicateCount = acceptedFiles.length - newFiles.length;

      if (duplicateCount > 0) {
        toast(`${duplicateCount} duplicate file(s) skipped`, { icon: 'ℹ️' });
      }

      // Convert files to PendingFileWithName with extracted extension
      const pendingFilesWithNames: PendingFileWithName[] = newFiles.map(file => {
        const lastDotIndex = file.name.lastIndexOf('.');
        const hasExtension = lastDotIndex > 0;
        const extension = hasExtension ? file.name.slice(lastDotIndex) : '';
        const nameWithoutExtension = hasExtension ? file.name.slice(0, lastDotIndex) : file.name;

        return {
          file,
          editedName: nameWithoutExtension,
          extension,
        };
      });

      setPendingFiles(prev => [...prev, ...pendingFilesWithNames]);
      return;
    }

    // Single mode - original behavior
    console.log('📤 SINGLE MODE - uploading immediately');
    const newFiles: FileWithProgress[] = acceptedFiles.map(file => {
      // Ensure file has valid properties
      const validFile = {
        ...file,
        id: `file-${++fileIdCounter.current}`,
        progress: 0,
        status: 'uploading' as const,
        size: file.size || 0,
        type: file.type || 'application/octet-stream',
        name: file.name || 'unnamed-file'
      };

      return validFile;
    });

    setFiles(prev => [...prev, ...newFiles]);

    // Simulate upload progress
    newFiles.forEach(file => {
      simulateUpload(file);
    });

    if (onUpload) {
      onUpload(acceptedFiles, selectedFolder || undefined);
    }
  }, [mode, isBulkMode, selectedFolder, onUpload, pendingFiles, maxFiles]); // Include mode and isBulkMode in deps

  const simulateUpload = (file: FileWithProgress) => {
    const interval = setInterval(() => {
      setFiles(prev => prev.map(f => {
        if (f.id === file.id) {
          // Ensure progress is a valid number
          const currentProgress = isNaN(f.progress) ? 0 : f.progress;
          if (currentProgress < 100) {
            const newProgress = Math.min(currentProgress + 10, 100);
            return { ...f, progress: newProgress };
          } else {
            clearInterval(interval);
            return { ...f, status: 'completed', progress: 100 };
          }
        }
        return f;
      }));
    }, 200);
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  // Bulk mode: remove a pending file
  const removePendingFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Bulk mode: clear all pending files
  const clearPendingFiles = () => {
    setPendingFiles([]);
  };

  // Bulk mode: start bulk upload
  const handleStartBulkUpload = async () => {
    console.log('🎯 Start Bulk Upload clicked:', {
      pendingFilesCount: pendingFiles.length,
      selectedFolder,
      hasOnBulkUpload: !!onBulkUpload
    });

    if (!onBulkUpload) {
      console.error('onBulkUpload callback not provided');
      return;
    }

    if (!selectedFolder) {
      toast.error('Please select a folder before uploading');
      return;
    }

    if (pendingFiles.length === 0) {
      toast.error('No files to upload');
      return;
    }

    // Get folder name from selected folder ID
    const folder = folders.find(f => f.id === selectedFolder);
    if (!folder) {
      toast.error('Selected folder not found');
      return;
    }

    // Create new File objects with edited names
    const filesWithEditedNames = pendingFiles.map(pf => {
      const fullName = getFullFilename(pf);
      // Only create new File if name was changed
      if (fullName !== pf.file.name) {
        return new File([pf.file], fullName, { type: pf.file.type });
      }
      return pf.file;
    });

    console.log('📤 Initiating bulk upload:', {
      folderName: folder.name,
      fileCount: filesWithEditedNames.length,
      fileNames: filesWithEditedNames.map(f => f.name),
      originalNames: pendingFiles.map(pf => pf.file.name)
    });

    try {
      await onBulkUpload(filesWithEditedNames, folder.name);
      // Clear pending files after successful upload initiation
      setPendingFiles([]);
      setEditingIndex(null);
    } catch (err: any) {
      console.error('Bulk upload failed:', err);
      toast.error(err.message || 'Bulk upload failed');
    }
  };

  // Calculate total size of pending files
  const totalPendingSize = pendingFiles.reduce((sum, pf) => sum + pf.file.size, 0);

  // Helper to get full filename (edited name + extension)
  const getFullFilename = (pf: PendingFileWithName) => `${pf.editedName}${pf.extension}`;

  // Handle file name change
  const handleFileNameChange = (index: number, newName: string) => {
    // Remove any extension from the input (user should not be able to change extension)
    const cleanName = newName.replace(/\.[^/.]+$/, '');
    setPendingFiles(prev => prev.map((pf, i) =>
      i === index ? { ...pf, editedName: cleanName } : pf
    ));
  };

  // Start editing a file name
  const startEditing = (index: number) => {
    setEditingIndex(index);
    // Focus input after render
    setTimeout(() => {
      editInputRef.current?.focus();
      editInputRef.current?.select();
    }, 0);
  };

  // Stop editing
  const stopEditing = () => {
    setEditingIndex(null);
  };

  // Handle key press in edit input
  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === 'Escape') {
      stopEditing();
    }
  };

  const handleFolderSelect = (folderId: string | null) => {
    if (onFolderChange) {
      onFolderChange(folderId);
    }
    setShowFolderDropdown(false);
  };

  const getSelectedFolderName = () => {
    if (!selectedFolder) return 'Please select a folder';
    const folder = folders.find(f => f.id === selectedFolder);
    return folder ? folder.name : 'Unknown folder';
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowFolderDropdown(false);
      }
    };

    if (showFolderDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showFolderDropdown]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    maxFiles,
    maxSize,
    accept: acceptedTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
  });

  const getFileIcon = (file: FileWithProgress) => {
    // Check if file.type exists and is a string before using startsWith
    if (file.type && typeof file.type === 'string' && file.type.startsWith('image/')) {
      try {
        return <img src={URL.createObjectURL(file)} alt={file.name} className="w-8 h-8 rounded object-cover" />;
      } catch (error) {
        console.warn('Failed to create object URL for image file:', error);
        return <DocumentTextIcon className="w-8 h-8 text-secondary-500" />;
      }
    }
    
    // Create a temporary Document object for file-utils detection
    const tempDocument: Partial<Document> = {
      name: file.name,
      type: file.type || 'application/octet-stream'
    };
    
    // Check if it's an Excel file
    if (fileUtils.isExcelFile(tempDocument as Document)) {
      return <TableCellsIcon className="w-8 h-8 text-green-600" />;
    }
    
    // Check if it's a CSV file
    if (fileUtils.isCsvFile(tempDocument as Document)) {
      return <TableCellsIcon className="w-8 h-8 text-blue-600" />;
    }
    
    return <DocumentTextIcon className="w-8 h-8 text-secondary-500" />;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="w-5 h-5 text-success-500" />;
      case 'error':
        return <ExclamationTriangleIcon className="w-5 h-5 text-error-500" />;
      default:
        return (
          <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        );
    }
  };

  return (
    <div className={clsx('space-y-4', className)}>
      {/* Folder Selection */}
      {showFolderSelection && folders.length > 0 && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-secondary-700">
            Select Destination Folder
          </label>
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setShowFolderDropdown(!showFolderDropdown)}
              className="w-full flex items-center justify-between px-3 py-2 border border-secondary-300 rounded-lg bg-white text-left text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 hover:border-secondary-400 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <FolderIcon className={clsx('w-4 h-4', selectedFolder ? 'text-secondary-400' : 'text-warning-500')} />
                <span className={selectedFolder ? 'text-secondary-900' : 'text-warning-600 font-medium'}>
                  {getSelectedFolderName()}
                </span>
              </div>
              <ChevronDownIcon 
                className={clsx(
                  'w-4 h-4 text-secondary-400 transition-transform duration-200',
                  showFolderDropdown && 'rotate-180'
                )}
              />
            </button>
            
            {showFolderDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute z-10 w-full mt-1 bg-white border border-secondary-200 rounded-lg shadow-lg max-h-60 overflow-auto"
              >
                <div className="py-1">
                  {/* Folder options */}
                  {folders.map((folder) => (
                    <button
                      key={folder.id}
                      type="button"
                      onClick={() => handleFolderSelect(folder.id)}
                      className={clsx(
                        'w-full text-left px-3 py-2 text-sm hover:bg-secondary-50 flex items-center space-x-2',
                        selectedFolder === folder.id && 'bg-primary-50 text-primary-700'
                      )}
                    >
                      <FolderIcon className="w-4 h-4 text-secondary-400" />
                      <span>{folder.name}</span>
                      {folder.document_count !== undefined && (
                        <span className="text-xs text-secondary-400 ml-auto">
                          ({folder.document_count} docs)
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      )}
      
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={clsx(
          'relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200',
          !selectedFolder
            ? 'cursor-not-allowed opacity-75 border-warning-300 bg-warning-50/20'
            : 'cursor-pointer',
          isDragActive && selectedFolder
            ? 'border-primary-400 bg-primary-50'
            : selectedFolder 
            ? 'border-secondary-300 hover:border-primary-400 hover:bg-primary-50/50'
            : ''
        )}
      >
        <input {...getInputProps()} />
        
        <motion.div
          className="flex flex-col items-center space-y-4"
          animate={isDragActive ? { y: -5 } : { y: 0 }}
        >
          <div className={clsx(
            'p-4 rounded-full transition-colors duration-200',
            isDragActive ? 'bg-primary-200' : 'bg-secondary-100'
          )}>
            <CloudArrowUpIcon className={clsx(
              'w-8 h-8 transition-colors duration-200',
              isDragActive ? 'text-primary-600' : 'text-secondary-500'
            )} />
          </div>
          
          <div>
            <h3 className="text-lg font-poppins font-semibold text-secondary-900 mb-2">
              {isDragActive ? 'Drop files here' : 'Upload documents'}
            </h3>
            {!selectedFolder && (
              <div className="mb-4 p-3 bg-warning-50 border border-warning-200 rounded-lg">
                <p className="text-sm text-warning-800 font-medium">
                  ⚠️ Please select a folder above before uploading documents
                </p>
              </div>
            )}
            <p className="text-secondary-600 mb-4">
              Drag and drop files here, or click to select files
            </p>
            <p className="text-sm text-secondary-500">
              Supports PDF, Excel, CSV, images, and text files up to {formatFileSize(maxSize)}
            </p>
            {showFolderSelection && (
              <div className="mt-2 flex items-center space-x-2 text-xs text-secondary-600">
                <FolderIcon className="w-3 h-3" />
                <span>
                  Uploading to: <span className="font-medium">{getSelectedFolderName()}</span>
                </span>
              </div>
            )}
          </div>
          
          <Button variant="outline" size="sm">
            Choose Files
          </Button>
        </motion.div>
      </div>

      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <h4 className="text-sm font-medium text-secondary-900">Uploading files</h4>
            
            {files.map((file) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-secondary-200"
              >
                <div className="flex-shrink-0">
                  {getFileIcon(file)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-secondary-900 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-secondary-500">
                    {formatFileSize(file.size)}
                  </p>
                  
                  {file.status === 'uploading' && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs text-secondary-600 mb-1">
                        <span>Uploading...</span>
                        <span>{isNaN(file.progress) ? 0 : Math.round(file.progress)}%</span>
                      </div>
                      <div className="w-full bg-secondary-200 rounded-full h-1.5">
                        <motion.div
                          className="bg-primary-600 h-1.5 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${isNaN(file.progress) ? 0 : Math.round(file.progress)}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {file.status === 'error' && file.error && (
                    <p className="text-xs text-error-600 mt-1">{typeof file.error === 'string' ? file.error : String(file.error)}</p>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  {getStatusIcon(file.status)}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(file.id)}
                    className="text-secondary-400 hover:text-error-600"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Mode: Pending Files List */}
      <AnimatePresence>
        {isBulkMode && pendingFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-secondary-900">
                Files to upload ({pendingFiles.length}/{maxFiles})
              </h4>
              <button
                type="button"
                onClick={clearPendingFiles}
                className="text-xs text-secondary-500 hover:text-error-600 transition-colors"
                disabled={isBulkUploading}
              >
                Clear all
              </button>
            </div>

            <div className="text-xs text-secondary-500 mb-2">
              Total size: {formatFileSize(totalPendingSize)}
            </div>

            {/* Pending files list */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {pendingFiles.map((pf, index) => (
                <motion.div
                  key={`${pf.file.name}-${index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-secondary-200"
                >
                  <div className="flex-shrink-0">
                    <DocumentTextIcon className="w-6 h-6 text-secondary-400" />
                  </div>

                  <div className="flex-1 min-w-0">
                    {editingIndex === index ? (
                      <div className="flex items-center">
                        <input
                          ref={editInputRef}
                          type="text"
                          value={pf.editedName}
                          onChange={(e) => handleFileNameChange(index, e.target.value)}
                          onBlur={stopEditing}
                          onKeyDown={handleEditKeyDown}
                          className="flex-1 text-sm font-medium text-secondary-900 bg-primary-50 border border-primary-300 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary-500"
                          disabled={isBulkUploading}
                        />
                        <span className="text-sm text-secondary-500 ml-0.5">{pf.extension}</span>
                      </div>
                    ) : (
                      <div
                        className="group flex items-center cursor-pointer"
                        onClick={() => !isBulkUploading && startEditing(index)}
                        title="Click to edit file name"
                      >
                        <p className="text-sm font-medium text-secondary-900 truncate group-hover:text-primary-600">
                          {pf.editedName}
                        </p>
                        <span className="text-sm text-secondary-500">{pf.extension}</span>
                        <PencilIcon className="w-3.5 h-3.5 ml-2 text-secondary-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    )}
                    <p className="text-xs text-secondary-500">
                      {formatFileSize(pf.file.size)}
                      {pf.editedName !== pf.file.name.replace(pf.extension, '') && (
                        <span className="ml-2 text-primary-600">
                          (renamed from: {pf.file.name})
                        </span>
                      )}
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removePendingFile(index)}
                    className="text-secondary-400 hover:text-error-600"
                    disabled={isBulkUploading}
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </Button>
                </motion.div>
              ))}
            </div>

            {/* Bulk upload progress */}
            {isBulkUploading && (
              <div className="mt-4 p-4 bg-primary-50 rounded-lg border border-primary-200">
                <div className="flex items-center justify-between text-sm text-primary-700 mb-2">
                  <span className="font-medium">Uploading files...</span>
                  <span>{Math.round(bulkUploadProgress)}%</span>
                </div>
                <div className="w-full bg-primary-200 rounded-full h-2">
                  <motion.div
                    className="bg-primary-600 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${bulkUploadProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            )}

            {/* Start bulk upload button */}
            {!isBulkUploading && (
              <div className="flex justify-end space-x-3 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearPendingFiles}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleStartBulkUpload}
                  disabled={!selectedFolder || pendingFiles.length === 0}
                >
                  Start Bulk Upload ({pendingFiles.length} files)
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}