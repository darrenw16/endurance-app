import { useState, useEffect } from 'react';
import type { RaceConfig } from '../types';

/**
 * Custom hook for managing race state (timing, status, FCY)
 */
export const useRaceState = (raceConfig: RaceConfig) => {
  // Race State
  const [raceStarted, setRaceStarted] = useState(false);
  const [racePaused, setRacePaused] = useState(false);
  const [raceStartTime, setRaceStartTime] = useState<Date | null>(null);
  const [pausedTime, setPausedTime] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [fcyActive, setFcyActive] = useState(false);

  // Timer effect
  useEffect(() => {
    if (raceStarted && !racePaused) {
      const interval = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [raceStarted, racePaused]);

  const startRace = () => {
    const now = new Date();
    setRaceStartTime(now);
    setRaceStarted(true);
    setRacePaused(false);
    setPausedTime(0);
    return now; // Return start time for team state initialization
  };

  const pauseRace = () => {
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
  };

  const stopRace = () => {
    setRaceStarted(false);
    setRacePaused(false);
    setRaceStartTime(null);
    setPausedTime(0);
    setFcyActive(false);
  };

  const toggleFCY = () => {
    setFcyActive(!fcyActive);
  };

  // Update race start time (for manual adjustments)
  const updateRaceStartTime = (newStartTime: Date) => {
    setRaceStartTime(newStartTime);
  };

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
