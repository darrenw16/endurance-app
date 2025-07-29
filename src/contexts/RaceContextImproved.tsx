import React, { createContext, useContext, type ReactNode } from 'react';
import {
  RaceTimingProvider,
  useRaceTiming,
  TeamManagementProvider,
  useTeamManagement,
  PitStopProvider,
  usePitStopContext,
  UIStateProvider,
  useUIState
} from './split';
import { useAutoSave } from '../hooks';
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

/**
 * Improved RaceContext that uses split contexts internally
 * Maintains backward compatibility while providing better organization
 */
interface RaceContextType {
  // Race Configuration
  raceConfig: RaceConfig;
  setRaceConfig: React.Dispatch<React.SetStateAction<RaceConfig>>;
  
  // Race State (from RaceTimingContext)
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
  
  // Team State (from TeamManagementContext)
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
  
  // Modals State (from UIStateContext)
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
  
  // Drag and Drop State (from TeamManagementContext)
  dragAndDrop: {
    draggedDriver: DraggedDriver | null;
    dragOverIndex: number | null;
    handleDriverDragStart: (e: React.DragEvent, stintIndex: number, teamIndex: number) => void;
    handleDriverDragOver: (e: React.DragEvent) => void;
    handleDriverDragEnter: (e: React.DragEvent, targetStintIndex: number) => void;
    handleDriverDragLeave: (e: React.DragEvent) => void;
    handleDriverDrop: (e: React.DragEvent, targetStintIndex: number, selectedTeam: number, teamStates: any[]) => void;
  };
  
  // Pit Stop (from PitStopContext)
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

const RaceContext = createContext<RaceContextType | undefined>(undefined);

interface RaceProviderProps {
  children: ReactNode;
  raceConfig: RaceConfig;
  setRaceConfig: React.Dispatch<React.SetStateAction<RaceConfig>>;
}

/**
 * Wrapper that accesses all contexts and provides the unified API
 */
const RaceContextConsumer: React.FC<{ children: ReactNode; raceConfig: RaceConfig; setRaceConfig: React.Dispatch<React.SetStateAction<RaceConfig>>; }> = ({ 
  children, 
  raceConfig, 
  setRaceConfig 
}) => {
  const raceTiming = useRaceTiming();
  const teamManagement = useTeamManagement();
  const pitStop = usePitStopContext();
  const uiState = useUIState();

  // Auto-save functionality
  const autoSave = useAutoSave({
    raceConfig,
    raceState: {
      raceStarted: raceTiming.raceStarted,
      racePaused: raceTiming.racePaused,
      raceStartTime: raceTiming.raceStartTime,
      pausedTime: raceTiming.pausedTime,
      fcyActive: raceTiming.fcyActive
    },
    teamStates: teamManagement.teamStates
  });

  // Race Actions
  const startRace = () => {
    const startTime = raceTiming.startRace();
    teamManagement.initializeRaceStart(startTime);
  };

  const pauseRace = () => {
    const result = raceTiming.pauseRace();
    if (result.resumed && result.pauseDuration > 0) {
      teamManagement.handleRacePauseResume(result.pauseDuration);
    }
  };

  const stopRace = () => {
    raceTiming.stopRace();
    teamManagement.resetTeamStates();
  };

  const executePit = (teamIndex = teamManagement.selectedTeam) => {
    // Validate team index
    if (teamIndex < 0 || teamIndex >= teamManagement.teamStates.length) {
      console.error(`Invalid team index: ${teamIndex}, teamStates length: ${teamManagement.teamStates.length}`);
      return;
    }
    
    // Validate team state exists
    const currentTeamForPit = teamManagement.teamStates[teamIndex];
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
    teamManagement.setSelectedTeam(teamIndex);
    
    // Set the default next driver (next in rotation)
    const currentDriverIndex = currentTeamForPit.currentDriver || 0;
    const driversArray = teamConfig.drivers || [];
    const nextDriverIndex = driversArray.length > 0 
      ? (currentDriverIndex + 1) % driversArray.length 
      : 0;
    
    uiState.actions.openPitDialog(raceTiming.fcyActive, nextDriverIndex);
  };

  const confirmPitStop = () => {
    // Store FCY state before pit stop to avoid unintended changes
    const fcyWasActive = raceTiming.fcyActive;
    
    pitStop.executePitStop({
      selectedTeam: teamManagement.selectedTeam,
      pitReason: pitStop.pitReason,
      fuelTaken: pitStop.fuelTaken,
      driverChanged: pitStop.driverChanged,
      selectedDriverIndex: pitStop.selectedDriverIndex,
      raceConfig,
      teamStates: teamManagement.teamStates,
      currentTime: raceTiming.currentTime,
      setTeamStates: teamManagement.setTeamStates
    });
    
    // Only recalculate stint plans for fuel-taking unscheduled stops
    if (pitStop.fuelTaken && pitStop.pitReason === 'unscheduled') {
      setTimeout(() => {
        teamManagement.stintCalculations.recalculateTeamStintPlan(teamManagement.selectedTeam);
      }, 100);
    }
    
    uiState.setters.setShowPitDialog(false);
    
    // Only turn off FCY if it was explicitly active before the pit stop
    if (fcyWasActive) {
      raceTiming.fcyStrategy.toggleFCY();
    }
  };

  // Time modal functions
  const openElapsedModal = () => {
    if (!teamManagement.teamStates[teamManagement.selectedTeam]?.stintStartTime) return;
    const currentValue = getElapsedTime(teamManagement.teamStates[teamManagement.selectedTeam].stintStartTime!, raceTiming.currentTime);
    uiState.actions.openElapsedModal(formatDurationToHMS(currentValue));
  };

  const openRemainingModal = () => {
    if (!teamManagement.teamStates[teamManagement.selectedTeam]?.stintStartTime) return;
    const currentTeam = teamManagement.teamStates[teamManagement.selectedTeam];
    const currentStint = currentTeam.stints[currentTeam.currentStint - 1];
    const currentValue = getRemainingTime(currentTeam.stintStartTime!, currentStint?.plannedLength || 0, raceTiming.currentTime);
    uiState.actions.openRemainingModal(formatDurationToHMS(currentValue));
  };

  const openRaceTimeModal = () => {
    uiState.actions.openRaceTimeModal(formatRaceTime(getRemainingRaceTime(raceTiming.raceStartTime, raceConfig.raceLengthHours, raceTiming.currentTime)));
  };

  const saveElapsedTime = () => {
    if (!uiState.tempValues.tempTimeValue) {
      uiState.setters.setShowElapsedModal(false);
      uiState.setters.setTempTimeValue('');
      return;
    }

    const totalMinutes = parseTimeToMinutes(uiState.tempValues.tempTimeValue);
    const newStartTime = new Date(raceTiming.currentTime.getTime() - (totalMinutes * 60000));
    teamManagement.updateTeamState(teamManagement.selectedTeam, (team) => ({
      ...team,
      stintStartTime: newStartTime
    }));

    uiState.setters.setShowElapsedModal(false);
    uiState.setters.setTempTimeValue('');
  };

  const saveRemainingTime = () => {
    if (!uiState.tempValues.tempTimeValue) {
      uiState.setters.setShowRemainingModal(false);
      uiState.setters.setTempTimeValue('');
      return;
    }

    const totalMinutes = parseTimeToMinutes(uiState.tempValues.tempTimeValue);
    const currentTeam = teamManagement.teamStates[teamManagement.selectedTeam];
    const currentStint = currentTeam.stints[currentTeam.currentStint - 1];
    
    const currentStintLength = currentStint?.plannedLength || 0;
    const newElapsed = currentStintLength - totalMinutes;
    const newStartTime = new Date(raceTiming.currentTime.getTime() - (newElapsed * 60000));
    teamManagement.updateTeamState(teamManagement.selectedTeam, (team) => ({
      ...team,
      stintStartTime: newStartTime
    }));

    uiState.setters.setShowRemainingModal(false);
    uiState.setters.setTempTimeValue('');
  };

  const saveRaceTime = () => {
    if (!uiState.tempValues.tempTimeValue) {
      uiState.setters.setShowRaceTimeModal(false);
      uiState.setters.setTempTimeValue('');
      return;
    }

    const totalMinutes = parseTimeToMinutes(uiState.tempValues.tempTimeValue);
    const totalRaceMinutes = raceConfig.raceLengthHours * 60;
    const elapsedMinutes = totalRaceMinutes - totalMinutes;
    const newStartTime = new Date(raceTiming.currentTime.getTime() - (elapsedMinutes * 60000));
    
    raceTiming.updateRaceStartTime(newStartTime);
    
    if (raceTiming.raceStartTime) {
      const timeDifference = newStartTime.getTime() - raceTiming.raceStartTime.getTime();
      teamManagement.setTeamStates(prev => prev.map(team => ({
        ...team,
        stintStartTime: team.stintStartTime ? new Date(team.stintStartTime.getTime() + timeDifference) : null,
        lastPitTime: team.lastPitTime ? new Date(team.lastPitTime.getTime() + timeDifference) : null
      })));
    }

    uiState.setters.setShowRaceTimeModal(false);
    uiState.setters.setTempTimeValue('');
  };

  const openFuelRangeModal = () => {
    uiState.actions.openFuelRangeModal(raceConfig.fuelRangeMinutes.toString());
  };

  const saveFuelRange = () => {
    const newFuelRange = parseInt(uiState.tempValues.tempFuelRangeValue);
    
    if (!newFuelRange || newFuelRange < 30 || newFuelRange > 300) {
      alert('Please enter a valid fuel range between 30 and 300 minutes');
      return;
    }

    setRaceConfig(prev => ({
      ...prev,
      fuelRangeMinutes: newFuelRange
    }));

    setTimeout(() => {
      teamManagement.stintCalculations.recalculateAllStintPlans();
    }, 100);

    uiState.setters.setShowFuelRangeModal(false);
    uiState.setters.setTempFuelRangeValue('');
  };

  const openStintTimeModal = (stintIndex: number, field: string, type: string) => {
    const currentTeam = teamManagement.teamStates[teamManagement.selectedTeam];
    const stint = currentTeam.stints[stintIndex];
    let currentValue: Date | null = null;
    
    if (field === 'start') {
      currentValue = type === 'planned' ? stint.plannedStart : stint.actualStart;
    } else if (field === 'finish') {
      currentValue = type === 'planned' ? stint.plannedFinish : stint.actualFinish;
    }
    
    const timeValue = currentValue instanceof Date ? currentValue.toLocaleTimeString('en-US', { hour12: false }) : '';
    uiState.actions.openStintTimeModal(stintIndex, field, type, timeValue);
  };

  const saveStintTime = () => {
    if (!uiState.tempValues.tempTimeValue || uiState.tempValues.editingStint.index === null) {
      uiState.setters.setShowStintTimeModal(false);
      uiState.setters.setTempTimeValue('');
      uiState.setters.setEditingStint({ index: null, field: null, type: null });
      return;
    }

    const newTime = createTimeForToday(uiState.tempValues.tempTimeValue);
    if (!newTime) {
      alert('Please enter time in HH:MM:SS format');
      return;
    }

    teamManagement.updateTeamState(teamManagement.selectedTeam, (team) => {
      const updatedStints = [...team.stints];
      const stint = { ...updatedStints[uiState.tempValues.editingStint.index!] };
      
      const fieldName = uiState.tempValues.editingStint.type === 'planned' 
        ? (uiState.tempValues.editingStint.field === 'start' ? 'plannedStart' : 'plannedFinish')
        : (uiState.tempValues.editingStint.field === 'start' ? 'actualStart' : 'actualFinish');
      
      (stint as any)[fieldName] = newTime;
      
      updatedStints[uiState.tempValues.editingStint.index!] = stint;
      
      if (uiState.tempValues.editingStint.field === 'start' && uiState.tempValues.editingStint.type === 'actual' && stint.status === 'active') {
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

    uiState.setters.setShowStintTimeModal(false);
    uiState.setters.setTempTimeValue('');
    uiState.setters.setEditingStint({ index: null, field: null, type: null });
  };

  // Create the context value
  const contextValue: RaceContextType = {
    raceConfig,
    setRaceConfig,
    raceState: {
      raceStarted: raceTiming.raceStarted,
      racePaused: raceTiming.racePaused,
      raceStartTime: raceTiming.raceStartTime,
      pausedTime: raceTiming.pausedTime,
      currentTime: raceTiming.currentTime,
      fcyActive: raceTiming.fcyActive,
      startRace: raceTiming.startRace,
      pauseRace: raceTiming.pauseRace,
      stopRace: raceTiming.stopRace,
      toggleFCY: raceTiming.fcyStrategy.toggleFCY,
      updateRaceStartTime: raceTiming.updateRaceStartTime,
    },
    teamState: {
      teamStates: teamManagement.teamStates,
      selectedTeam: teamManagement.selectedTeam,
      setSelectedTeam: teamManagement.setSelectedTeam,
      setTeamStates: teamManagement.setTeamStates,
      initializeRaceStart: teamManagement.initializeRaceStart,
      resetTeamStates: teamManagement.resetTeamStates,
      handleRacePauseResume: teamManagement.handleRacePauseResume,
      updateTeamState: teamManagement.updateTeamState,
      recalculateAllStintPlans: teamManagement.stintCalculations.recalculateAllStintPlans,
      recalculateTeamStintPlan: teamManagement.stintCalculations.recalculateTeamStintPlan,
    },
    modals: {
      showPitDialog: uiState.modals.showPitDialog,
      pitReason: pitStop.pitReason,
      setPitReason: pitStop.setPitReason,
      fuelTaken: pitStop.fuelTaken,
      setFuelTaken: pitStop.setFuelTaken,
      driverChanged: pitStop.driverChanged,
      setDriverChanged: pitStop.setDriverChanged,
      selectedDriverIndex: pitStop.selectedDriverIndex,
      setSelectedDriverIndex: pitStop.setSelectedDriverIndex,
      setShowPitDialog: uiState.setters.setShowPitDialog,
      showElapsedModal: uiState.modals.showElapsedModal,
      showRemainingModal: uiState.modals.showRemainingModal,
      showRaceTimeModal: uiState.modals.showRaceTimeModal,
      tempTimeValue: uiState.tempValues.tempTimeValue,
      setTempTimeValue: uiState.setters.setTempTimeValue,
      showFuelRangeModal: uiState.modals.showFuelRangeModal,
      tempFuelRangeValue: uiState.tempValues.tempFuelRangeValue,
      setTempFuelRangeValue: uiState.setters.setTempFuelRangeValue,
      showStintTimeModal: uiState.modals.showStintTimeModal,
      editingStint: uiState.tempValues.editingStint,
      setEditingStint: uiState.setters.setEditingStint,
      openPitDialog: uiState.actions.openPitDialog,
      openElapsedModal: uiState.actions.openElapsedModal,
      openRemainingModal: uiState.actions.openRemainingModal,
      openRaceTimeModal: uiState.actions.openRaceTimeModal,
      openFuelRangeModal: uiState.actions.openFuelRangeModal,
      openStintTimeModal: uiState.actions.openStintTimeModal,
      cancelModal: uiState.actions.cancelModal,
    },
    dragAndDrop: teamManagement.dragAndDrop,
    pitStop: {
      executePitStop: pitStop.executePitStop
    },
    actions: {
      startRace,
      pauseRace,
      stopRace,
      executePit,
      confirmPitStop,
      toggleFCY: raceTiming.fcyStrategy.toggleFCY,
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

/**
 * Composite provider that sets up all the split contexts
 */
export const RaceProvider: React.FC<RaceProviderProps> = ({ children, raceConfig, setRaceConfig }) => {
  return (
    <RaceTimingProvider raceConfig={raceConfig}>
      <UIStateProvider>
        <TeamManagementProvider
          raceConfig={raceConfig}
          raceStartTime={null} // Will be populated by timing context
          currentTime={new Date()}
          setRaceConfig={setRaceConfig}
        >
          <PitStopProvider
            raceConfig={raceConfig}
            teamStates={[]} // Will be populated by team management context
            currentTime={new Date()}
            fcyActive={false}
          >
            <RaceContextConsumer raceConfig={raceConfig} setRaceConfig={setRaceConfig}>
              {children}
            </RaceContextConsumer>
          </PitStopProvider>
        </TeamManagementProvider>
      </UIStateProvider>
    </RaceTimingProvider>
  );
};

export const useRaceContext = () => {
  const context = useContext(RaceContext);
  if (context === undefined) {
    throw new Error('useRaceContext must be used within a RaceProvider');
  }
  return context;
};

export { RaceContext };
