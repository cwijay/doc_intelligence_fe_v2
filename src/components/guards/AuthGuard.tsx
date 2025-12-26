'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface AuthGuardProps {
  children: ReactNode;
  requireAuth?: boolean;
  fallbackPath?: string;
}

export default function AuthGuard({ 
  children, 
  requireAuth = true,
  fallbackPath = '/register'
}: AuthGuardProps) {
  const { isAuthenticated, isLoading, user, isSessionExpired, logout, getTimeUntilExpiry } = useAuth();
  const router = useRouter();

  // Debug logging
  console.log('🛡️ AuthGuard State:', {
    requireAuth,
    isAuthenticated,
    isLoading,
    hasUser: !!user,
    isSessionExpired: isSessionExpired(),
    fallbackPath,
    timestamp: new Date().toISOString()
  });

  useEffect(() => {
    console.log('🛡️ AuthGuard useEffect:', { 
      isLoading, 
      requireAuth, 
      isAuthenticated,
      isSessionExpired: isSessionExpired(),
      user: !!user,
      pathname: window.location.pathname
    });
    
    if (!isLoading) {
      // More defensive session expiration check
      if (isAuthenticated && user && isSessionExpired()) {
        console.log('🚫 AuthGuard: Session expired, performing automatic logout...');
        console.log('🔍 AuthGuard: Session debug info:', {
          hasUser: !!user,
          userEmail: user?.email,
          timeUntilExpiry: getTimeUntilExpiry(),
          isSessionExpiredCheck: isSessionExpired()
        });
        
        // Only logout if we have a valid logout function and the session is truly expired
        if (logout && getTimeUntilExpiry() <= 0) {
          logout().then(() => {
            console.log('✅ AuthGuard: Automatic logout completed, redirecting to:', fallbackPath);
            router.push(fallbackPath);
          }).catch((error) => {
            console.error('❌ AuthGuard: Automatic logout failed:', error);
            // Still redirect even if logout fails
            router.push(fallbackPath);
          });
        } else if (getTimeUntilExpiry() > 0) {
          // False positive - token is not actually expired yet
          console.log('⚠️ AuthGuard: False session expiration detected, token still valid for:', getTimeUntilExpiry(), 'ms');
        } else {
          console.log('🚫 AuthGuard: No logout function available, redirecting to:', fallbackPath);
          router.push(fallbackPath);
        }
      } else if (requireAuth && !isAuthenticated) {
        console.log('🚫 AuthGuard: User needs auth but not authenticated, redirecting to:', fallbackPath);
        router.push(fallbackPath);
      } else if (!requireAuth && isAuthenticated) {
        console.log('🚫 AuthGuard: User authenticated but should not be, redirecting to dashboard');
        router.push('/dashboard');
      } else {
        console.log('✅ AuthGuard: Authentication state is correct');
      }
    }
  }, [isAuthenticated, isLoading, requireAuth, fallbackPath, router, isSessionExpired, logout, user, getTimeUntilExpiry]);

  // Show loading state while checking authentication
  if (isLoading) {
    console.log('🔄 AuthGuard: Showing loading state');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-secondary-600">Checking authentication...</p>
          <p className="text-xs text-secondary-400 mt-2">AuthGuard Loading</p>
        </div>
      </div>
    );
  }

  // If authentication state doesn't match requirements, show loading
  // (will redirect via useEffect)
  const sessionExpired = isAuthenticated && isSessionExpired();
  if ((requireAuth && !isAuthenticated) || (!requireAuth && isAuthenticated) || sessionExpired) {
    console.log('🚫 AuthGuard: Auth state mismatch, showing redirect screen');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-secondary-600">Redirecting...</p>
          <p className="text-xs text-secondary-400 mt-2">
            Auth: {isAuthenticated ? 'Yes' : 'No'} | Required: {requireAuth ? 'Yes' : 'No'} | Expired: {sessionExpired ? 'Yes' : 'No'}
          </p>
        </div>
      </div>
    );
  }

  // Render children if authentication state is correct
  console.log('✅ AuthGuard: Rendering protected content');
  return <>{children}</>;
}