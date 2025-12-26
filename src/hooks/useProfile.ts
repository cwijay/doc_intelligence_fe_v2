import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi, usersApi } from '@/lib/api/index';
import { useAuth } from '@/hooks/useAuth';
import { UserUpdateRequest, User } from '@/types/api';
import { SessionUser } from '@/types/auth';

const QUERY_KEYS = {
  profile: 'profile',
  currentUser: 'currentUser',
};

// Enhanced profile data that combines User data with session info
export interface EnhancedProfile extends User {
  // Add session-specific fields from auth context
  session_id?: string;
  org_name?: string;
  expires_at?: string;
  last_used?: string;
}

// Get current user profile information using by-email endpoint
export const useProfile = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: [QUERY_KEYS.profile, user?.org_id, user?.email],
    queryFn: async (): Promise<EnhancedProfile> => {
      if (!user?.org_id || !user?.email) {
        throw new Error('User organization ID or email not found');
      }
      
      try {
        // Use the by-email endpoint to get detailed user information
        const userProfile = await usersApi.getByEmail(user.org_id, user.email);
        
        // Enhance with session information from auth context
        const enhancedProfile: EnhancedProfile = {
          ...userProfile,
          // Add session-specific fields from auth context
          session_id: user.session_id,
          org_name: user.org_name,
          expires_at: user.expires_at,
          last_used: user.last_used,
        };
        
        return enhancedProfile;
      } catch (error) {
        console.error('Failed to fetch user profile via by-email endpoint:', error);
        
        // Fallback to auth/me endpoint if by-email fails
        console.log('Falling back to /auth/me endpoint...');
        const sessionUser = await authApi.getCurrentUser();
        
        // Convert SessionUser to EnhancedProfile format
        const fallbackProfile: EnhancedProfile = {
          id: sessionUser.user_id,
          org_id: sessionUser.org_id,
          email: sessionUser.email,
          username: sessionUser.username,
          full_name: sessionUser.full_name,
          role: sessionUser.role,
          is_active: true, // Assume active if logged in
          created_at: sessionUser.created_at,
          updated_at: sessionUser.created_at, // Use created_at as fallback
          last_login: sessionUser.last_used,
          // Session-specific fields
          session_id: sessionUser.session_id,
          org_name: sessionUser.org_name,
          expires_at: sessionUser.expires_at,
          last_used: sessionUser.last_used,
        };
        
        return fallbackProfile;
      }
    },
    enabled: !!user?.org_id && !!user?.email,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Don't retry on auth errors
  });
};

// Update user profile
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (data: UserUpdateRequest) => {
      if (!user?.org_id || !user?.user_id) {
        throw new Error('User organization or ID not found');
      }
      
      return usersApi.update(user.org_id, user.user_id, data);
    },
    onSuccess: (updatedUser: User) => {
      // Update the profile cache with the correct query key structure
      queryClient.setQueryData(
        [QUERY_KEYS.profile, user?.org_id, user?.email], 
        (oldData: EnhancedProfile | undefined) => {
          if (!oldData) return oldData;
          
          // Merge updated user data with existing session data
          return {
            ...oldData,
            ...updatedUser, // This includes all updated fields
            // Preserve session-specific fields
            session_id: oldData.session_id,
            org_name: oldData.org_name,
            expires_at: oldData.expires_at,
            last_used: oldData.last_used,
          } as EnhancedProfile;
        }
      );
      
      // Invalidate related queries with the correct structure
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.profile, user?.org_id, user?.email] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) => {
      console.error('Failed to update profile:', error);
    },
  });
};

// Get user's organization information
export const useUserOrganization = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['organizations', user?.org_id],
    queryFn: () => {
      if (!user?.org_id) {
        throw new Error('User organization ID not found');
      }
      // We'll need to add this to the API if it doesn't exist
      // For now, return the org info from the user object
      return Promise.resolve({
        id: user.org_id,
        name: user.org_name || 'Unknown Organization',
        domain: '',
        plan_type: 'free' as const,
        is_active: true,
        created_at: '',
        updated_at: '',
        settings: {},
      });
    },
    enabled: !!user?.org_id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};