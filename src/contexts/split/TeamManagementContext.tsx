import React, { createContext, useContext, type ReactNode } from 'react';
import { useTeamState, useDragAndDrop } from '../../hooks';
import { useStintCalculations } from '../../hooks/business';
import type { RaceConfig, TeamState, DraggedDriver } from '../../types';

/**
 * Context for team management operations
 * Handles team selection, stint management, driver assignments, and drag & drop
 */
interface TeamManagementContextType {
  // Team State
  teamStates: TeamState[];
  selectedTeam: number;
  setSelectedTeam: (teamIndex: number) => void;
  setTeamStates: React.Dispatch<React.SetStateAction<TeamState[]>>;
  
  // Team Operations
  initializeRaceStart: (startTime: Date) => void;
  resetTeamStates: () => void;
  handleRacePauseResume: (pauseDuration: number) => void;
  updateTeamState: (teamIndex: number, updater: (prevState: TeamState) => TeamState) => void;
  
  // Stint Management
  stintCalculations: {
    recalculateAllStintPlans: (overrideFuelRange?: number) => void;
    recalculateTeamStintPlan: (teamIndex: number) => void;
    calculateOptimalStintLength: (teamIndex: number) => number;
    predictNextPitWindow: (teamIndex: number) => Date | null;
    getFuelRange: () => number;
    calculateStintDurations: (teamIndex: number) => number[];
  };
  
  // Drag and Drop
  dragAndDrop: {
    draggedDriver: DraggedDriver | null;
    dragOverIndex: number | null;
    handleDriverDragStart: (e: React.DragEvent, stintIndex: number, teamIndex: number) => void;
    handleDriverDragOver: (e: React.DragEvent) => void;
    handleDriverDragEnter: (e: React.DragEvent, targetStintIndex: number) => void;
    handleDriverDragLeave: (e: React.DragEvent) => void;
    handleDriverDrop: (e: React.DragEvent, targetStintIndex: number, selectedTeam: number, teamStates: TeamState[]) => void;
  };
  
  // Team Analytics
  analytics: {
    getTeamPosition: (teamIndex: number) => number;
    getTeamProgress: (teamIndex: number) => number;
    getCompletedStints: (teamIndex: number) => number;
    getCurrentDriver: (teamIndex: number) => string;
    getNextDriver: (teamIndex: number) => string;
    getTeamEfficiency: (teamIndex: number) => number;
  };
}

const TeamManagementContext = createContext<TeamManagementContextType | undefined>(undefined);

interface TeamManagementProviderProps {
  children: ReactNode;
  raceConfig: RaceConfig;
  raceStartTime: Date | null;
  currentTime: Date;
  setRaceConfig: React.Dispatch<React.SetStateAction<RaceConfig>>;
}

export const TeamManagementProvider: React.FC<TeamManagementProviderProps> = ({ 
  children, 
  raceConfig,
  raceStartTime,
  currentTime,
  setRaceConfig
}) => {
  const teamState = useTeamState(raceConfig, raceStartTime, currentTime);
  const dragAndDrop = useDragAndDrop(raceConfig, setRaceConfig);
  const stintCalculations = useStintCalculations(raceConfig, teamState.teamStates, teamState.setTeamStates, raceStartTime, currentTime);

  // Team analytics
  const analytics = {
    getTeamPosition: (teamIndex: number): number => {
      const team = teamState.teamStates[teamIndex];
      return team?.position || teamIndex + 1;
    },

    getTeamProgress: (teamIndex: number): number => {
      const team = teamState.teamStates[teamIndex];
      if (!team || !team.stints.length) return 0;
      
      const completedStints = team.stints.filter(stint => stint.status === 'completed').length;
      const totalStints = team.stints.length;
      return totalStints > 0 ? (completedStints / totalStints) * 100 : 0;
    },

    getCompletedStints: (teamIndex: number): number => {
      const team = teamState.teamStates[teamIndex];
      return team?.stints.filter(stint => stint.status === 'completed').length || 0;
    },

    getCurrentDriver: (teamIndex: number): string => {
      const team = teamState.teamStates[teamIndex];
      const teamConfig = raceConfig.teams[teamIndex];
      
      if (!team || !teamConfig || !teamConfig.drivers) return 'Unknown';
      
      const currentDriverIndex = team.currentDriver || 0;
      return teamConfig.drivers[currentDriverIndex] || 'Unknown';
    },

    getNextDriver: (teamIndex: number): string => {
      const team = teamState.teamStates[teamIndex];
      const teamConfig = raceConfig.teams[teamIndex];
      
      if (!team || !teamConfig || !teamConfig.drivers) return 'Unknown';
      
      const currentDriverIndex = team.currentDriver || 0;
      const nextDriverIndex = (currentDriverIndex + 1) % teamConfig.drivers.length;
      return teamConfig.drivers[nextDriverIndex] || 'Unknown';
    },

    getTeamEfficiency: (teamIndex: number): number => {
      const team = teamState.teamStates[teamIndex];
      if (!team || !team.stints.length) return 100;
      
      const completedStints = team.stints.filter(stint => stint.status === 'completed');
      if (completedStints.length === 0) return 100;
      
      const totalPlannedTime = completedStints.reduce((sum, stint) => sum + stint.plannedLength, 0);
      const totalActualTime = completedStints.reduce((sum, stint) => {
        if (stint.actualStart && stint.actualFinish) {
          return sum + ((stint.actualFinish.getTime() - stint.actualStart.getTime()) / 60000);
        }
        return sum + stint.plannedLength;
      }, 0);
      
      return totalActualTime > 0 ? Math.round((totalPlannedTime / totalActualTime) * 100) : 100;
    }
  };

  const contextValue: TeamManagementContextType = {
    // Team State
    teamStates: teamState.teamStates,
    selectedTeam: teamState.selectedTeam,
    setSelectedTeam: teamState.setSelectedTeam,
    setTeamStates: teamState.setTeamStates,
    
    // Team Operations
    initializeRaceStart: teamState.initializeRaceStart,
    resetTeamStates: teamState.resetTeamStates,
    handleRacePauseResume: teamState.handleRacePauseResume,
    updateTeamState: teamState.updateTeamState,
    
    // Stint Management
    stintCalculations,
    
    // Drag and Drop
    dragAndDrop,
    
    // Team Analytics
    analytics
  };

  return (
    <TeamManagementContext.Provider value={contextValue}>
      {children}
    </TeamManagementContext.Provider>
  );
};

export const useTeamManagement = () => {
  const context = useContext(TeamManagementContext);
  if (context === undefined) {
    throw new Error('useTeamManagement must be used within a TeamManagementProvider');
  }
  return context;
};

export { TeamManagementContext };
