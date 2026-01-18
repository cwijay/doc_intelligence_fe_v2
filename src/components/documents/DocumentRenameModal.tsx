'use client';

import { Fragment, useState, useEffect, useCallback } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { PencilSquareIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { Document } from '@/types/api';
import { clsx } from 'clsx';

interface DocumentRenameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newName: string) => void;
  document: Document | null;
  loading?: boolean;
  error?: string | null;
}

// Validation rules for document names
const INVALID_CHARS_REGEX = /[<>:"/\\|?*\x00-\x1F]/;
const MAX_NAME_LENGTH = 255;

/**
 * Extract the file extension from a filename
 */
function getFileExtension(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex === -1 || lastDotIndex === 0) {
    return '';
  }
  return filename.slice(lastDotIndex);
}

/**
 * Extract the base name (without extension) from a filename
 */
function getBaseName(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex === -1 || lastDotIndex === 0) {
    return filename;
  }
  return filename.slice(0, lastDotIndex);
}

/**
 * Validate a document name and return validation errors
 */
function validateDocumentName(name: string, extension: string): string | null {
  const trimmedName = name.trim();

  if (!trimmedName) {
    return 'Document name is required';
  }

  if (INVALID_CHARS_REGEX.test(trimmedName)) {
    return 'Name contains invalid characters. Avoid: < > : " / \\ | ? *';
  }

  const fullName = trimmedName + extension;
  if (fullName.length > MAX_NAME_LENGTH) {
    return `Name is too long. Maximum ${MAX_NAME_LENGTH} characters (including extension)`;
  }

  // Check for names that are just dots or spaces
  if (/^[.\s]+$/.test(trimmedName)) {
    return 'Name cannot be only dots or spaces';
  }

  return null;
}

export default function DocumentRenameModal({
  isOpen,
  onClose,
  onConfirm,
  document,
  loading = false,
  error = null,
}: DocumentRenameModalProps) {
  const [newName, setNewName] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const extension = document ? getFileExtension(document.name) : '';
  const originalBaseName = document ? getBaseName(document.name) : '';

  // Reset form when modal opens or document changes
  useEffect(() => {
    if (isOpen && document) {
      setNewName(originalBaseName);
      setValidationError(null);
    }
  }, [isOpen, document, originalBaseName]);

  // Validate on name change
  const handleNameChange = useCallback((value: string) => {
    setNewName(value);
    const error = validateDocumentName(value, extension);
    setValidationError(error);
  }, [extension]);

  // Handle form submission
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = newName.trim();
    const error = validateDocumentName(trimmedName, extension);

    if (error) {
      setValidationError(error);
      return;
    }

    const fullNewName = trimmedName + extension;

    // Don't submit if name hasn't changed
    if (document && fullNewName === document.name) {
      onClose();
      return;
    }

    onConfirm(fullNewName);
  }, [newName, extension, document, onConfirm, onClose]);

  // Handle close
  const handleClose = useCallback(() => {
    if (!loading) {
      onClose();
    }
  }, [loading, onClose]);

  const hasChanges = document && (newName.trim() + extension) !== document.name;
  const isValid = !validationError && newName.trim().length > 0;

  if (!document) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-strong transition-all">
                <form onSubmit={handleSubmit}>
                  {/* Header */}
                  <div className="flex items-start space-x-4 mb-6">
                    <div className="flex-shrink-0 rounded-full p-3 bg-primary-100 dark:bg-primary-900/30">
                      <PencilSquareIcon
                        className="h-6 w-6 text-primary-600 dark:text-primary-400"
                        aria-hidden="true"
                      />
                    </div>

                    <div className="flex-1">
                      <Dialog.Title
                        as="h3"
                        className="text-lg font-semibold leading-6 text-gray-900 dark:text-gray-100 mb-1"
                      >
                        Rename Document
                      </Dialog.Title>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Enter a new name for this document
                      </p>
                    </div>
                  </div>

                  {/* Current name display */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Current name
                    </label>
                    <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm text-gray-600 dark:text-gray-300 truncate">
                      {document.name}
                    </div>
                  </div>

                  {/* New name input */}
                  <div className="mb-4">
                    <label
                      htmlFor="new-name"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      New name
                    </label>
                    <div className="relative flex">
                      <input
                        type="text"
                        id="new-name"
                        value={newName}
                        onChange={(e) => handleNameChange(e.target.value)}
                        disabled={loading}
                        className={clsx(
                          'flex-1 px-3 py-2 rounded-l-lg border transition-colors',
                          'focus:outline-none focus:ring-2 focus:ring-offset-0',
                          'disabled:opacity-50 disabled:cursor-not-allowed',
                          'dark:bg-gray-700 dark:text-gray-100',
                          validationError
                            ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500/20'
                            : 'border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500/20'
                        )}
                        placeholder="Enter new name"
                        autoFocus
                      />
                      {extension && (
                        <div className="px-3 py-2 bg-gray-100 dark:bg-gray-600 border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-lg text-sm text-gray-500 dark:text-gray-300">
                          {extension}
                        </div>
                      )}
                    </div>
                    {validationError && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {validationError}
                      </p>
                    )}
                  </div>

                  {/* API Error */}
                  {error && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-500 flex-shrink-0" />
                        <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                      </div>
                    </div>
                  )}

                  {/* Warning about related files */}
                  <div className="mb-6 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <ExclamationTriangleIcon className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-amber-700 dark:text-amber-300">
                        <p className="font-medium mb-1">This will update all related files:</p>
                        <ul className="list-disc list-inside text-xs space-y-0.5 ml-1">
                          <li>Original document</li>
                          <li>Parsed content</li>
                          <li>Summary, FAQs, Questions</li>
                          <li>Search index</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end space-x-3">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleClose}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      loading={loading}
                      disabled={loading || !isValid || !hasChanges}
                    >
                      {loading ? 'Renaming...' : 'Rename Document'}
                    </Button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
