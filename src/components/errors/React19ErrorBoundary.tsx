'use client';

import React, { ErrorInfo, ReactNode, Component } from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

/**
 * React 19 compatible error boundary for handling authentication and form errors
 * Specifically designed to catch React 19 + Next.js 15.5.0 compatibility issues
 */
export class React19ErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.error('🚨 React19ErrorBoundary caught error:', {
      errorId,
      error: error.message,
      stack: error.stack,
      name: error.name,
      timestamp: new Date().toISOString()
    });

    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorDetails = {
      errorId: this.state.errorId,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      errorInfo: {
        componentStack: errorInfo.componentStack
      },
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'Unknown',
      timestamp: new Date().toISOString(),
      retryCount: this.retryCount,
      react19Issues: this.detectReact19Issues(error)
    };

    console.group('🔍 React 19 Error Analysis');
    console.error('Error Details:', errorDetails);
    console.error('Component Stack:', errorInfo.componentStack);
    console.groupEnd();

    // Update state with error info
    this.setState({ errorInfo });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      this.logErrorToService(errorDetails);
    }
  }

  private detectReact19Issues(error: Error): string[] {
    const issues: string[] = [];
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';

    // Common React 19 compatibility issues
    if (message.includes('hydration') || stack.includes('hydration')) {
      issues.push('Hydration mismatch - likely React 19 SSR issue');
    }

    if (message.includes('transition') || stack.includes('transition')) {
      issues.push('React 19 transition API issue');
    }

    if (message.includes('form') && message.includes('submit')) {
      issues.push('React 19 form handling compatibility issue');
    }

    if (message.includes('synthetic') || message.includes('event')) {
      issues.push('React 19 event system change');
    }

    if (stack.includes('react-hook-form')) {
      issues.push('React Hook Form + React 19 compatibility issue');
    }

    if (stack.includes('next') && message.includes('navigation')) {
      issues.push('Next.js 15.5.0 + React 19 navigation issue');
    }

    return issues;
  }

  private logErrorToService(errorDetails: any) {
    // In a real app, send to error tracking service like Sentry
    console.log('📊 Would log to error service:', errorDetails);
  }

  private handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      console.log(`🔄 Retrying component render (attempt ${this.retryCount}/${this.maxRetries})`);

      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: ''
      });
    } else {
      console.warn('⚠️ Max retry attempts reached');
    }
  };

  private handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <div className="max-w-md mx-auto text-center">
            <div className="mb-6">
              <ExclamationTriangleIcon className="w-16 h-16 text-error-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-secondary-900 mb-2">
                Something went wrong
              </h2>
              <p className="text-secondary-600 text-sm mb-4">
                We've detected a React 19 compatibility issue. This is likely related to the sign-in functionality.
              </p>
            </div>

            {/* Development mode error details */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="bg-error-50 border border-error-200 rounded-lg p-4 mb-6 text-left">
                <h3 className="text-sm font-semibold text-error-800 mb-2">
                  Debug Information (Development Mode)
                </h3>
                <div className="text-xs text-error-700 space-y-2">
                  <div>
                    <strong>Error:</strong> {this.state.error.message}
                  </div>
                  <div>
                    <strong>Error ID:</strong> {this.state.errorId}
                  </div>
                  <div>
                    <strong>Retry Count:</strong> {this.retryCount}/{this.maxRetries}
                  </div>
                  {this.detectReact19Issues(this.state.error).length > 0 && (
                    <div>
                      <strong>Detected Issues:</strong>
                      <ul className="list-disc list-inside ml-2 mt-1">
                        {this.detectReact19Issues(this.state.error).map((issue, index) => (
                          <li key={index}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-3">
              {this.retryCount < this.maxRetries && (
                <Button
                  onClick={this.handleRetry}
                  variant="primary"
                  className="w-full"
                  icon={<ArrowPathIcon className="w-4 h-4" />}
                >
                  Try Again ({this.maxRetries - this.retryCount} attempts left)
                </Button>
              )}

              <Button
                onClick={this.handleReload}
                variant="outline"
                className="w-full"
              >
                Reload Page
              </Button>
            </div>

            <p className="text-xs text-secondary-500 mt-4">
              Error ID: {this.state.errorId}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default React19ErrorBoundary;