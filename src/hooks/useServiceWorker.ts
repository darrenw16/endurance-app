import { useEffect, useState } from 'react';
import type { ServiceWorkerHook } from './pwaTypes';

export const useServiceWorker = (): ServiceWorkerHook => {
  const [isRegistered, setIsRegistered] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  const isSupported = 'serviceWorker' in navigator;

  useEffect(() => {
    if (!isSupported) {
      console.log('Service Worker not supported');
      return;
    }

    let mounted = true;

    // Get the existing registration if it exists
    const getRegistration = async () => {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        
        if (reg && mounted) {
          setRegistration(reg);
          setIsRegistered(true);
          console.log('Service Worker found:', reg);

          // Check for updates
          const handleUpdateFound = () => {
            console.log('Service Worker update found');
            const newWorker = reg.installing;
            
            if (newWorker) {
              const handleStateChange = () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller && mounted) {
                  console.log('New service worker installed, update available');
                  setWaitingWorker(newWorker);
                  setUpdateAvailable(true);
                }
              };
              newWorker.addEventListener('statechange', handleStateChange);
            }
          };
          
          reg.addEventListener('updatefound', handleUpdateFound);

          // Check if there's already a waiting worker
          if (reg.waiting && mounted) {
            setWaitingWorker(reg.waiting);
            setUpdateAvailable(true);
          }

          // Check for updates periodically
          const updateInterval = setInterval(() => {
            if (mounted) {
              reg.update().catch((error) => {
                console.error('Failed to check for service worker updates:', error);
              });
            }
          }, 60000); // Check every minute
          
          return () => {
            clearInterval(updateInterval);
            reg.removeEventListener('updatefound', handleUpdateFound);
          };
        }
        
      } catch (error) {
        console.error('Service Worker check failed:', error);
        if (mounted) {
          setError('Failed to check service worker');
        }
      }
    };

    getRegistration();

    // Listen for messages from service worker
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'UPDATE_AVAILABLE' && mounted) {
        setUpdateAvailable(true);
      }
    };
    
    navigator.serviceWorker.addEventListener('message', handleMessage);

    // Listen for service worker controller changes
    const handleControllerChange = () => {
      console.log('Service Worker controller changed, reloading page');
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    return () => {
      mounted = false;
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, [isSupported]);

  const installUpdate = async (): Promise<void> => {
    if (!waitingWorker) {
      throw new Error('No update available');
    }

    try {
      // Tell the waiting service worker to skip waiting
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      
      // The service worker will take control and reload the page
      setUpdateAvailable(false);
      setWaitingWorker(null);
    } catch (error) {
      console.error('Failed to install update:', error);
      throw new Error('Failed to install update');
    }
  };

  return {
    isRegistered,
    isSupported,
    updateAvailable,
    installUpdate,
    registration,
    error
  };
};
