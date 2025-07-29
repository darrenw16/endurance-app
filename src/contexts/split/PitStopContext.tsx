import React, { createContext, useContext, type ReactNode } from 'react';
import { usePitStop } from '../../hooks';
import { useRaceValidation } from '../../hooks/business';
import type { RaceConfig, TeamState } from '../../types';

/**
 * Context for pit stop logic and strategy
 * Handles pit stop execution, validation, and strategy decisions
 */
interface PitStopContextType {
  // Pit Stop State
  pitReason: 'scheduled' | 'fcyOpportunity' | 'unscheduled';
  fuelTaken: boolean;
  driverChanged: boolean;
  selectedDriverIndex: number;
  
  // Setters
  setPitReason: React.Dispatch<React.SetStateAction<'scheduled' | 'fcyOpportunity' | 'unscheduled'>>;
  setFuelTaken: (taken: boolean) => void;
  setDriverChanged: (changed: boolean) => void;
  setSelectedDriverIndex: (index: number) => void;
  
  // Pit Stop Operations
  executePitStop: (params: {
    selectedTeam: number;
    pitReason: 'scheduled' | 'fcyOpportunity' | 'unscheduled';
    fuelTaken: boolean;
    driverChanged: boolean;
    selectedDriverIndex: number;
    raceConfig: RaceConfig;
    teamStates: TeamState[];
    currentTime: Date;
    setTeamStates: React.Dispatch<React.SetStateAction<TeamState[]>>;
  }) => void;
  
  // Pit Strategy
  strategy: {
    calculatePitWindow: (teamIndex: number) => { start: Date | null; end: Date | null };
    isOptimalPitTime: (teamIndex: number) => boolean;
    getPitTimeAdvantage: (pitReason: string) => number;
    estimatePitLoss: (pitReason: string, driverChanged: boolean, fuelTaken: boolean) => number;
    shouldTakeFuel: (teamIndex: number) => boolean;
    shouldChangeDriver: (teamIndex: number) => boolean;
  };
  
  // Pit Validation
  validation: {
    canExecutePitStop: (teamIndex: number) => { valid: boolean; reasons: string[] };
    validatePitTiming: (teamIndex: number) => { valid: boolean; warnings: string[] };
    validateDriverChange: (teamIndex: number, newDriverIndex: number) => { valid: boolean; reasons: string[] };
    getPitStopRecommendations: (teamIndex: number, fcyActive: boolean) => string[];
  };
}

const PitStopContext = createContext<PitStopContextType | undefined>(undefined);

interface PitStopProviderProps {
  children: ReactNode;
  raceConfig: RaceConfig;
  teamStates: TeamState[];
  currentTime: Date;
  fcyActive: boolean;
}

export const PitStopProvider: React.FC<PitStopProviderProps> = ({ 
  children, 
  raceConfig,
  teamStates,
  currentTime,
  fcyActive
}) => {
  const pitStop = usePitStop();
  const validation = useRaceValidation(raceConfig, teamStates, currentTime);

  // Pit Stop State (moved from modals for better separation)
  const [pitReason, setPitReason] = React.useState<'scheduled' | 'fcyOpportunity' | 'unscheduled'>('scheduled');
  const [fuelTaken, setFuelTaken] = React.useState(true);
  const [driverChanged, setDriverChanged] = React.useState(true);
  const [selectedDriverIndex, setSelectedDriverIndex] = React.useState(0);

  // Pit Strategy calculations
  const strategy = {
    calculatePitWindow: (teamIndex: number) => {
      const team = teamStates[teamIndex];
      if (!team || !team.stintStartTime) {
        return { start: null, end: null };
      }

      const stintStart = team.stintStartTime.getTime();
      const fuelRange = raceConfig.fuelRangeMinutes;
      const bufferMinutes = 5; // Safety buffer

      const windowStart = new Date(stintStart + ((fuelRange - bufferMinutes) * 60000));
      const windowEnd = new Date(stintStart + (fuelRange * 60000));

      return { start: windowStart, end: windowEnd };
    },

    isOptimalPitTime: (teamIndex: number): boolean => {
      const window = strategy.calculatePitWindow(teamIndex);
      if (!window.start || !window.end) return false;
      
      const now = currentTime.getTime();
      return now >= window.start.getTime() && now <= window.end.getTime();
    },

    getPitTimeAdvantage: (pitReason: string): number => {
      switch (pitReason) {
        case 'fcyOpportunity':
          return 15; // seconds saved during FCY
        case 'scheduled':
          return 0; // no time advantage/loss
        case 'unscheduled':
          return -10; // time penalty for unscheduled stop
        default:
          return 0;
      }
    },

    estimatePitLoss: (pitReason: string, driverChanged: boolean, fuelTaken: boolean): number => {
      let basePitTime = raceConfig.minPitTimeSeconds;
      
      // Add time for driver change
      if (driverChanged) {
        basePitTime += 15; // Additional time for driver change
      }
      
      // Add time for fuel (minimal since we can't measure exact fuel)
      if (fuelTaken) {
        basePitTime += 5; // Minimal time addition for fuel procedure
      }
      
      // Apply pit reason modifier
      const advantageSeconds = strategy.getPitTimeAdvantage(pitReason);
      return basePitTime - advantageSeconds;
    },

    shouldTakeFuel: (teamIndex: number): boolean => {
      const team = teamStates[teamIndex];
      if (!team || !team.stintStartTime) return true;
      
      // Calculate time since last fuel stop
      const lastFuelTime = team.lastPitTime || team.stintStartTime;
      const timeSinceLastFuel = (currentTime.getTime() - lastFuelTime.getTime()) / 60000;
      
      // Recommend fuel if close to fuel range limit
      return timeSinceLastFuel >= (raceConfig.fuelRangeMinutes * 0.8);
    },

    shouldChangeDriver: (teamIndex: number): boolean => {
      const team = teamStates[teamIndex];
      const teamConfig = raceConfig.teams[teamIndex];
      
      if (!team || !teamConfig || teamConfig.drivers.length <= 1) return false;
      
      // For now, always recommend driver change for pit stops
      // In future could add driver stint time limits
      return true;
    }
  };

  const contextValue: PitStopContextType = {
    // Pit Stop State
    pitReason,
    fuelTaken,
    driverChanged,
    selectedDriverIndex,
    
    // Setters
    setPitReason,
    setFuelTaken,
    setDriverChanged,
    setSelectedDriverIndex,
    
    // Pit Stop Operations
    executePitStop: pitStop.executePitStop,
    
    // Pit Strategy
    strategy,
    
    // Pit Validation
    validation: {
      canExecutePitStop: validation.canExecutePitStop,
      validatePitTiming: validation.validatePitTiming,
      validateDriverChange: validation.validateDriverChange,
      getPitStopRecommendations: validation.getPitStopRecommendations
    }
  };

  return (
    <PitStopContext.Provider value={contextValue}>
      {children}
    </PitStopContext.Provider>
  );
};

export const usePitStopContext = () => {
  const context = useContext(PitStopContext);
  if (context === undefined) {
    throw new Error('usePitStopContext must be used within a PitStopProvider');
  }
  return context;
};

export { PitStopContext };
