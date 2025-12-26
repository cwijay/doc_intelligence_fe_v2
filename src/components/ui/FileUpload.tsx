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
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import Button from './Button';
import { Folder, Document } from '@/types/api';
import { fileUtils } from '@/lib/file-utils';
import toast from 'react-hot-toast';

interface FileWithProgress extends File {
  id: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
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
}: FileUploadProps) {
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const [showFolderDropdown, setShowFolderDropdown] = useState(false);
  const fileIdCounter = useRef(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
    // Check if folder is selected before proceeding
    if (!selectedFolder) {
      toast.error('Please select a folder before uploading documents');
      return;
    }
    
    if (rejectedFiles.length > 0) {
      console.error('Some files were rejected:', rejectedFiles);
    }

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
  }, [onUpload, selectedFolder]);

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

  const formatFileSize = (bytes: number) => {
    // Handle undefined, null, or NaN values
    if (!bytes || isNaN(bytes) || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const formattedSize = parseFloat((bytes / Math.pow(k, i)).toFixed(2));
    
    // Ensure formattedSize is not NaN
    if (isNaN(formattedSize)) return '0 Bytes';
    
    return formattedSize + ' ' + sizes[i];
  };

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
    </div>
  );
}