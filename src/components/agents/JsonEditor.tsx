'use client';

import { useEffect, useId, useState } from 'react';

interface JsonEditorProps {
  value: string;
  onChange: (next: string) => void;
  label?: string;
  placeholder?: string;
  rows?: number;
}

/**
 * Plain textarea JSON editor with validate-on-blur. Intentionally low-dep
 * (no Monaco). Error surfaces below the textarea only after the user blurs
 * so they can type freely.
 */
export default function JsonEditor({
  value, onChange, label = 'Input payload', placeholder, rows = 10,
}: JsonEditorProps) {
  const [error, setError] = useState<string | null>(null);
  const inputId = useId();
  const errorId = `${inputId}-error`;

  useEffect(() => {
    setError(null);
  }, [value]);

  const validate = () => {
    if (!value.trim()) {
      setError(null);
      return;
    }
    try {
      JSON.parse(value);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid JSON');
    }
  };

  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">
        {label}
      </label>
      <textarea
        id={inputId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={validate}
        rows={rows}
        spellCheck={false}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className="w-full font-mono text-sm p-3 rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-900 text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
      />
      {error && (
        <p id={errorId} role="alert" className="text-xs text-error-600 dark:text-error-400">
          JSON error: {error}
        </p>
      )}
    </div>
  );
}
