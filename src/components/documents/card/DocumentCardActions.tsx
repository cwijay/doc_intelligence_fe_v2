'use client';

import React from 'react';
import { Document } from '@/types/api';
import {
  CheckCircleIcon,
  ArrowPathIcon,
  SparklesIcon,
  QuestionMarkCircleIcon,
  AcademicCapIcon,
  ChatBubbleLeftIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import {
  isDocumentParsed,
  isDocumentSummarized,
  isDocumentFAQGenerated,
  isDocumentQuestionsGenerated,
  canPerformAIOperations,
} from '@/lib/document-utils';
import { ProcessingState } from './types';

interface ActionItem {
  icon: React.ElementType;
  label: string;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  color: string;
  bgColor: string;
  isProcessing?: boolean;
  isCompleted?: boolean;
}

interface DocumentCardActionsProps {
  document: Document;
  isProcessing: ProcessingState;
  onParse?: () => void;
  onSummarize?: () => void;
  onFaq?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onQuestions?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onChat?: () => void;
  onView?: () => void;
  onDownload?: () => void;
  onDelete?: () => void;
}

export function DocumentCardActions({
  document,
  isProcessing,
  onParse,
  onSummarize,
  onFaq,
  onQuestions,
  onChat,
  onView,
  onDownload,
  onDelete,
}: DocumentCardActionsProps) {
  const primaryActions: ActionItem[] = [];
  const secondaryActions: ActionItem[] = [];

  // Parse action (always first if document not parsed)
  if (onParse) {
    primaryActions.push({
      icon: isProcessing.parsing ? ArrowPathIcon : CheckCircleIcon,
      label: 'Parse',
      onClick: (e) => {
        e.preventDefault();
        e.stopPropagation();
        onParse();
      },
      disabled: isProcessing.parsing,
      color: isDocumentParsed(document) ? 'text-green-500' : 'text-blue-500',
      bgColor: isDocumentParsed(document) ? 'hover:bg-green-50' : 'hover:bg-blue-50',
      isProcessing: isProcessing.parsing,
      isCompleted: isDocumentParsed(document),
    });
  }

  // AI Feature actions (only for parsed documents)
  if (onSummarize && isDocumentParsed(document)) {
    primaryActions.push({
      icon: isProcessing.summarizing ? ArrowPathIcon : SparklesIcon,
      label: 'Summary',
      onClick: (e) => {
        e.preventDefault();
        e.stopPropagation();
        onSummarize();
      },
      disabled: isProcessing.summarizing,
      color: isDocumentSummarized(document) ? 'text-green-500' : 'text-purple-500',
      bgColor: isDocumentSummarized(document) ? 'hover:bg-green-50' : 'hover:bg-purple-50',
      isProcessing: isProcessing.summarizing,
      isCompleted: isDocumentSummarized(document),
    });
  }

  if (onFaq && isDocumentParsed(document)) {
    primaryActions.push({
      icon: isProcessing.faqGenerating ? ArrowPathIcon : QuestionMarkCircleIcon,
      label: 'FAQ',
      onClick: (e) => {
        e.preventDefault();
        e.stopPropagation();
        onFaq(e);
      },
      disabled: isProcessing.faqGenerating,
      color: isDocumentFAQGenerated(document) ? 'text-green-500' : 'text-blue-500',
      bgColor: isDocumentFAQGenerated(document) ? 'hover:bg-green-50' : 'hover:bg-blue-50',
      isProcessing: isProcessing.faqGenerating,
      isCompleted: isDocumentFAQGenerated(document),
    });
  }

  if (onQuestions && isDocumentParsed(document)) {
    primaryActions.push({
      icon: isProcessing.questionsGenerating ? ArrowPathIcon : AcademicCapIcon,
      label: 'Questions',
      onClick: (e) => {
        e.preventDefault();
        e.stopPropagation();
        onQuestions(e);
      },
      disabled: isProcessing.questionsGenerating,
      color: isDocumentQuestionsGenerated(document) ? 'text-green-500' : 'text-emerald-500',
      bgColor: isDocumentQuestionsGenerated(document)
        ? 'hover:bg-green-50'
        : 'hover:bg-emerald-50',
      isProcessing: isProcessing.questionsGenerating,
      isCompleted: isDocumentQuestionsGenerated(document),
    });
  }

  if (onChat && canPerformAIOperations(document)) {
    primaryActions.push({
      icon: ChatBubbleLeftIcon,
      label: 'Chat',
      onClick: (e) => {
        e.preventDefault();
        e.stopPropagation();
        onChat();
      },
      color: 'text-indigo-500',
      bgColor: 'hover:bg-indigo-50',
    });
  }

  // Secondary actions
  if (onView) {
    secondaryActions.push({
      icon: EyeIcon,
      label: 'View',
      onClick: (e) => {
        e.preventDefault();
        e.stopPropagation();
        onView();
      },
      color: 'text-gray-500',
      bgColor: 'hover:bg-gray-50',
    });
  }

  if (onDownload) {
    secondaryActions.push({
      icon: ArrowDownTrayIcon,
      label: 'Download',
      onClick: (e) => {
        e.preventDefault();
        e.stopPropagation();
        onDownload();
      },
      color: 'text-gray-500',
      bgColor: 'hover:bg-gray-50',
    });
  }

  if (onDelete) {
    secondaryActions.push({
      icon: TrashIcon,
      label: 'Delete',
      onClick: (e) => {
        e.preventDefault();
        e.stopPropagation();
        onDelete();
      },
      color: 'text-red-500',
      bgColor: 'hover:bg-red-50',
    });
  }

  return (
    <div className="space-y-3">
      {/* Primary AI Actions */}
      {primaryActions.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {primaryActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={index}
                onClick={action.onClick}
                disabled={action.disabled}
                className={clsx(
                  'flex flex-col items-center space-y-1 p-2 rounded-md border transition-all duration-200',
                  'hover:border-gray-300 hover:shadow-sm',
                  action.disabled && 'opacity-50 cursor-not-allowed',
                  !action.disabled && action.bgColor,
                  action.isCompleted && 'bg-green-50 border-green-200'
                )}
                title={`${action.label}${action.isCompleted ? ' (Completed)' : ''}${action.isProcessing ? ' (Processing...)' : ''}`}
              >
                <Icon
                  className={clsx(
                    'w-4 h-4 transition-transform duration-200',
                    action.color,
                    action.isProcessing && 'animate-spin',
                    !action.disabled && 'group-hover:scale-110'
                  )}
                />
                <span className={clsx('text-xs font-medium', action.color)}>{action.label}</span>
                {action.isCompleted && <div className="w-1 h-1 bg-green-500 rounded-full"></div>}
              </button>
            );
          })}
        </div>
      )}

      {/* Secondary Actions */}
      {secondaryActions.length > 0 && (
        <div className="flex justify-center space-x-1 pt-2 border-t border-gray-100">
          {secondaryActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={index}
                onClick={action.onClick}
                className={clsx(
                  'flex items-center justify-center w-8 h-8 rounded-md transition-all duration-200',
                  'hover:scale-110',
                  action.bgColor
                )}
                title={action.label}
              >
                <Icon className={clsx('w-4 h-4', action.color)} />
              </button>
            );
          })}
        </div>
      )}

      {/* Status indicator for non-parsed documents */}
      {!isDocumentParsed(document) && primaryActions.length === 1 && (
        <div className="text-center text-xs text-gray-500 py-2 bg-gray-50 rounded-md">
          Parse document to unlock AI features
        </div>
      )}
    </div>
  );
}
