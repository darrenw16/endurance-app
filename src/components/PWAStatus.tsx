import React from 'react';
import { Wifi, WifiOff, Download, Smartphone, AlertCircle, CheckCircle } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useOffline } from '../hooks/useOffline';
import { useDataPersistence } from '../hooks/useDataPersistence';

interface PWAStatusProps {
  className?: string;
}

export const PWAStatus: React.FC<PWAStatusProps> = ({ className = '' }) => {
  const { isInstallable, isInstalled, isSupported, promptInstall, isInstalling, installError } = usePWAInstall();
  const { isOnline, isOffline, wasOffline } = useOffline();
  const { lastSaved, isSaving, saveError, autoSaveEnabled } = useDataPersistence();

  const handleInstallClick = async () => {
    try {
      await promptInstall();
    } catch (error) {
      console.error('Failed to install PWA:', error);
    }
  };

  return (
    <div className={`flex flex-col space-y-2 ${className}`}>
      {/* Connection Status */}
      <div className="flex items-center space-x-2">
        {isOnline ? (
          <div className="flex items-center space-x-1 text-green-600">
            <Wifi className="w-4 h-4" />
            <span className="text-sm font-medium">Online</span>
            {wasOffline && (
              <span className="text-xs text-green-500">(Reconnected)</span>
            )}
          </div>
        ) : (
          <div className="flex items-center space-x-1 text-red-600">
            <WifiOff className="w-4 h-4" />
            <span className="text-sm font-medium">Offline</span>
          </div>
        )}
      </div>

      {/* PWA Installation Status */}
      {isSupported && (
        <div className="flex items-center space-x-2">
          {isInstalled ? (
            <div className="flex items-center space-x-1 text-green-600">
              <Smartphone className="w-4 h-4" />
              <span className="text-sm font-medium">App Installed</span>
            </div>
          ) : isInstallable ? (
            <button
              onClick={handleInstallClick}
              disabled={isInstalling}
              className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>{isInstalling ? 'Installing...' : 'Install App'}</span>
            </button>
          ) : (
            <div className="flex items-center space-x-1 text-gray-500">
              <Smartphone className="w-4 h-4" />
              <span className="text-sm">Install not available</span>
            </div>
          )}
        </div>
      )}

      {/* Save Status */}
      <div className="flex items-center space-x-2">
        {isSaving ? (
          <div className="flex items-center space-x-1 text-blue-600">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium">Saving...</span>
          </div>
        ) : saveError ? (
          <div className="flex items-center space-x-1 text-red-600">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Save Failed</span>
          </div>
        ) : lastSaved ? (
          <div className="flex items-center space-x-1 text-green-600">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">
              Saved {formatRelativeTime(lastSaved)}
            </span>
            {autoSaveEnabled && (
              <span className="text-xs text-gray-500">(Auto)</span>
            )}
          </div>
        ) : (
          <div className="flex items-center space-x-1 text-gray-500">
            <span className="text-sm">Not saved</span>
          </div>
        )}
      </div>

      {/* Error Messages */}
      {installError && (
        <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
          {installError}
        </div>
      )}
      
      {saveError && (
        <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
          {saveError}
        </div>
      )}

      {/* Offline Notice */}
      {isOffline && (
        <div className="text-xs text-yellow-700 bg-yellow-50 px-2 py-1 rounded">
          Working offline. Changes will sync when connection is restored.
        </div>
      )}
    </div>
  );
};

// Helper function to format relative time
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);

  if (diffSeconds < 60) {
    return 'just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else {
    return date.toLocaleDateString();
  }
}
