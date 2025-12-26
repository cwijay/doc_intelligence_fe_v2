'use client';

import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { SparklesIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface SummaryProgressToastProps {
  documentName: string;
  isVisible: boolean;
  onComplete?: () => void;
  onError?: (error: string) => void;
}

export default function SummaryProgressToast({ 
  documentName, 
  isVisible, 
  onComplete, 
  onError 
}: SummaryProgressToastProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [toastId, setToastId] = useState<string | null>(null);

  const steps = [
    'Analyzing document structure...',
    'Extracting key information...',
    'Identifying main topics...',
    'Generating comprehensive summary...',
    'Finalizing content...'
  ];

  useEffect(() => {
    if (isVisible && !toastId) {
      // Start the progress toast
      const id = toast.loading(
        <SummaryProgressContent 
          documentName={documentName}
          currentStep={currentStep}
          steps={steps}
        />,
        {
          duration: Infinity,
          className: 'summary-progress-toast',
          style: {
            maxWidth: '500px',
            padding: '16px',
          }
        }
      );
      setToastId(id);
      setCurrentStep(0);
    }

    if (!isVisible && toastId) {
      toast.dismiss(toastId);
      setToastId(null);
      setCurrentStep(0);
    }
  }, [isVisible, toastId, documentName, currentStep, steps]);

  useEffect(() => {
    if (isVisible && toastId) {
      // Progress through steps automatically
      const stepInterval = setInterval(() => {
        setCurrentStep(prev => {
          const nextStep = prev + 1;
          if (nextStep < steps.length) {
            // Update the toast content
            toast.loading(
              <SummaryProgressContent 
                documentName={documentName}
                currentStep={nextStep}
                steps={steps}
              />,
              { id: toastId }
            );
            return nextStep;
          } else {
            // Don't go beyond the last step
            return prev;
          }
        });
      }, 2500); // Change step every 2.5 seconds

      return () => {
        clearInterval(stepInterval);
      };
    }
  }, [isVisible, toastId, documentName, steps]);

  return null; // This component doesn't render anything directly
}

interface SummaryProgressContentProps {
  documentName: string;
  currentStep: number;
  steps: string[];
}

function SummaryProgressContent({ documentName, currentStep, steps }: SummaryProgressContentProps) {
  return (
    <div className="flex items-start space-x-3">
      <div className="flex-shrink-0">
        <div className="relative">
          <SparklesIcon className="w-6 h-6 text-primary-600 animate-pulse" />
          <div className="absolute inset-0 rounded-full bg-primary-600 opacity-20 animate-ping"></div>
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-secondary-900 mb-1">
          Generating Summary for &quot;{documentName}&quot;
        </div>
        <div className="text-xs text-secondary-600 mb-2">
          {steps[currentStep]}
        </div>
        <div className="w-full bg-secondary-200 rounded-full h-1.5 mb-2">
          <div 
            className="bg-primary-600 h-1.5 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          ></div>
        </div>
        <div className="text-xs text-secondary-500">
          Step {currentStep + 1} of {steps.length}
        </div>
      </div>
    </div>
  );
}

// Utility functions for managing summary progress toasts
export const showSummaryProgressToast = (documentName: string) => {
  return toast.loading(
    <SummaryProgressContent 
      documentName={documentName}
      currentStep={0}
      steps={[
        'Analyzing document structure...',
        'Extracting key information...',
        'Identifying main topics...',
        'Generating comprehensive summary...',
        'Finalizing content...'
      ]}
    />,
    {
      duration: Infinity,
      className: 'summary-progress-toast',
      style: {
        maxWidth: '500px',
        padding: '16px',
      }
    }
  );
};

export const updateSummaryProgressToast = (toastId: string, documentName: string, step: number) => {
  const steps = [
    'Analyzing document structure...',
    'Extracting key information...',
    'Identifying main topics...',
    'Generating comprehensive summary...',
    'Finalizing content...'
  ];

  toast.loading(
    <SummaryProgressContent 
      documentName={documentName}
      currentStep={step}
      steps={steps}
    />,
    { id: toastId }
  );
};

export const completeSummaryProgressToast = (toastId: string, documentName: string) => {
  toast.success(
    <div className="flex items-center space-x-3">
      <CheckCircleIcon className="w-6 h-6 text-success-600 flex-shrink-0" />
      <div>
        <div className="text-sm font-medium text-secondary-900">
          Summary Generated Successfully
        </div>
        <div className="text-xs text-secondary-600">
          &quot;{documentName}&quot; has been summarized
        </div>
      </div>
    </div>,
    { 
      id: toastId,
      duration: 4000,
      className: 'summary-success-toast'
    }
  );
};

export const errorSummaryProgressToast = (toastId: string, documentName: string, error: string) => {
  toast.error(
    <div className="flex items-start space-x-3">
      <XCircleIcon className="w-6 h-6 text-error-600 flex-shrink-0 mt-0.5" />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-secondary-900 mb-1">
          Summary Generation Failed
        </div>
        <div className="text-xs text-secondary-600 mb-1">
          &quot;{documentName}&quot;
        </div>
        <div className="text-xs text-error-600">
          {error}
        </div>
      </div>
    </div>,
    { 
      id: toastId,
      duration: 6000,
      className: 'summary-error-toast'
    }
  );
};