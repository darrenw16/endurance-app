import React, { useState, useEffect } from 'react';
import { CompositeRaceProvider } from './contexts/split';
import { RaceApp } from './components/common/RaceApp';
import { BaseErrorBoundary } from './components/errorBoundaries';
import { useDataPersistence } from './hooks';
import { usePerformanceDashboard } from './components/optimized';
import { PWAStatus } from './components/PWAStatus';
import { UpdateNotification } from './components/UpdateNotification';
import { useServiceWorker } from './hooks/useServiceWorker';
import { useAutoSave } from './hooks/useAutoSave';
import type { RaceConfig } from './types';
import type { RaceState } from './hooks/pwaTypes';

/**
 * Main application using optimized split context architecture
 * Provides better performance through focused context subscriptions
 */
const PitStrategyApp = () => {
  // Race Configuration State - stays at the top level
  const [raceConfig, setRaceConfig] = useState<RaceConfig>({
    track: '',
    raceLengthHours: 24,
    fuelRangeMinutes: 108,
    minPitTimeSeconds: 170,
    numTeams: 1,
    teams: [{ number: '', name: '', drivers: [''], driverAssignments: [] }]
  });

  const [hasLoadedFromStorage, setHasLoadedFromStorage] = useState(false);
  const { loadRaceConfig, isStorageAvailable } = useDataPersistence();
  
  // Initialize PWA features
  const serviceWorker = useServiceWorker();
  
  // Initialize performance dashboard
  const { PerformanceDashboard } = usePerformanceDashboard();

  // Convert raceConfig to RaceState for auto-save (simplified)
  const raceState: RaceState | null = raceConfig.track ? {
    id: `race-${raceConfig.track.toLowerCase().replace(/\s+/g, '-')}`,
    name: `${raceConfig.track} ${raceConfig.raceLengthHours}h`,
    track: raceConfig.track,
    duration: raceConfig.raceLengthHours,
    fuelRangeMinutes: raceConfig.fuelRangeMinutes,
    teams: raceConfig.teams,
    currentTime: 0,
    isRunning: false,
    isPaused: false,
    fcyActive: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1
  } : null;

  // Initialize auto-save
  useAutoSave(raceState, {
    enabled: true,
    interval: 30000, // 30 seconds
    onSave: (state) => console.log('Auto-saved race:', state.name),
    onError: (error) => console.error('Auto-save failed:', error)
  });

  // Load saved configuration on mount
  useEffect(() => {
    if (!hasLoadedFromStorage && isStorageAvailable) {
      try {
        const savedConfig = loadRaceConfig();
        if (savedConfig) {
          console.log('Loaded saved race configuration');
          setRaceConfig(savedConfig);
        }
      } catch (error) {
        console.warn('Failed to load saved configuration:', error);
      } finally {
        setHasLoadedFromStorage(true);
      }
    }
  }, [loadRaceConfig, isStorageAvailable, hasLoadedFromStorage]);

  // Error handler
  const handleAppError = (error: Error, errorInfo: React.ErrorInfo) => {
    console.group('🏁 Race App Error');
    console.error('Application error:', error);
    console.error('Error info:', errorInfo);
    console.error('Race config at time of error:', raceConfig);
    console.groupEnd();

    if (process.env.NODE_ENV === 'production') {
      // Example: sendErrorToAnalytics('app_error', error, errorInfo, { raceConfig });
    }
  };

  return (
    <BaseErrorBoundary onError={handleAppError}>
      <div className="min-h-screen bg-gray-900 text-gray-100">
        {/* PWA Status Bar */}
        <div className="bg-gray-800 border-b border-gray-700 px-4 py-2">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <h1 className="text-lg font-semibold text-white">
              Endurance Racing Pit Strategy
            </h1>
            <PWAStatus className="" />
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-6">
          {/* Use the composite provider that sets up all split contexts */}
          <CompositeRaceProvider raceConfig={raceConfig} setRaceConfig={setRaceConfig}>
            <RaceApp 
              raceConfig={raceConfig} 
              setRaceConfig={setRaceConfig}
            />
          </CompositeRaceProvider>
        </div>
      </div>
      
      {/* Performance Dashboard */}
      <PerformanceDashboard />
      
      {/* PWA Update Notification */}
      <UpdateNotification />
    </BaseErrorBoundary>
  );
};

export default PitStrategyApp;
