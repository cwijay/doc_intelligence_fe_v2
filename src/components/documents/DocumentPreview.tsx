'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  XMarkIcon,
  DocumentTextIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import { Document } from '@/types/api';
import Button from '@/components/ui/Button';
import { clsx } from 'clsx';
import { getFileTypeInfo, formatFileSize } from '@/lib/file-types';
import { formatDistanceToNow } from 'date-fns';

interface DocumentPreviewProps {
  document: Document;
  isOpen: boolean;
  onClose: () => void;
  onDownload?: () => void;
  className?: string;
}

export default function DocumentPreview({
  document,
  isOpen,
  onClose,
  onDownload,
  className,
}: DocumentPreviewProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const fileInfo = getFileTypeInfo(document.name, document.type);
  
  if (!isOpen) return null;

  const renderPreviewContent = () => {
    // For images, try to show the actual image
    if (fileInfo.category === 'image' && document.gcs_path) {
      return (
        <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
          {!imageError ? (
            <div className="relative max-w-full max-h-full">
              <img
                src={document.gcs_path}
                alt={document.name}
                className={clsx(
                  "max-w-full max-h-full object-contain rounded transition-opacity duration-200",
                  imageLoaded ? "opacity-100" : "opacity-0"
                )}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
              />
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center">
              <PhotoIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-sm text-gray-500">Cannot preview this image</p>
            </div>
          )}
        </div>
      );
    }

    // For PDFs, show a placeholder with option to open
    if (fileInfo.displayName === 'PDF') {
      return (
        <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
          <div className="text-center">
            <DocumentTextIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">PDF Document</p>
            <p className="text-sm text-gray-500 mb-6">
              PDF preview is not available in this interface
            </p>
            <Button
              variant="primary"
              icon={<EyeIcon className="w-4 h-4" />}
              onClick={() => {
                if (document.gcs_path) {
                  window.open(document.gcs_path, '_blank');
                }
              }}
            >
              Open PDF
            </Button>
          </div>
        </div>
      );
    }

    // For other file types, show file info
    const IconComponent = fileInfo.icon;
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className={clsx(
            'w-20 h-20 rounded-lg border-2 flex items-center justify-center mx-auto mb-4',
            fileInfo.bgColor
          )}>
            <IconComponent className={clsx('w-10 h-10', fileInfo.color)} />
          </div>
          <p className="text-lg font-medium text-gray-900 mb-2">{fileInfo.displayName} File</p>
          <p className="text-sm text-gray-500 mb-6">
            Preview not available for this file type
          </p>
          {onDownload && (
            <Button
              variant="outline"
              icon={<ArrowDownTrayIcon className="w-4 h-4" />}
              onClick={onDownload}
            >
              Download File
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={clsx("fixed inset-0 bg-black/50 backdrop-blur-sm z-50", className)}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="fixed inset-4 md:inset-8 lg:inset-16 bg-white rounded-xl shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className={clsx(
              'w-10 h-10 rounded-lg border flex items-center justify-center',
              fileInfo.bgColor
            )}>
              <fileInfo.icon className={clsx('w-5 h-5', fileInfo.color)} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 truncate max-w-md">
                {document.name}
              </h2>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span className={clsx('font-medium', fileInfo.color)}>
                  {fileInfo.displayName}
                </span>
                {document.size && <span>{formatFileSize(document.size)}</span>}
                {document.uploaded_at && (
                  <span>
                    {formatDistanceToNow(new Date(document.uploaded_at), { addSuffix: true })}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {onDownload && (
              <Button
                variant="outline"
                size="sm"
                icon={<ArrowDownTrayIcon className="w-4 h-4" />}
                onClick={onDownload}
              >
                Download
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              icon={<XMarkIcon className="w-4 h-4" />}
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 overflow-hidden">
          {renderPreviewContent()}
        </div>

        {/* Footer with metadata */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Status:</span>
              <span className="ml-2 text-gray-600 capitalize">{document.status || 'Unknown'}</span>
            </div>
            {document.folder_name && (
              <div>
                <span className="font-medium text-gray-700">Folder:</span>
                <span className="ml-2 text-gray-600">{document.folder_name}</span>
              </div>
            )}
            {document.size && (
              <div>
                <span className="font-medium text-gray-700">Size:</span>
                <span className="ml-2 text-gray-600">{formatFileSize(document.size)}</span>
              </div>
            )}
            {document.uploaded_at && (
              <div>
                <span className="font-medium text-gray-700">Uploaded:</span>
                <span className="ml-2 text-gray-600">
                  {new Date(document.uploaded_at).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}