import { HTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'glass' | 'interactive';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding = 'md', hover = false, children, ...props }, ref) => {
    const baseStyles = clsx(
      'rounded-xl transition-all duration-200',
      'bg-white dark:bg-secondary-800'
    );

    const variants = {
      default: clsx(
        'border border-secondary-200 shadow-soft',
        'dark:border-secondary-700 dark:shadow-dark-soft'
      ),
      elevated: clsx(
        'shadow-medium border border-transparent',
        'dark:shadow-dark-medium'
      ),
      outlined: clsx(
        'border-2 border-secondary-200 bg-white/50',
        'dark:border-secondary-600 dark:bg-secondary-800/50'
      ),
      glass: clsx(
        'backdrop-blur-md bg-white/70 border border-white/20 shadow-soft',
        'dark:bg-secondary-900/70 dark:border-secondary-700/30'
      ),
      interactive: clsx(
        'border border-secondary-200 shadow-soft cursor-pointer',
        'hover:shadow-medium hover:border-primary-200',
        'dark:border-secondary-700 dark:shadow-dark-soft',
        'dark:hover:shadow-dark-medium dark:hover:border-primary-700'
      ),
    };

    const paddings = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
      xl: 'p-10',
    };

    const hoverStyles = hover
      ? clsx(
          'hover:shadow-medium hover:scale-[1.01] cursor-pointer',
          'dark:hover:shadow-dark-medium'
        )
      : '';

    return (
      <div
        className={clsx(
          baseStyles,
          variants[variant],
          paddings[padding],
          hoverStyles,
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}

const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={clsx('flex flex-col space-y-1.5 pb-6', className)}
      {...props}
    />
  )
);

CardHeader.displayName = 'CardHeader';

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, as: Component = 'h3', ...props }, ref) => (
    <Component
      ref={ref}
      className={clsx(
        'font-poppins font-semibold leading-none tracking-tight',
        'text-secondary-900 dark:text-secondary-100',
        className
      )}
      {...props}
    />
  )
);

CardTitle.displayName = 'CardTitle';

interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {}

const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={clsx(
        'text-sm text-secondary-600 dark:text-secondary-400',
        className
      )}
      {...props}
    />
  )
);

CardDescription.displayName = 'CardDescription';

interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={clsx('pt-0', className)} {...props} />
  )
);

CardContent.displayName = 'CardContent';

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {}

const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={clsx('flex items-center pt-6', className)}
      {...props}
    />
  )
);

CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
export type { CardProps };