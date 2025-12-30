'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  DocumentTextIcon,
  PhotoIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';
import { Document } from '@/types/api';
import Button from '@/components/ui/Button';
import { clsx } from 'clsx';
import { getFileTypeInfo, formatFileSize } from '@/lib/file-types';
import { formatDistanceToNow } from 'date-fns';
import { authService } from '@/lib/auth';
import { useAuth } from '@/hooks/useAuth';
import { clientConfig } from '@/lib/config';

interface DocumentContentModalProps {
  document: Document | null;
  isOpen: boolean;
  onClose: () => void;
}

// Check if file is an image based on extension
const isImageFile = (filename: string): boolean => {
  return /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(filename);
};

// Check if file is a PDF
const isPdfFile = (filename: string): boolean => {
  return /\.pdf$/i.test(filename);
};

// Construct direct GCS URL from document data
const getDirectGcsUrl = (doc: Document, orgName: string): string | null => {
  const gcsBucket = clientConfig.gcsBucketName;
  const gcsBaseUrl = clientConfig.gcsBucketUrl || 'https://storage.googleapis.com';

  if (!gcsBucket) return null;

  // If gcs_path is already a gs:// URL, extract the path
  if (doc.gcs_path?.startsWith('gs://')) {
    const match = doc.gcs_path.match(/gs:\/\/[^/]+\/(.+)/);
    if (match) {
      return `${gcsBaseUrl}/${gcsBucket}/${match[1]}`;
    }
  }

  // Try storage_path
  if (doc.storage_path && !doc.storage_path.startsWith('gs://')) {
    return `${gcsBaseUrl}/${gcsBucket}/${doc.storage_path}`;
  }

  // Construct from org/folder/name
  if (orgName && doc.name) {
    const folderName = doc.folder_name || 'default';
    return `${gcsBaseUrl}/${gcsBucket}/${orgName}/original/${folderName}/${encodeURIComponent(doc.name)}`;
  }

  return null;
};

export default function DocumentContentModal({
  document,
  isOpen,
  onClose,
}: DocumentContentModalProps) {
  const { user } = useAuth();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [pdfLoaded, setPdfLoaded] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cleanup blob URL on unmount or document change
  useEffect(() => {
    return () => {
      if (signedUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(signedUrl);
      }
    };
  }, [signedUrl]);

  // Reset state when document changes
  useEffect(() => {
    // Cleanup previous blob URL
    if (signedUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(signedUrl);
    }
    setImageLoaded(false);
    setImageError(false);
    setPdfLoaded(false);
    setSignedUrl(null);
    setIsLoading(false);
    setError(null);
  }, [document?.id]);

  // Get organization name for URL construction
  const orgName = user?.org_name || '';

  // Fetch download URL from backend or use content streaming endpoint
  useEffect(() => {
    if (!isOpen || !document?.id) return;

    const fetchDownloadUrl = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const token = authService.getAccessToken();
        if (!token) {
          throw new Error('Not authenticated');
        }

        // Try the download endpoint first to get a signed URL
        console.log('📥 Fetching download URL for document:', document.id);

        const downloadResponse = await fetch(
          `/api/backend/documents/${document.id}/download?expiration_minutes=60`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );

        if (downloadResponse.ok) {
          const data = await downloadResponse.json();
          console.log('📥 Got signed download URL:', data);

          if (data.download_url) {
            setSignedUrl(data.download_url);
            return;
          }
        }

        // If download endpoint fails, try the content streaming endpoint
        console.log('🔄 Signed URL failed, trying content streaming endpoint...');

        // Use the content endpoint which streams file directly through backend
        const contentUrl = `/api/backend/documents/${document.id}/content`;

        try {
          // Directly fetch content (don't use HEAD test - backend only supports GET)
          const contentResponse = await fetch(contentUrl, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (contentResponse.ok) {
            const blob = await contentResponse.blob();
            const blobUrl = URL.createObjectURL(blob);
            console.log('✅ Created blob URL for document content');
            setSignedUrl(blobUrl);
            return;
          } else {
            console.warn('⚠️ Content streaming endpoint returned:', contentResponse.status);
          }
        } catch (contentError) {
          console.warn('⚠️ Content streaming endpoint failed:', contentError);
        }

        // Try direct GCS URL as last fallback (works if bucket is public)
        const directUrl = getDirectGcsUrl(document, orgName);
        if (directUrl) {
          console.log('🔄 Trying direct GCS URL:', directUrl);

          try {
            const testResponse = await fetch(directUrl, { method: 'HEAD' });
            if (testResponse.ok) {
              console.log('✅ Direct GCS URL works');
              setSignedUrl(directUrl);
              return;
            }
          } catch (e) {
            console.log('⚠️ Direct GCS URL not accessible');
          }
        }

        // If all else fails, show error with helpful message
        throw new Error('Could not load document content. Please check backend configuration.');

      } catch (err) {
        console.error('🚫 Failed to get download URL:', err);
        setError(err instanceof Error ? err.message : 'Failed to load document');
        setImageError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDownloadUrl();
  }, [isOpen, document?.id, orgName]);

  if (!isOpen || !document) return null;

  const fileInfo = getFileTypeInfo(document.name, document.type);
  const isImage = isImageFile(document.name);
  const isPdf = isPdfFile(document.name);

  // Get direct GCS URL for fallback
  const directGcsUrl = document ? getDirectGcsUrl(document, orgName) : null;

  const handleOpenInNewTab = () => {
    if (signedUrl) {
      window.open(signedUrl, '_blank');
    } else if (directGcsUrl) {
      window.open(directGcsUrl, '_blank');
    }
  };

  const renderContent = () => {
    // Show loading state
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Loading document...</p>
          </div>
        </div>
      );
    }

    // Show error state
    if (error || imageError) {
      return (
        <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-center">
            <DocumentTextIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Cannot preview this document</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-4 max-w-md">
              {error || 'The document could not be loaded'}
            </p>
            {(signedUrl || directGcsUrl) && (
              <Button
                variant="primary"
                size="sm"
                icon={<ArrowTopRightOnSquareIcon className="w-4 h-4" />}
                onClick={handleOpenInNewTab}
              >
                Try Open in New Tab
              </Button>
            )}
          </div>
        </div>
      );
    }

    // No URL available yet
    if (!signedUrl) {
      return (
        <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-center">
            <DocumentTextIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Document preview not available</p>
          </div>
        </div>
      );
    }

    // For images, show the actual image
    if (isImage) {
      return (
        <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="relative max-w-full max-h-full">
            <img
              src={signedUrl}
              alt={document.name}
              className={clsx(
                "max-w-full max-h-[60vh] object-contain rounded transition-opacity duration-200",
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
        </div>
      );
    }

    // For PDFs, embed the PDF viewer
    if (isPdf) {
      return (
        <div className="h-full bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden relative">
          {!pdfLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-800 z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Loading PDF...</p>
              </div>
            </div>
          )}
          <iframe
            src={signedUrl}
            className="w-full h-full border-0"
            title={document.name}
            onLoad={() => setPdfLoaded(true)}
            onError={() => setImageError(true)}
          />
        </div>
      );
    }

    // For other file types, show file info with download button
    const FileIcon = fileInfo.icon;
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="text-center">
          <div className={clsx(
            'w-20 h-20 rounded-lg border-2 flex items-center justify-center mx-auto mb-4',
            fileInfo.bgColor
          )}>
            <FileIcon className={clsx('w-10 h-10', fileInfo.color)} />
          </div>
          <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            {fileInfo.displayName} File
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Click below to download the original document
          </p>
          <Button
            variant="primary"
            icon={<ArrowTopRightOnSquareIcon className="w-4 h-4" />}
            onClick={handleOpenInNewTab}
          >
            Download File
          </Button>
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="fixed inset-4 md:inset-8 lg:inset-16 bg-white dark:bg-gray-900 rounded-xl shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3 min-w-0">
                <div className={clsx(
                  'w-10 h-10 rounded-lg border flex items-center justify-center flex-shrink-0',
                  fileInfo.bgColor
                )}>
                  <fileInfo.icon className={clsx('w-5 h-5', fileInfo.color)} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {document.name}
                  </h2>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
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

              <div className="flex items-center space-x-2 flex-shrink-0">
                {(signedUrl || directGcsUrl) && (
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<ArrowTopRightOnSquareIcon className="w-4 h-4" />}
                    onClick={handleOpenInNewTab}
                  >
                    Open
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<XMarkIcon className="w-5 h-5" />}
                  onClick={onClose}
                >
                  Close
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-4 overflow-hidden min-h-0 relative">
              {renderContent()}
            </div>

            {/* Footer with metadata */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Status:</span>
                  <span className="ml-2 text-gray-600 dark:text-gray-400 capitalize">{document.status || 'Unknown'}</span>
                </div>
                {document.folder_name && (
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Folder:</span>
                    <span className="ml-2 text-gray-600 dark:text-gray-400">{document.folder_name}</span>
                  </div>
                )}
                {document.size && (
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Size:</span>
                    <span className="ml-2 text-gray-600 dark:text-gray-400">{formatFileSize(document.size)}</span>
                  </div>
                )}
                {document.uploaded_at && (
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Uploaded:</span>
                    <span className="ml-2 text-gray-600 dark:text-gray-400">
                      {new Date(document.uploaded_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
