'use client';

import React from 'react';
import { ReportStatus, REPORT_STATUS_CONFIG } from '@/types/reports';

interface ReportStatusBadgeProps {
  status: ReportStatus;
  showDot?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ReportStatusBadge({ status, showDot = true, size = 'md' }: ReportStatusBadgeProps) {
  const config = REPORT_STATUS_CONFIG[status] || {
    label: status,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  const dotSizeClasses = {
    sm: 'h-1.5 w-1.5',
    md: 'h-2 w-2',
    lg: 'h-2.5 w-2.5',
  };

  const isAnimating = ['pending', 'extracting', 'aggregating', 'analyzing', 'generating'].includes(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${sizeClasses[size]} ${config.bgColor} ${config.color} dark:bg-opacity-20`}
    >
      {showDot && (
        <span
          className={`rounded-full ${dotSizeClasses[size]} ${isAnimating ? 'animate-pulse' : ''}`}
          style={{
            backgroundColor: 'currentColor',
          }}
        />
      )}
      {config.label}
    </span>
  );
}
