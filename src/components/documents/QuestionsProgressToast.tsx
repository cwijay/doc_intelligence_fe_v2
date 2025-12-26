import toast from 'react-hot-toast';
import { AcademicCapIcon } from '@heroicons/react/24/outline';

const PROGRESS_STEPS = [
  'Analyzing document content...',
  'Identifying key concepts and topics...',
  'Determining question types and difficulty...',
  'Generating diverse questions...',
  'Creating answer keys and options...',
  'Finalizing questions...'
];

export const showQuestionsProgressToast = (documentName: string) => {
  const toastId = `questions-${documentName}-${Date.now()}`;
  
  toast.loading(
    <div className="flex items-center space-x-3">
      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
      <div>
        <div className="font-medium">Generating Questions for "{documentName}"</div>
        <div className="text-sm text-secondary-600 mt-0.5">
          {PROGRESS_STEPS[0]}
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

export const updateQuestionsProgressToast = (toastId: string, documentName: string, step: number) => {
  if (step >= PROGRESS_STEPS.length) return;
  
  toast.loading(
    <div className="flex items-center space-x-3">
      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
      <div>
        <div className="font-medium">Generating Questions for "{documentName}"</div>
        <div className="text-sm text-secondary-600 mt-0.5">
          {PROGRESS_STEPS[step]}
        </div>
        <div className="flex space-x-1 mt-2">
          {PROGRESS_STEPS.map((_, index) => (
            <div
              key={index}
              className={`h-1 w-6 rounded-full transition-all duration-300 ${
                index <= step ? 'bg-primary-600' : 'bg-secondary-200'
              }`}
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

export const completeQuestionsProgressToast = (toastId: string, documentName: string, questionsCount?: number) => {
  toast.success(
    <div className="flex items-center space-x-3">
      <div className="flex-shrink-0">
        <AcademicCapIcon className="w-5 h-5 text-success-600" />
      </div>
      <div>
        <div className="font-medium">Questions generated successfully!</div>
        <div className="text-sm text-success-600">
          Created {questionsCount || 'questions'} for "{documentName}"
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

export const errorQuestionsProgressToast = (toastId: string, documentName: string, errorMessage: string) => {
  toast.error(
    <div className="flex items-center space-x-3">
      <div className="flex-shrink-0">
        <svg className="w-5 h-5 text-error-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      </div>
      <div>
        <div className="font-medium">Questions generation failed</div>
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

export const dismissQuestionsProgressToast = (toastId: string) => {
  toast.dismiss(toastId);
};