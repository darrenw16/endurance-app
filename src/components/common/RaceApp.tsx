import React from 'react';
import { useRaceContext } from '../../contexts';
import {
  RaceConfiguration,
  RaceHeader,
  TeamSelector,
  CurrentStintStatus,
  FCYAlert,
  StintSchedule,
  ModalContainer
} from '../';

export const RaceApp: React.FC = () => {
  const { 
    raceConfig, 
    setRaceConfig, 
    raceState, 
    teamState, 
    modals,
    dragAndDrop,
    actions 
  } = useRaceContext();

  const currentTeam = teamState.teamStates[teamState.selectedTeam];

  if (!raceState.raceStarted) {
    return (
      <RaceConfiguration
        raceConfig={raceConfig}
        setRaceConfig={setRaceConfig}
        onStartRace={actions.startRace}
      />
    );
  }

  return (
    <>
      {/* Header */}
      <RaceHeader
        raceConfig={raceConfig}
        raceStartTime={raceState.raceStartTime}
        currentTime={raceState.currentTime}
        racePaused={raceState.racePaused}
        pausedTime={raceState.pausedTime}
        fcyActive={raceState.fcyActive}
        onPauseRace={actions.pauseRace}
        onStopRace={actions.stopRace}
        onToggleFCY={actions.toggleFCY}
        onOpenRaceTimeModal={actions.openRaceTimeModal}
      />

      {/* Team Selection */}
      <TeamSelector
        raceConfig={raceConfig}
        selectedTeam={teamState.selectedTeam}
        onSelectTeam={teamState.setSelectedTeam}
        onExecutePit={actions.executePit}
      />

      {/* Current Stint Status */}
      {currentTeam && raceConfig.teams[teamState.selectedTeam] && (
        <CurrentStintStatus
          raceConfig={raceConfig}
          currentTeam={currentTeam}
          selectedTeam={teamState.selectedTeam}
          raceStartTime={raceState.raceStartTime}
          currentTime={raceState.currentTime}
          onOpenElapsedModal={actions.openElapsedModal}
          onOpenRemainingModal={actions.openRemainingModal}
          onOpenFuelRangeModal={actions.openFuelRangeModal}
        />
      )}

      {/* FCY Alert */}
      <FCYAlert
        fcyActive={raceState.fcyActive}
        currentTeam={teamState.teamStates[teamState.selectedTeam]}
        raceConfig={raceConfig}
        currentTime={raceState.currentTime}
        raceStartTime={raceState.raceStartTime}
        onExecutePit={() => actions.executePit()}
      />

      {/* Stint Schedule */}
      {currentTeam && (
        <StintSchedule
          currentTeam={currentTeam}
          selectedTeam={teamState.selectedTeam}
          raceConfig={raceConfig}
          teamStates={teamState.teamStates}
          dragOverIndex={dragAndDrop.dragOverIndex}
          onOpenStintTimeModal={actions.openStintTimeModal}
          onDriverDragStart={dragAndDrop.handleDriverDragStart}
          onDriverDragOver={dragAndDrop.handleDriverDragOver}
          onDriverDragEnter={dragAndDrop.handleDriverDragEnter}
          onDriverDragLeave={dragAndDrop.handleDriverDragLeave}
          onDriverDrop={dragAndDrop.handleDriverDrop}
        />
      )}

      {/* All Modals */}
      <ModalContainer
        // Pit Stop Modal
        showPitDialog={modals.showPitDialog}
        pitReason={modals.pitReason}
        setPitReason={modals.setPitReason}
        fuelTaken={modals.fuelTaken}
        setFuelTaken={modals.setFuelTaken}
        driverChanged={modals.driverChanged}
        setDriverChanged={modals.setDriverChanged}
        selectedDriverIndex={modals.selectedDriverIndex}
        setSelectedDriverIndex={modals.setSelectedDriverIndex}
        selectedTeam={teamState.selectedTeam}
        raceConfig={raceConfig}
        onClosePitDialog={() => modals.setShowPitDialog(false)}
        onConfirmPitStop={actions.confirmPitStop}

        // Time Edit Modals
        showElapsedModal={modals.showElapsedModal}
        showRemainingModal={modals.showRemainingModal}
        showRaceTimeModal={modals.showRaceTimeModal}
        tempTimeValue={modals.tempTimeValue}
        setTempTimeValue={modals.setTempTimeValue}
        onCloseModals={modals.cancelModal}
        onSaveElapsedTime={actions.saveElapsedTime}
        onSaveRemainingTime={actions.saveRemainingTime}
        onSaveRaceTime={actions.saveRaceTime}

        // Fuel Range Modal
        showFuelRangeModal={modals.showFuelRangeModal}
        tempFuelRangeValue={modals.tempFuelRangeValue}
        setTempFuelRangeValue={modals.setTempFuelRangeValue}
        onSaveFuelRange={actions.saveFuelRange}

        // Stint Time Modal
        showStintTimeModal={modals.showStintTimeModal}
        editingStint={modals.editingStint}
        onSaveStintTime={actions.saveStintTime}
      />
    </>
  );
};

export default RaceApp;
