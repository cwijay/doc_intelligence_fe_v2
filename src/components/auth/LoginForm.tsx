'use client';

import { useState, useCallback, useTransition, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  EyeIcon,
  EyeSlashIcon,
  UserIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAuth } from '@/hooks/useAuth';
import { LoginRequest } from '@/types/auth';

type LoginFormData = LoginRequest;

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const { login, isLoading, error, clearError } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginFormData>({
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: ''
    }
  });

  // React 19 compatible form submission with error handling
  const onSubmit = useCallback(async (data: LoginFormData) => {
    console.log('🔐 Login form submitted', { data: { email: data.email, hasPassword: !!data.password } });

    try {
      clearError();

      // Use React 19's startTransition for non-urgent updates
      startTransition(async () => {
        try {
          await login(data);
          toast.success('Login successful! Redirecting to dashboard...');
          // Use router with startTransition for React 19 compatibility
          router.push('/dashboard');
        } catch (error: any) {
          console.error('Login failed:', error);
          toast.error(error.message || 'Login failed');
        }
      });
    } catch (error: any) {
      console.error('Login submission error:', error);
      toast.error(error.message || 'An error occurred during login');
    }
  }, [login, clearError, router]);

  // React 19 compatible password toggle
  const togglePasswordVisibility = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowPassword(prev => !prev);
  }, []);

  return (
    <Card className="w-full max-w-md mx-auto shadow-medium dark:shadow-dark-medium">
      <CardHeader>
        <div className="flex items-center justify-center mb-6">
          <div className="p-3 bg-primary-100 dark:bg-primary-900/40 rounded-full">
            <UserIcon className="w-8 h-8 text-primary-600 dark:text-primary-400" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-center">
          Welcome Back
        </CardTitle>
        <p className="text-center text-secondary-600 dark:text-secondary-400 mt-2">
          Sign in to your account to continue
        </p>
      </CardHeader>

      <CardContent>
        <form
          ref={formRef}
          onSubmit={(e) => {
            console.log('🚀 Form submit event triggered', {
              formValid: formRef.current?.checkValidity(),
              isSubmitting,
              isLoading,
              isPending
            });
            return handleSubmit(onSubmit)(e);
          }}
          className="space-y-4"
          noValidate
        >
          {error && (
            <div className="p-3 bg-error-50 dark:bg-error-900/30 border border-error-200 dark:border-error-700 rounded-lg">
              <p className="text-sm text-error-700 dark:text-error-300">{error || 'Login failed'}</p>
            </div>
          )}

          <Input
            label="Email Address"
            type="email"
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Please enter a valid email address'
              }
            })}
            error={errors.email?.message}
            placeholder="you@example.com"
            icon={<UserIcon className="w-4 h-4" />}
          />

          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              {...register('password', {
                required: 'Password is required'
              })}
              error={errors.password?.message}
              placeholder="••••••••"
              icon={<LockClosedIcon className="w-4 h-4" />}
            />
            <button
              type="button"
              className="absolute right-3 top-8 text-secondary-500 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-200 transition-colors"
              onClick={togglePasswordVisibility}
            >
              {showPassword ? (
                <EyeSlashIcon className="w-4 h-4" />
              ) : (
                <EyeIcon className="w-4 h-4" />
              )}
            </button>
          </div>

          <div className="flex items-center justify-end">
            <Link
              href="/forgot-password"
              className="text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            loading={isSubmitting || isLoading || isPending}
            disabled={isSubmitting || isLoading || isPending}
            onClick={(e) => {
              console.log('🎯 Sign In button clicked', {
                type: e.type,
                buttonType: e.currentTarget.type,
                isSubmitting,
                isLoading,
                isPending,
                formRef: !!formRef.current
              });
            }}
          >
            {isSubmitting || isLoading || isPending ? 'Signing in...' : 'Sign In'}
          </Button>

        </form>
      </CardContent>
    </Card>
  );
}