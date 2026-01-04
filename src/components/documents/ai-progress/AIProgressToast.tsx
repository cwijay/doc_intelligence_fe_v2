'use client';

import toast from 'react-hot-toast';
import { ReactNode } from 'react';

/**
 * Configuration for creating a progress toast
 */
export interface ProgressToastConfig {
  /** Feature name for display (e.g., "Summary", "FAQs", "Questions") */
  featureName: string;
  /** Progress steps to show */
  steps: string[];
  /** Icon component for success toast */
  successIcon?: ReactNode;
  /** Action verb for success message (e.g., "summarized", "created") */
  successVerb?: string;
}

/**
 * Progress toast interface returned by createProgressToast
 */
export interface ProgressToastApi {
  show: (documentName: string) => string;
  update: (toastId: string, documentName: string, step: number) => void;
  complete: (toastId: string, documentName: string, count?: number) => void;
  error: (toastId: string, documentName: string, errorMessage: string) => void;
  dismiss: (toastId: string) => void;
}

/**
 * Default icons for different states
 */
const DefaultSuccessIcon = () => (
  <svg className="w-5 h-5 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const DefaultErrorIcon = () => (
  <svg className="w-5 h-5 text-error-600" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
  </svg>
);

/**
 * Create a progress toast API for an AI feature
 */
export function createProgressToast(config: ProgressToastConfig): ProgressToastApi {
  const { featureName, steps, successIcon, successVerb = 'generated' } = config;

  const show = (documentName: string): string => {
    const toastId = `${featureName.toLowerCase()}-${documentName}-${Date.now()}`;

    toast.loading(
      <div className="flex items-center space-x-3">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
        <div>
          <div className="font-medium">Generating {featureName} for &quot;{documentName}&quot;</div>
          <div className="text-sm text-secondary-600 mt-0.5">
            {steps[0]}
          </div>
        </div>
      </div>,
      {
        id: toastId,
        duration: Infinity,
        style: {
          maxWidth: '500px',
        }
      }
    );

    return toastId;
  };

  const update = (toastId: string, documentName: string, step: number): void => {
    if (step >= steps.length) return;

    toast.loading(
      <div className="flex items-center space-x-3">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
        <div>
          <div className="font-medium">Generating {featureName} for &quot;{documentName}&quot;</div>
          <div className="text-sm text-secondary-600 mt-0.5">
            {steps[step]}
          </div>
          <div className="flex space-x-1 mt-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-1 rounded-full transition-all duration-300 ${
                  index <= step ? 'bg-primary-600' : 'bg-secondary-200'
                }`}
                style={{ width: `${Math.max(16, 48 / steps.length)}px` }}
              />
            ))}
          </div>
        </div>
      </div>,
      {
        id: toastId,
        duration: Infinity,
        style: {
          maxWidth: '500px',
        }
      }
    );
  };

  const complete = (toastId: string, documentName: string, count?: number): void => {
    const countText = count ? `${count} ` : '';

    toast.success(
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          {successIcon || <DefaultSuccessIcon />}
        </div>
        <div>
          <div className="font-medium">{featureName} {successVerb} successfully!</div>
          <div className="text-sm text-success-600">
            {countText}{successVerb} for &quot;{documentName}&quot;
          </div>
        </div>
      </div>,
      {
        id: toastId,
        duration: 4000,
        style: {
          maxWidth: '500px',
        }
      }
    );
  };

  const error = (toastId: string, documentName: string, errorMessage: string): void => {
    toast.error(
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          <DefaultErrorIcon />
        </div>
        <div>
          <div className="font-medium">{featureName} generation failed</div>
          <div className="text-sm text-error-600">
            {errorMessage}
          </div>
        </div>
      </div>,
      {
        id: toastId,
        duration: 6000,
        style: {
          maxWidth: '500px',
        }
      }
    );
  };

  const dismiss = (toastId: string): void => {
    toast.dismiss(toastId);
  };

  return { show, update, complete, error, dismiss };
}

// Pre-configured progress toasts for common features
export const summaryProgressToast = createProgressToast({
  featureName: 'Summary',
  steps: [
    'Analyzing document structure...',
    'Extracting key information...',
    'Identifying main topics...',
    'Generating comprehensive summary...',
    'Finalizing content...'
  ],
  successVerb: 'summarized',
});

export const faqProgressToast = createProgressToast({
  featureName: 'FAQs',
  steps: [
    'Analyzing document content...',
    'Identifying key topics and concepts...',
    'Generating relevant questions...',
    'Formulating comprehensive answers...',
    'Finalizing FAQs...'
  ],
  successVerb: 'created',
});

export const questionsProgressToast = createProgressToast({
  featureName: 'Questions',
  steps: [
    'Analyzing document content...',
    'Identifying key concepts and topics...',
    'Determining question types and difficulty...',
    'Generating diverse questions...',
    'Creating answer keys and options...',
    'Finalizing questions...'
  ],
  successVerb: 'generated',
});
