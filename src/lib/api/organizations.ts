import { AxiosResponse } from 'axios';
import api from './base';
import {
  Organization,
  OrganizationCreateRequest,
  OrganizationUpdateRequest,
  OrganizationDeleteResponse,
  OrganizationList,
  OrganizationFilters,
} from '@/types/api';

export const organizationsApi = {
  create: async (data: OrganizationCreateRequest): Promise<Organization> => {
    const response: AxiosResponse<Organization> = await api.post('/organizations/', data);
    return response.data;
  },

  list: async (filters?: OrganizationFilters): Promise<OrganizationList> => {
    const response: AxiosResponse<OrganizationList> = await api.get('/organizations/', {
      params: filters,
    });
    return response.data;
  },

  getById: async (orgId: string): Promise<Organization> => {
    const response: AxiosResponse<Organization> = await api.get(`/organizations/${orgId}`);
    return response.data;
  },

  getByName: async (name: string): Promise<Organization> => {
    const response: AxiosResponse<Organization> = await api.get(`/organizations/search/by-name/${name}`);
    return response.data;
  },

  update: async (orgId: string, data: OrganizationUpdateRequest): Promise<Organization> => {
    const response: AxiosResponse<Organization> = await api.put(`/organizations/${orgId}`, data);
    return response.data;
  },

  delete: async (orgId: string): Promise<OrganizationDeleteResponse> => {
    const response: AxiosResponse<OrganizationDeleteResponse> = await api.delete(`/organizations/${orgId}`);
    return response.data;
  },

  getStats: async (): Promise<any> => {
    const response = await api.get('/organizations/stats/');
    return response.data;
  },
};