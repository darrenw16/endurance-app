import { useCallback, useEffect } from 'react';
import type { RaceConfig, TeamState } from '../../types';

// Storage keys
const STORAGE_KEYS = {
  RACE_CONFIG: 'endurance-race-config',
  RACE_STATE: 'endurance-race-state',
  TEAM_STATES: 'endurance-team-states',
  AUTO_SAVE_ENABLED: 'endurance-auto-save-enabled',
} as const;

// Interface for complete race session data
export interface RaceSessionData {
  raceConfig: RaceConfig;
  raceState: {
    raceStarted: boolean;
    racePaused: boolean;
    raceStartTime: string | null; // ISO string for serialization
    pausedTime: number;
    fcyActive: boolean;
  };
  teamStates: TeamState[];
  savedAt: string; // ISO timestamp
  version: string; // For future migration compatibility
}

// Interface for auto-save settings
export interface AutoSaveSettings {
  enabled: boolean;
  intervalSeconds: number;
}

export const useDataPersistence = () => {
  // Check if localStorage is available
  const isStorageAvailable = useCallback((): boolean => {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }, []);

  // Save race configuration only
  const saveRaceConfig = useCallback((config: RaceConfig): boolean => {
    if (!isStorageAvailable()) {
      console.warn('localStorage not available');
      return false;
    }

    try {
      const configData = {
        ...config,
        savedAt: new Date().toISOString(),
        version: '1.0.0'
      };
      localStorage.setItem(STORAGE_KEYS.RACE_CONFIG, JSON.stringify(configData));
      return true;
    } catch (error) {
      console.error('Failed to save race config:', error);
      return false;
    }
  }, [isStorageAvailable]);

  // Load race configuration only
  const loadRaceConfig = useCallback((): RaceConfig | null => {
    if (!isStorageAvailable()) return null;

    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RACE_CONFIG);
      if (!saved) return null;

      const data = JSON.parse(saved);
      
      // Validate the loaded data has required fields
      if (!data.track || !data.teams || !Array.isArray(data.teams)) {
        console.warn('Invalid race config format in storage');
        return null;
      }

      // Return just the config part, excluding metadata
      const { savedAt, version, ...config } = data;
      return config as RaceConfig;
    } catch (error) {
      console.error('Failed to load race config:', error);
      return null;
    }
  }, [isStorageAvailable]);

  // Save complete race session (config + active race data)
  const saveRaceSession = useCallback((
    raceConfig: RaceConfig,
    raceState: {
      raceStarted: boolean;
      racePaused: boolean;
      raceStartTime: Date | null;
      pausedTime: number;
      fcyActive: boolean;
    },
    teamStates: TeamState[]
  ): boolean => {
    if (!isStorageAvailable()) {
      console.warn('localStorage not available');
      return false;
    }

    try {
      const sessionData: RaceSessionData = {
        raceConfig,
        raceState: {
          ...raceState,
          raceStartTime: raceState.raceStartTime?.toISOString() || null,
        },
        teamStates: teamStates.map(team => ({
          ...team,
          stintStartTime: team.stintStartTime?.toISOString() || null,
          lastPitTime: team.lastPitTime?.toISOString() || null,
          stints: team.stints.map(stint => ({
            ...stint,
            plannedStart: stint.plannedStart?.toISOString() || null,
            predictedStart: stint.predictedStart?.toISOString() || null,
            plannedFinish: stint.plannedFinish?.toISOString() || null,
            predictedFinish: stint.predictedFinish?.toISOString() || null,
            actualStart: stint.actualStart?.toISOString() || null,
            actualFinish: stint.actualFinish?.toISOString() || null,
          }))
        })) as any, // Type assertion needed due to Date serialization
        savedAt: new Date().toISOString(),
        version: '1.0.0'
      };

      localStorage.setItem(STORAGE_KEYS.RACE_STATE, JSON.stringify(sessionData));
      return true;
    } catch (error) {
      console.error('Failed to save race session:', error);
      return false;
    }
  }, [isStorageAvailable]);

  // Load complete race session
  const loadRaceSession = useCallback((): {
    raceConfig: RaceConfig;
    raceState: {
      raceStarted: boolean;
      racePaused: boolean;
      raceStartTime: Date | null;
      pausedTime: number;
      fcyActive: boolean;
    };
    teamStates: TeamState[];
  } | null => {
    if (!isStorageAvailable()) return null;

    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RACE_STATE);
      if (!saved) return null;

      const data: RaceSessionData = JSON.parse(saved);
      
      // Validate version compatibility
      if (data.version !== '1.0.0') {
        console.warn('Incompatible race session version');
        return null;
      }

      // Deserialize dates
      const raceState = {
        ...data.raceState,
        raceStartTime: data.raceState.raceStartTime ? new Date(data.raceState.raceStartTime) : null,
      };

      const teamStates: TeamState[] = data.teamStates.map(team => ({
        ...team,
        stintStartTime: team.stintStartTime ? new Date(team.stintStartTime as any) : null,
        lastPitTime: team.lastPitTime ? new Date(team.lastPitTime as any) : null,
        stints: team.stints.map(stint => ({
          ...stint,
          plannedStart: stint.plannedStart ? new Date(stint.plannedStart as any) : null,
          predictedStart: stint.predictedStart ? new Date(stint.predictedStart as any) : null,
          plannedFinish: stint.plannedFinish ? new Date(stint.plannedFinish as any) : null,
          predictedFinish: stint.predictedFinish ? new Date(stint.predictedFinish as any) : null,
          actualStart: stint.actualStart ? new Date(stint.actualStart as any) : null,
          actualFinish: stint.actualFinish ? new Date(stint.actualFinish as any) : null,
        }))
      }));

      return {
        raceConfig: data.raceConfig,
        raceState,
        teamStates
      };
    } catch (error) {
      console.error('Failed to load race session:', error);
      return null;
    }
  }, [isStorageAvailable]);

  // Clear all stored data
  const clearStoredData = useCallback((): boolean => {
    if (!isStorageAvailable()) return false;

    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      return true;
    } catch (error) {
      console.error('Failed to clear stored data:', error);
      return false;
    }
  }, [isStorageAvailable]);

  // Auto-save settings
  const saveAutoSaveSettings = useCallback((settings: AutoSaveSettings): boolean => {
    if (!isStorageAvailable()) return false;

    try {
      localStorage.setItem(STORAGE_KEYS.AUTO_SAVE_ENABLED, JSON.stringify(settings));
      return true;
    } catch (error) {
      console.error('Failed to save auto-save settings:', error);
      return false;
    }
  }, [isStorageAvailable]);

  const loadAutoSaveSettings = useCallback((): AutoSaveSettings => {
    if (!isStorageAvailable()) {
      return { enabled: false, intervalSeconds: 30 };
    }

    try {
      const saved = localStorage.getItem(STORAGE_KEYS.AUTO_SAVE_ENABLED);
      if (!saved) return { enabled: true, intervalSeconds: 30 }; // Default to enabled

      return JSON.parse(saved);
    } catch (error) {
      console.error('Failed to load auto-save settings:', error);
      return { enabled: false, intervalSeconds: 30 };
    }
  }, [isStorageAvailable]);

  // Check if saved data exists
  const hasSavedRaceConfig = useCallback((): boolean => {
    if (!isStorageAvailable()) return false;
    return localStorage.getItem(STORAGE_KEYS.RACE_CONFIG) !== null;
  }, [isStorageAvailable]);

  const hasSavedRaceSession = useCallback((): boolean => {
    if (!isStorageAvailable()) return false;
    return localStorage.getItem(STORAGE_KEYS.RACE_STATE) !== null;
  }, [isStorageAvailable]);

  // Get storage usage info
  const getStorageInfo = useCallback(() => {
    if (!isStorageAvailable()) {
      return { available: false, usage: 0, total: 0 };
    }

    try {
      let usage = 0;
      Object.values(STORAGE_KEYS).forEach(key => {
        const item = localStorage.getItem(key);
        if (item) usage += item.length;
      });

      // Estimate total localStorage capacity (usually ~5-10MB)
      const total = 5 * 1024 * 1024; // 5MB estimate
      
      return {
        available: true,
        usage,
        total,
        usagePercent: (usage / total) * 100
      };
    } catch {
      return { available: false, usage: 0, total: 0 };
    }
  }, [isStorageAvailable]);

  return {
    // Configuration persistence
    saveRaceConfig,
    loadRaceConfig,
    hasSavedRaceConfig,

    // Session persistence
    saveRaceSession,
    loadRaceSession,
    hasSavedRaceSession,

    // Settings
    saveAutoSaveSettings,
    loadAutoSaveSettings,

    // Utilities
    clearStoredData,
    getStorageInfo,
    isStorageAvailable: isStorageAvailable(),
  };
};
