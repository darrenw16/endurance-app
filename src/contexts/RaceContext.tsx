import React, { createContext, useContext, type ReactNode } from 'react';
import { 
  useRaceState, 
  useTeamState, 
  useModals, 
  useDragAndDrop, 
  usePitStop 
} from '../hooks';
import {
  formatDurationToHMS,
  parseTimeToMinutes,
  createTimeForToday,
  getElapsedTime,
  getRemainingTime,
  formatRaceTime,
  getRemainingRaceTime
} from '../utils/timeFormatting';
import type { RaceConfig, TeamState, EditingStint, DraggedDriver } from '../types';

// Define the shape of the race context
interface RaceContextType {
  // Race Configuration
  raceConfig: RaceConfig;
  setRaceConfig: React.Dispatch<React.SetStateAction<RaceConfig>>;
  
  // Race State
  raceState: {
    raceStarted: boolean;
    racePaused: boolean;
    raceStartTime: Date | null;
    pausedTime: number;
    currentTime: Date;
    fcyActive: boolean;
    startRace: () => Date;
    pauseRace: () => { resumed: boolean; pauseDuration: number };
    stopRace: () => void;
    toggleFCY: () => void;
    updateRaceStartTime: (newStartTime: Date) => void;
  };
  
  // Team State
  teamState: {
    teamStates: TeamState[];
    selectedTeam: number;
    setSelectedTeam: (teamIndex: number) => void;
    setTeamStates: React.Dispatch<React.SetStateAction<TeamState[]>>;
    initializeRaceStart: (startTime: Date) => void;
    resetTeamStates: () => void;
    handleRacePauseResume: (pauseDuration: number) => void;
    updateTeamState: (teamIndex: number, updater: (prevState: TeamState) => TeamState) => void;
    recalculateAllStintPlans: () => void;
    recalculateTeamStintPlan: (teamIndex: number) => void;
  };
  
  // Modals State
  modals: {
    // Pit Dialog
    showPitDialog: boolean;
    pitReason: 'scheduled' | 'fcyOpportunity' | 'unscheduled';
    setPitReason: React.Dispatch<React.SetStateAction<'scheduled' | 'fcyOpportunity' | 'unscheduled'>>;
    fuelTaken: boolean;
    setFuelTaken: (taken: boolean) => void;
    driverChanged: boolean;
    setDriverChanged: (changed: boolean) => void;
    selectedDriverIndex: number;
    setSelectedDriverIndex: (index: number) => void;
    setShowPitDialog: (show: boolean) => void;
    
    // Time Edit Modals
    showElapsedModal: boolean;
    showRemainingModal: boolean;
    showRaceTimeModal: boolean;
    tempTimeValue: string;
    setTempTimeValue: (value: string) => void;
    
    // Fuel Range Modal
    showFuelRangeModal: boolean;
    tempFuelRangeValue: string;
    setTempFuelRangeValue: (value: string) => void;
    
    // Stint Time Modal
    showStintTimeModal: boolean;
    editingStint: EditingStint;
    setEditingStint: (stint: EditingStint) => void;
    
    // Modal Actions
    openPitDialog: (fcyActive: boolean, nextDriverIndex: number) => void;
    openElapsedModal: (currentValue: string) => void;
    openRemainingModal: (currentValue: string) => void;
    openRaceTimeModal: (currentValue: string) => void;
    openFuelRangeModal: (currentValue: string) => void;
    openStintTimeModal: (stintIndex: number, field: string, type: string, timeValue: string) => void;
    cancelModal: () => void;
  };
  
  // Drag and Drop State
  dragAndDrop: {
    draggedDriver: DraggedDriver | null;
    dragOverIndex: number | null;
    handleDriverDragStart: (e: React.DragEvent, stintIndex: number, teamIndex: number) => void;
    handleDriverDragOver: (e: React.DragEvent) => void;
    handleDriverDragEnter: (e: React.DragEvent, targetStintIndex: number) => void;
    handleDriverDragLeave: (e: React.DragEvent) => void;
    handleDriverDrop: (e: React.DragEvent, targetStintIndex: number, selectedTeam: number, teamStates: any[]) => void;
  };
  
  // Pit Stop
  pitStop: {
    executePitStop: (params: any) => void;
  };
  
  // Race Actions
  actions: {
    startRace: () => void;
    pauseRace: () => void;
    stopRace: () => void;
    executePit: (teamIndex?: number) => void;
    confirmPitStop: () => void;
    toggleFCY: () => void;
    
    // Modal Actions
    openElapsedModal: () => void;
    openRemainingModal: () => void;
    openRaceTimeModal: () => void;
    saveElapsedTime: () => void;
    saveRemainingTime: () => void;
    saveRaceTime: () => void;
    openFuelRangeModal: () => void;
    saveFuelRange: () => void;
    openStintTimeModal: (stintIndex: number, field: string, type: string) => void;
    saveStintTime: () => void;
  };
}

// Create the context
const RaceContext = createContext<RaceContextType | undefined>(undefined);

// Provider component props
interface RaceProviderProps {
  children: ReactNode;
  raceConfig: RaceConfig;
  setRaceConfig: React.Dispatch<React.SetStateAction<RaceConfig>>;
}

// Provider component
export const RaceProvider: React.FC<RaceProviderProps> = ({ 
  children, 
  raceConfig, 
  setRaceConfig 
}) => {
  // Initialize all hooks
  const raceState = useRaceState(raceConfig);
  const teamState = useTeamState(raceConfig, raceState.raceStartTime, raceState.currentTime);
  const modals = useModals();
  const dragAndDrop = useDragAndDrop(raceConfig, setRaceConfig);
  const pitStop = usePitStop();

  // Race Actions
  const startRace = () => {
    const startTime = raceState.startRace();
    teamState.initializeRaceStart(startTime);
  };

  const pauseRace = () => {
    const result = raceState.pauseRace();
    if (result.resumed && result.pauseDuration > 0) {
      teamState.handleRacePauseResume(result.pauseDuration);
    }
  };

  const stopRace = () => {
    raceState.stopRace();
    teamState.resetTeamStates();
  };

  const executePit = (teamIndex = teamState.selectedTeam) => {
    // Validate team index
    if (teamIndex < 0 || teamIndex >= teamState.teamStates.length) {
      console.error(`Invalid team index: ${teamIndex}, teamStates length: ${teamState.teamStates.length}`);
      return;
    }
    
    // Validate team state exists
    const currentTeamForPit = teamState.teamStates[teamIndex];
    if (!currentTeamForPit) {
      console.error(`No team state found for index: ${teamIndex}`);
      return;
    }
    
    // Validate team config exists
    const teamConfig = raceConfig.teams[teamIndex];
    if (!teamConfig) {
      console.error(`No team config found for index: ${teamIndex}`);
      return;
    }
    
    // Ensure we're working with the correct team
    teamState.setSelectedTeam(teamIndex);
    
    // Set the default next driver (next in rotation)
    const currentDriverIndex = currentTeamForPit.currentDriver || 0;
    const driversArray = teamConfig.drivers || [];
    const nextDriverIndex = driversArray.length > 0 
      ? (currentDriverIndex + 1) % driversArray.length 
      : 0;
    
    modals.openPitDialog(raceState.fcyActive, nextDriverIndex);
  };

  const confirmPitStop = () => {
    // Store FCY state before pit stop to avoid unintended changes
    const fcyWasActive = raceState.fcyActive;
    
    pitStop.executePitStop({
      selectedTeam: teamState.selectedTeam,
      pitReason: modals.pitReason,
      fuelTaken: modals.fuelTaken,
      driverChanged: modals.driverChanged,
      selectedDriverIndex: modals.selectedDriverIndex,
      raceConfig,
      teamStates: teamState.teamStates,
      currentTime: raceState.currentTime,
      setTeamStates: teamState.setTeamStates
    });
    
    // Only recalculate stint plans for fuel-taking unscheduled stops
    if (modals.fuelTaken && modals.pitReason === 'unscheduled') {
      setTimeout(() => {
        teamState.recalculateTeamStintPlan(teamState.selectedTeam);
      }, 100);
    }
    
    modals.setShowPitDialog(false);
    
    // Only turn off FCY if it was explicitly active before the pit stop
    // Don't change FCY state if it wasn't active
    if (fcyWasActive) {
      raceState.toggleFCY(); // Turn off FCY after pit stop during FCY period
    }
  };

  const toggleFCY = raceState.toggleFCY;

  // Time modal functions
  const openElapsedModal = () => {
    if (!teamState.teamStates[teamState.selectedTeam]?.stintStartTime) return;
    const currentValue = getElapsedTime(teamState.teamStates[teamState.selectedTeam].stintStartTime!, raceState.currentTime);
    modals.openElapsedModal(formatDurationToHMS(currentValue));
  };

  const openRemainingModal = () => {
    if (!teamState.teamStates[teamState.selectedTeam]?.stintStartTime) return;
    const currentTeam = teamState.teamStates[teamState.selectedTeam];
    const currentStint = currentTeam.stints[currentTeam.currentStint - 1];
    const currentValue = getRemainingTime(currentTeam.stintStartTime!, currentStint?.plannedLength || 0, raceState.currentTime);
    modals.openRemainingModal(formatDurationToHMS(currentValue));
  };

  const openRaceTimeModal = () => {
    modals.openRaceTimeModal(formatRaceTime(getRemainingRaceTime(raceState.raceStartTime, raceConfig.raceLengthHours, raceState.currentTime)));
  };

  const saveElapsedTime = () => {
    if (!modals.tempTimeValue) {
      modals.setShowElapsedModal(false);
      modals.setTempTimeValue('');
      return;
    }

    const totalMinutes = parseTimeToMinutes(modals.tempTimeValue);

    // Adjust stint start time based on new elapsed time
    const newStartTime = new Date(raceState.currentTime.getTime() - (totalMinutes * 60000));
    teamState.updateTeamState(teamState.selectedTeam, (team) => ({
      ...team,
      stintStartTime: newStartTime
    }));

    modals.setShowElapsedModal(false);
    modals.setTempTimeValue('');
  };

  const saveRemainingTime = () => {
    if (!modals.tempTimeValue) {
      modals.setShowRemainingModal(false);
      modals.setTempTimeValue('');
      return;
    }

    const totalMinutes = parseTimeToMinutes(modals.tempTimeValue);
    const currentTeam = teamState.teamStates[teamState.selectedTeam];
    const currentStint = currentTeam.stints[currentTeam.currentStint - 1];
    
    // Adjust stint start time based on new remaining time
    const currentStintLength = currentStint?.plannedLength || 0;
    const newElapsed = currentStintLength - totalMinutes;
    const newStartTime = new Date(raceState.currentTime.getTime() - (newElapsed * 60000));
    teamState.updateTeamState(teamState.selectedTeam, (team) => ({
      ...team,
      stintStartTime: newStartTime
    }));

    modals.setShowRemainingModal(false);
    modals.setTempTimeValue('');
  };

  const saveRaceTime = () => {
    if (!modals.tempTimeValue) {
      modals.setShowRaceTimeModal(false);
      modals.setTempTimeValue('');
      return;
    }

    const totalMinutes = parseTimeToMinutes(modals.tempTimeValue);

    // Calculate what the race start time should be to result in this remaining time
    const totalRaceMinutes = raceConfig.raceLengthHours * 60;
    const elapsedMinutes = totalRaceMinutes - totalMinutes;
    const newStartTime = new Date(raceState.currentTime.getTime() - (elapsedMinutes * 60000));
    
    raceState.updateRaceStartTime(newStartTime);
    
    // Also adjust all team stint start times by the same amount
    if (raceState.raceStartTime) {
      const timeDifference = newStartTime.getTime() - raceState.raceStartTime.getTime();
      teamState.setTeamStates(prev => prev.map(team => ({
        ...team,
        stintStartTime: team.stintStartTime ? new Date(team.stintStartTime.getTime() + timeDifference) : null,
        lastPitTime: team.lastPitTime ? new Date(team.lastPitTime.getTime() + timeDifference) : null
      })));
    }

    modals.setShowRaceTimeModal(false);
    modals.setTempTimeValue('');
  };

  const openFuelRangeModal = () => {
    modals.openFuelRangeModal(raceConfig.fuelRangeMinutes.toString());
  };

  const saveFuelRange = () => {
    const newFuelRange = parseInt(modals.tempFuelRangeValue);
    
    if (!newFuelRange || newFuelRange < 30 || newFuelRange > 300) {
      alert('Please enter a valid fuel range between 30 and 300 minutes');
      return;
    }

    // Update the race configuration
    setRaceConfig(prev => ({
      ...prev,
      fuelRangeMinutes: newFuelRange
    }));

    // Recalculate stint plans for all teams with the new fuel range
    setTimeout(() => {
      teamState.recalculateAllStintPlans();
    }, 100);

    modals.setShowFuelRangeModal(false);
    modals.setTempFuelRangeValue('');
  };

  const openStintTimeModal = (stintIndex: number, field: string, type: string) => {
    const currentTeam = teamState.teamStates[teamState.selectedTeam];
    const stint = currentTeam.stints[stintIndex];
    let currentValue: Date | null = null;
    
    if (field === 'start') {
      currentValue = type === 'planned' ? stint.plannedStart : stint.actualStart;
    } else if (field === 'finish') {
      currentValue = type === 'planned' ? stint.plannedFinish : stint.actualFinish;
    }
    
    const timeValue = currentValue instanceof Date ? currentValue.toLocaleTimeString('en-US', { hour12: false }) : '';
    modals.openStintTimeModal(stintIndex, field, type, timeValue);
  };

  const saveStintTime = () => {
    if (!modals.tempTimeValue || modals.editingStint.index === null) {
      modals.setShowStintTimeModal(false);
      modals.setTempTimeValue('');
      modals.setEditingStint({ index: null, field: null, type: null });
      return;
    }

    const newTime = createTimeForToday(modals.tempTimeValue);
    if (!newTime) {
      alert('Please enter time in HH:MM:SS format');
      return;
    }

    // Update the specific stint time
    teamState.updateTeamState(teamState.selectedTeam, (team) => {
      const updatedStints = [...team.stints];
      const stint = { ...updatedStints[modals.editingStint.index!] };
      
      const fieldName = modals.editingStint.type === 'planned' 
        ? (modals.editingStint.field === 'start' ? 'plannedStart' : 'plannedFinish')
        : (modals.editingStint.field === 'start' ? 'actualStart' : 'actualFinish');
      
      (stint as any)[fieldName] = newTime;
      
      updatedStints[modals.editingStint.index!] = stint;
      
      // If we're editing the actual start time of the active stint, update the team's stint start time
      if (modals.editingStint.field === 'start' && modals.editingStint.type === 'actual' && stint.status === 'active') {
        return {
          ...team,
          stintStartTime: newTime,
          stints: updatedStints
        };
      }
      
      return {
        ...team,
        stints: updatedStints
      };
    });

    modals.setShowStintTimeModal(false);
    modals.setTempTimeValue('');
    modals.setEditingStint({ index: null, field: null, type: null });
  };

  // Create the context value
  const contextValue: RaceContextType = {
    raceConfig,
    setRaceConfig,
    raceState,
    teamState,
    modals,
    dragAndDrop,
    pitStop,
    actions: {
      startRace,
      pauseRace,
      stopRace,
      executePit,
      confirmPitStop,
      toggleFCY,
      openElapsedModal,
      openRemainingModal,
      openRaceTimeModal,
      saveElapsedTime,
      saveRemainingTime,
      saveRaceTime,
      openFuelRangeModal,
      saveFuelRange,
      openStintTimeModal,
      saveStintTime,
    },
  };

  return (
    <RaceContext.Provider value={contextValue}>
      {children}
    </RaceContext.Provider>
  );
};

// Custom hook to use the race context
export const useRaceContext = () => {
  const context = useContext(RaceContext);
  if (context === undefined) {
    throw new Error('useRaceContext must be used within a RaceProvider');
  }
  return context;
};

// Export the context for advanced use cases
export { RaceContext };
