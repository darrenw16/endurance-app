import { useState, useEffect, useCallback } from 'react';
import { useOptimizedTimer } from './useOptimizedTimer';
import { performanceMonitor } from '../utils/performance/performanceMonitoring';
import type { RaceConfig } from '../types';

/**
 * Optimized custom hook for managing race state (timing, status, FCY)
 * Uses optimized timer and performance monitoring
 */
export const useRaceState = (raceConfig: RaceConfig) => {
  // Race State
  const [raceStarted, setRaceStarted] = useState(false);
  const [racePaused, setRacePaused] = useState(false);
  const [raceStartTime, setRaceStartTime] = useState<Date | null>(null);
  const [pausedTime, setPausedTime] = useState(0);
  const [fcyActive, setFcyActive] = useState(false);

  // Use optimized timer for better performance
  const { currentTime } = useOptimizedTimer(
    raceStarted && !racePaused,
    {
      interval: 1000,
      precision: 200, // Check every 200ms but update display every 1000ms
      enablePerformanceMonitoring: process.env.NODE_ENV === 'development'
    }
  );

  // Performance monitoring for race operations
  const measureRaceOperation = useCallback((operation: string, fn: () => any) => {
    const endTiming = performanceMonitor.startTiming(`race-${operation}`);
    const result = fn();
    endTiming();
    return result;
  }, []);

  const startRace = useCallback(() => {
    return measureRaceOperation('start', () => {
      const now = new Date();
      setRaceStartTime(now);
      setRaceStarted(true);
      setRacePaused(false);
      setPausedTime(0);
      return now; // Return start time for team state initialization
    });
  }, [measureRaceOperation]);

  const pauseRace = useCallback(() => {
    return measureRaceOperation('pause-resume', () => {
      if (racePaused) {
        // Resume race
        const pauseDuration = Date.now() - pausedTime;
        const newStartTime = new Date(raceStartTime!.getTime() + pauseDuration);
        setRaceStartTime(newStartTime);
        setRacePaused(false);
        setPausedTime(0);
        return { resumed: true, pauseDuration };
      } else {
        // Pause race
        setRacePaused(true);
        setPausedTime(Date.now());
        return { resumed: false, pauseDuration: 0 };
      }
    });
  }, [racePaused, pausedTime, raceStartTime, measureRaceOperation]);

  const stopRace = useCallback(() => {
    measureRaceOperation('stop', () => {
      setRaceStarted(false);
      setRacePaused(false);
      setRaceStartTime(null);
      setPausedTime(0);
      setFcyActive(false);
    });
  }, [measureRaceOperation]);

  const toggleFCY = useCallback(() => {
    measureRaceOperation('fcy-toggle', () => {
      setFcyActive(prev => !prev);
    });
  }, [measureRaceOperation]);

  // Update race start time (for manual adjustments)
  const updateRaceStartTime = useCallback((newStartTime: Date) => {
    measureRaceOperation('time-update', () => {
      setRaceStartTime(newStartTime);
    });
  }, [measureRaceOperation]);

  return {
    // State
    raceStarted,
    racePaused,
    raceStartTime,
    pausedTime,
    currentTime,
    fcyActive,
    
    // Actions
    startRace,
    pauseRace,
    stopRace,
    toggleFCY,
    updateRaceStartTime,
  };
};
