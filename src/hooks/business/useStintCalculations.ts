import { useCallback, useRef, useMemo } from 'react';
import { generateStintPlan, recalculateStintPlanForFuelChange } from '../../utils/stintPlanGenerator';
import type { RaceConfig, TeamState } from '../../types';

/**
 * Custom hook for stint calculations and planning
 * Handles fuel range calculations, stint duration optimization, and schedule recalculation
 * CRITICAL: Uses stable references to prevent infinite re-renders
 */
export const useStintCalculations = (
  raceConfig: RaceConfig,
  teamStates: TeamState[],
  setTeamStates: React.Dispatch<React.SetStateAction<TeamState[]>>,
  raceStartTime: Date | null = null,
  currentTime: Date = new Date()
) => {
  // Prevent infinite loops with debouncing and stable references
  const lastRecalcTime = useRef<number>(0);
  const isRecalculating = useRef<boolean>(false);
  const stableRaceConfig = useRef<RaceConfig>(raceConfig);
  const stableRaceStartTime = useRef<Date | null>(raceStartTime);
  
  // Update stable refs when values change, but don't trigger re-renders
  stableRaceConfig.current = raceConfig;
  stableRaceStartTime.current = raceStartTime;
  
  /**
   * Get the current fuel range in minutes
   * This is the only fuel-related calculation we can reliably make
   */
  const getFuelRange = useCallback((): number => {
    return stableRaceConfig.current.fuelRangeMinutes;
  }, []); // No dependencies - uses stable ref

  /**
   * Calculate optimal stint length based on fuel range
   * Since we can't measure exact fuel capacity, we use the configured range
   */
  const calculateOptimalStintLength = useCallback((teamIndex: number): number => {
    const fuelRange = getFuelRange();
    
    // Apply a small buffer for safety (5 minutes)
    const bufferMinutes = 5;
    const optimalLength = fuelRange - bufferMinutes;
    
    return Math.max(30, optimalLength); // Minimum 30-minute stint
  }, [getFuelRange]);

  /**
   * Calculate expected stint durations for a team
   * Returns array of stint lengths in minutes
   */
  const calculateStintDurations = useCallback((teamIndex: number): number[] => {
    // Use current teamStates directly to avoid stale closures
    const getCurrentTeamStates = () => {
      let currentStates: TeamState[] = [];
      setTeamStates(prevStates => {
        currentStates = prevStates;
        return prevStates;
      });
      return currentStates;
    };
    
    const team = getCurrentTeamStates()[teamIndex];
    if (!team || !team.stints.length) return [];

    const optimalLength = calculateOptimalStintLength(teamIndex);
    
    return team.stints.map(stint => {
      // Use actual length if completed, calculated length if available, otherwise optimal
      if (stint.status === 'completed' && stint.actualStart && stint.actualFinish) {
        return (stint.actualFinish.getTime() - stint.actualStart.getTime()) / 60000;
      }
      
      return stint.calculatedLength || stint.plannedLength || optimalLength;
    });
  }, [calculateOptimalStintLength, setTeamStates]);

  /**
   * Predict when the next pit window opens for a team
   */
  const predictNextPitWindow = useCallback((teamIndex: number): Date | null => {
    // Use current teamStates directly
    const getCurrentTeamStates = () => {
      let currentStates: TeamState[] = [];
      setTeamStates(prevStates => {
        currentStates = prevStates;
        return prevStates;
      });
      return currentStates;
    };
    
    const team = getCurrentTeamStates()[teamIndex];
    if (!team || !team.stintStartTime) return null;

    const fuelRange = getFuelRange();
    const bufferMinutes = 5;
    
    // Calculate when pit window opens (fuel range - buffer)
    const pitWindowStart = new Date(
      team.stintStartTime.getTime() + ((fuelRange - bufferMinutes) * 60000)
    );

    return pitWindowStart;
  }, [getFuelRange, setTeamStates]);

  /**
   * Recalculate stint plan for a specific team
   * CRITICAL: Uses stable references and prevents excessive calls
   */
  const recalculateTeamStintPlan = useCallback((teamIndex: number) => {
    const now = Date.now();
    
    // Prevent rapid successive calls for individual teams
    if (now - lastRecalcTime.current < 200) {
      console.log(`🔧 recalculateTeamStintPlan for team ${teamIndex}: Debounced`);
      return;
    }
    
    if (teamIndex < 0 || teamIndex >= stableRaceConfig.current.teams.length) {
      console.warn(`Invalid team index: ${teamIndex}`);
      return;
    }

    const teamConfig = stableRaceConfig.current.teams[teamIndex];
    if (!teamConfig) {
      console.warn(`No team config found for index: ${teamIndex}`);
      return;
    }

    lastRecalcTime.current = now;

    setTeamStates(prevStates => {
      const newStates = [...prevStates];
      const currentTeam = newStates[teamIndex];
      
      if (!currentTeam) {
        console.warn(`No team state found for index: ${teamIndex}`);
        return prevStates;
      }

      // Use specialized recalculation for fuel range changes during race
      const hasActiveOrCompletedStints = currentTeam.stints.some(stint => 
        stint.status === 'completed' || stint.status === 'active'
      );
      
      let newStintPlan: any[];
      
      if (hasActiveOrCompletedStints) {
        // Race is ongoing, use fuel change recalculation
        newStintPlan = recalculateStintPlanForFuelChange(
          currentTeam,
          stableRaceConfig.current,
          stableRaceStartTime.current,
          new Date() // Use current time for this call
        );
      } else {
        // Race hasn't started or no active stints, generate fresh plan
        newStintPlan = generateStintPlan(stableRaceConfig.current.fuelRangeMinutes, stableRaceConfig.current.raceLengthHours);
      }

      // CRITICAL: Only update if stints actually changed
      const stintsChanged = JSON.stringify(currentTeam.stints) !== JSON.stringify(newStintPlan);
      
      if (!stintsChanged) {
        console.log(`🔧 Team ${teamIndex}: No stint changes, preserving state`);
        return prevStates;
      }

      // CRITICAL: Preserve ALL team state, only update stints
      newStates[teamIndex] = {
        ...currentTeam,
        stints: newStintPlan
        // Explicitly preserve these critical fields:
        // - stintStartTime: keeps elapsed time counting
        // - currentStint: maintains active stint number
        // - currentDriver: keeps driver assignment
        // - lastPitTime: preserves pit timing
        // - position: keeps race position
      };

      return newStates;
    });
  }, [setTeamStates]); // Minimal dependencies

  /**
  * Recalculate stint plans for all teams with optional override fuel range
  * Handles fuel range changes during active races
  */
  const recalculateAllStintPlans = useCallback((overrideFuelRange?: number) => {
  const now = Date.now();
  
  // Debouncing to prevent excessive calls
  if (now - lastRecalcTime.current < 2000) {
  return;
  }
  
  // Prevent overlapping calls
  if (isRecalculating.current) {
    return;
  }
  
  isRecalculating.current = true;
  lastRecalcTime.current = now;
  
  // Use override fuel range if provided, otherwise use stable config
  const fuelRangeToUse = overrideFuelRange || stableRaceConfig.current.fuelRangeMinutes;
  
  // Small delay to ensure React has finished all renders
  setTimeout(() => {
    setTeamStates(prevStates => {
      const newStates = prevStates.map((currentTeam, teamIndex) => {
        if (teamIndex >= stableRaceConfig.current.teams.length) {
          return currentTeam;
      }

    // Check if team has active or completed stints
    const hasActiveOrCompletedStints = currentTeam.stints.some(stint => 
    stint.status === 'completed' || stint.status === 'active'
  );
  
          let newStintPlan: any[];
  
  if (hasActiveOrCompletedStints) {
  // Race is ongoing, use fuel change recalculation
    const tempRaceConfig = {
      ...stableRaceConfig.current,
      fuelRangeMinutes: fuelRangeToUse
  };
  
  newStintPlan = recalculateStintPlanForFuelChange(
    currentTeam,
    tempRaceConfig,
    stableRaceStartTime.current,
    new Date()
  );
  } else {
  // Generate fresh plan with new fuel range
  newStintPlan = generateStintPlan(fuelRangeToUse, stableRaceConfig.current.raceLengthHours);
  
  // If race has started, restore the active stint status
    if (stableRaceStartTime.current && currentTeam.currentStint && currentTeam.currentStint > 0) {
      const activeStintIndex = currentTeam.currentStint - 1;
      if (newStintPlan[activeStintIndex]) {
        // Calculate when this stint should have started based on race time
        let estimatedStintStartMinutes = 0;
      for (let i = 0; i < activeStintIndex; i++) {
        estimatedStintStartMinutes += newStintPlan[i].plannedLength;
      }
      
    const estimatedStintStart = new Date(stableRaceStartTime.current.getTime() + (estimatedStintStartMinutes * 60000));
    
      // Restore the stint to active status
      newStintPlan[activeStintIndex] = {
        ...newStintPlan[activeStintIndex],
        status: 'active',
      actualStart: estimatedStintStart,
      plannedStart: estimatedStintStart,
      plannedFinish: new Date(estimatedStintStart.getTime() + (newStintPlan[activeStintIndex].plannedLength * 60000))
    };
    }
    }
  }

  // Only update if stints actually changed
  const stintsChanged = JSON.stringify(currentTeam.stints) !== JSON.stringify(newStintPlan);
  
  if (!stintsChanged) {
  return currentTeam;
  }

  // Preserve all team timing state when updating stints
  const updatedTeam = {
  ...currentTeam,
  stints: newStintPlan
  };
  
  // If we restored an active stint, also restore team stintStartTime
  if (stableRaceStartTime.current && currentTeam.currentStint && currentTeam.currentStint > 0) {
  const activeStintIndex = currentTeam.currentStint - 1;
  const activeStint = newStintPlan[activeStintIndex];
  
  if (activeStint && activeStint.status === 'active' && activeStint.actualStart) {
  updatedTeam.stintStartTime = activeStint.actualStart;
  }
  }
  
  return updatedTeam;
  });
  
  // Reset the recalculating flag
  setTimeout(() => {
  isRecalculating.current = false;
  }, 500);
  
  return newStates;
  });
  }, 10);
  }, [setTeamStates]);

  return {
    getFuelRange,
    calculateOptimalStintLength,
    calculateStintDurations,
    predictNextPitWindow,
    recalculateTeamStintPlan,
    recalculateAllStintPlans
  };
};
