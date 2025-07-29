import React, { createContext, useContext, type ReactNode } from 'react';
import { useModals } from '../../hooks';
import type { EditingStint } from '../../types';

/**
 * Context for UI state management
 * Handles modals, temporary values, and UI interaction states
 */
interface UIStateContextType {
  // Modal States
  modals: {
    showElapsedModal: boolean;
    showRemainingModal: boolean;
    showRaceTimeModal: boolean;
    showFuelRangeModal: boolean;
    showStintTimeModal: boolean;
    showPitDialog: boolean;
  };
  
  // Temporary Values
  tempValues: {
    tempTimeValue: string;
    tempFuelRangeValue: string;
    editingStint: EditingStint;
  };
  
  // Modal Actions
  actions: {
    // Generic actions
    cancelModal: () => void;
    
    // Time modals
    openElapsedModal: (currentValue: string) => void;
    openRemainingModal: (currentValue: string) => void;
    openRaceTimeModal: (currentValue: string) => void;
    
    // Configuration modals
    openFuelRangeModal: (currentValue: string) => void;
    
    // Stint modals
    openStintTimeModal: (stintIndex: number, field: string, type: string, currentValue: string) => void;
    getStintTimeModalTitle: () => string;
    
    // Pit dialog
    openPitDialog: (fcyActive: boolean, nextDriverIndex: number) => void;
  };
  
  // Value Setters
  setters: {
    setTempTimeValue: (value: string) => void;
    setTempFuelRangeValue: (value: string) => void;
    setEditingStint: (stint: EditingStint) => void;
    
    // Direct modal control
    setShowElapsedModal: (show: boolean) => void;
    setShowRemainingModal: (show: boolean) => void;
    setShowRaceTimeModal: (show: boolean) => void;
    setShowFuelRangeModal: (show: boolean) => void;
    setShowStintTimeModal: (show: boolean) => void;
    setShowPitDialog: (show: boolean) => void;
  };
  
  // UI Helper Functions
  helpers: {
    isAnyModalOpen: () => boolean;
    getOpenModalName: () => string | null;
    hasUnsavedChanges: () => boolean;
  };
}

const UIStateContext = createContext<UIStateContextType | undefined>(undefined);

interface UIStateProviderProps {
  children: ReactNode;
}

export const UIStateProvider: React.FC<UIStateProviderProps> = ({ children }) => {
  const modals = useModals();

  // UI Helper Functions
  const helpers = {
    isAnyModalOpen: (): boolean => {
      return modals.showElapsedModal ||
             modals.showRemainingModal ||
             modals.showRaceTimeModal ||
             modals.showFuelRangeModal ||
             modals.showStintTimeModal ||
             modals.showPitDialog;
    },

    getOpenModalName: (): string | null => {
      if (modals.showElapsedModal) return 'elapsed';
      if (modals.showRemainingModal) return 'remaining';
      if (modals.showRaceTimeModal) return 'raceTime';
      if (modals.showFuelRangeModal) return 'fuelRange';
      if (modals.showStintTimeModal) return 'stintTime';
      if (modals.showPitDialog) return 'pitDialog';
      return null;
    },

    hasUnsavedChanges: (): boolean => {
      return !!(modals.tempTimeValue || modals.tempFuelRangeValue);
    }
  };

  const contextValue: UIStateContextType = {
    // Modal States
    modals: {
      showElapsedModal: modals.showElapsedModal,
      showRemainingModal: modals.showRemainingModal,
      showRaceTimeModal: modals.showRaceTimeModal,
      showFuelRangeModal: modals.showFuelRangeModal,
      showStintTimeModal: modals.showStintTimeModal,
      showPitDialog: modals.showPitDialog
    },
    
    // Temporary Values
    tempValues: {
      tempTimeValue: modals.tempTimeValue,
      tempFuelRangeValue: modals.tempFuelRangeValue,
      editingStint: modals.editingStint
    },
    
    // Modal Actions
    actions: {
      cancelModal: modals.cancelModal,
      openElapsedModal: modals.openElapsedModal,
      openRemainingModal: modals.openRemainingModal,
      openRaceTimeModal: modals.openRaceTimeModal,
      openFuelRangeModal: modals.openFuelRangeModal,
      openStintTimeModal: modals.openStintTimeModal,
      getStintTimeModalTitle: modals.getStintTimeModalTitle,
      openPitDialog: modals.openPitDialog
    },
    
    // Value Setters
    setters: {
      setTempTimeValue: modals.setTempTimeValue,
      setTempFuelRangeValue: modals.setTempFuelRangeValue,
      setEditingStint: modals.setEditingStint,
      setShowElapsedModal: modals.setShowElapsedModal,
      setShowRemainingModal: modals.setShowRemainingModal,
      setShowRaceTimeModal: modals.setShowRaceTimeModal,
      setShowFuelRangeModal: modals.setShowFuelRangeModal,
      setShowStintTimeModal: modals.setShowStintTimeModal,
      setShowPitDialog: modals.setShowPitDialog
    },
    
    // UI Helper Functions
    helpers
  };

  return (
    <UIStateContext.Provider value={contextValue}>
      {children}
    </UIStateContext.Provider>
  );
};

export const useUIState = () => {
  const context = useContext(UIStateContext);
  if (context === undefined) {
    throw new Error('useUIState must be used within a UIStateProvider');
  }
  return context;
};

export { UIStateContext };
