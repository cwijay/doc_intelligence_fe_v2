import { InputHTMLAttributes, forwardRef, useId } from 'react';
import { clsx } from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  variant?: 'default' | 'filled' | 'minimal';
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({
    className,
    type = 'text',
    label,
    error,
    hint,
    icon,
    iconPosition = 'left',
    variant = 'default',
    disabled,
    id,
    ...props
  }, ref) => {
    const reactId = useId();
    const inputId = id || `input-${reactId}`;

    const baseInputStyles = clsx(
      'block w-full transition-all duration-200',
      'focus:outline-none focus:ring-2',
      'disabled:cursor-not-allowed disabled:opacity-60',
      'placeholder:text-secondary-400 dark:placeholder:text-secondary-500',
      'text-secondary-900 dark:text-secondary-100'
    );

    const variants = {
      default: clsx(
        'border border-secondary-300 rounded-lg px-4 py-2.5',
        'bg-white dark:bg-secondary-800',
        'focus:border-primary-500 focus:ring-primary-500/20',
        'dark:border-secondary-600',
        'dark:focus:border-primary-400 dark:focus:ring-primary-400/20'
      ),
      filled: clsx(
        'border-0 rounded-lg px-4 py-2.5',
        'bg-secondary-100 dark:bg-secondary-700',
        'focus:bg-white dark:focus:bg-secondary-800',
        'focus:ring-2 focus:ring-primary-500/20 dark:focus:ring-primary-400/20'
      ),
      minimal: clsx(
        'border-0 border-b-2 border-secondary-300 rounded-none px-0 py-2',
        'bg-transparent',
        'focus:border-primary-500 focus:ring-0',
        'dark:border-secondary-600 dark:focus:border-primary-400'
      ),
    };

    const errorStyles = error
      ? clsx(
          'border-error-500 focus:border-error-500 focus:ring-error-500/20',
          'dark:border-error-400 dark:focus:border-error-400 dark:focus:ring-error-400/20'
        )
      : '';

    const iconPadding = icon ? (iconPosition === 'left' ? 'pl-10' : 'pr-10') : '';

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-secondary-700 dark:text-secondary-300"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {icon && (
            <div className={clsx(
              'absolute inset-y-0 flex items-center pointer-events-none z-10',
              iconPosition === 'left' ? 'left-3' : 'right-3'
            )}>
              <div className="w-4 h-4 text-secondary-400 dark:text-secondary-500">
                {icon}
              </div>
            </div>
          )}

          <input
            type={type}
            className={clsx(
              baseInputStyles,
              variants[variant],
              errorStyles,
              iconPadding,
              className
            )}
            ref={ref}
            id={inputId}
            disabled={disabled}
            {...props}
          />
        </div>

        {(hint || error) && (
          <div className="flex items-start space-x-1">
            {error ? (
              <p className="text-sm text-error-600 dark:text-error-400 flex items-center space-x-1">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{error || 'Invalid input'}</span>
              </p>
            ) : (
              <p className="text-sm text-secondary-500 dark:text-secondary-400">{hint}</p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;