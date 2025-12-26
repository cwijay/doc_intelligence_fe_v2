import { UserRole } from './api';

// Session-based User interface (from API spec)
export interface SessionUser {
  user_id: string;
  email: string;
  full_name: string;
  username: string;
  role: UserRole;
  org_id: string;
  org_name: string;
  session_id: string;
  created_at: string;
  last_used: string;
  expires_at: string;
}

// Organization interface (from API spec)
export interface Organization {
  id: string;
  name: string;
  domain: string;
  settings: Record<string, unknown>;
  plan_type: "free" | "starter" | "pro";
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Login request/response (from API spec)
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
  expires_in: number;
  refresh_expires_in: number;
  access_token_expires_at: string;
  refresh_token_expires_at: string;
  user: SessionUser;
}

// Register request/response (from API spec)
export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  username: string;
  organization_id: string; // Required - must select existing organization
}

export interface RegisterResponse {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
  expires_in: number;
  refresh_expires_in: number;
  access_token_expires_at: string;
  refresh_token_expires_at: string;
  user: SessionUser;
}

// Logout response (from API spec)
export interface LogoutResponse {
  message: string;
  logged_out_at: string;
}

// Token validation response (from API spec)
export interface TokenValidationResponse {
  valid: boolean;
  expires_at: string;
  time_remaining: number;
  in_grace_period: boolean;
  can_refresh: boolean;
  user: SessionUser;
}

// Refresh token request (from API spec)
export interface RefreshTokenRequest {
  refresh_token: string;
}

// Access token response (from API spec)
export interface AccessTokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  access_token_expires_at: string;
  refresh_token_expires_at?: string;
  refresh_token_expires_in?: number;
  rotation_enabled: boolean;
  refresh_token_rotated: boolean;
}

// Enhanced auth state with refresh tokens
export interface AuthState {
  user: SessionUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  accessTokenExpiry: Date | null;
  refreshTokenExpiry: Date | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasInitialized: boolean;
  error: string | null;
  sessionStatus: {
    valid: boolean;
    timeRemaining: number;
    inGracePeriod: boolean;
    canRefresh: boolean;
  };
}

// Enhanced auth context with token refresh
export interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshTokens: () => Promise<void>;
  validateToken: () => Promise<TokenValidationResponse>;
  clearError: () => void;
  hasRole: (role: UserRole) => boolean;
  hasPermission: (permission: string) => boolean;
  isAdmin: () => boolean;
  isSessionExpired: () => boolean;
  getTimeUntilExpiry: () => number;
}

// Error interface (from API spec format)
export interface AuthError {
  error: {
    code: string;
    message: string;
    error_id: string;
    details?: {
      field_errors?: Array<{
        field: string;
        message: string;
        type: string;
      }>;
    };
    path: string;
    timestamp: string;
  };
}