import React, { useState } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { useServiceWorker } from '../hooks/useServiceWorker';

export const UpdateNotification: React.FC = () => {
  const { updateAvailable, installUpdate } = useServiceWorker();
  const [isInstalling, setIsInstalling] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  if (!updateAvailable || isDismissed) {
    return null;
  }

  const handleUpdate = async () => {
    setIsInstalling(true);
    try {
      await installUpdate();
    } catch (error) {
      console.error('Failed to install update:', error);
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-blue-600 text-white rounded-lg shadow-lg p-4 z-50">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-sm mb-1">App Update Available</h3>
          <p className="text-sm text-blue-100 mb-3">
            A new version of the app is available with improvements and bug fixes.
          </p>
          <div className="flex space-x-2">
            <button
              onClick={handleUpdate}
              disabled={isInstalling}
              className="flex items-center space-x-1 px-3 py-1 bg-white text-blue-600 text-sm font-medium rounded hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isInstalling ? (
                <>
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span>Installing...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Update Now</span>
                </>
              )}
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-1 border border-blue-300 text-blue-100 text-sm rounded hover:bg-blue-500 transition-colors"
            >
              Later
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="ml-2 p-1 hover:bg-blue-500 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
