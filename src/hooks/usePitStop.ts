import type { RaceConfig, TeamState } from '../types';
import { getElapsedTime } from '../utils/stintCalculations';

interface PitStopParams {
  selectedTeam: number;
  pitReason: 'scheduled' | 'fcyOpportunity' | 'unscheduled';
  fuelTaken: boolean;
  driverChanged: boolean;
  selectedDriverIndex: number;
  raceConfig: RaceConfig;
  teamStates: TeamState[];
  currentTime: Date;
  setTeamStates: React.Dispatch<React.SetStateAction<TeamState[]>>;
}

/**
 * Custom hook for managing pit stop operations
 */
export const usePitStop = () => {
  
  const executePitStop = ({
    selectedTeam,
    pitReason,
    fuelTaken,
    driverChanged,
    selectedDriverIndex,
    raceConfig,
    teamStates,
    currentTime,
    setTeamStates
  }: PitStopParams) => {
    const now = new Date();
    const currentStintIndex = teamStates[selectedTeam].currentStint - 1;
    const elapsed = getElapsedTime(teamStates[selectedTeam].stintStartTime, currentTime);
    const pitTimeMs = raceConfig.minPitTimeSeconds * 1000;
    
    setTeamStates(prev => {
      return prev.map((team, i) => {
        if (i !== selectedTeam) return team;
        
        let updatedStints = [...team.stints];
        let newCurrentStint = team.currentStint;
        let newStintStartTime = team.stintStartTime;
        
        // Handle pit stops differently based on type
        const activeStintIndex = updatedStints.findIndex(stint => stint.status === 'active');
        
        if (activeStintIndex >= 0) {
          const activeStint = updatedStints[activeStintIndex];
          
          if (pitReason === 'unscheduled') {
            // UNSCHEDULED STOPS: Mark current stint as unscheduled, then create new active stint
            
            // First, mark the current stint as completed with unscheduled reason
            updatedStints[activeStintIndex] = {
              ...activeStint,
              calculatedLength: elapsed,
              actualFinish: now,
              predictedFinish: now,
              status: 'completed',
              fuelTaken: fuelTaken,
              pitReason: 'unscheduled',
              driverChanged: driverChanged,
              driver: raceConfig.teams[selectedTeam].drivers[team.currentDriver]
            };
            
            // Create new active stint row with next stint number
            const nextStintNumber = team.currentStint + 1;
            
            // Simple rule: Fuel taken = reset to max fuel range, No fuel = don't reset timer
            const stintLength = fuelTaken ? raceConfig.fuelRangeMinutes : (activeStint.plannedLength - elapsed);
            
            const newActiveStint = {
              stintNumber: nextStintNumber,
              plannedLength: stintLength,
              calculatedLength: null,
              plannedStart: new Date(now.getTime() + pitTimeMs),
              predictedStart: new Date(now.getTime() + pitTimeMs),
              plannedFinish: new Date(now.getTime() + pitTimeMs + (stintLength * 60000)),
              predictedFinish: new Date(now.getTime() + pitTimeMs + (stintLength * 60000)),
              actualStart: new Date(now.getTime() + pitTimeMs),
              actualFinish: null,
              pitTime: raceConfig.minPitTimeSeconds,
              actualPitTime: null,
              status: 'active' as const,
              fuelTaken: null,
              pitReason: null,
              driverChanged: null,
              driver: driverChanged ? raceConfig.teams[selectedTeam].drivers[selectedDriverIndex] : raceConfig.teams[selectedTeam].drivers[team.currentDriver],
              elapsed: 0,
              remaining: stintLength,
              fcyBuffer: 0,
              isUnscheduled: false
            };
            
            // Insert the new active stint after current stint
            updatedStints.splice(activeStintIndex + 1, 0, newActiveStint);
            
            // Renumber all subsequent planned stints
            for (let i = activeStintIndex + 2; i < updatedStints.length; i++) {
              updatedStints[i].stintNumber = updatedStints[i].stintNumber + 1;
            }
            
            // Update current stint tracking
            newCurrentStint = nextStintNumber;
            if (fuelTaken) {
              // Fresh timer starts with new fuel
              newStintStartTime = new Date(now.getTime() + pitTimeMs);
            } else {
              // Continue the original timer - adjust start time to maintain elapsed time
              const originalElapsed = elapsed;
              newStintStartTime = new Date((now.getTime() + pitTimeMs) - (originalElapsed * 60000));
            }
            
          } else {
            // SCHEDULED/FCY STOPS: Update existing planned stint
            
            updatedStints[activeStintIndex] = {
              ...activeStint,
              calculatedLength: elapsed,
              actualFinish: now,
              predictedFinish: now,
              status: 'completed',
              fuelTaken: fuelTaken,
              pitReason: pitReason,
              driverChanged: driverChanged,
              driver: raceConfig.teams[selectedTeam].drivers[team.currentDriver]
            };
            
            if (fuelTaken) {
              // Move to next planned stint
              newCurrentStint = team.currentStint + 1;
              newStintStartTime = new Date(now.getTime() + pitTimeMs);
              
              // Find and activate next planned stint
              const nextPlannedIndex = updatedStints.findIndex((stint, idx) => 
                idx > activeStintIndex && stint.status === 'planned'
              );
              
              if (nextPlannedIndex >= 0) {
                const nextDriver = driverChanged 
                  ? raceConfig.teams[selectedTeam].drivers[selectedDriverIndex]
                  : raceConfig.teams[selectedTeam].drivers[team.currentDriver];
                
                // Force the planned length to be exactly the fuel range when fuel is taken
                // AND set the start time to NOW, not future time
                updatedStints[nextPlannedIndex] = {
                  ...updatedStints[nextPlannedIndex],
                  plannedLength: raceConfig.fuelRangeMinutes, // Force to exactly fuel range minutes
                  predictedStart: now, // Start now, not in the future
                  actualStart: now,    // Start now, not in the future
                  status: 'active',
                  driver: nextDriver
                };
                
                // Set the team's stint start time to NOW as well
                newStintStartTime = now;
              }
            } else {
              // No fuel taken - continue current stint
              newStintStartTime = team.stintStartTime;
              newCurrentStint = team.currentStint;
            }
          }
        }
        
        // Calculate new current driver
        const newCurrentDriver = driverChanged 
          ? selectedDriverIndex
          : team.currentDriver;

        const newTeamState = {
          ...team,
          currentStint: newCurrentStint,
          stintStartTime: newStintStartTime,
          lastPitTime: now,
          currentDriver: newCurrentDriver,
          stints: updatedStints
        };
        
        return newTeamState;
      });
    });
  };

  return {
    executePitStop
  };
};
