import { AxiosResponse } from 'axios';
import api from './base';
import {
  User,
  UserCreateRequest,
  UserUpdateRequest,
  UserDeleteResponse,
  UserList,
  UserFilters,
} from '@/types/api';

export const usersApi = {
  create: async (orgId: string, data: UserCreateRequest): Promise<User> => {
    const response: AxiosResponse<User> = await api.post(`/organizations/${orgId}/users`, data);
    return response.data;
  },

  list: async (orgId: string, filters?: UserFilters): Promise<UserList> => {
    const response: AxiosResponse<UserList> = await api.get(`/organizations/${orgId}/users`, {
      params: filters,
    });
    return response.data;
  },

  getById: async (orgId: string, userId: string): Promise<User> => {
    const response: AxiosResponse<User> = await api.get(`/organizations/${orgId}/users/${userId}`);
    return response.data;
  },

  getByEmail: async (orgId: string, email: string): Promise<User> => {
    const response: AxiosResponse<User> = await api.get(`/organizations/${orgId}/users/search/by-email/${email}`);
    return response.data;
  },

  getByUsername: async (orgId: string, username: string): Promise<User> => {
    const response: AxiosResponse<User> = await api.get(`/organizations/${orgId}/users/search/by-username/${username}`);
    return response.data;
  },

  update: async (orgId: string, userId: string, data: UserUpdateRequest): Promise<User> => {
    const response: AxiosResponse<User> = await api.put(`/organizations/${orgId}/users/${userId}`, data);
    return response.data;
  },

  delete: async (orgId: string, userId: string): Promise<UserDeleteResponse> => {
    const response: AxiosResponse<UserDeleteResponse> = await api.delete(`/organizations/${orgId}/users/${userId}`);
    return response.data;
  },

  getStats: async (orgId: string): Promise<any> => {
    try {
      const response = await api.get(`/organizations/${orgId}/users/stats/summary`);
      
      // If we get a fallback response, handle it gracefully
      if (response.data?.fallback) {
        console.warn('Using fallback data for user stats due to backend issues');
        return response.data.data; // Return just the data part, not the wrapper
      }
      
      return response.data;
    } catch (error) {
      console.error('Failed to fetch user stats, returning fallback data:', error);
      // Return default fallback data if API call fails completely
      return {
        total_users: 0,
        active_users: 0,
        inactive_users: 0,
        recent_registrations: 0,
        user_roles: {
          admin: 0,
          user: 0,
          viewer: 0
        }
      };
    }
  },
};