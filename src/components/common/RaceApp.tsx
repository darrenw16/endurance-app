import React from 'react';
import { useRaceTiming, useTeamManagement, usePitStopContext, useUIState } from '../../contexts/split';
import { Activity } from 'lucide-react';
import {
  RaceConfiguration,
  RaceHeader,
  TeamSelector,
  CurrentStintStatus,
  FCYAlert,
  StintSchedule,
  ModalContainer
} from '../';
import type { RaceConfig } from '../../types';

interface RaceAppProps {
  raceConfig: RaceConfig;
  setRaceConfig: React.Dispatch<React.SetStateAction<RaceConfig>>;
}

/**
 * Main RaceApp component using optimized split contexts
 * Each context subscription is optimized to only re-render when relevant data changes
 */
export const RaceApp: React.FC<RaceAppProps> = ({ raceConfig, setRaceConfig }) => {
  // Use split contexts instead of monolithic context
  const raceTiming = useRaceTiming();
  const teamManagement = useTeamManagement();
  const pitStop = usePitStopContext();
  const uiState = useUIState();

  const currentTeam = teamManagement.teamStates[teamManagement.selectedTeam];

  // Race actions using split contexts
  const handleStartRace = () => {
    const startTime = raceTiming.startRace();
    teamManagement.initializeRaceStart(startTime);
  };

  const handlePauseRace = () => {
    const result = raceTiming.pauseRace();
    if (result.resumed && result.pauseDuration > 0) {
      teamManagement.handleRacePauseResume(result.pauseDuration);
    }
  };

  const handleStopRace = () => {
    raceTiming.stopRace();
    teamManagement.resetTeamStates();
  };

  const handleExecutePit = (teamIndex = teamManagement.selectedTeam) => {
    // Validation logic
    if (teamIndex < 0 || teamIndex >= teamManagement.teamStates.length) {
      console.error(`Invalid team index: ${teamIndex}`);
      return;
    }
    
    const currentTeamForPit = teamManagement.teamStates[teamIndex];
    if (!currentTeamForPit) {
      console.error(`No team state found for index: ${teamIndex}`);
      return;
    }
    
    const teamConfig = raceConfig.teams[teamIndex];
    if (!teamConfig) {
      console.error(`No team config found for index: ${teamIndex}`);
      return;
    }
    
    teamManagement.setSelectedTeam(teamIndex);
    
    // Set default next driver
    const currentDriverIndex = currentTeamForPit.currentDriver || 0;
    const driversArray = teamConfig.drivers || [];
    const nextDriverIndex = driversArray.length > 0 
      ? (currentDriverIndex + 1) % driversArray.length 
      : 0;
    
    pitStop.setSelectedDriverIndex(nextDriverIndex);
    pitStop.setPitReason(raceTiming.fcyActive ? 'fcyOpportunity' : 'scheduled');
    uiState.setters.setShowPitDialog(true);
  };

  const handleConfirmPitStop = () => {
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
    
    // Recalculate stint plans for fuel-taking unscheduled stops
    if (pitStop.fuelTaken && pitStop.pitReason === 'unscheduled') {
      setTimeout(() => {
        teamManagement.stintCalculations.recalculateTeamStintPlan(teamManagement.selectedTeam);
      }, 100);
    }
    
    uiState.setters.setShowPitDialog(false);
    
    // Handle FCY state
    if (fcyWasActive) {
      raceTiming.fcyStrategy.toggleFCY();
    }
  };

  // Handle fuel range changes during configuration
  const handleFuelRangeChange = () => {
    // Trigger recalculation of stint plans if race has started
    if (raceTiming.raceStarted) {
      teamManagement.stintCalculations.recalculateAllStintPlans();
    }
  };

  // Show configuration screen if race hasn't started
  if (!raceTiming.raceStarted) {
    return (
      <RaceConfiguration
        raceConfig={raceConfig}
        setRaceConfig={setRaceConfig}
        onStartRace={handleStartRace}
        onFuelRangeChange={handleFuelRangeChange}
      />
    );
  }

  return (
    <>
      {/* Header - optimized to only use timing data */}
      <OptimizedRaceHeader
        raceConfig={raceConfig}
        onPauseRace={handlePauseRace}
        onStopRace={handleStopRace}
      />

      {/* Team Selection - optimized for team management */}
      <OptimizedTeamSelector
        raceConfig={raceConfig}
        onExecutePit={handleExecutePit}
      />

      {/* Current Stint Status - uses multiple contexts efficiently */}
      {currentTeam && raceConfig.teams[teamManagement.selectedTeam] && (
        <OptimizedCurrentStintStatus
          raceConfig={raceConfig}
          selectedTeam={teamManagement.selectedTeam}
        />
      )}

      {/* FCY Alert - optimized for FCY and pit strategy */}
      <OptimizedFCYAlert
        raceConfig={raceConfig}
        onExecutePit={() => handleExecutePit()}
      />

      {/* Performance Indicator - Development Only */}
      {process.env.NODE_ENV === 'development' && (
        <PerformanceIndicator />
      )}

      {/* Stint Schedule - optimized for team and drag operations */}
      {currentTeam && (
        <OptimizedStintSchedule
          raceConfig={raceConfig}
        />
      )}

      {/* All Modals - uses UI state context */}
      <OptimizedModalContainer
        raceConfig={raceConfig}
        onConfirmPitStop={handleConfirmPitStop}
        setRaceConfig={setRaceConfig}
      />
    </>
  );
};

/**
 * Optimized Race Header using only timing context
 */
const OptimizedRaceHeader: React.FC<{
  raceConfig: RaceConfig;
  onPauseRace: () => void;
  onStopRace: () => void;
}> = ({ raceConfig, onPauseRace, onStopRace }) => {
  const raceTiming = useRaceTiming();
  const uiState = useUIState();

  const handleOpenRaceTimeModal = () => {
    const remainingTime = raceTiming.timing.getRemainingRaceTime();
    const formattedTime = `${Math.floor(remainingTime / 60)}:${String(Math.floor(remainingTime % 60)).padStart(2, '0')}:00`;
    uiState.actions.openRaceTimeModal(formattedTime);
  };

  return (
    <RaceHeader
      raceConfig={raceConfig}
      raceStartTime={raceTiming.raceStartTime}
      currentTime={raceTiming.currentTime}
      racePaused={raceTiming.racePaused}
      pausedTime={raceTiming.pausedTime}
      fcyActive={raceTiming.fcyActive}
      onPauseRace={onPauseRace}
      onStopRace={onStopRace}
      onToggleFCY={raceTiming.fcyStrategy.toggleFCY}
      onOpenRaceTimeModal={handleOpenRaceTimeModal}
    />
  );
};

/**
 * Optimized Team Selector using team management context
 */
const OptimizedTeamSelector: React.FC<{
  raceConfig: RaceConfig;
  onExecutePit: (teamIndex?: number) => void;
}> = ({ raceConfig, onExecutePit }) => {
  const teamManagement = useTeamManagement();

  return (
    <TeamSelector
      raceConfig={raceConfig}
      selectedTeam={teamManagement.selectedTeam}
      onSelectTeam={teamManagement.setSelectedTeam}
      onExecutePit={onExecutePit}
    />
  );
};

/**
 * Optimized Current Stint Status using multiple contexts efficiently
 */
const OptimizedCurrentStintStatus: React.FC<{
  raceConfig: RaceConfig;
  selectedTeam: number;
}> = ({ raceConfig, selectedTeam }) => {
  const raceTiming = useRaceTiming();
  const teamManagement = useTeamManagement();
  const uiState = useUIState();

  const currentTeam = teamManagement.teamStates[selectedTeam];

  const handleOpenElapsedModal = () => {
    if (!currentTeam?.stintStartTime) return;
    const elapsed = (raceTiming.currentTime.getTime() - currentTeam.stintStartTime.getTime()) / 60000;
    const formattedTime = `${Math.floor(elapsed / 60)}:${String(Math.floor(elapsed % 60)).padStart(2, '0')}:00`;
    uiState.actions.openElapsedModal(formattedTime);
  };

  const handleOpenRemainingModal = () => {
    if (!currentTeam?.stintStartTime) return;
    const currentStint = currentTeam.stints[currentTeam.currentStint - 1];
    const elapsed = (raceTiming.currentTime.getTime() - currentTeam.stintStartTime.getTime()) / 60000;
    const remaining = Math.max(0, (currentStint?.plannedLength || 0) - elapsed);
    const formattedTime = `${Math.floor(remaining / 60)}:${String(Math.floor(remaining % 60)).padStart(2, '0')}:00`;
    uiState.actions.openRemainingModal(formattedTime);
  };

  const handleOpenFuelRangeModal = () => {
    uiState.actions.openFuelRangeModal(raceConfig.fuelRangeMinutes.toString());
  };

  if (!currentTeam) return null;

  return (
    <CurrentStintStatus
      raceConfig={raceConfig}
      currentTeam={currentTeam}
      selectedTeam={selectedTeam}
      raceStartTime={raceTiming.raceStartTime}
      currentTime={raceTiming.currentTime}
      onOpenElapsedModal={handleOpenElapsedModal}
      onOpenRemainingModal={handleOpenRemainingModal}
      onOpenFuelRangeModal={handleOpenFuelRangeModal}
    />
  );
};

/**
 * Optimized FCY Alert using timing and pit strategy
 */
const OptimizedFCYAlert: React.FC<{
  raceConfig: RaceConfig;
  onExecutePit: () => void;
}> = ({ raceConfig, onExecutePit }) => {
  const raceTiming = useRaceTiming();
  const teamManagement = useTeamManagement();

  const currentTeam = teamManagement.teamStates[teamManagement.selectedTeam];

  return (
    <FCYAlert
      fcyActive={raceTiming.fcyActive}
      currentTeam={currentTeam}
      raceConfig={raceConfig}
      currentTime={raceTiming.currentTime}
      raceStartTime={raceTiming.raceStartTime}
      onExecutePit={onExecutePit}
    />
  );
};

/**
 * Optimized Stint Schedule using team management and drag & drop
 */
const OptimizedStintSchedule: React.FC<{
  raceConfig: RaceConfig;
}> = ({ raceConfig }) => {
  const teamManagement = useTeamManagement();
  const uiState = useUIState();

  const currentTeam = teamManagement.teamStates[teamManagement.selectedTeam];

  const handleOpenStintTimeModal = (stintIndex: number, field: string, type: string) => {
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

  if (!currentTeam) return null;

  return (
    <StintSchedule
      currentTeam={currentTeam}
      selectedTeam={teamManagement.selectedTeam}
      raceConfig={raceConfig}
      teamStates={teamManagement.teamStates}
      dragOverIndex={teamManagement.dragAndDrop.dragOverIndex}
      onOpenStintTimeModal={handleOpenStintTimeModal}
      onDriverDragStart={teamManagement.dragAndDrop.handleDriverDragStart}
      onDriverDragOver={teamManagement.dragAndDrop.handleDriverDragOver}
      onDriverDragEnter={teamManagement.dragAndDrop.handleDriverDragEnter}
      onDriverDragLeave={teamManagement.dragAndDrop.handleDriverDragLeave}
      onDriverDrop={teamManagement.dragAndDrop.handleDriverDrop}
    />
  );
};

/**
 * Optimized Modal Container using UI state context
 */
const OptimizedModalContainer: React.FC<{
  raceConfig: RaceConfig;
  onConfirmPitStop: () => void;
  setRaceConfig: React.Dispatch<React.SetStateAction<RaceConfig>>;
}> = ({ raceConfig, onConfirmPitStop, setRaceConfig }) => {
  const raceTiming = useRaceTiming();
  const teamManagement = useTeamManagement();
  const pitStop = usePitStopContext();
  const uiState = useUIState();

  // Time modal save handlers
  const handleSaveElapsedTime = () => {
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

  const handleSaveRemainingTime = () => {
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

  const handleSaveRaceTime = () => {
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

  const handleSaveFuelRange = () => {
    const newFuelRange = parseInt(uiState.tempValues.tempFuelRangeValue);
    
    if (!newFuelRange || newFuelRange < 30 || newFuelRange > 300) {
      alert('Please enter a valid fuel range between 30 and 300 minutes');
      return;
    }

    // Early exit if fuel range hasn't actually changed
    if (newFuelRange === raceConfig.fuelRangeMinutes) {
      uiState.setters.setShowFuelRangeModal(false);
      uiState.setters.setTempFuelRangeValue('');
      return;
    }

    // Update race config
    setRaceConfig(prev => ({
      ...prev,
      fuelRangeMinutes: newFuelRange
    }));

    // Trigger recalculation if race is active
    if (raceTiming.raceStarted) {
      teamManagement.stintCalculations.recalculateAllStintPlans(newFuelRange);
    }

    uiState.setters.setShowFuelRangeModal(false);
    uiState.setters.setTempFuelRangeValue('');
  };

  const handleSaveStintTime = () => {
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

  return (
    <ModalContainer
      // Pit Stop Modal
      showPitDialog={uiState.modals.showPitDialog}
      pitReason={pitStop.pitReason}
      setPitReason={pitStop.setPitReason}
      fuelTaken={pitStop.fuelTaken}
      setFuelTaken={pitStop.setFuelTaken}
      driverChanged={pitStop.driverChanged}
      setDriverChanged={pitStop.setDriverChanged}
      selectedDriverIndex={pitStop.selectedDriverIndex}
      setSelectedDriverIndex={pitStop.setSelectedDriverIndex}
      selectedTeam={teamManagement.selectedTeam}
      raceConfig={raceConfig}
      onClosePitDialog={() => uiState.setters.setShowPitDialog(false)}
      onConfirmPitStop={onConfirmPitStop}

      // Time Edit Modals
      showElapsedModal={uiState.modals.showElapsedModal}
      showRemainingModal={uiState.modals.showRemainingModal}
      showRaceTimeModal={uiState.modals.showRaceTimeModal}
      tempTimeValue={uiState.tempValues.tempTimeValue}
      setTempTimeValue={uiState.setters.setTempTimeValue}
      onCloseModals={uiState.actions.cancelModal}
      onSaveElapsedTime={handleSaveElapsedTime}
      onSaveRemainingTime={handleSaveRemainingTime}
      onSaveRaceTime={handleSaveRaceTime}

      // Fuel Range Modal
      showFuelRangeModal={uiState.modals.showFuelRangeModal}
      tempFuelRangeValue={uiState.tempValues.tempFuelRangeValue}
      setTempFuelRangeValue={uiState.setters.setTempFuelRangeValue}
      onSaveFuelRange={handleSaveFuelRange}

      // Stint Time Modal
      showStintTimeModal={uiState.modals.showStintTimeModal}
      editingStint={uiState.tempValues.editingStint}
      onSaveStintTime={handleSaveStintTime}
    />
  );
};

/**
 * Performance indicator component - shows optimized status
 */
const PerformanceIndicator: React.FC = () => {
  return (
    <div className="fixed bottom-4 right-4 z-40">
      <div className="bg-green-800 border border-green-600 rounded-lg p-3 shadow-lg">
        <div className="flex items-center gap-2 text-sm text-green-100">
          <Activity className="h-4 w-4 text-green-400" />
          <span>Optimized Performance</span>
        </div>
        <div className="text-xs text-green-200 mt-1">
          Split context architecture ✨
        </div>
      </div>
    </div>
  );
};

// Helper functions
const parseTimeToMinutes = (timeStr: string): number => {
  const [hours, minutes, seconds] = timeStr.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0) + (seconds || 0) / 60;
};

const createTimeForToday = (timeStr: string): Date | null => {
  try {
    const [hours, minutes, seconds] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours || 0, minutes || 0, seconds || 0, 0);
    return date;
  } catch {
    return null;
  }
};

export default RaceApp;
