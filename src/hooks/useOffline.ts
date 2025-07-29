import { useState, useEffect } from 'react';
import type { OfflineHook } from './pwaTypes';

// Extend the ServiceWorkerRegistration interface to include sync
declare global {
  interface ServiceWorkerRegistration {
    sync?: {
      register(tag: string): Promise<void>;
    };
  }
}

export const useOffline = (): OfflineHook => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        console.log('Connection restored');
        // Trigger sync when back online
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then((registration) => {
            // Check if Background Sync is supported
            if ('sync' in registration) {
              return registration.sync?.register('race-data-sync');
            } else {
              console.log('Background Sync not supported');
            }
          }).catch((error) => {
            console.error('Background sync registration failed:', error);
          });
        }
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      console.log('Connection lost');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Additional connectivity check
    const checkConnectivity = async () => {
      try {
        // Try to fetch a small resource to verify connectivity
        await fetch('/manifest.json', {
          method: 'GET',
          cache: 'no-cache'
        });
        
        if (!isOnline) {
          setIsOnline(true);
        }
      } catch {
        if (isOnline) {
          setIsOnline(false);
          setWasOffline(true);
        }
      }
    };

    // Check connectivity every 30 seconds
    const connectivityInterval = setInterval(checkConnectivity, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(connectivityInterval);
    };
  }, [isOnline, wasOffline]);

  return {
    isOnline,
    isOffline: !isOnline,
    wasOffline
  };
};
