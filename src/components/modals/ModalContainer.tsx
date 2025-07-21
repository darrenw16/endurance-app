import React from 'react';
import PitStopModal from './PitStopModal';
import TimeEditModal from './TimeEditModal';
import NumberEditModal from './NumberEditModal';
import StintTimeModal from './StintTimeModal';
import type { RaceConfig } from '../../types';

interface ModalContainerProps {
  // Pit Stop Modal
  showPitDialog: boolean;
  pitReason: 'scheduled' | 'fcyOpportunity' | 'unscheduled';
  setPitReason: React.Dispatch<React.SetStateAction<'scheduled' | 'fcyOpportunity' | 'unscheduled'>>;
  fuelTaken: boolean;
  setFuelTaken: (taken: boolean) => void;
  driverChanged: boolean;
  setDriverChanged: (changed: boolean) => void;
  selectedDriverIndex: number;
  setSelectedDriverIndex: (index: number) => void;
  selectedTeam: number;
  raceConfig: RaceConfig;
  onClosePitDialog: () => void;
  onConfirmPitStop: () => void;

  // Time Edit Modals
  showElapsedModal: boolean;
  showRemainingModal: boolean;
  showRaceTimeModal: boolean;
  tempTimeValue: string;
  setTempTimeValue: (value: string) => void;
  onCloseModals: () => void;
  onSaveElapsedTime: () => void;
  onSaveRemainingTime: () => void;
  onSaveRaceTime: () => void;

  // Fuel Range Modal
  showFuelRangeModal: boolean;
  tempFuelRangeValue: string;
  setTempFuelRangeValue: (value: string) => void;
  onSaveFuelRange: () => void;

  // Stint Time Modal
  showStintTimeModal: boolean;
  editingStint: {
    index: number | null;
    field: string | null;
    type: string | null;
  };
  onSaveStintTime: () => void;
}

const ModalContainer: React.FC<ModalContainerProps> = ({
  // Pit Stop Modal props
  showPitDialog,
  pitReason,
  setPitReason,
  fuelTaken,
  setFuelTaken,
  driverChanged,
  setDriverChanged,
  selectedDriverIndex,
  setSelectedDriverIndex,
  selectedTeam,
  raceConfig,
  onClosePitDialog,
  onConfirmPitStop,

  // Time Edit Modal props
  showElapsedModal,
  showRemainingModal,
  showRaceTimeModal,
  tempTimeValue,
  setTempTimeValue,
  onCloseModals,
  onSaveElapsedTime,
  onSaveRemainingTime,
  onSaveRaceTime,

  // Fuel Range Modal props
  showFuelRangeModal,
  tempFuelRangeValue,
  setTempFuelRangeValue,
  onSaveFuelRange,

  // Stint Time Modal props
  showStintTimeModal,
  editingStint,
  onSaveStintTime,
}) => {
  return (
    <>
      {/* Pit Stop Modal */}
      <PitStopModal
        isOpen={showPitDialog}
        onClose={onClosePitDialog}
        onConfirm={onConfirmPitStop}
        pitReason={pitReason}
        setPitReason={setPitReason}
        fuelTaken={fuelTaken}
        setFuelTaken={setFuelTaken}
        driverChanged={driverChanged}
        setDriverChanged={setDriverChanged}
        selectedDriverIndex={selectedDriverIndex}
        setSelectedDriverIndex={setSelectedDriverIndex}
        selectedTeam={selectedTeam}
        raceConfig={raceConfig}
      />

      {/* Elapsed Time Modal */}
      <TimeEditModal
        isOpen={showElapsedModal}
        onClose={onCloseModals}
        onSave={onSaveElapsedTime}
        title="Edit Stint Elapsed Time"
        label="Elapsed Time (HH:MM:SS)"
        placeholder="HH:MM:SS"
        value={tempTimeValue}
        onChange={setTempTimeValue}
        helpText="Adjust how much time has elapsed in the current stint"
        buttonText="Update Elapsed Time"
        buttonColor="green"
      />

      {/* Remaining Time Modal */}
      <TimeEditModal
        isOpen={showRemainingModal}
        onClose={onCloseModals}
        onSave={onSaveRemainingTime}
        title="Edit Stint Remaining Time"
        label="Remaining Time (HH:MM:SS)"
        placeholder="HH:MM:SS"
        value={tempTimeValue}
        onChange={setTempTimeValue}
        helpText="Adjust how much time remains in the current stint"
        buttonText="Update Remaining Time"
        buttonColor="orange"
      />

      {/* Race Time Modal */}
      <TimeEditModal
        isOpen={showRaceTimeModal}
        onClose={onCloseModals}
        onSave={onSaveRaceTime}
        title="Edit Race Time Remaining"
        label="Time Remaining (HH:MM:SS)"
        placeholder="HH:MM:SS"
        value={tempTimeValue}
        onChange={setTempTimeValue}
        helpText="Adjust to match official race timing system"
        buttonText="Update Race Time"
        buttonColor="blue"
      />

      {/* Fuel Range Modal */}
      <NumberEditModal
        isOpen={showFuelRangeModal}
        onClose={onCloseModals}
        onSave={onSaveFuelRange}
        title="Edit Max Fuel Range"
        label="Fuel Range (minutes)"
        placeholder="108"
        value={tempFuelRangeValue}
        onChange={setTempFuelRangeValue}
        min={30}
        max={300}
        helpText="Maximum stint length in minutes (30-300). This will recalculate all stint plans."
        buttonText="Update Fuel Range"
        buttonColor="purple"
      />

      {/* Stint Time Modal */}
      <StintTimeModal
        isOpen={showStintTimeModal}
        onClose={onCloseModals}
        onSave={onSaveStintTime}
        stintIndex={editingStint.index}
        field={editingStint.field}
        type={editingStint.type}
        value={tempTimeValue}
        onChange={setTempTimeValue}
      />
    </>
  );
};

export default ModalContainer;
