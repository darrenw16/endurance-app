import { useState, useEffect, useCallback } from 'react';
import type { RaceState, SavedRace, DataPersistenceHook } from './pwaTypes';

const STORAGE_KEY = 'endurance-race-states';
const AUTO_SAVE_KEY = 'endurance-auto-save';
const AUTO_SAVE_INTERVAL = 30000; // 30 seconds

export const useDataPersistence = (): DataPersistenceHook => {
  const [autoSaveEnabled, setAutoSaveEnabledState] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    // Load auto-save preference
    const savedPreference = localStorage.getItem(AUTO_SAVE_KEY);
    if (savedPreference !== null) {
      setAutoSaveEnabledState(JSON.parse(savedPreference));
    }
  }, []);

  const setAutoSaveEnabled = useCallback((enabled: boolean) => {
    setAutoSaveEnabledState(enabled);
    localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(enabled));
  }, []);

  // Helper function to get saved races from localStorage
  const getSavedRacesFromStorage = useCallback(async (): Promise<RaceState[]> => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Failed to load saved races:', error);
      return [];
    }
  }, []);

  // IndexedDB helpers
  const openDB = useCallback((): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('EnduranceAppDB', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('races')) {
          db.createObjectStore('races', { keyPath: 'id' });
        }
      };
    });
  }, []);

  const saveToIndexedDB = useCallback(async (id: string, state: RaceState): Promise<void> => {
    try {
      const db = await openDB();
      const transaction = db.transaction(['races'], 'readwrite');
      const store = transaction.objectStore('races');
      
      await new Promise<void>((resolve, reject) => {
        const request = store.put(state);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.warn('IndexedDB save failed, using localStorage only:', error);
    }
  }, [openDB]);

  const loadFromIndexedDB = useCallback(async (id: string): Promise<RaceState | null> => {
    try {
      const db = await openDB();
      const transaction = db.transaction(['races'], 'readonly');
      const store = transaction.objectStore('races');
      
      return new Promise<RaceState | null>((resolve, reject) => {
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.warn('IndexedDB load failed, using localStorage only:', error);
      return null;
    }
  }, [openDB]);

  const deleteFromIndexedDB = useCallback(async (id: string): Promise<void> => {
    try {
      const db = await openDB();
      const transaction = db.transaction(['races'], 'readwrite');
      const store = transaction.objectStore('races');
      
      await new Promise<void>((resolve, reject) => {
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.warn('IndexedDB delete failed:', error);
    }
  }, [openDB]);

  const saveRaceState = useCallback(async (state: RaceState): Promise<void> => {
    setIsSaving(true);
    setSaveError(null);

    try {
      // Get existing saved races
      const existingRaces = await getSavedRacesFromStorage();
      
      // Update the state with current timestamp and version
      const updatedState: RaceState = {
        ...state,
        updatedAt: new Date().toISOString(),
        version: (state.version || 0) + 1
      };

      // Update or add the race state
      const raceIndex = existingRaces.findIndex(race => race.id === state.id);
      if (raceIndex >= 0) {
        existingRaces[raceIndex] = updatedState;
      } else {
        existingRaces.push(updatedState);
      }

      // Save to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existingRaces));
      
      // Also save to IndexedDB for larger storage (if available)
      await saveToIndexedDB(state.id, updatedState);
      
      setLastSaved(new Date());
      console.log('Race state saved successfully:', state.id);
    } catch (error) {
      console.error('Failed to save race state:', error);
      setSaveError('Failed to save race data');
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [getSavedRacesFromStorage, saveToIndexedDB]);

  const loadRaceState = useCallback(async (id?: string): Promise<RaceState | null> => {
    try {
      // Try IndexedDB first
      if (id) {
        const indexedDBData = await loadFromIndexedDB(id);
        if (indexedDBData) {
          return indexedDBData;
        }
      }

      // Fallback to localStorage
      const savedRaces = await getSavedRacesFromStorage();
      
      if (id) {
        const race = savedRaces.find(race => race.id === id);
        return race || null;
      } else {
        // Return the most recently updated race
        const sortedRaces = savedRaces.sort((a, b) => 
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        return sortedRaces[0] || null;
      }
    } catch (error) {
      console.error('Failed to load race state:', error);
      return null;
    }
  }, [getSavedRacesFromStorage, loadFromIndexedDB]);

  const deleteRaceState = useCallback(async (id: string): Promise<void> => {
    try {
      // Remove from localStorage
      const existingRaces = await getSavedRacesFromStorage();
      const filteredRaces = existingRaces.filter(race => race.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredRaces));
      
      // Remove from IndexedDB
      await deleteFromIndexedDB(id);
      
      console.log('Race state deleted successfully:', id);
    } catch (error) {
      console.error('Failed to delete race state:', error);
      throw error;
    }
  }, [getSavedRacesFromStorage, deleteFromIndexedDB]);

  const getSavedRaces = useCallback(async (): Promise<SavedRace[]> => {
    try {
      const savedRaces = await getSavedRacesFromStorage();
      
      return savedRaces.map(race => ({
        id: race.id,
        name: race.name,
        track: race.track,
        createdAt: race.createdAt,
        updatedAt: race.updatedAt,
        size: JSON.stringify(race).length
      }));
    } catch (error) {
      console.error('Failed to get saved races:', error);
      return [];
    }
  }, [getSavedRacesFromStorage]);

  const exportRaceData = useCallback((state: RaceState): string => {
    try {
      const exportData = {
        ...state,
        exportedAt: new Date().toISOString(),
        appVersion: '1.0.0'
      };
      
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Failed to export race data:', error);
      throw new Error('Failed to export race data');
    }
  }, []);

  const importRaceData = useCallback((data: string): RaceState | null => {
    try {
      const parsed = JSON.parse(data);
      
      // Validate required fields
      if (!parsed.id || !parsed.name || !parsed.track) {
        throw new Error('Invalid race data format');
      }
      
      // Generate new ID to prevent conflicts
      const importedState: RaceState = {
        ...parsed,
        id: `imported-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1
      };
      
      return importedState;
    } catch (error) {
      console.error('Failed to import race data:', error);
      return null;
    }
  }, []);

  return {
    saveRaceState,
    loadRaceState,
    deleteRaceState,
    getSavedRaces,
    autoSaveEnabled,
    setAutoSaveEnabled,
    lastSaved,
    isSaving,
    saveError,
    exportRaceData,
    importRaceData
  };
};
