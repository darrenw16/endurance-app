import React, { createContext, useContext, type ReactNode } from 'react';
import { useRaceState } from '../../hooks';
import { useFCYStrategy } from '../../hooks/business';
import type { RaceConfig } from '../../types';

/**
 * Context for race timing and status management
 * Handles race start/stop/pause, FCY status, and time calculations
 */
interface RaceTimingContextType {
  // Race State
  raceStarted: boolean;
  racePaused: boolean;
  raceStartTime: Date | null;
  pausedTime: number;
  currentTime: Date;
  fcyActive: boolean;
  
  // Race Actions
  startRace: () => Date;
  pauseRace: () => { resumed: boolean; pauseDuration: number };
  stopRace: () => void;
  updateRaceStartTime: (newStartTime: Date) => void;
  
  // FCY Strategy
  fcyStrategy: {
    toggleFCY: () => void;
    shouldRecommendPit: () => boolean;
    getFCYPitAdvantage: () => number;
    getOptimalFCYActions: () => string[];
  };
  
  // Time Calculations
  timing: {
    getElapsedRaceTime: () => number;
    getRemainingRaceTime: () => number;
    getRaceProgress: () => number;
  };
}

const RaceTimingContext = createContext<RaceTimingContextType | undefined>(undefined);

interface RaceTimingProviderProps {
  children: ReactNode;
  raceConfig: RaceConfig;
}

export const RaceTimingProvider: React.FC<RaceTimingProviderProps> = ({ 
  children, 
  raceConfig 
}) => {
  const raceState = useRaceState(raceConfig);
  const fcyStrategy = useFCYStrategy(raceState.fcyActive, raceConfig);

  // Time calculation utilities
  const timing = {
    getElapsedRaceTime: (): number => {
      if (!raceState.raceStartTime || !raceState.raceStarted) return 0;
      return (raceState.currentTime.getTime() - raceState.raceStartTime.getTime()) / 60000; // minutes
    },

    getRemainingRaceTime: (): number => {
      const elapsed = timing.getElapsedRaceTime();
      const totalRaceMinutes = raceConfig.raceLengthHours * 60;
      return Math.max(0, totalRaceMinutes - elapsed);
    },

    getRaceProgress: (): number => {
      const elapsed = timing.getElapsedRaceTime();
      const totalRaceMinutes = raceConfig.raceLengthHours * 60;
      return totalRaceMinutes > 0 ? Math.min(100, (elapsed / totalRaceMinutes) * 100) : 0;
    }
  };

  const contextValue: RaceTimingContextType = {
    // Race State
    raceStarted: raceState.raceStarted,
    racePaused: raceState.racePaused,
    raceStartTime: raceState.raceStartTime,
    pausedTime: raceState.pausedTime,
    currentTime: raceState.currentTime,
    fcyActive: raceState.fcyActive,
    
    // Race Actions
    startRace: raceState.startRace,
    pauseRace: raceState.pauseRace,
    stopRace: raceState.stopRace,
    updateRaceStartTime: raceState.updateRaceStartTime,
    
    // FCY Strategy
    fcyStrategy: {
      toggleFCY: raceState.toggleFCY,
      shouldRecommendPit: fcyStrategy.shouldRecommendPit,
      getFCYPitAdvantage: fcyStrategy.getFCYPitAdvantage,
      getOptimalFCYActions: fcyStrategy.getOptimalFCYActions
    },
    
    // Time Calculations
    timing
  };

  return (
    <RaceTimingContext.Provider value={contextValue}>
      {children}
    </RaceTimingContext.Provider>
  );
};

export const useRaceTiming = () => {
  const context = useContext(RaceTimingContext);
  if (context === undefined) {
    throw new Error('useRaceTiming must be used within a RaceTimingProvider');
  }
  return context;
};

export { RaceTimingContext };
