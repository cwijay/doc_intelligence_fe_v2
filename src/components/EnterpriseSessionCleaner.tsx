'use client';

import { useEffect, useRef } from 'react';
import { AuthTokenManager } from '@/lib/auth';

export default function EnterpriseSessionCleaner() {
  const isInitialLoad = useRef(true);
  const hasInteracted = useRef(false);

  useEffect(() => {
    // Mark as no longer initial load after component mounts
    const timer = setTimeout(() => {
      isInitialLoad.current = false;
    }, 5000); // Give 5 seconds for initial chunks to load

    // Track user interaction
    const handleInteraction = () => {
      hasInteracted.current = true;
    };

    window.addEventListener('click', handleInteraction);
    window.addEventListener('keydown', handleInteraction);

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // Only clear session if:
      // 1. Not during initial load
      // 2. User has actually interacted with the page
      // 3. This is a real browser unload (not just navigation)
      if (!isInitialLoad.current && hasInteracted.current) {
        console.log('🔒 Enterprise Security: Clearing session on browser exit');

        // Clear authentication tokens only
        AuthTokenManager.clearEnterpriseSession();

        // Don't clear caches aggressively as it interferes with chunk loading
        // Only clear auth-related data
        try {
          // Clear only auth-related localStorage items
          const authKeys = ['access_token', 'refresh_token', 'user_data'];
          authKeys.forEach(key => {
            localStorage.removeItem(key);
          });

          // Clear only auth-related sessionStorage
          sessionStorage.removeItem('auth_session');
        } catch (error) {
          console.warn('Session clear warning:', error);
        }
      }
    };

    // Only listen to actual browser unload events
    // Not page hide or visibility change which can fire during normal navigation
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup
    return () => {
      clearTimeout(timer);
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return null; // This component doesn't render anything
}