'use client';

import { clsx } from 'clsx';
import {
  ClockIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { DocumentStatus } from '@/types/api';

export type StatusVariant = 'full' | 'dot' | 'icon';

interface StatusConfig {
  bg: string;
  text: string;
  dotColor: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

const STATUS_CONFIG: Record<DocumentStatus | 'default', StatusConfig> = {
  uploaded: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-700 dark:text-yellow-300',
    dotColor: 'bg-yellow-400',
    icon: ClockIcon,
    label: 'Uploaded',
  },
  processing: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-300',
    dotColor: 'bg-blue-400',
    icon: ArrowPathIcon,
    label: 'Processing',
  },
  processed: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-300',
    dotColor: 'bg-green-400',
    icon: CheckCircleIcon,
    label: 'Ready',
  },
  parsed: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-300',
    dotColor: 'bg-green-500',
    icon: CheckCircleIcon,
    label: 'Parsed',
  },
  error: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-300',
    dotColor: 'bg-red-400',
    icon: ExclamationTriangleIcon,
    label: 'Error',
  },
  failed: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-300',
    dotColor: 'bg-red-400',
    icon: ExclamationCircleIcon,
    label: 'Failed',
  },
  default: {
    bg: 'bg-gray-100 dark:bg-gray-900/30',
    text: 'text-gray-700 dark:text-gray-300',
    dotColor: 'bg-gray-400',
    icon: ClockIcon,
    label: 'Unknown',
  },
};

interface StatusBadgeProps {
  status: DocumentStatus;
  variant?: StatusVariant;
  className?: string;
  showLabel?: boolean;
}

/**
 * Unified status badge component with multiple display variants:
 * - 'full': Icon + label in a pill badge
 * - 'dot': Small colored dot indicator
 * - 'icon': Icon only
 */
export function StatusBadge({
  status,
  variant = 'full',
  className,
  showLabel = true,
}: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.default;
  const Icon = config.icon;
  const isProcessing = status === 'processing';

  if (variant === 'dot') {
    return (
      <span
        className={clsx(
          'inline-block w-2 h-2 rounded-full',
          config.dotColor,
          isProcessing && 'animate-pulse',
          className
        )}
        title={config.label}
      />
    );
  }

  if (variant === 'icon') {
    return (
      <span title={config.label}>
        <Icon
          className={clsx(
            'w-4 h-4',
            config.text,
            isProcessing && 'animate-spin',
            className
          )}
        />
      </span>
    );
  }

  // Full variant (default)
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
        config.bg,
        config.text,
        className
      )}
    >
      <Icon className={clsx('w-3 h-3', isProcessing && 'animate-spin')} />
      {showLabel && config.label}
    </span>
  );
}

// Convenience components for common variants
StatusBadge.Dot = function StatusDot({ status, className }: Omit<StatusBadgeProps, 'variant'>) {
  return <StatusBadge status={status} variant="dot" className={className} />;
};

StatusBadge.Icon = function StatusIcon({ status, className }: Omit<StatusBadgeProps, 'variant'>) {
  return <StatusBadge status={status} variant="icon" className={className} />;
};

StatusBadge.Full = function StatusFull({ status, className, showLabel }: Omit<StatusBadgeProps, 'variant'>) {
  return <StatusBadge status={status} variant="full" className={className} showLabel={showLabel} />;
};

export default StatusBadge;

// Export config for custom usage
export { STATUS_CONFIG };
