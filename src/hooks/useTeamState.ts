import { useState, useEffect } from 'react';
import type { RaceConfig, TeamState } from '../types';
import { generateStintPlan, recalculateStintPlan } from '../utils/stintPlanGenerator';

/**
 * Custom hook for managing team states and operations
 */
export const useTeamState = (raceConfig: RaceConfig, raceStartTime: Date | null, currentTime: Date) => {
  const [teamStates, setTeamStates] = useState<TeamState[]>([]);
  const [selectedTeam, setSelectedTeam] = useState(0);

  // Initialize team states when race config changes
  useEffect(() => {
    if (!raceConfig.teams || raceConfig.teams.length === 0) {
      return;
    }
    
    const initialStates = raceConfig.teams.map((team, index) => {
      // Ensure drivers array exists
      const drivers = team.drivers || [''];
      const validDrivers = drivers.filter(driver => driver && driver.trim());
      
      return {
        currentStint: 1,
        stintStartTime: null,
        currentDriver: 0,
        stints: generateStintPlan(raceConfig.fuelRangeMinutes, raceConfig.raceLengthHours),
        lastPitTime: null,
        position: index + 1
      };
    });
    
    setTeamStates(initialStates);
  }, [raceConfig.teams.length, raceConfig.fuelRangeMinutes, raceConfig.raceLengthHours, raceConfig.minPitTimeSeconds]);

  // Initialize first stint for all teams when race starts
  const initializeRaceStart = (startTime: Date) => {
    setTeamStates(prev => prev.map(team => ({
      ...team,
      stintStartTime: startTime,
      stints: team.stints.map((stint, i) => {
        if (i === 0) {
          // First stint starts now for ALL teams
          return {
            ...stint,
            plannedStart: startTime,
            predictedStart: startTime,
            actualStart: startTime,
            plannedFinish: new Date(startTime.getTime() + (stint.plannedLength * 60000)),
            status: 'active' as const
          };
        } else {
          // Calculate planned times for future stints based on ONLY race time (no pit stops)
          const cumulativeRaceTime = team.stints.slice(0, i).reduce((total, prevStint) => total + prevStint.plannedLength, 0);
          
          // Planned times are based on race time only (for strategy)
          const plannedStartTime = new Date(startTime.getTime() + (cumulativeRaceTime * 60000));
          const plannedFinishTime = new Date(plannedStartTime.getTime() + (stint.plannedLength * 60000));
          
          // Predicted times include pit stops (for actual clock timing)
          const pitTimeMinutes = (i * raceConfig.minPitTimeSeconds) / 60;
          const predictedStartTime = new Date(startTime.getTime() + ((cumulativeRaceTime + pitTimeMinutes) * 60000));
          const predictedFinishTime = new Date(predictedStartTime.getTime() + (stint.plannedLength * 60000));
          
          return {
            ...stint,
            plannedStart: plannedStartTime,
            plannedFinish: plannedFinishTime,
            predictedStart: predictedStartTime,
            predictedFinish: predictedFinishTime,
            status: 'planned' as const
          };
        }
      })
    })));
  };

  // Reset team states when race stops
  const resetTeamStates = () => {
    setTeamStates(prev => prev.map(team => ({
      ...team,
      currentStint: 1,
      stintStartTime: null,
      currentDriver: 0,
      lastPitTime: null,
      stints: generateStintPlan(raceConfig.fuelRangeMinutes, raceConfig.raceLengthHours)
    })));
  };

  // Handle race pause/resume - adjust times
  const handleRacePauseResume = (pauseDuration: number) => {
    setTeamStates(prev => prev.map(team => ({
      ...team,
      stintStartTime: team.stintStartTime ? new Date(team.stintStartTime.getTime() + pauseDuration) : null,
      lastPitTime: team.lastPitTime ? new Date(team.lastPitTime.getTime() + pauseDuration) : null
    })));
  };

  // Update team state
  const updateTeamState = (teamIndex: number, updater: (prevState: TeamState) => TeamState) => {
    setTeamStates(prev => prev.map((team, i) => 
      i === teamIndex ? updater(team) : team
    ));
  };

  // Recalculate stint plans for all teams
  const recalculateAllStintPlans = () => {
    setTeamStates(prev => prev.map(team => ({
      ...team,
      stints: recalculateStintPlan(team, raceConfig, raceStartTime, currentTime)
    })));
  };

  // Recalculate stint plan for specific team
  const recalculateTeamStintPlan = (teamIndex: number) => {
    setTeamStates(prev => prev.map((team, i) => {
      if (i !== teamIndex) return team;
      return {
        ...team,
        stints: recalculateStintPlan(team, raceConfig, raceStartTime, currentTime)
      };
    }));
  };

  return {
    // State
    teamStates,
    selectedTeam,
    
    // Actions
    setSelectedTeam,
    setTeamStates,
    initializeRaceStart,
    resetTeamStates,
    handleRacePauseResume,
    updateTeamState,
    recalculateAllStintPlans,
    recalculateTeamStintPlan,
  };
};
