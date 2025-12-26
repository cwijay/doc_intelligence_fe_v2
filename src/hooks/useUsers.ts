'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/lib/api/index';
import { User, UserCreateRequest, UserUpdateRequest, UserFilters } from '@/types/api';

// Query Keys
export const userKeys = {
  all: ['users'] as const,
  lists: (orgId: string) => [...userKeys.all, 'list', orgId] as const,
  list: (orgId: string, filters?: UserFilters) => [...userKeys.lists(orgId), { filters }] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (orgId: string, userId: string) => [...userKeys.details(), orgId, userId] as const,
  stats: (orgId: string) => [...userKeys.all, 'stats', orgId] as const,
};

// Hook to get users list
export function useUsers(orgId: string, filters?: UserFilters) {
  return useQuery({
    queryKey: userKeys.list(orgId, filters),
    queryFn: async () => {
      try {
        return await usersApi.list(orgId, filters);
      } catch (error) {
        console.warn('⚠️ useUsers: API failed, returning empty list', {
          error: error instanceof Error ? error.message : 'Unknown error',
          orgId,
          filters
        });
        return { users: [], total: 0 };
      }
    },
    enabled: !!orgId,
    staleTime: 30000, // 30 seconds
    retry: 2,
  });
}

// Hook to get user by ID
export function useUser(orgId: string, userId: string) {
  return useQuery({
    queryKey: userKeys.detail(orgId, userId),
    queryFn: async () => {
      try {
        return await usersApi.getById(orgId, userId);
      } catch (error) {
        console.warn('⚠️ useUser: API failed, returning null', {
          error: error instanceof Error ? error.message : 'Unknown error',
          orgId,
          userId
        });
        return null;
      }
    },
    enabled: !!orgId && !!userId,
    retry: 2,
  });
}

// Hook to get user stats
export function useUserStats(orgId: string) {
  return useQuery({
    queryKey: userKeys.stats(orgId),
    queryFn: async () => {
      try {
        return await usersApi.getStats(orgId);
      } catch (error) {
        console.warn('⚠️ useUserStats: API failed, returning fallback stats', {
          error: error instanceof Error ? error.message : 'Unknown error',
          orgId
        });
        return { total: 0, active: 0, pending: 0 };
      }
    },
    enabled: !!orgId,
    staleTime: 60000, // 1 minute
    retry: 2,
  });
}

// Hook to create user
export function useCreateUser(orgId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: UserCreateRequest) => usersApi.create(orgId, data),
    onSuccess: () => {
      // Invalidate and refetch user lists for this organization
      queryClient.invalidateQueries({
        queryKey: userKeys.lists(orgId)
      });
      // Invalidate user stats
      queryClient.invalidateQueries({
        queryKey: userKeys.stats(orgId)
      });
    },
  });
}

// Hook to update user
export function useUpdateUser(orgId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: UserUpdateRequest }) => 
      usersApi.update(orgId, userId, data),
    onSuccess: (_, { userId }) => {
      // Invalidate specific user detail
      queryClient.invalidateQueries({
        queryKey: userKeys.detail(orgId, userId)
      });
      // Invalidate user lists for this organization
      queryClient.invalidateQueries({
        queryKey: userKeys.lists(orgId)
      });
    },
  });
}

// Hook to delete user
export function useDeleteUser(orgId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userId: string) => usersApi.delete(orgId, userId),
    onSuccess: (_, userId) => {
      // Remove specific user from cache
      queryClient.removeQueries({
        queryKey: userKeys.detail(orgId, userId)
      });
      // Invalidate user lists for this organization
      queryClient.invalidateQueries({
        queryKey: userKeys.lists(orgId)
      });
      // Invalidate user stats
      queryClient.invalidateQueries({
        queryKey: userKeys.stats(orgId)
      });
    },
  });
}