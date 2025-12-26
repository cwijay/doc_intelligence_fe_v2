'use client';

import { useQuery } from '@tanstack/react-query';
import { documentsApi, usersApi, foldersApi } from '@/lib/api/index';
import { formatDistanceToNow } from 'date-fns';

export interface Activity {
  type: 'upload' | 'processed' | 'processing' | 'error' | 'user' | 'folder';
  message: string;
  time: string; // relative time like "2 minutes ago"
  status: 'success' | 'error' | 'info';
  timestamp: Date; // for sorting
}

export const useRecentActivity = (orgId: string, enabled = true) => {
  return useQuery({
    queryKey: ['recent-activity', orgId],
    queryFn: async (): Promise<Activity[]> => {
      if (!orgId) {
        return [];
      }

      // Helper to safely fetch data without triggering API error logs
      // This is intentional - activity fetches are non-critical and some endpoints
      // may fail for non-admin users (e.g., users list)
      const safeApiCall = async <T>(
        apiCall: () => Promise<T>,
        fallback: T
      ): Promise<T> => {
        try {
          return await apiCall();
        } catch {
          return fallback;
        }
      };

      // Fetch data from multiple APIs in parallel with graceful error handling
      const [documentsResult, usersResult, foldersResult] = await Promise.all([
        safeApiCall(
          () => documentsApi.list(orgId, { per_page: 10 }),
          { documents: [], total: 0, page: 1, per_page: 10, total_pages: 0 }
        ),
        safeApiCall(
          () => usersApi.list(orgId, { per_page: 10 }),
          { users: [], total: 0, page: 1, per_page: 10, total_pages: 0 }
        ),
        safeApiCall(
          () => foldersApi.list(orgId, { per_page: 10 }),
          { folders: [], total: 0, page: 1, per_page: 10, total_pages: 0 }
        )
      ]);

      const activities: Activity[] = [];

      // Process documents for upload, processing, and error activities
      documentsResult.documents.forEach(doc => {
        // Document upload activity
        if (doc.uploaded_at) {
          activities.push({
            type: 'upload',
            message: `${doc.name} uploaded successfully`,
            time: formatDistanceToNow(new Date(doc.uploaded_at), { addSuffix: true }),
            status: 'success',
            timestamp: new Date(doc.uploaded_at)
          });
        }

        // Document processed activity
        if (doc.processed_at && doc.status === 'processed') {
          activities.push({
            type: 'processed',
            message: `${doc.name} processing completed`,
            time: formatDistanceToNow(new Date(doc.processed_at), { addSuffix: true }),
            status: 'success',
            timestamp: new Date(doc.processed_at)
          });
        }

        // Document processing activity (currently processing)
        if (doc.status === 'processing') {
          activities.push({
            type: 'processing',
            message: `${doc.name} is being processed`,
            time: formatDistanceToNow(new Date(doc.uploaded_at), { addSuffix: true }),
            status: 'info',
            timestamp: new Date(doc.uploaded_at)
          });
        }

        // Document error activity
        if (doc.status === 'error' || doc.status === 'failed') {
          const errorMsg = doc.error ? `: ${doc.error}` : '';
          activities.push({
            type: 'error',
            message: `Failed to process ${doc.name}${errorMsg}`,
            time: formatDistanceToNow(new Date(doc.uploaded_at), { addSuffix: true }),
            status: 'error',
            timestamp: new Date(doc.uploaded_at)
          });
        }
      });

      // Process users for registration activities
      usersResult.users.forEach(user => {
        if (user.created_at) {
          activities.push({
            type: 'user',
            message: `${user.full_name} joined the organization`,
            time: formatDistanceToNow(new Date(user.created_at), { addSuffix: true }),
            status: 'info',
            timestamp: new Date(user.created_at)
          });
        }
      });

      // Process folders for creation activities
      foldersResult.folders.forEach(folder => {
        if (folder.created_at) {
          activities.push({
            type: 'folder',
            message: `Folder '${folder.name}' created`,
            time: formatDistanceToNow(new Date(folder.created_at), { addSuffix: true }),
            status: 'info',
            timestamp: new Date(folder.created_at)
          });
        }
      });

      // Sort activities by timestamp (most recent first) and limit to top 4
      return activities
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 4);
    },
    enabled: enabled && !!orgId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes for real-time feel
  });
};
