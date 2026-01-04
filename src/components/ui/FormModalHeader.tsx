'use client';

import { ReactNode } from 'react';
import { clsx } from 'clsx';

export interface FormModalHeaderProps {
  /** Icon component to display */
  icon: ReactNode;
  /** Main title text */
  title: string;
  /** Description text below title */
  description: string;
  /** Background color variant */
  variant?: 'primary' | 'success' | 'warning' | 'error';
  /** Additional className for the container */
  className?: string;
}

const variantStyles = {
  primary: {
    container: 'bg-primary-50 dark:bg-primary-900/20',
    iconBg: 'bg-primary-100 dark:bg-primary-800/30',
    iconColor: 'text-primary-600 dark:text-primary-400',
    title: 'text-primary-900 dark:text-primary-100',
    description: 'text-primary-700 dark:text-primary-300',
  },
  success: {
    container: 'bg-success-50 dark:bg-success-900/20',
    iconBg: 'bg-success-100 dark:bg-success-800/30',
    iconColor: 'text-success-600 dark:text-success-400',
    title: 'text-success-900 dark:text-success-100',
    description: 'text-success-700 dark:text-success-300',
  },
  warning: {
    container: 'bg-warning-50 dark:bg-warning-900/20',
    iconBg: 'bg-warning-100 dark:bg-warning-800/30',
    iconColor: 'text-warning-600 dark:text-warning-400',
    title: 'text-warning-900 dark:text-warning-100',
    description: 'text-warning-700 dark:text-warning-300',
  },
  error: {
    container: 'bg-error-50 dark:bg-error-900/20',
    iconBg: 'bg-error-100 dark:bg-error-800/30',
    iconColor: 'text-error-600 dark:text-error-400',
    title: 'text-error-900 dark:text-error-100',
    description: 'text-error-700 dark:text-error-300',
  },
};

/**
 * Reusable header component for form modals.
 * Displays an icon, title, and description in a styled container.
 */
export default function FormModalHeader({
  icon,
  title,
  description,
  variant = 'primary',
  className,
}: FormModalHeaderProps) {
  const styles = variantStyles[variant];

  return (
    <div
      className={clsx(
        'flex items-center space-x-3 p-4 rounded-lg',
        styles.container,
        className
      )}
    >
      <div className={clsx('p-2 rounded-lg', styles.iconBg)}>
        <div className={clsx('w-6 h-6', styles.iconColor)}>
          {icon}
        </div>
      </div>
      <div>
        <h4 className={clsx('font-medium', styles.title)}>{title}</h4>
        <p className={clsx('text-sm', styles.description)}>{description}</p>
      </div>
    </div>
  );
}
