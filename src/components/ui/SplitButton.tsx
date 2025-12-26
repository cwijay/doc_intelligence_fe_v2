'use client';

import { ButtonHTMLAttributes, ForwardedRef, forwardRef, useState } from 'react';
import { clsx } from 'clsx';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

export interface SplitButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  count?: number;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onPrimaryClick: () => void;
  onDropdownClick: () => void;
  dropdownOpen?: boolean;
}

const SplitButton = forwardRef<HTMLDivElement, SplitButtonProps>(
  (
    {
      icon: Icon,
      label,
      count,
      variant = 'ghost',
      size = 'sm',
      disabled = false,
      loading = false,
      onPrimaryClick,
      onDropdownClick,
      dropdownOpen = false,
      className,
      ...props
    },
    ref: ForwardedRef<HTMLDivElement>
  ) => {
    const [primaryHover, setPrimaryHover] = useState(false);
    const [dropdownHover, setDropdownHover] = useState(false);

    // Debug logging
    console.log('🔧 SplitButton rendering:', {
      label,
      count,
      variant,
      size,
      disabled,
      loading
    });

    const baseStyles = 'inline-flex items-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variantStyles = {
      primary: 'text-white focus:ring-primary-500',
      secondary: 'text-secondary-900 focus:ring-secondary-500',
      ghost: 'focus:ring-secondary-500',
      danger: 'text-white focus:ring-error-500'
    };

    const variantHoverStyles = {
      primary: {
        primary: 'bg-primary-600 hover:bg-primary-700',
        dropdown: 'bg-primary-700 hover:bg-primary-800'
      },
      secondary: {
        primary: 'bg-secondary-100 hover:bg-secondary-200',
        dropdown: 'bg-secondary-200 hover:bg-secondary-300'
      },
      ghost: {
        primary: 'hover:bg-secondary-100',
        dropdown: 'hover:bg-secondary-200'
      },
      danger: {
        primary: 'bg-error-600 hover:bg-error-700',
        dropdown: 'bg-error-700 hover:bg-error-800'
      }
    };

    const sizeStyles = {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg'
    };

    const iconSizeStyles = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6'
    };

    const getPrimaryBg = () => {
      if (disabled) return 'bg-gray-50';
      if (primaryHover) return variantHoverStyles[variant].primary;
      if (variant === 'primary') return 'bg-primary-600';
      if (variant === 'secondary') return 'bg-secondary-100';
      if (variant === 'danger') return 'bg-error-600';
      if (variant === 'ghost') return 'bg-white border border-secondary-300';
      return 'bg-white';
    };

    const getDropdownBg = () => {
      if (disabled) return 'bg-gray-50';
      if (dropdownHover || dropdownOpen) return variantHoverStyles[variant].dropdown;
      if (variant === 'primary') return 'bg-primary-600';
      if (variant === 'secondary') return 'bg-secondary-100';
      if (variant === 'danger') return 'bg-error-600';
      if (variant === 'ghost') return 'bg-white border border-secondary-300';
      return 'bg-white';
    };

    return (
      <div
        ref={ref}
        className={clsx(
          'inline-flex items-center rounded-md shadow-sm',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
      >
        <button
          type="button"
          disabled={disabled || loading}
          onClick={onPrimaryClick}
          onMouseEnter={() => setPrimaryHover(true)}
          onMouseLeave={() => setPrimaryHover(false)}
          className={clsx(
            baseStyles,
            variantStyles[variant],
            sizeStyles[size],
            getPrimaryBg(),
            'px-3 py-2 rounded-l-md border-r-2 border-secondary-300',
            size === 'sm' && 'px-2 py-1',
            size === 'lg' && 'px-4 py-3'
          )}
          {...props}
        >
          {loading ? (
            <div className={clsx('animate-spin rounded-full border-b-2 border-current', iconSizeStyles[size])} />
          ) : Icon ? (
            <Icon className={clsx(iconSizeStyles[size], 'mr-1.5')} />
          ) : null}
          
          <span className="whitespace-nowrap">
            {label}
            {count !== undefined && (
              <span className={clsx(
                'ml-1.5 px-1.5 py-0.5 rounded-full text-xs font-semibold',
                variant === 'primary' && 'bg-primary-700 text-primary-100',
                variant === 'secondary' && 'bg-secondary-200 text-secondary-700',
                variant === 'ghost' && 'bg-secondary-200 text-secondary-700',
                variant === 'danger' && 'bg-error-700 text-error-100'
              )}>
                {count}
              </span>
            )}
          </span>
        </button>

        <button
          type="button"
          disabled={disabled || loading}
          onClick={onDropdownClick}
          onMouseEnter={() => setDropdownHover(true)}
          onMouseLeave={() => setDropdownHover(false)}
          className={clsx(
            baseStyles,
            variantStyles[variant],
            sizeStyles[size],
            getDropdownBg(),
            'px-2 py-2 rounded-r-md',
            size === 'sm' && 'px-1.5 py-1',
            size === 'lg' && 'px-3 py-3'
          )}
          aria-label="Open count selector"
        >
          <ChevronDownIcon 
            className={clsx(
              iconSizeStyles[size],
              'transition-transform duration-200',
              dropdownOpen && 'rotate-180'
            )} 
          />
        </button>
      </div>
    );
  }
);

SplitButton.displayName = 'SplitButton';

export default SplitButton;