import { useState } from 'react';
import type { EditingStint } from '../types';

/**
 * Custom hook for managing modal states and temporary values
 */
export const useModals = () => {
  // Modal states
  const [showElapsedModal, setShowElapsedModal] = useState(false);
  const [showRemainingModal, setShowRemainingModal] = useState(false);
  const [showRaceTimeModal, setShowRaceTimeModal] = useState(false);
  const [showFuelRangeModal, setShowFuelRangeModal] = useState(false);
  const [showStintTimeModal, setShowStintTimeModal] = useState(false);
  const [showPitDialog, setShowPitDialog] = useState(false);

  // Temporary values for editing
  const [tempTimeValue, setTempTimeValue] = useState('');
  const [tempFuelRangeValue, setTempFuelRangeValue] = useState('');
  const [editingStint, setEditingStint] = useState<EditingStint>({ index: null, field: null, type: null });

  // Pit stop modal states
  const [pitReason, setPitReason] = useState<'scheduled' | 'fcyOpportunity' | 'unscheduled'>('scheduled');
  const [fuelTaken, setFuelTaken] = useState(true);
  const [driverChanged, setDriverChanged] = useState(true);
  const [selectedDriverIndex, setSelectedDriverIndex] = useState(0);

  // Generic cancel function that resets all modal states
  const cancelModal = () => {
    setShowElapsedModal(false);
    setShowRemainingModal(false);
    setShowRaceTimeModal(false);
    setShowFuelRangeModal(false);
    setShowStintTimeModal(false);
    setShowPitDialog(false);
    setTempTimeValue('');
    setTempFuelRangeValue('');
    setEditingStint({ index: null, field: null, type: null });
  };

  // Open elapsed time modal
  const openElapsedModal = (currentValue: string) => {
    setTempTimeValue(currentValue);
    setShowElapsedModal(true);
  };

  // Open remaining time modal
  const openRemainingModal = (currentValue: string) => {
    setTempTimeValue(currentValue);
    setShowRemainingModal(true);
  };

  // Open race time modal
  const openRaceTimeModal = (currentValue: string) => {
    setTempTimeValue(currentValue);
    setShowRaceTimeModal(true);
  };

  // Open fuel range modal
  const openFuelRangeModal = (currentValue: string) => {
    setTempFuelRangeValue(currentValue);
    setShowFuelRangeModal(true);
  };

  // Open stint time modal
  const openStintTimeModal = (stintIndex: number, field: string, type: string, currentValue: string) => {
    setTempTimeValue(currentValue);
    setEditingStint({ index: stintIndex, field, type });
    setShowStintTimeModal(true);
  };

  // Open pit dialog
  const openPitDialog = (fcyActive: boolean, nextDriverIndex: number) => {
    setShowPitDialog(true);
    setPitReason(fcyActive ? 'fcyOpportunity' : 'scheduled');
    setFuelTaken(true);
    setDriverChanged(true);
    setSelectedDriverIndex(nextDriverIndex);
  };

  // Get stint time modal title
  const getStintTimeModalTitle = () => {
    if (!editingStint.field || !editingStint.type) return 'Edit Time';
    
    const fieldName = editingStint.field === 'start' ? 'Start' : 'Finish';
    const typeName = editingStint.type === 'planned' ? 'Planned' : 'Actual';
    
    return `Edit ${typeName} ${fieldName} Time`;
  };

  return {
    // Modal visibility states
    showElapsedModal,
    showRemainingModal,
    showRaceTimeModal,
    showFuelRangeModal,
    showStintTimeModal,
    showPitDialog,

    // Temporary values
    tempTimeValue,
    tempFuelRangeValue,
    editingStint,

    // Pit stop states
    pitReason,
    fuelTaken,
    driverChanged,
    selectedDriverIndex,

    // Setters
    setTempTimeValue,
    setTempFuelRangeValue,
    setEditingStint,
    setPitReason,
    setFuelTaken,
    setDriverChanged,
    setSelectedDriverIndex,

    // Actions
    cancelModal,
    openElapsedModal,
    openRemainingModal,
    openRaceTimeModal,
    openFuelRangeModal,
    openStintTimeModal,
    openPitDialog,
    getStintTimeModalTitle,

    // Direct modal setters (for cases where we need direct control)
    setShowElapsedModal,
    setShowRemainingModal,
    setShowRaceTimeModal,
    setShowFuelRangeModal,
    setShowStintTimeModal,
    setShowPitDialog,
  };
};
