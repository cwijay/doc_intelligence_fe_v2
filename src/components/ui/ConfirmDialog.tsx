'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Button from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false,
}: ConfirmDialogProps) {
  const variantStyles = {
    danger: {
      iconBg: 'bg-error-100',
      iconColor: 'text-error-600',
      confirmVariant: 'error' as const,
    },
    warning: {
      iconBg: 'bg-warning-100',
      iconColor: 'text-warning-600',
      confirmVariant: 'warning' as const,
    },
    info: {
      iconBg: 'bg-primary-100',
      iconColor: 'text-primary-600',
      confirmVariant: 'primary' as const,
    },
  };

  const styles = variantStyles[variant];

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-strong transition-all">
                <div className="flex items-start space-x-4">
                  <div className={`flex-shrink-0 rounded-full p-3 ${styles.iconBg}`}>
                    <ExclamationTriangleIcon 
                      className={`h-6 w-6 ${styles.iconColor}`} 
                      aria-hidden="true" 
                    />
                  </div>
                  
                  <div className="flex-1">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-poppins font-semibold leading-6 text-secondary-900 mb-2"
                    >
                      {title}
                    </Dialog.Title>
                    
                    <div className="text-sm text-secondary-600 mb-6">
                      {message}
                    </div>

                    <div className="flex items-center justify-end space-x-3">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={onClose}
                        disabled={loading}
                      >
                        {cancelText}
                      </Button>
                      <Button
                        type="button"
                        variant={styles.confirmVariant}
                        onClick={onConfirm}
                        loading={loading}
                        disabled={loading}
                      >
                        {loading ? 'Processing...' : confirmText}
                      </Button>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}