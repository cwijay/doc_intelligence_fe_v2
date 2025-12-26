import { ButtonHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'gradient' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled,
    icon,
    iconPosition = 'left',
    children,
    ...props
  }, ref) => {
    const baseStyles = clsx(
      'inline-flex items-center justify-center font-medium',
      'transition-all duration-200 ease-out',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none',
      'active:scale-[0.98]',
      'dark:focus-visible:ring-offset-secondary-900'
    );

    const variants = {
      primary: clsx(
        'bg-primary-600 hover:bg-primary-700 active:bg-primary-800',
        'text-white shadow-sm hover:shadow-md',
        'focus-visible:ring-primary-500',
        'dark:bg-primary-500 dark:hover:bg-primary-600 dark:active:bg-primary-700'
      ),
      secondary: clsx(
        'bg-secondary-100 hover:bg-secondary-200 active:bg-secondary-300',
        'text-secondary-900',
        'focus-visible:ring-secondary-500',
        'dark:bg-secondary-800 dark:hover:bg-secondary-700 dark:active:bg-secondary-600',
        'dark:text-secondary-100'
      ),
      outline: clsx(
        'border-2 border-primary-200 hover:border-primary-300',
        'text-primary-700 hover:bg-primary-50',
        'focus-visible:ring-primary-500',
        'dark:border-primary-700 dark:text-primary-300',
        'dark:hover:bg-primary-900/30 dark:hover:border-primary-600'
      ),
      ghost: clsx(
        'hover:bg-secondary-100 active:bg-secondary-200',
        'text-secondary-700',
        'focus-visible:ring-secondary-500',
        'dark:hover:bg-secondary-800 dark:active:bg-secondary-700',
        'dark:text-secondary-300'
      ),
      gradient: clsx(
        'bg-gradient-to-r from-primary-600 to-primary-500',
        'hover:from-primary-700 hover:to-primary-600',
        'text-white shadow-md hover:shadow-lg',
        'focus-visible:ring-primary-500',
        'dark:from-primary-500 dark:to-primary-400',
        'dark:hover:from-primary-600 dark:hover:to-primary-500'
      ),
      success: clsx(
        'bg-success-600 hover:bg-success-700 active:bg-success-800',
        'text-white shadow-sm hover:shadow-md',
        'focus-visible:ring-success-500',
        'dark:bg-success-500 dark:hover:bg-success-600'
      ),
      warning: clsx(
        'bg-warning-500 hover:bg-warning-600 active:bg-warning-700',
        'text-white shadow-sm hover:shadow-md',
        'focus-visible:ring-warning-500'
      ),
      error: clsx(
        'bg-error-600 hover:bg-error-700 active:bg-error-800',
        'text-white shadow-sm hover:shadow-md',
        'focus-visible:ring-error-500',
        'dark:bg-error-500 dark:hover:bg-error-600'
      ),
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm rounded-lg gap-1.5',
      md: 'px-4 py-2 text-sm rounded-lg gap-2',
      lg: 'px-6 py-2.5 text-base rounded-xl gap-2',
      xl: 'px-8 py-3 text-lg rounded-xl gap-3',
    };

    return (
      <button
        className={clsx(
          baseStyles,
          variants[variant],
          sizes[size],
          (loading || disabled) && 'cursor-not-allowed active:scale-100',
          className
        )}
        disabled={disabled || loading}
        ref={ref}
        {...props}
      >
        {loading && (
          <svg className="animate-spin -ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}

        {icon && iconPosition === 'left' && !loading && icon}

        {children}

        {icon && iconPosition === 'right' && !loading && icon}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;