import { AxiosResponse } from 'axios';
import api from './base';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  LogoutResponse,
  Organization,
  SessionUser,
} from '@/types/auth';
import { authService } from '@/lib/auth';

export const authApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response: AxiosResponse<LoginResponse> = await api.post('/auth/login', credentials);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    const response: AxiosResponse<RegisterResponse> = await api.post('/auth/register', data);
    return response.data;
  },

  getOrganizations: async (query?: string): Promise<Organization[]> => {
    const params = query ? { name: query } : undefined;

    const response: AxiosResponse<any> = await api.get('/organizations/', { params });

    const data = response.data;

    if (Array.isArray(data)) {
      return data as Organization[];
    }

    if (Array.isArray(data?.items)) {
      return data.items as Organization[];
    }

    if (Array.isArray(data?.organizations)) {
      return data.organizations as Organization[];
    }

    if (Array.isArray(data?.results)) {
      return data.results as Organization[];
    }

    return [];
  },

  getCurrentUser: async (): Promise<SessionUser> => {
    const response: AxiosResponse<SessionUser> = await api.get('/auth/me');
    return response.data;
  },

  logout: async (): Promise<LogoutResponse> => {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authService.getAccessToken() || ''}`
      }
    });
    return await response.json();
  },
};
