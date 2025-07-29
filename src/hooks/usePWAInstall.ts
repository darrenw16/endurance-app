import { useState, useEffect } from 'react';
import type { PWAInstallHook } from './pwaTypes';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: ReadonlyArray<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const usePWAInstall = (): PWAInstallHook => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installError, setInstallError] = useState<string | null>(null);

  useEffect(() => {
    // Check if app is already installed
    const checkInstalled = () => {
      // Check if running in standalone mode (installed PWA)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      // Check if running as iOS web app
      const isIOSStandalone = (navigator as any).standalone === true;
      // Check if running in TWA (Android)
      const isTWA = document.referrer.startsWith('android-app://');
      
      setIsInstalled(isStandalone || isIOSStandalone || isTWA);
    };

    checkInstalled();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    // Listen for app installation
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
      console.log('PWA was installed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async (): Promise<void> => {
    if (!installPrompt) {
      setInstallError('Installation prompt not available');
      return;
    }

    setIsInstalling(true);
    setInstallError(null);

    try {
      await installPrompt.prompt();
      const choiceResult = await installPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      
      setInstallPrompt(null);
    } catch (error) {
      console.error('Error during installation:', error);
      setInstallError('Failed to install app');
    } finally {
      setIsInstalling(false);
    }
  };

  // Check if PWA is supported
  const isSupported = 'serviceWorker' in navigator && 'PushManager' in window;

  return {
    isInstallable: !!installPrompt && !isInstalled,
    isInstalled,
    isSupported,
    promptInstall,
    isInstalling,
    installError
  };
};
