import { AxiosResponse } from 'axios';
import api from './base';
import {
  Folder,
  FolderCreateRequest,
  FolderUpdateRequest,
  FolderDeleteResponse,
  FolderList,
  FolderFilters,
  FolderMoveRequest,
  FolderStats,
  FolderTree,
} from '@/types/api';
import { authService } from '../auth';

export const foldersApi = {
  list: async (orgId: string, filters?: FolderFilters): Promise<FolderList> => {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.per_page) params.append('per_page', filters.per_page.toString());
    if (filters?.name) params.append('name', filters.name);
    if (filters?.parent_folder_id) params.append('parent_folder_id', filters.parent_folder_id);
    
    const response: AxiosResponse<FolderList> = await api.get(
      `/organizations/${orgId}/folders${params.toString() ? `?${params.toString()}` : ''}`
    );
    return response.data;
  },

  getById: async (orgId: string, folderId: string): Promise<Folder> => {
    const response: AxiosResponse<Folder> = await api.get(`/organizations/${orgId}/folders/${folderId}`);
    return response.data;
  },

  create: async (orgId: string, data: FolderCreateRequest): Promise<Folder> => {
    if (!orgId) {
      throw new Error('Organization ID is required to create a folder');
    }
    if (!data.name || data.name.trim() === '') {
      throw new Error('Folder name is required');
    }
    
    // Get current user information for user_id parameter
    const currentUser = authService.getUser();
    if (!currentUser) {
      throw new Error('No authenticated user found. Please login first.');
    }
    
    // Validate user belongs to the organization
    if (currentUser.org_id !== orgId) {
      throw new Error('Access denied: Cannot create folder in different organization.');
    }
    
    console.log('Creating folder:', { 
      orgId, 
      data, 
      userId: currentUser.user_id,
      orgName: currentUser.org_name
    });
    
    // Add user_id as query parameter as required by the backend
    const response: AxiosResponse<Folder> = await api.post(
      `/organizations/${orgId}/folders?user_id=${currentUser.user_id}`, 
      data
    );
    return response.data;
  },

  update: async (orgId: string, folderId: string, data: FolderUpdateRequest): Promise<Folder> => {
    const response: AxiosResponse<Folder> = await api.put(`/organizations/${orgId}/folders/${folderId}`, data);
    return response.data;
  },

  delete: async (orgId: string, folderId: string): Promise<FolderDeleteResponse> => {
    const response: AxiosResponse<FolderDeleteResponse> = await api.delete(`/organizations/${orgId}/folders/${folderId}`);
    return response.data;
  },

  getTree: async (orgId: string): Promise<FolderTree> => {
    const response: AxiosResponse<FolderTree> = await api.get(`/organizations/${orgId}/folders/tree`);
    return response.data;
  },

  move: async (orgId: string, folderId: string, data: FolderMoveRequest): Promise<Folder> => {
    const response: AxiosResponse<Folder> = await api.put(`/organizations/${orgId}/folders/${folderId}/move`, data);
    return response.data;
  },

  getPath: async (orgId: string, folderId: string): Promise<{ path: string }> => {
    const response: AxiosResponse<{ path: string }> = await api.get(`/organizations/${orgId}/folders/${folderId}/path`);
    return response.data;
  },

  getStats: async (orgId: string): Promise<FolderStats> => {
    const response: AxiosResponse<FolderStats> = await api.get(`/organizations/${orgId}/folders/stats`);
    return response.data;
  },
};