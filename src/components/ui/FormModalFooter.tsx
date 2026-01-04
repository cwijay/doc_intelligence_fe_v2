'use client';

import { clsx } from 'clsx';
import Button from './Button';

export interface FormModalFooterProps {
  /** Cancel button handler */
  onCancel: () => void;
  /** Whether the form is currently submitting */
  isSubmitting?: boolean;
  /** Whether the submit button should be disabled */
  isDisabled?: boolean;
  /** Text to show on cancel button */
  cancelText?: string;
  /** Text to show on submit button when not submitting */
  submitText?: string;
  /** Text to show on submit button while submitting */
  submittingText?: string;
  /** Submit button variant */
  submitVariant?: 'primary' | 'danger';
  /** Cancel button variant */
  cancelVariant?: 'ghost' | 'outline' | 'secondary';
  /** Additional className for the container */
  className?: string;
  /** Whether to show border at top */
  showBorder?: boolean;
}

/**
 * Reusable footer component for form modals.
 * Provides Cancel and Submit buttons with consistent styling.
 */
export default function FormModalFooter({
  onCancel,
  isSubmitting = false,
  isDisabled = false,
  cancelText = 'Cancel',
  submitText = 'Submit',
  submittingText,
  submitVariant = 'primary',
  cancelVariant = 'ghost',
  className,
  showBorder = true,
}: FormModalFooterProps) {
  const loadingText = submittingText || `${submitText.replace(/^(Create|Add|Save|Update|Edit)/, '$1ing').replace(/ing$/, 'ing...')}`;

  return (
    <div
      className={clsx(
        'flex items-center justify-end space-x-3 pt-6',
        showBorder && 'border-t border-secondary-200 dark:border-secondary-700',
        className
      )}
    >
      <Button
        type="button"
        variant={cancelVariant}
        onClick={onCancel}
        disabled={isSubmitting}
      >
        {cancelText}
      </Button>
      <Button
        type="submit"
        variant={submitVariant}
        loading={isSubmitting}
        disabled={isSubmitting || isDisabled}
      >
        {isSubmitting ? loadingText : submitText}
      </Button>
    </div>
  );
}
