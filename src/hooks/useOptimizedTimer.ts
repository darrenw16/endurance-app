import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { performanceMonitor } from '../utils/performance/performanceMonitoring';

export interface OptimizedTimerOptions {
  interval?: number; // Update interval in milliseconds
  precision?: number; // How often to actually check time vs display update
  enablePerformanceMonitoring?: boolean;
}

/**
 * Optimized timer hook that reduces unnecessary re-renders and improves performance
 * 
 * Key optimizations:
 * - Separates time checking from UI updates
 * - Uses requestAnimationFrame for smooth updates
 * - Throttles updates to avoid excessive re-renders
 * - Monitors performance metrics
 */
export const useOptimizedTimer = (
  isActive: boolean = false,
  options: OptimizedTimerOptions = {}
) => {
  const {
    interval = 1000, // Default to 1 second updates
    precision = 100,  // Check time every 100ms but update display less frequently
    enablePerformanceMonitoring = process.env.NODE_ENV === 'development'
  } = options;

  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [lastUpdateTime, setLastUpdateTime] = useState(0);
  
  const rafRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastRealUpdateRef = useRef(0);
  const performanceStartRef = useRef<(() => void) | null>(null);

  // Optimized time update function
  const updateTime = useCallback(() => {
    if (enablePerformanceMonitoring) {
      performanceStartRef.current = performanceMonitor.startTiming('timer-update');
    }

    const now = Date.now();
    const timeSinceLastUpdate = now - lastRealUpdateRef.current;

    // Only update if enough time has passed to warrant a UI update
    if (timeSinceLastUpdate >= interval) {
      const newTime = new Date(now);
      setCurrentTime(newTime);
      setLastUpdateTime(now);
      lastRealUpdateRef.current = now;

      if (enablePerformanceMonitoring && performanceStartRef.current) {
        performanceStartRef.current();
        performanceStartRef.current = null;
      }
    }
  }, [interval, enablePerformanceMonitoring]);

  // High-precision time checking with less frequent UI updates
  const checkTime = useCallback(() => {
    updateTime();
    
    if (isActive) {
      rafRef.current = requestAnimationFrame(checkTime);
    }
  }, [updateTime, isActive]);

  // Start/stop timer
  useEffect(() => {
    if (isActive) {
      // Initial update
      updateTime();
      
      // Use a combination of setInterval for regular updates and RAF for smooth animation
      intervalRef.current = setInterval(updateTime, precision);
      rafRef.current = requestAnimationFrame(checkTime);
    } else {
      // Cleanup
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isActive, checkTime, updateTime, precision]);

  // Manual time update for immediate sync
  const forceUpdate = useCallback(() => {
    lastRealUpdateRef.current = 0; // Force next update
    updateTime();
  }, [updateTime]);

  return {
    currentTime,
    lastUpdateTime,
    forceUpdate,
  };
};

/**
 * Optimized hook for race timing that minimizes re-renders
 * Only updates when significant time changes occur
 */
export const useRaceTimer = (
  raceStartTime: Date | null,
  isActive: boolean = false,
  options: { 
    updateInterval?: number;
    significantChangeThreshold?: number; // Only update UI for changes >= this many seconds
  } = {}
) => {
  const { 
    updateInterval = 1000,
    significantChangeThreshold = 1 
  } = options;

  const { currentTime, forceUpdate } = useOptimizedTimer(isActive, {
    interval: updateInterval,
    enablePerformanceMonitoring: true
  });

  const [displayTime, setDisplayTime] = useState(currentTime);
  const lastSignificantUpdate = useRef(0);

  // Calculate elapsed time
  const elapsedTime = raceStartTime 
    ? Math.floor((currentTime.getTime() - raceStartTime.getTime()) / 1000)
    : 0;

  // Only update display time for significant changes
  useEffect(() => {
    const timeDifference = Math.abs(elapsedTime - lastSignificantUpdate.current);
    
    if (timeDifference >= significantChangeThreshold) {
      setDisplayTime(currentTime);
      lastSignificantUpdate.current = elapsedTime;
    }
  }, [elapsedTime, currentTime, significantChangeThreshold]);

  // Format elapsed time efficiently
  const formattedElapsedTime = useMemo(() => {
    if (!raceStartTime) return '00:00:00';
    
    const hours = Math.floor(elapsedTime / 3600);
    const minutes = Math.floor((elapsedTime % 3600) / 60);
    const seconds = elapsedTime % 60;
    
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, [elapsedTime, raceStartTime]);

  return {
    currentTime: displayTime,
    elapsedTime,
    formattedElapsedTime,
    forceUpdate,
  };
};

/**
 * Hook for managing multiple timers efficiently
 * Useful for managing multiple team stint timers
 */
export const useMultipleTimers = (
  timerConfigs: Array<{
    id: string;
    startTime: Date | null;
    isActive: boolean;
  }>,
  options: { updateInterval?: number } = {}
) => {
  const { updateInterval = 1000 } = options;
  const { currentTime } = useOptimizedTimer(true, { interval: updateInterval });

  // Memoize timer calculations to avoid recalculating on every render
  const timerValues = useMemo(() => {
    return timerConfigs.map(config => {
      if (!config.startTime || !config.isActive) {
        return {
          id: config.id,
          elapsedTime: 0,
          formattedTime: '00:00:00'
        };
      }

      const elapsed = Math.floor((currentTime.getTime() - config.startTime.getTime()) / 1000);
      const hours = Math.floor(elapsed / 3600);
      const minutes = Math.floor((elapsed % 3600) / 60);
      const seconds = elapsed % 60;
      
      return {
        id: config.id,
        elapsedTime: elapsed,
        formattedTime: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      };
    });
  }, [timerConfigs, currentTime]);

  return timerValues;
};

/**
 * Hook for debounced time updates
 * Useful for time input fields that need validation
 */
export const useDebouncedTimeUpdate = (
  initialValue: string,
  onUpdate: (value: string) => void,
  delay: number = 500
) => {
  const [displayValue, setDisplayValue] = useState(initialValue);
  const [debouncedValue, setDebouncedValue] = useState(initialValue);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update display value immediately for responsive UI
  const updateDisplayValue = useCallback((value: string) => {
    setDisplayValue(value);

    // Debounce the actual update
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
      onUpdate(value);
    }, delay);
  }, [onUpdate, delay]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    displayValue,
    debouncedValue,
    updateValue: updateDisplayValue,
    isUpdating: displayValue !== debouncedValue
  };
};
