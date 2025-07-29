import { useEffect, useRef, useCallback } from 'react';
import { useDataPersistence, type AutoSaveSettings } from './useDataPersistence';
import type { RaceConfig, TeamState } from '../../types';

interface UseAutoSaveProps {
  raceConfig: RaceConfig;
  raceState: {
    raceStarted: boolean;
    racePaused: boolean;
    raceStartTime: Date | null;
    pausedTime: number;
    fcyActive: boolean;
  };
  teamStates: TeamState[];
  enabled?: boolean;
  intervalSeconds?: number;
}

export const useAutoSave = ({
  raceConfig,
  raceState,
  teamStates,
  enabled = true,
  intervalSeconds = 30
}: UseAutoSaveProps) => {
  const { saveRaceSession, saveAutoSaveSettings, loadAutoSaveSettings } = useDataPersistence();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveRef = useRef<string>('');

  // Create a stable hash of the current state to avoid unnecessary saves
  const createStateHash = useCallback((
    config: RaceConfig,
    state: typeof raceState,
    teams: TeamState[]
  ): string => {
    return JSON.stringify({
      config: {
        track: config.track,
        raceLengthHours: config.raceLengthHours,
        fuelRangeMinutes: config.fuelRangeMinutes,
        teams: config.teams.map(t => ({ number: t.number, name: t.name, drivers: t.drivers }))
      },
      state: {
        raceStarted: state.raceStarted,
        racePaused: state.racePaused,
        raceStartTime: state.raceStartTime?.toISOString(),
        fcyActive: state.fcyActive
      },
      teams: teams.map(t => ({
        currentStint: t.currentStint,
        currentDriver: t.currentDriver,
        position: t.position,
        stintsCount: t.stints.length,
        lastStintStatus: t.stints[t.stints.length - 1]?.status
      }))
    });
  }, []);

  // Perform auto-save
  const performAutoSave = useCallback(() => {
    try {
      const currentHash = createStateHash(raceConfig, raceState, teamStates);
      
      // Only save if data has actually changed
      if (currentHash === lastSaveRef.current) {
        return { success: true, skipped: true };
      }

      const success = saveRaceSession(raceConfig, raceState, teamStates);
      
      if (success) {
        lastSaveRef.current = currentHash;
        console.log('Auto-save completed successfully');
      } else {
        console.warn('Auto-save failed');
      }

      return { success, skipped: false };
    } catch (error) {
      console.error('Auto-save error:', error);
      return { success: false, skipped: false, error };
    }
  }, [raceConfig, raceState, teamStates, saveRaceSession, createStateHash]);

  // Manual save function
  const saveNow = useCallback(() => {
    return performAutoSave();
  }, [performAutoSave]);

  // Start auto-save interval
  const startAutoSave = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (enabled && intervalSeconds > 0) {
      intervalRef.current = setInterval(() => {
        performAutoSave();
      }, intervalSeconds * 1000);

      console.log(`Auto-save started with ${intervalSeconds}s interval`);
    }
  }, [enabled, intervalSeconds, performAutoSave]);

  // Stop auto-save interval
  const stopAutoSave = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      console.log('Auto-save stopped');
    }
  }, []);

  // Update auto-save settings
  const updateAutoSaveSettings = useCallback((settings: AutoSaveSettings) => {
    saveAutoSaveSettings(settings);
    
    // Restart auto-save with new settings
    stopAutoSave();
    if (settings.enabled) {
      setTimeout(() => {
        startAutoSave();
      }, 100);
    }
  }, [saveAutoSaveSettings, stopAutoSave, startAutoSave]);

  // Effect to start/stop auto-save based on settings
  useEffect(() => {
    startAutoSave();
    return stopAutoSave;
  }, [startAutoSave, stopAutoSave]);

  // Load and apply auto-save settings on mount
  useEffect(() => {
    const settings = loadAutoSaveSettings();
    if (settings.enabled !== enabled || settings.intervalSeconds !== intervalSeconds) {
      updateAutoSaveSettings(settings);
    }
  }, []); // Only run on mount

  // Save when component unmounts or race finishes
  useEffect(() => {
    const handleBeforeUnload = () => {
      performAutoSave();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      performAutoSave(); // Final save on cleanup
    };
  }, [performAutoSave]);

  // Auto-save when race starts or important state changes
  useEffect(() => {
    if (raceState.raceStarted) {
      saveNow();
    }
  }, [raceState.raceStarted, saveNow]);

  return {
    saveNow,
    startAutoSave,
    stopAutoSave,
    updateAutoSaveSettings,
    isAutoSaveEnabled: enabled,
    autoSaveInterval: intervalSeconds,
  };
};
