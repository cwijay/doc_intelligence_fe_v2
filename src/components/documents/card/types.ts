import { Document, DocumentStatus } from '@/types/api';
import {
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

export interface DocumentCardProps {
  document: Document;
  selected?: boolean;
  isHighlighted?: boolean;
  onSelectionChange?: (selected: boolean) => void;
  onView?: () => void;
  onDownload?: () => void;
  onRename?: () => void;
  onDelete?: () => void;
  onParse?: () => void;
  onLoadParsed?: () => void;
  onSummarize?: () => void;
  onFaq?: (count?: number) => void;
  onQuestions?: (count?: number) => void;
  onChat?: () => void;
  onAnalyse?: () => void;
  onExtract?: () => void;
  isProcessing?: ProcessingState;
  viewMode?: 'grid' | 'list' | 'compact';
  className?: string;
}

export interface ProcessingState {
  parsing?: boolean;
  loadingParsed?: boolean;
  summarizing?: boolean;
  faqGenerating?: boolean;
  questionsGenerating?: boolean;
  extracting?: boolean;
}

export interface StatusInfo {
  icon: typeof ClockIcon;
  color: string;
  bgColor: string;
  label: string;
  animate?: boolean;
}

export const getStatusInfo = (status: DocumentStatus, isProcessing?: boolean): StatusInfo => {
  if (isProcessing) {
    return {
      icon: ArrowPathIcon,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 border-blue-200',
      label: 'Processing...',
      animate: true,
    };
  }

  switch (status) {
    case 'uploaded':
      return {
        icon: ClockIcon,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50 border-yellow-200',
        label: 'Uploaded',
      };
    case 'processing':
      return {
        icon: ArrowPathIcon,
        color: 'text-blue-500',
        bgColor: 'bg-blue-50 border-blue-200',
        label: 'Processing',
        animate: true,
      };
    case 'processed':
      return {
        icon: CheckCircleIcon,
        color: 'text-green-600',
        bgColor: 'bg-green-50 border-green-200',
        label: 'Ready',
      };
    case 'error':
    case 'failed':
      return {
        icon: ExclamationTriangleIcon,
        color: 'text-red-600',
        bgColor: 'bg-red-50 border-red-200',
        label: 'Failed',
      };
    default:
      return {
        icon: ClockIcon,
        color: 'text-gray-500',
        bgColor: 'bg-gray-50 border-gray-200',
        label: 'Unknown',
      };
  }
};
