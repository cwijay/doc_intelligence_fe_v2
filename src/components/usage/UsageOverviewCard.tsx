'use client';

import { clsx } from 'clsx';
import { ReactNode } from 'react';

interface UsageOverviewCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: { value: number; isPositive: boolean };
  variant?: 'default' | 'warning' | 'danger';
}

export function UsageOverviewCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  variant = 'default',
}: UsageOverviewCardProps) {
  const variantStyles = {
    default: 'border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800',
    warning:
      'border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/20',
    danger: 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20',
  };

  const iconStyles = {
    default: 'bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400',
    warning: 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400',
    danger: 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400',
  };

  return (
    <div
      className={clsx(
        'rounded-xl border p-4 transition-all duration-200 hover:shadow-md',
        variantStyles[variant]
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1 flex-1 min-w-0">
          <p className="text-sm font-medium text-secondary-600 dark:text-secondary-400 truncate">
            {title}
          </p>
          <p className="text-2xl font-bold text-secondary-900 dark:text-secondary-100 truncate">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {subtitle && (
            <p className="text-xs text-secondary-500 dark:text-secondary-400 truncate">
              {subtitle}
            </p>
          )}
        </div>
        <div className={clsx('p-2.5 rounded-lg flex-shrink-0 ml-3', iconStyles[variant])}>
          {icon}
        </div>
      </div>
      {trend && (
        <div
          className={clsx(
            'mt-3 text-xs font-medium flex items-center gap-1',
            trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          )}
        >
          <span>{trend.isPositive ? '↑' : '↓'}</span>
          <span>{Math.abs(trend.value).toFixed(1)}% vs last period</span>
        </div>
      )}
    </div>
  );
}
