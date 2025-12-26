'use client';

import { useEffect, useState, useCallback, useMemo, Suspense } from 'react';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import RegisterForm from '@/components/auth/RegisterForm';
import LoginForm from '@/components/auth/LoginForm';
import React19ErrorBoundary from '@/components/errors/React19ErrorBoundary';

// React 19 compatible component wrapper
function RegisterPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // React 19 compatible state initialization
  const [isHydrated, setIsHydrated] = useState(false);

  // Use useMemo to prevent hydration mismatches with React 19
  const initialLoginMode = useMemo(() => {
    return searchParams.get('mode') === 'login';
  }, [searchParams]);

  const [isLoginMode, setIsLoginMode] = useState(initialLoginMode);

  // React 19 compatible hydration effect
  useEffect(() => {
    setIsHydrated(true);
    const mode = searchParams.get('mode');
    const shouldShowLogin = mode === 'login';
    setIsLoginMode(shouldShowLogin);
  }, [searchParams]);

  // React 19 compatible event handler with useCallback
  const handleModeChange = useCallback((mode: 'register' | 'login') => {
    const showLogin = mode === 'login';
    setIsLoginMode(showLogin);

    const nextUrl = showLogin ? '/register?mode=login' : '/register';
    router.replace(nextUrl, { scroll: false });
  }, [router]);

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
        {/* Logo and Brand */}
        <div className="flex items-center justify-center mb-8">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-primary-500 dark:from-primary-500 dark:to-primary-400 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200 shadow-sm">
              <DocumentTextIcon className="w-7 h-7 text-white" />
            </div>
            <span className="font-poppins font-bold text-2xl text-secondary-900 dark:text-secondary-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200">
              Biz-To-Bricks
            </span>
          </Link>
        </div>

        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-secondary-100">
            {isLoginMode ? 'Sign In' : 'Join Biz-To-Bricks'}
          </h1>
          <p className="mt-2 text-secondary-600 dark:text-secondary-400">
            {isLoginMode
              ? 'Access your document intelligence platform'
              : 'Create your account and start managing documents with AI'
            }
          </p>
        </div>

        {/* Mode Toggle - React 19 Compatible */}
        <div className="flex justify-center mb-6">
          <div className="bg-white dark:bg-secondary-800 p-1 rounded-lg border border-secondary-200 dark:border-secondary-700 shadow-xs">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Register button clicked', { isLoginMode, isHydrated });
                handleModeChange('register');
              }}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                !isLoginMode
                  ? 'bg-primary-600 dark:bg-primary-500 text-white shadow-sm'
                  : 'text-secondary-600 dark:text-secondary-400 hover:text-secondary-800 dark:hover:text-secondary-200'
              }`}
            >
              Register
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Sign In button clicked', { isLoginMode, isHydrated });
                handleModeChange('login');
              }}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                isLoginMode
                  ? 'bg-primary-600 dark:bg-primary-500 text-white shadow-sm'
                  : 'text-secondary-600 dark:text-secondary-400 hover:text-secondary-800 dark:hover:text-secondary-200'
              }`}
            >
              Sign In
            </button>
          </div>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
        <React19ErrorBoundary
          onError={(error, errorInfo) => {
            console.error('🚨 Form Error Boundary triggered:', {
              error: error.message,
              isLoginMode,
              isHydrated,
              componentStack: errorInfo.componentStack
            });
          }}
        >
          {isLoginMode ? <LoginForm /> : <RegisterForm />}
        </React19ErrorBoundary>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-sm text-secondary-500 dark:text-secondary-400">
          By using this platform, you agree to our{' '}
          <Link
            href="/terms"
            className="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
          >
            Terms of Service
          </Link>
          {' '}and{' '}
          <Link
            href="/privacy"
            className="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
          >
            Privacy Policy
          </Link>
        </p>

        <p className="mt-2 text-sm text-secondary-500 dark:text-secondary-400">
          Need help?{' '}
          <Link
            href="/support"
            className="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
          >
            Contact Support
          </Link>
        </p>
      </div>
    </div>
  );
}

// React 19 + Next.js 15.5.0 compatible main component with Suspense
export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-secondary-50 dark:bg-secondary-900 flex items-center justify-center transition-colors duration-200">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-primary-400 mx-auto mb-4"></div>
            <p className="text-secondary-600 dark:text-secondary-400">Loading...</p>
          </div>
        </div>
      }
    >
      <RegisterPageContent />
    </Suspense>
  );
}
