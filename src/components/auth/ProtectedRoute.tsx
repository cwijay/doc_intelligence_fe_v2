'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types/api';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requiredRole?: UserRole;
  requiredPermission?: string;
  redirectTo?: string;
}

export default function ProtectedRoute({
  children,
  requireAuth = true,
  requiredRole,
  requiredPermission,
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user, hasRole, hasPermission } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return; // Wait for auth to initialize

    // If authentication is required but user is not authenticated
    if (requireAuth && !isAuthenticated) {
      router.push(redirectTo);
      return;
    }

    // If user is authenticated but doesn't have required role
    if (requireAuth && isAuthenticated && requiredRole && !hasRole(requiredRole)) {
      router.push('/unauthorized');
      return;
    }

    // If user is authenticated but doesn't have required permission
    if (requireAuth && isAuthenticated && requiredPermission && !hasPermission(requiredPermission)) {
      router.push('/unauthorized');
      return;
    }

    // If user is authenticated but accessing auth pages, redirect to dashboard
    if (!requireAuth && isAuthenticated) {
      router.push('/');
      return;
    }
  }, [
    isLoading, 
    isAuthenticated, 
    requireAuth, 
    requiredRole, 
    requiredPermission, 
    hasRole, 
    hasPermission, 
    router, 
    redirectTo
  ]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-secondary-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If auth is required but user is not authenticated, don't render children
  if (requireAuth && !isAuthenticated) {
    return null; // Redirecting
  }

  // If role is required but user doesn't have it, don't render children
  if (requireAuth && isAuthenticated && requiredRole && !hasRole(requiredRole)) {
    return null; // Redirecting
  }

  // If permission is required but user doesn't have it, don't render children
  if (requireAuth && isAuthenticated && requiredPermission && !hasPermission(requiredPermission)) {
    return null; // Redirecting
  }

  // If this is an auth route but user is authenticated, don't render children
  if (!requireAuth && isAuthenticated) {
    return null; // Redirecting
  }

  return <>{children}</>;
}

// Convenience components for common use cases
export function AdminOnlyRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole="admin" redirectTo="/unauthorized">
      {children}
    </ProtectedRoute>
  );
}

export function UserOrAdminRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole="user" redirectTo="/unauthorized">
      {children}
    </ProtectedRoute>
  );
}

export function PublicRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requireAuth={false}>
      {children}
    </ProtectedRoute>
  );
}