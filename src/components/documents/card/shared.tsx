'use client';

import React from 'react';
import { Document } from '@/types/api';
import {
  SparklesIcon,
  QuestionMarkCircleIcon,
  AcademicCapIcon,
  MagnifyingGlassCircleIcon,
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import { getFileTypeInfo } from '@/lib/file-types';
import {
  isDocumentSummarized,
  isDocumentFAQGenerated,
  isDocumentQuestionsGenerated,
  isDocumentIndexed,
} from '@/lib/document-utils';
import { StatusInfo } from './types';

interface FileIconProps {
  document: Document;
  viewMode: 'grid' | 'list' | 'compact';
}

export function FileIcon({ document, viewMode }: FileIconProps) {
  const fileInfo = getFileTypeInfo(document.name, document.type);
  const IconComponent = fileInfo.icon;

  return (
    <div
      className={clsx(
        'flex items-center justify-center rounded-lg border-2 transition-all duration-200',
        fileInfo.bgColor,
        viewMode === 'grid' ? 'w-12 h-12' : 'w-8 h-8'
      )}
    >
      <IconComponent
        className={clsx(fileInfo.color, viewMode === 'grid' ? 'w-6 h-6' : 'w-4 h-4')}
      />
    </div>
  );
}

interface StatusBadgeProps {
  statusInfo: StatusInfo;
}

export function StatusBadge({ statusInfo }: StatusBadgeProps) {
  const StatusIcon = statusInfo.icon;

  return (
    <div
      className={clsx(
        'flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
        statusInfo.bgColor
      )}
    >
      <StatusIcon
        className={clsx('w-3 h-3', statusInfo.color, statusInfo.animate && 'animate-spin')}
      />
      <span className={statusInfo.color}>{statusInfo.label}</span>
    </div>
  );
}

interface FeatureBadgesProps {
  document: Document;
  viewMode: 'grid' | 'list' | 'compact';
}

export function FeatureBadges({ document, viewMode }: FeatureBadgesProps) {
  if (viewMode === 'compact') return null;

  const features = [];
  if (isDocumentIndexed(document))
    features.push({ icon: MagnifyingGlassCircleIcon, color: 'text-teal-500', label: 'Indexed' });
  if (isDocumentSummarized(document))
    features.push({ icon: SparklesIcon, color: 'text-purple-500', label: 'Summary' });
  if (isDocumentFAQGenerated(document))
    features.push({ icon: QuestionMarkCircleIcon, color: 'text-blue-500', label: 'FAQ' });
  if (isDocumentQuestionsGenerated(document))
    features.push({ icon: AcademicCapIcon, color: 'text-green-500', label: 'Questions' });

  if (features.length === 0) return null;

  return (
    <div className="flex items-center space-x-1">
      {features.map(({ icon: Icon, color, label }, index) => (
        <div
          key={index}
          className={clsx(
            'flex items-center justify-center w-5 h-5 rounded-full bg-white shadow-sm border',
            'hover:scale-110 transition-transform duration-200'
          )}
          title={label}
        >
          <Icon className={clsx('w-3 h-3', color)} />
        </div>
      ))}
    </div>
  );
}
