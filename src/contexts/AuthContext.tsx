'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import {
  AuthContextType,
  AuthState,
  LoginRequest,
  RegisterRequest,
  SessionUser,
  TokenValidationResponse
} from '@/types/auth';
import { UserRole } from '@/types/api';
import { authService, formatAuthError } from '@/lib/auth';

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: SessionUser; accessToken: string; refreshToken: string; accessTokenExpiry: Date; refreshTokenExpiry: Date } }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_INITIALIZED'; payload: boolean };

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  accessTokenExpiry: null,
  refreshTokenExpiry: null,
  isAuthenticated: false,
  isLoading: true,
  hasInitialized: false,
  error: null,
  sessionStatus: {
    valid: false,
    timeRemaining: 0,
    inGracePeriod: false,
    canRefresh: false,
  },
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
        accessTokenExpiry: action.payload.accessTokenExpiry,
        refreshTokenExpiry: action.payload.refreshTokenExpiry,
        isAuthenticated: true,
        isLoading: false,
        hasInitialized: true,
        error: null,
        sessionStatus: {
          valid: true,
          timeRemaining: action.payload.accessTokenExpiry.getTime() - new Date().getTime(),
          inGracePeriod: false,
          canRefresh: true,
        },
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        accessToken: null,
        refreshToken: null,
        accessTokenExpiry: null,
        refreshTokenExpiry: null,
        isAuthenticated: false,
        isLoading: false,
        hasInitialized: true,
        error: action.payload,
        sessionStatus: {
          valid: false,
          timeRemaining: 0,
          inGracePeriod: false,
          canRefresh: false,
        },
      };
    case 'AUTH_LOGOUT':
      return {
        ...state,
        user: null,
        accessToken: null,
        refreshToken: null,
        accessTokenExpiry: null,
        refreshTokenExpiry: null,
        isAuthenticated: false,
        isLoading: false,
        hasInitialized: true,
        error: null,
        sessionStatus: {
          valid: false,
          timeRemaining: 0,
          inGracePeriod: false,
          canRefresh: false,
        },
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'SET_INITIALIZED':
      return {
        ...state,
        hasInitialized: action.payload,
      };
    default:
      return state;
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const login = async (credentials: LoginRequest): Promise<void> => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      console.log('🔑 Attempting login for:', credentials.email);
      const response = await authService.login(credentials);
      
      console.log('🔍 Login response received:', {
        hasAccessToken: !!response.access_token,
        tokenType: response.token_type,
        expiresIn: response.expires_in,
        userEmail: response.user?.email,
        orgName: response.user?.org_name
      });
      
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: response.user,
          accessToken: response.access_token,
          refreshToken: response.refresh_token,
          accessTokenExpiry: new Date(response.access_token_expires_at),
          refreshTokenExpiry: new Date(response.refresh_token_expires_at),
        },
      });
    } catch (error) {
      const errorMessage = formatAuthError(error);
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  const register = async (data: RegisterRequest): Promise<void> => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      const response = await authService.register(data);
      
      console.log('🔍 Registration response received:', {
        hasAccessToken: !!response.access_token,
        tokenType: response.token_type,
        expiresIn: response.expires_in,
        userEmail: response.user?.email,
        orgName: response.user?.org_name
      });
      
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: response.user,
          accessToken: response.access_token,
          refreshToken: response.refresh_token,
          accessTokenExpiry: new Date(response.access_token_expires_at),
          refreshTokenExpiry: new Date(response.refresh_token_expires_at),
        },
      });
    } catch (error) {
      const errorMessage = formatAuthError(error);
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  const logout = useCallback(async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const response = await authService.logout();

      console.log('Logout successful:', response.message);
    } catch (error) {
      console.error('Backend logout failed, proceeding with local logout:', error);
    } finally {
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  }, []);

  const refreshTokens = async (): Promise<void> => {
    try {
      await authService.refreshAccessToken();
      
      // Update state with new token info
      const user = authService.getUser();
      if (user) {
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: {
            user,
            accessToken: authService.getAccessToken() || '',
            refreshToken: authService.getRefreshToken() || '',
            accessTokenExpiry: authService.getAccessTokenExpiry() || new Date(),
            refreshTokenExpiry: authService.getRefreshTokenExpiry() || new Date(),
          },
        });
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      dispatch({ type: 'AUTH_LOGOUT' });
      throw error;
    }
  };

  const validateToken = async (): Promise<TokenValidationResponse> => {
    return await authService.validateToken();
  };

  const isSessionExpired = (): boolean => {
    return authService.isAccessTokenExpired();
  };

  const getTimeUntilExpiry = (): number => {
    return authService.getTimeUntilExpiry();
  };

  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const checkRole = (role: UserRole): boolean => {
    return authService.hasRole(role);
  };

  const checkPermission = (permission: string): boolean => {
    return authService.hasPermission(permission);
  };

  const isAdmin = (): boolean => {
    return authService.isAdmin();
  };

  // Disabled beforeunload token clearing to prevent unexpected logouts

  // Listen for unauthorized events from API interceptors
  useEffect(() => {
    const handleUnauthorized = (event: CustomEvent) => {
      console.log('🚫 Received unauthorized event from API interceptor:', event.detail);
      // Trigger logout when 401 is received from API
      logout().catch((error) => {
        console.error('Failed to logout on unauthorized event:', error);
      });
    };

    // Add event listener for unauthorized events
    window.addEventListener('auth:unauthorized', handleUnauthorized as EventListener);

    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized as EventListener);
    };
  }, [logout]);

  // Periodic session expiration check
  useEffect(() => {
    if (!state.isAuthenticated) {
      return; // No need to check if not authenticated
    }

    const checkSessionExpiration = () => {
      if (state.isAuthenticated && isSessionExpired()) {
        console.log('🕰️ Periodic check: Session expired, triggering automatic logout...');
        logout().catch((error) => {
          console.error('Failed to logout on periodic session check:', error);
        });
      }
    };

    // Check every 5 minutes (reduced frequency to prevent aggressive logout)
    const intervalId = setInterval(checkSessionExpiration, 5 * 60 * 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [state.isAuthenticated, logout]);

  // Check if we need to restore session on app load
  useEffect(() => {
    const restoreSession = () => {
      console.log('🔍 Checking for existing session on app load');
      
      if (authService.isAuthenticated()) {
        const user = authService.getUser();
        const accessToken = authService.getAccessToken();
        const refreshToken = authService.getRefreshToken();
        const accessTokenExpiry = authService.getAccessTokenExpiry();
        const refreshTokenExpiry = authService.getRefreshTokenExpiry();
        
        if (user && accessToken && refreshToken && accessTokenExpiry && refreshTokenExpiry) {
          console.log('🔍 Restoring valid session for:', user.email);
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: {
              user,
              accessToken,
              refreshToken,
              accessTokenExpiry,
              refreshTokenExpiry,
            },
          });
          return;
        }
      }
      
      // No valid session found, mark as initialized and stop loading
      console.log('🔍 No valid session found, stopping loading state');
      dispatch({ type: 'SET_LOADING', payload: false });
      dispatch({ type: 'SET_INITIALIZED', payload: true });
    };
    
    restoreSession();
  }, []);

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    refreshTokens,
    validateToken,
    clearError,
    hasRole: checkRole,
    hasPermission: checkPermission,
    isAdmin,
    isSessionExpired,
    getTimeUntilExpiry,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};