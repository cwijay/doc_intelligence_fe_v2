'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | 'full';
  className?: string;
  /** Whether to show the close button (default: true) */
  showCloseButton?: boolean;
  /** Custom width in pixels (overrides size prop) */
  customWidth?: number;
  /** Custom height in pixels (overrides max-height from className) */
  customHeight?: number;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  className,
  showCloseButton = true,
  customWidth,
  customHeight,
}: ModalProps) {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-xl',
    xl: 'max-w-2xl',
    '2xl': 'max-w-4xl',
    '3xl': 'max-w-5xl',
    '4xl': 'max-w-6xl',
    'full': 'max-w-[90vw]',
  };

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
          <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" />
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
              <Dialog.Panel
                className={clsx(
                  'w-full transform overflow-hidden rounded-2xl p-6 text-left align-middle transition-all',
                  'bg-gradient-to-br from-white to-[#fafafa] dark:from-brand-navy-600 dark:to-brand-navy-700',
                  'shadow-strong dark:shadow-dark-strong',
                  'border border-secondary-200/50 dark:border-secondary-700/50',
                  // Only apply size class if no custom width
                  !customWidth && sizeClasses[size],
                  className
                )}
                style={{
                  ...(customWidth && { width: customWidth, maxWidth: customWidth }),
                  ...(customHeight && { height: customHeight, maxHeight: customHeight }),
                }}
              >
                {title && (
                  <div className="flex items-center justify-between mb-6">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-poppins font-semibold leading-6 text-secondary-900 dark:text-secondary-100"
                    >
                      {title}
                    </Dialog.Title>
                    {showCloseButton && (
                      <button
                        type="button"
                        className={clsx(
                          'rounded-lg p-2 transition-colors duration-200',
                          'text-secondary-400 hover:text-secondary-600 hover:bg-secondary-100',
                          'dark:text-secondary-500 dark:hover:text-secondary-300 dark:hover:bg-secondary-700',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500'
                        )}
                        onClick={onClose}
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                )}

                {children}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}