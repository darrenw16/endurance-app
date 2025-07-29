import { useEffect, useRef, useCallback } from 'react';
import { useDataPersistence } from './useDataPersistence';
import type { RaceState, AutoSaveOptions } from './pwaTypes';

export const useAutoSave = (
  raceState: RaceState | null,
  options: AutoSaveOptions = {}
) => {
  const {
    interval = 30000, // 30 seconds default
    enabled = true,
    onSave,
    onError
  } = options;

  const { saveRaceState, autoSaveEnabled } = useDataPersistence();
  const lastStateRef = useRef<string>('');
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const isSavingRef = useRef(false);

  const performAutoSave = useCallback(async (state: RaceState) => {
    if (isSavingRef.current) {
      return; // Already saving, skip this attempt
    }

    isSavingRef.current = true;

    try {
      await saveRaceState(state);
      onSave?.(state);
      console.log('Auto-save completed for race:', state.id);
    } catch (error) {
      console.error('Auto-save failed:', error);
      onError?.(error as Error);
    } finally {
      isSavingRef.current = false;
    }
  }, [saveRaceState, onSave, onError]);

  const scheduleAutoSave = useCallback((state: RaceState) => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Schedule the auto-save
    timeoutRef.current = setTimeout(() => {
      performAutoSave(state);
    }, interval);
  }, [interval, performAutoSave]);

  useEffect(() => {
    if (!enabled || !autoSaveEnabled || !raceState) {
      return;
    }

    // Check if the state has actually changed
    const currentStateString = JSON.stringify(raceState);
    if (currentStateString === lastStateRef.current) {
      return; // No changes, skip auto-save
    }

    lastStateRef.current = currentStateString;

    // Only auto-save if the race is active or has been modified
    const shouldAutoSave = 
      raceState.isRunning || 
      raceState.teams.length > 0 || 
      raceState.currentTime > 0;

    if (shouldAutoSave) {
      scheduleAutoSave(raceState);
    }

    // Cleanup timeout on unmount or dependency change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [raceState, enabled, autoSaveEnabled, scheduleAutoSave]);

  // Save immediately when the page is about to unload
  useEffect(() => {
    const handleBeforeUnload = async (event: BeforeUnloadEvent) => {
      if (!raceState || !autoSaveEnabled) return;

      // Check if there are unsaved changes
      const currentStateString = JSON.stringify(raceState);
      if (currentStateString !== lastStateRef.current) {
        event.preventDefault();
        
        try {
          await performAutoSave(raceState);
        } catch (error) {
          console.error('Failed to save before unload:', error);
          // Show browser warning for unsaved changes
          event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
          return event.returnValue;
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [raceState, autoSaveEnabled, performAutoSave]);

  // Save when app goes to background (mobile)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && raceState && autoSaveEnabled) {
        // Page is hidden, save immediately
        const currentStateString = JSON.stringify(raceState);
        if (currentStateString !== lastStateRef.current) {
          performAutoSave(raceState);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [raceState, autoSaveEnabled, performAutoSave]);

  return {
    saveNow: raceState ? () => performAutoSave(raceState) : undefined,
    isSaving: isSavingRef.current
  };
};
