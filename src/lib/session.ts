'use client';

import { SessionUser } from '@/types/auth';

// Session storage keys
const SESSION_TOKEN_KEY = 'biz_to_bricks_session_token';
const SESSION_USER_KEY = 'biz_to_bricks_session_user';
const SESSION_EXPIRY_KEY = 'biz_to_bricks_session_expiry';

export class SessionManager {
  // Session token management (simple UUID v4 tokens)
  static getToken(): string | null {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(SESSION_TOKEN_KEY);
    } catch (error) {
      console.warn('localStorage access blocked:', error);
      return null;
    }
  }

  static setToken(token: string): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(SESSION_TOKEN_KEY, token);
    } catch (error) {
      console.warn('localStorage write blocked:', error);
    }
  }

  // Session expiry management (24-hour server-managed sessions)
  static getSessionExpiry(): Date | null {
    if (typeof window === 'undefined') return null;
    try {
      const expiryStr = localStorage.getItem(SESSION_EXPIRY_KEY);
      return expiryStr ? new Date(expiryStr) : null;
    } catch (error) {
      console.warn('localStorage access blocked:', error);
      return null;
    }
  }

  static setSessionExpiry(expiryDate: Date): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(SESSION_EXPIRY_KEY, expiryDate.toISOString());
    } catch (error) {
      console.warn('localStorage write blocked:', error);
    }
  }

  // User data management
  static getUser(): SessionUser | null {
    if (typeof window === 'undefined') return null;
    try {
      const userStr = localStorage.getItem(SESSION_USER_KEY);
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.warn('localStorage access blocked or invalid user data:', error);
      return null;
    }
  }

  static setUser(user: SessionUser): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.warn('localStorage write blocked:', error);
    }
  }

  // Session validation (simple expiry check)
  static isSessionExpired(): boolean {
    const expiry = this.getSessionExpiry();
    if (!expiry) return true;
    
    const now = new Date();
    const isExpired = now >= expiry;
    
    console.log('🔍 Session expiry check:', {
      now: now.toISOString(),
      expiry: expiry.toISOString(),
      isExpired,
      minutesRemaining: isExpired ? 0 : Math.floor((expiry.getTime() - now.getTime()) / 60000)
    });
    
    return isExpired;
  }

  static isSessionValid(): boolean {
    const token = this.getToken();
    const user = this.getUser();
    const expired = this.isSessionExpired();
    
    const isValid = !!(token && user && !expired);
    
    console.log('🔍 Session validation check:', {
      hasToken: !!token,
      hasUser: !!user,
      isExpired: expired,
      isValid
    });
    
    return isValid;
  }

  // Session setup from login response
  static setupSession(token: string, user: SessionUser, expiryDate: string): void {
    console.log('🔒 Setting up new session:', {
      tokenStart: token.substring(0, 8) + '...',
      userEmail: user.email,
      orgName: user.org_name,
      expiryDate
    });
    
    this.setToken(token);
    this.setUser(user);
    this.setSessionExpiry(new Date(expiryDate));
  }

  // Clear session (logout)
  static clearSession(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(SESSION_TOKEN_KEY);
      localStorage.removeItem(SESSION_USER_KEY);
      localStorage.removeItem(SESSION_EXPIRY_KEY);
      console.log('🔒 Session cleared');
    } catch (error) {
      console.warn('localStorage clear blocked:', error);
    }
  }

  // Enterprise session clearing (keep from previous system)
  static clearEnterpriseSession(): void {
    if (typeof window === 'undefined') return;
    try {
      // Clear all localStorage
      localStorage.clear();
      
      // Clear all sessionStorage
      sessionStorage.clear();
      
      // Clear auth-related cookies
      document.cookie.split(";").forEach((cookie) => {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" + window.location.hostname;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=." + window.location.hostname;
      });
      
      console.log('🔒 Enterprise session cleared: localStorage, sessionStorage, and cookies');
    } catch (error) {
      console.warn('Enterprise session clear blocked:', error);
    }
  }

  // Debug session state
  static getSessionDebugInfo(): Record<string, unknown> {
    return {
      hasToken: !!this.getToken(),
      hasUser: !!this.getUser(),
      sessionExpiry: this.getSessionExpiry()?.toISOString(),
      isExpired: this.isSessionExpired(),
      isValid: this.isSessionValid(),
      user: this.getUser() ? {
        email: this.getUser()?.email,
        org_name: this.getUser()?.org_name,
        role: this.getUser()?.role
      } : null
    };
  }
}

// Error formatting utility (simplified)
export const formatAuthError = (error: unknown): string => {
  if (!error) return 'An unknown error occurred';
  
  if (typeof error === 'string') return error;
  
  // Handle new API error format
  if (typeof error === 'object' && error !== null && 'error' in error) {
    const authError = error as { error: { message: string; details?: { field_errors?: Array<{ message: string }> } } };
    if (authError.error.message) {
      return authError.error.message;
    }
    if (authError.error.details?.field_errors?.[0]?.message) {
      return authError.error.details.field_errors[0].message;
    }
  }
  
  // Handle axios response format
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: unknown; status?: number } }).response;
    
    if (response?.data && typeof response.data === 'object' && response.data !== null) {
      const data = response.data as Record<string, unknown>;
      
      if (data.message && typeof data.message === 'string') {
        return data.message;
      }
      
      // Handle new API error format in response
      if (data.error && typeof data.error === 'object') {
        const errorObj = data.error as { message?: string };
        if (errorObj.message) return errorObj.message;
      }
    }
    
    // Handle common HTTP status codes
    switch (response?.status) {
      case 401:
        return 'Invalid email or password';
      case 403:
        return 'Access denied';
      case 404:
        return 'Resource not found';
      case 500:
        return 'Server error - please try again later';
      default:
        break;
    }
  }
  
  return 'An unexpected error occurred';
};

// Role and permission utilities (simplified)
export const hasRole = (userRole: string, requiredRole: string): boolean => {
  const roleHierarchy: Record<string, number> = {
    user: 1,
    admin: 2,
  };
  
  const userLevel = roleHierarchy[userRole] || 0;
  const requiredLevel = roleHierarchy[requiredRole] || 0;
  
  return userLevel >= requiredLevel;
};

export const hasPermission = (userRole: string, permission: string): boolean => {
  const permissions: Record<string, string[]> = {
    admin: [
      'organizations.read',
      'organizations.update',
      'users.create',
      'users.read', 
      'users.update',
      'users.delete',
      'documents.create',
      'documents.read',
      'documents.update',
      'documents.delete',
    ],
    user: [
      'organizations.read',
      'users.read',
      'documents.create',
      'documents.read',
      'documents.update',
    ],
  };
  
  return permissions[userRole]?.includes(permission) || false;
};