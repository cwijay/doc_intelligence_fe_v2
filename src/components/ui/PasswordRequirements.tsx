'use client';

import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useMemo } from 'react';

interface PasswordRequirement {
  id: string;
  text: string;
  validator: (password: string) => boolean;
}

interface PasswordRequirementsProps {
  password: string;
  className?: string;
}

const requirements: PasswordRequirement[] = [
  {
    id: 'length',
    text: 'At least 8 characters long',
    validator: (password: string) => password.length >= 8,
  },
  {
    id: 'uppercase',
    text: 'Contains at least one uppercase letter (A-Z)',
    validator: (password: string) => /[A-Z]/.test(password),
  },
  {
    id: 'lowercase',
    text: 'Contains at least one lowercase letter (a-z)',
    validator: (password: string) => /[a-z]/.test(password),
  },
  {
    id: 'digit',
    text: 'Contains at least one digit (0-9)',
    validator: (password: string) => /\d/.test(password),
  },
  {
    id: 'special',
    text: 'Contains at least one special character (!@#$%^&*)',
    validator: (password: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  },
];

export default function PasswordRequirements({ 
  password, 
  className = '' 
}: PasswordRequirementsProps) {
  const validationResults = useMemo(() => {
    return requirements.map((req) => ({
      ...req,
      isValid: req.validator(password),
    }));
  }, [password]);

  const allValid = validationResults.every((result) => result.isValid);
  const validCount = validationResults.filter((result) => result.isValid).length;

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-secondary-700">
          Password Requirements
        </h4>
        <span className="text-xs text-secondary-500">
          {validCount}/{requirements.length} met
        </span>
      </div>
      
      <div className="space-y-2">
        {validationResults.map((result) => (
          <div
            key={result.id}
            className="flex items-start space-x-2 text-sm"
          >
            <div className="flex-shrink-0 mt-0.5">
              {result.isValid ? (
                <CheckIcon className="w-4 h-4 text-green-500" />
              ) : (
                <XMarkIcon className="w-4 h-4 text-secondary-400" />
              )}
            </div>
            <span
              className={
                result.isValid
                  ? 'text-green-600'
                  : 'text-secondary-600'
              }
            >
              {result.text}
            </span>
          </div>
        ))}
      </div>

      {password.length > 0 && (
        <div className="mt-3 p-3 rounded-lg bg-secondary-50">
          <div className="flex items-center space-x-2">
            {allValid ? (
              <>
                <CheckIcon className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-700 font-medium">
                  Password meets all requirements!
                </span>
              </>
            ) : (
              <>
                <XMarkIcon className="w-4 h-4 text-amber-500" />
                <span className="text-sm text-amber-700">
                  Password needs to meet {requirements.length - validCount} more requirement{requirements.length - validCount !== 1 ? 's' : ''}
                </span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export { requirements };
export type { PasswordRequirement };