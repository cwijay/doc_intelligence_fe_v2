'use client';

import { clsx } from 'clsx';

interface QuotaProgressBarProps {
  label: string;
  used: number;
  limit: number;
  percentage: number;
  unit?: string;
  formatValue?: (value: number) => string;
  showWarning?: boolean;
  isExceeded?: boolean;
}

export function QuotaProgressBar({
  label,
  used,
  limit,
  percentage,
  unit = '',
  formatValue = (v) => v.toLocaleString(),
  showWarning = false,
  isExceeded = false,
}: QuotaProgressBarProps) {
  const getBarColor = () => {
    if (isExceeded) return 'bg-red-500';
    if (showWarning || percentage >= 80) return 'bg-amber-500';
    if (percentage >= 60) return 'bg-yellow-400';
    return 'bg-primary-500';
  };

  const getTextColor = () => {
    if (isExceeded) return 'text-red-600 dark:text-red-400';
    if (showWarning || percentage >= 80) return 'text-amber-600 dark:text-amber-400';
    return 'text-secondary-600 dark:text-secondary-400';
  };

  const remaining = Math.max(0, limit - used);

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-sm">
        <span className="font-medium text-secondary-700 dark:text-secondary-300">{label}</span>
        <span className={clsx('font-medium', isExceeded && 'text-red-600 dark:text-red-400')}>
          {formatValue(used)} / {formatValue(limit)} {unit}
        </span>
      </div>
      <div className="h-2.5 w-full bg-secondary-200 dark:bg-secondary-700 rounded-full overflow-hidden">
        <div
          className={clsx('h-full rounded-full transition-all duration-500', getBarColor())}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <div className="flex justify-between text-xs">
        <span className={getTextColor()}>{percentage.toFixed(1)}% used</span>
        <span className="text-secondary-500 dark:text-secondary-400">
          {formatValue(remaining)} {unit} remaining
        </span>
      </div>
    </div>
  );
}
