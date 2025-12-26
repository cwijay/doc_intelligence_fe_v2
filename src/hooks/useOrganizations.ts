import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { organizationsApi } from '@/lib/api/index';
import {
  Organization,
  OrganizationCreateRequest,
  OrganizationUpdateRequest,
  OrganizationFilters,
} from '@/types/api';

const QUERY_KEYS = {
  organizations: ['organizations'],
  organization: (id: string) => ['organizations', id],
  organizationStats: ['organizations', 'stats'],
};

export const useOrganizations = (filters?: OrganizationFilters) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.organizations, filters],
    queryFn: async () => {
      try {
        return await organizationsApi.list(filters);
      } catch (error) {
        console.warn('⚠️ useOrganizations: API failed, returning empty list', {
          error: error instanceof Error ? error.message : 'Unknown error',
          filters
        });
        return { organizations: [], total: 0 };
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2, // Retry up to 2 times before using fallback
  });
};

export const useOrganization = (id: string, enabled = true) => {
  return useQuery({
    queryKey: QUERY_KEYS.organization(id),
    queryFn: async () => {
      try {
        return await organizationsApi.getById(id);
      } catch (error) {
        console.warn('⚠️ useOrganization: API failed, returning null', {
          error: error instanceof Error ? error.message : 'Unknown error',
          id
        });
        return null;
      }
    },
    enabled: enabled && !!id,
    retry: 2,
  });
};

export const useOrganizationByName = (name: string, enabled = true) => {
  return useQuery({
    queryKey: ['organizations', 'by-name', name],
    queryFn: async () => {
      try {
        return await organizationsApi.getByName(name);
      } catch (error) {
        console.warn('⚠️ useOrganizationByName: API failed, returning null', {
          error: error instanceof Error ? error.message : 'Unknown error',
          name
        });
        return null;
      }
    },
    enabled: enabled && !!name,
    retry: 2,
  });
};

export const useOrganizationStats = () => {
  return useQuery({
    queryKey: QUERY_KEYS.organizationStats,
    queryFn: async () => {
      try {
        return await organizationsApi.getStats();
      } catch (error) {
        console.warn('⚠️ useOrganizationStats: API failed, returning fallback stats', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        return { total_users: 0, total_documents: 0, storage_used: 0 };
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
};

export const useCreateOrganization = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: OrganizationCreateRequest) => organizationsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.organizations });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.organizationStats });
    },
  });
};

export const useUpdateOrganization = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: OrganizationUpdateRequest }) =>
      organizationsApi.update(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.organizations });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.organization(data.id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.organizationStats });
    },
  });
};

export const useDeleteOrganization = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => organizationsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.organizations });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.organizationStats });
    },
  });
};