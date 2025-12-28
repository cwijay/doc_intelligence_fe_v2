'use client';

import axios, { AxiosInstance } from 'axios';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  LogoutResponse,
  TokenValidationResponse,
  RefreshTokenRequest,
  AccessTokenResponse,
  SessionUser,
} from '@/types/auth';
import { clientConfig, getBrowserApiBaseUrl, isUsingLocalProxy, API_LOCAL_PROXY_PATH } from './config';
import { STORAGE_KEYS, TIMEOUTS } from './constants';

const API_BASE_URL = getBrowserApiBaseUrl();
const usingLocalProxy = typeof window !== 'undefined' ? isUsingLocalProxy() : false;

if (usingLocalProxy) {
  console.log('🔁 Auth service using local API proxy:', API_LOCAL_PROXY_PATH);
}

// Use constants for storage keys
const ACCESS_TOKEN_KEY = STORAGE_KEYS.ACCESS_TOKEN;
const REFRESH_TOKEN_KEY = STORAGE_KEYS.REFRESH_TOKEN;
const USER_KEY = STORAGE_KEYS.USER;
const ACCESS_TOKEN_EXPIRY_KEY = STORAGE_KEYS.ACCESS_EXPIRY;
const REFRESH_TOKEN_EXPIRY_KEY = STORAGE_KEYS.REFRESH_EXPIRY;

export class AuthService {
  private static instance: AuthService;
  private api: AxiosInstance;
  private refreshPromise: Promise<void> | null = null;
  private isRefreshing = false;

  private constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: TIMEOUTS.AUTH_API,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private setupInterceptors(): void {
    this.api.interceptors.request.use(
      (config) => {
        const token = this.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Skip token refresh for auth endpoints to prevent refresh loops during login
        const isAuthEndpoint = originalRequest?.url?.includes('/auth/login') || 
                              originalRequest?.url?.includes('/auth/register') ||
                              originalRequest?.url?.includes('/auth/refresh');

        if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
          originalRequest._retry = true;

          // Only attempt refresh if we have a valid refresh token
          if (!this.canRefreshToken()) {
            console.warn('Cannot refresh token - clearing auth state');
            this.clearTokens();
            this.emitUnauthorizedEvent();
            return Promise.reject(error);
          }

          try {
            await this.refreshAccessToken();
            const newToken = this.getAccessToken();
            if (newToken) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            this.clearTokens();
            this.emitUnauthorizedEvent();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Token storage methods
  public getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(ACCESS_TOKEN_KEY);
    } catch {
      return null;
    }
  }

  public setAccessToken(token: string): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(ACCESS_TOKEN_KEY, token);
    } catch (error) {
      console.warn('Failed to store access token:', error);
    }
  }

  public getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  }

  public setRefreshToken(token: string): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(REFRESH_TOKEN_KEY, token);
    } catch (error) {
      console.warn('Failed to store refresh token:', error);
    }
  }

  public getAccessTokenExpiry(): Date | null {
    if (typeof window === 'undefined') return null;
    try {
      const expiry = localStorage.getItem(ACCESS_TOKEN_EXPIRY_KEY);
      return expiry ? new Date(expiry) : null;
    } catch {
      return null;
    }
  }

  private setAccessTokenExpiry(expiry: Date): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(ACCESS_TOKEN_EXPIRY_KEY, expiry.toISOString());
    } catch (error) {
      console.warn('Failed to store access token expiry:', error);
    }
  }

  public getRefreshTokenExpiry(): Date | null {
    if (typeof window === 'undefined') return null;
    try {
      const expiry = localStorage.getItem(REFRESH_TOKEN_EXPIRY_KEY);
      return expiry ? new Date(expiry) : null;
    } catch {
      return null;
    }
  }

  private setRefreshTokenExpiry(expiry: Date): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(REFRESH_TOKEN_EXPIRY_KEY, expiry.toISOString());
    } catch (error) {
      console.warn('Failed to store refresh token expiry:', error);
    }
  }

  public getUser(): SessionUser | null {
    if (typeof window === 'undefined') return null;
    try {
      const userStr = localStorage.getItem(USER_KEY);
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  }

  private setUser(user: SessionUser): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.warn('Failed to store user data:', error);
    }
  }

  public clearTokens(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(ACCESS_TOKEN_EXPIRY_KEY);
      localStorage.removeItem(REFRESH_TOKEN_EXPIRY_KEY);
    } catch (error) {
      console.warn('Failed to clear tokens:', error);
    }
  }

  // Authentication methods
  public async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      console.log('🔑 Attempting login for:', credentials.email);
      console.log('🌐 Login request details:', {
        url: `${API_BASE_URL}/auth/login`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        timestamp: new Date().toISOString()
      });

      const response = await this.api.post<LoginResponse>('/auth/login', credentials);

      this.storeTokens(response.data);
      console.log('🔍 Login successful, tokens stored');

      return response.data;
    } catch (error: any) {
      const errorInfo: Record<string, unknown> = {
        message: error?.message || 'Unknown error',
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        url: error?.config?.url || `${API_BASE_URL}/auth/login`,
        method: error?.config?.method || 'POST',
        timestamp: new Date().toISOString(),
        errorType: error?.name || 'Unknown',
        isAxiosError: error?.isAxiosError || false
      };

      // Add response data if it exists and is serializable
      if (error?.response?.data) {
        try {
          errorInfo.responseData = typeof error.response.data === 'string'
            ? error.response.data
            : JSON.stringify(error.response.data);
        } catch {
          errorInfo.responseData = 'Non-serializable response data';
        }
      }

      // Add request headers if they exist
      if (error?.config?.headers) {
        errorInfo.requestHeaders = {
          'Content-Type': error.config.headers['Content-Type'],
          'Authorization': error.config.headers['Authorization'] ? '[REDACTED]' : 'None'
        };
      }

      console.error('❌ Login failed - Detailed error:', errorInfo);
      throw error;
    }
  }

  public async register(data: RegisterRequest): Promise<RegisterResponse> {
    try {
      console.log('🔑 Attempting registration for:', data.email);
      const response = await this.api.post<RegisterResponse>('/auth/register', data);
      
      this.storeTokens(response.data);
      console.log('🔍 Registration successful, tokens stored');
      
      return response.data;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }

  public async logout(): Promise<LogoutResponse> {
    try {
      const token = this.getAccessToken();
      
      if (token) {
        const response = await this.api.post<LogoutResponse>('/auth/logout');
        console.log('Backend logout successful');
        return response.data;
      }
      
      return { message: 'Logged out successfully', logged_out_at: new Date().toISOString() };
    } catch (error) {
      console.warn('Backend logout failed, proceeding with local logout:', error);
      return { message: 'Logged out locally', logged_out_at: new Date().toISOString() };
    } finally {
      this.clearTokens();
    }
  }

  public async validateToken(): Promise<TokenValidationResponse> {
    try {
      const response = await this.api.get<TokenValidationResponse>('/auth/validate');
      return response.data;
    } catch (error) {
      console.error('Token validation failed:', error);
      throw error;
    }
  }

  public async refreshAccessToken(): Promise<void> {
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this.performTokenRefresh();

    try {
      await this.refreshPromise;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  private async performTokenRefresh(): Promise<void> {
    const refreshToken = this.getRefreshToken();
    
    if (!refreshToken) {
      console.warn('No refresh token available - clearing auth state');
      this.clearTokens();
      this.emitUnauthorizedEvent();
      throw new Error('No refresh token available');
    }

    // Check if refresh token is expired
    if (this.isRefreshTokenExpired()) {
      console.warn('Refresh token is expired - clearing auth state');
      this.clearTokens();
      this.emitUnauthorizedEvent();
      throw new Error('Refresh token expired');
    }

    try {
      console.log('🔄 Refreshing access token...');
      const response = await this.api.post<AccessTokenResponse>('/auth/refresh', {
        refresh_token: refreshToken,
      });

      const {
        access_token,
        refresh_token: newRefreshToken,
        access_token_expires_at,
        refresh_token_expires_at,
        refresh_token_rotated,
      } = response.data;

      // Use imported client config for consistent session timeout
      const now = new Date();
      const sessionHours = clientConfig.sessionTimeoutHours || 12;
      
      // Override backend expiration times during token refresh as well
      const overrideAccessExpiry = new Date(now.getTime() + (sessionHours * 60 * 60 * 1000));
      const overrideRefreshExpiry = new Date(now.getTime() + ((sessionHours + 12) * 60 * 60 * 1000));

      console.log('🔄 Token refresh: Overriding expiration times:', {
        backendAccessExpiry: access_token_expires_at,
        frontendAccessExpiry: overrideAccessExpiry.toISOString(),
        sessionTimeoutHours: sessionHours
      });

      // Store new access token with frontend-calculated expiry
      this.setAccessToken(access_token);
      this.setAccessTokenExpiry(overrideAccessExpiry);

      // Store new refresh token if rotated with frontend-calculated expiry
      if (refresh_token_rotated && newRefreshToken && refresh_token_expires_at) {
        this.setRefreshToken(newRefreshToken);
        this.setRefreshTokenExpiry(overrideRefreshExpiry);
      }

      console.log('🔍 Token refresh successful');
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.clearTokens();
      this.emitUnauthorizedEvent();
      throw error;
    }
  }

  // Token validation methods
  public isAccessTokenExpired(): boolean {
    const expiry = this.getAccessTokenExpiry();
    if (!expiry) return true;
    
    const now = new Date();
    const buffer = 1 * 60 * 1000; // 1 minute buffer (reduced from 5 minutes)
    return now.getTime() >= (expiry.getTime() - buffer);
  }

  public isRefreshTokenExpired(): boolean {
    const expiry = this.getRefreshTokenExpiry();
    if (!expiry) return true;
    
    return new Date() >= expiry;
  }

  public isAuthenticated(): boolean {
    const accessToken = this.getAccessToken();
    const user = this.getUser();
    const isAccessValid = !this.isAccessTokenExpired();
    const isRefreshValid = !this.isRefreshTokenExpired();
    
    return !!(accessToken && user && (isAccessValid || isRefreshValid));
  }

  public getTimeUntilExpiry(): number {
    const expiry = this.getAccessTokenExpiry();
    if (!expiry) return 0;
    
    return Math.max(0, expiry.getTime() - new Date().getTime());
  }

  public canRefreshToken(): boolean {
    return !!this.getRefreshToken() && !this.isRefreshTokenExpired();
  }

  // Session management
  private storeTokens(authResponse: LoginResponse | RegisterResponse): void {
    const {
      access_token,
      refresh_token,
      access_token_expires_at,
      refresh_token_expires_at,
      user,
    } = authResponse;

    // Use imported client config for session timeout configuration
    
    // Override backend expiration times with frontend-configured duration
    const now = new Date();
    const sessionHours = clientConfig.sessionTimeoutHours || 12;
    const overrideAccessExpiry = new Date(now.getTime() + (sessionHours * 60 * 60 * 1000));
    const overrideRefreshExpiry = new Date(now.getTime() + ((sessionHours + 12) * 60 * 60 * 1000)); // Refresh token lasts 12 hours longer

    console.log('🕰️ Overriding token expiration times:', {
      backendAccessExpiry: access_token_expires_at,
      backendRefreshExpiry: refresh_token_expires_at,
      frontendAccessExpiry: overrideAccessExpiry.toISOString(),
      frontendRefreshExpiry: overrideRefreshExpiry.toISOString(),
      sessionTimeoutHours: sessionHours,
      extensionReason: 'Frontend session timeout override'
    });

    this.setAccessToken(access_token);
    this.setRefreshToken(refresh_token);
    this.setAccessTokenExpiry(overrideAccessExpiry); // Use frontend-calculated expiry
    this.setRefreshTokenExpiry(overrideRefreshExpiry); // Use frontend-calculated expiry
    this.setUser(user);
  }

  private emitUnauthorizedEvent(): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth:unauthorized', {
        detail: { reason: 'token_refresh_failed', timestamp: new Date().toISOString() }
      }));
    }
  }

  // Utility methods
  public getSessionDebugInfo(): Record<string, unknown> {
    return {
      hasAccessToken: !!this.getAccessToken(),
      hasRefreshToken: !!this.getRefreshToken(),
      hasUser: !!this.getUser(),
      isAccessTokenExpired: this.isAccessTokenExpired(),
      isRefreshTokenExpired: this.isRefreshTokenExpired(),
      isAuthenticated: this.isAuthenticated(),
      canRefresh: this.canRefreshToken(),
      timeUntilExpiry: this.getTimeUntilExpiry(),
      user: this.getUser() ? {
        email: this.getUser()?.email,
        org_name: this.getUser()?.org_name,
        role: this.getUser()?.role,
      } : null,
    };
  }

  // Role and permission methods
  public hasRole(requiredRole: string): boolean {
    const user = this.getUser();
    if (!user) return false;

    const roleHierarchy: Record<string, number> = {
      user: 1,
      admin: 2,
    };

    const userLevel = roleHierarchy[user.role] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;

    return userLevel >= requiredLevel;
  }

  public hasPermission(permission: string): boolean {
    const user = this.getUser();
    if (!user) return false;

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

    return permissions[user.role]?.includes(permission) || false;
  }

  public isAdmin(): boolean {
    const user = this.getUser();
    return user?.role === 'admin' || false;
  }

  // Backward compatibility methods
  public clearEnterpriseSession(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.clear();
      sessionStorage.clear();
      
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
}

// Export singleton instance
export const authService = AuthService.getInstance();

// Backward compatibility - keep AuthTokenManager interface for existing code
export class AuthTokenManager {
  static getToken(): string | null {
    return authService.getAccessToken();
  }

  static setToken(token: string): void {
    authService.setAccessToken(token);
  }

  static getRefreshToken(): string | null {
    return authService.getRefreshToken();
  }

  static setRefreshToken(refreshToken: string): void {
    authService.setRefreshToken(refreshToken);
  }

  static getStoredUser(): string | null {
    const user = authService.getUser();
    return user ? JSON.stringify(user) : null;
  }

  static setStoredUser(user: string): void {
    try {
      const userData = JSON.parse(user);
      authService['setUser'](userData); // Access private method via bracket notation
    } catch (error) {
      console.warn('Failed to parse user data:', error);
    }
  }

  static clearTokens(): void {
    authService.clearTokens();
  }

  static clearEnterpriseSession(): void {
    authService.clearEnterpriseSession();
  }

  static isTokenExpired(): boolean {
    return authService.isAccessTokenExpired();
  }

  static isTokenValid(_token: string | null): boolean {
    return authService.isAuthenticated();
  }
}

export const formatAuthError = (error: unknown): string => {
  if (!error) return 'An unknown error occurred';

  if (typeof error === 'string') return error;

  // Check for Axios error with response FIRST (before instanceof Error)
  // This ensures we extract backend-specific error messages before falling back to generic error.message
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: unknown; status?: number } }).response;

    if (response?.data && typeof response.data === 'object' && response.data !== null) {
      const data = response.data as Record<string, unknown>;

      // Extract backend error message (priority order)
      if (data.detail && typeof data.detail === 'string') {
        return data.detail;
      }
      if (data.detail && Array.isArray(data.detail) && data.detail.length > 0) {
        return data.detail.map((d: { msg?: string } | string) =>
          typeof d === 'object' && d.msg ? d.msg : String(d)
        ).join(', ');
      }
      if (data.message && typeof data.message === 'string') {
        return data.message;
      }
      if (data.error && typeof data.error === 'string') {
        return data.error;
      }
      if (data.error && typeof data.error === 'object') {
        const errorObj = data.error as { message?: string };
        if (errorObj.message) return errorObj.message;
      }
    }

    // Fallback to HTTP status-based messages if no specific message found
    switch (response?.status) {
      case 401:
        return 'Invalid email or password';
      case 403:
        return 'Access denied';
      case 404:
        return 'User not found';
      case 500:
        return 'Server error - please try again later';
    }
  }

  // Check for nested error object structure
  if (typeof error === 'object' && error !== null && 'error' in error) {
    const authError = error as { error: { message: string; details?: { field_errors?: Array<{ message: string }> } } };
    if (authError.error.message) {
      return authError.error.message;
    }
    if (authError.error.details?.field_errors?.[0]?.message) {
      return authError.error.details.field_errors[0].message;
    }
  }

  // Finally, fall back to Error.message
  if (error instanceof Error) {
    // Avoid raw Axios messages like "Request failed with status code XXX"
    if (error.message.startsWith('Request failed with status code')) {
      return 'Login failed. Please check your credentials and try again.';
    }
    return error.message;
  }

  return 'An unexpected error occurred';
};

export const hasRole = (_userRole: string, requiredRole: string): boolean => {
  return authService.hasRole(requiredRole);
};

export const hasPermission = (_userRole: string, permission: string): boolean => {
  return authService.hasPermission(permission);
};

export const getAuthHeaders = (token?: string | null): Record<string, string> => {
  const authToken = token || authService.getAccessToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }
  
  return headers;
};
