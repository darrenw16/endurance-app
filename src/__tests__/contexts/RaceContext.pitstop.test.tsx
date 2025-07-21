import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RaceProvider, useRaceContext } from '../../contexts/RaceContext';

// Mock the hooks
jest.mock('../../hooks', () => ({
  useRaceState: jest.fn(),
  useTeamState: jest.fn(),
  useModals: jest.fn(),
  useDragAndDrop: jest.fn(),
  usePitStop: jest.fn(),
}));

// Mock the utility functions
jest.mock('../../utils/timeFormatting', () => ({
  formatDurationToHMS: jest.fn((mins) => `${Math.floor(mins/60)}:${mins%60}:00`),
  parseTimeToMinutes: jest.fn((str) => {
    const parts = str.split(':');
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
  }),
  createTimeForToday: jest.fn((str) => new Date(`2024-01-01T${str}`)),
  getElapsedTime: jest.fn((start, current) => (current - start) / 60000),
  getRemainingTime: jest.fn((start, planned, current) => Math.max(0, planned - (current - start) / 60000)),
  formatRaceTime: jest.fn((mins) => `${Math.floor(mins/60)}:${mins%60}`),
  getRemainingRaceTime: jest.fn(() => 1200), // 20 hours
}));

const { useRaceState, useTeamState, useModals, useDragAndDrop, usePitStop } = require('../../hooks');

// Test component to access context
const TestComponent = ({ onContextReady }) => {
  const context = useRaceContext();
  
  React.useEffect(() => {
    onContextReady(context);
  }, [context, onContextReady]);
  
  return (
    <div>
      <div data-testid="race-started">{context.raceState.raceStarted.toString()}</div>
      <div data-testid="race-paused">{context.raceState.racePaused.toString()}</div>
      <div data-testid="fcy-active">{context.raceState.fcyActive.toString()}</div>
      <div data-testid="pit-dialog">{context.modals.showPitDialog.toString()}</div>
      <button 
        data-testid="pit-button" 
        onClick={() => context.actions.executePit()}
      >
        Pit
      </button>
      <button 
        data-testid="confirm-pit-button" 
        onClick={() => context.actions.confirmPitStop()}
      >
        Confirm Pit
      </button>
    </div>
  );
};

describe('RaceContext - Pit Stop Race State Tests', () => {
  let mockRaceState, mockTeamState, mockModals, mockDragAndDrop, mockPitStop;
  let contextRef = { current: null };
  
  const mockRaceConfig = {
    track: 'Test Track',
    raceLengthHours: 24,
    fuelRangeMinutes: 108,
    minPitTimeSeconds: 170,
    numTeams: 1,
    teams: [{
      number: '1',
      name: 'Test Team',
      drivers: ['Driver 1', 'Driver 2'],
      driverAssignments: []
    }]
  };
  
  const mockSetRaceConfig = jest.fn();
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    contextRef.current = null;
    
    // Mock race state
    mockRaceState = {
      raceStarted: true,
      racePaused: false,
      raceStartTime: new Date('2024-01-01T10:00:00'),
      pausedTime: 0,
      currentTime: new Date('2024-01-01T11:00:00'),
      fcyActive: false,
      startRace: jest.fn(() => new Date()),
      pauseRace: jest.fn(() => ({ resumed: false, pauseDuration: 0 })),
      stopRace: jest.fn(),
      toggleFCY: jest.fn(),
      updateRaceStartTime: jest.fn(),
    };
    
    // Mock team state
    mockTeamState = {
      teamStates: [{
        currentStint: 1,
        stintStartTime: new Date('2024-01-01T10:00:00'),
        currentDriver: 0,
        stints: [{
          stintNumber: 1,
          plannedLength: 120,
          status: 'active'
        }],
        lastPitTime: null,
        position: 1
      }],
      selectedTeam: 0,
      setSelectedTeam: jest.fn(),
      setTeamStates: jest.fn(),
      initializeRaceStart: jest.fn(),
      resetTeamStates: jest.fn(),
      handleRacePauseResume: jest.fn(),
      updateTeamState: jest.fn(),
      recalculateAllStintPlans: jest.fn(),
      recalculateTeamStintPlan: jest.fn(),
    };
    
    // Mock modals
    mockModals = {
      showPitDialog: false,
      pitReason: 'scheduled',
      setPitReason: jest.fn(),
      fuelTaken: true,
      setFuelTaken: jest.fn(),
      driverChanged: false,
      setDriverChanged: jest.fn(),
      selectedDriverIndex: 1,
      setSelectedDriverIndex: jest.fn(),
      setShowPitDialog: jest.fn(),
      showElapsedModal: false,
      showRemainingModal: false,
      showRaceTimeModal: false,
      tempTimeValue: '',
      setTempTimeValue: jest.fn(),
      showFuelRangeModal: false,
      tempFuelRangeValue: '',
      setTempFuelRangeValue: jest.fn(),
      showStintTimeModal: false,
      editingStint: { index: null, field: null, type: null },
      setEditingStint: jest.fn(),
      openPitDialog: jest.fn(),
      openElapsedModal: jest.fn(),
      openRemainingModal: jest.fn(),
      openRaceTimeModal: jest.fn(),
      openFuelRangeModal: jest.fn(),
      openStintTimeModal: jest.fn(),
      cancelModal: jest.fn(),
    };
    
    // Mock drag and drop
    mockDragAndDrop = {
      dragOverIndex: null,
      handleDriverDragStart: jest.fn(),
      handleDriverDragOver: jest.fn(),
      handleDriverDragEnter: jest.fn(),
      handleDriverDragLeave: jest.fn(),
      handleDriverDrop: jest.fn(),
    };
    
    // Mock pit stop
    mockPitStop = {
      executePitStop: jest.fn(),
    };
    
    // Setup hook mocks
    useRaceState.mockReturnValue(mockRaceState);
    useTeamState.mockReturnValue(mockTeamState);
    useModals.mockReturnValue(mockModals);
    useDragAndDrop.mockReturnValue(mockDragAndDrop);
    usePitStop.mockReturnValue(mockPitStop);
  });
  
  const renderWithContext = () => {
    return render(
      <RaceProvider raceConfig={mockRaceConfig} setRaceConfig={mockSetRaceConfig}>
        <TestComponent onContextReady={(context) => { contextRef.current = context; }} />
      </RaceProvider>
    );
  };

  describe('Pit Stop without FCY', () => {
    test('should NOT activate FCY when doing a pit stop during normal racing', async () => {
      // Ensure FCY is initially off
      mockRaceState.fcyActive = false;
      
      renderWithContext();
      
      // Verify initial state
      expect(screen.getByTestId('fcy-active')).toHaveTextContent('false');
      expect(screen.getByTestId('race-started')).toHaveTextContent('true');
      expect(screen.getByTestId('race-paused')).toHaveTextContent('false');
      
      // Simulate pit stop
      await waitFor(() => {
        contextRef.current.actions.confirmPitStop();
      });
      
      // Verify FCY was NOT activated
      expect(mockRaceState.toggleFCY).not.toHaveBeenCalled();
      
      // Verify pit stop was executed
      expect(mockPitStop.executePitStop).toHaveBeenCalledWith({
        selectedTeam: 0,
        pitReason: 'scheduled',
        fuelTaken: true,
        driverChanged: false,
        selectedDriverIndex: 1,
        raceConfig: mockRaceConfig,
        teamStates: mockTeamState.teamStates,
        currentTime: mockRaceState.currentTime,
        setTeamStates: mockTeamState.setTeamStates
      });
      
      // Verify modal was closed
      expect(mockModals.setShowPitDialog).toHaveBeenCalledWith(false);
    });
    
    test('should NOT pause the race when doing a pit stop', async () => {
      renderWithContext();
      
      // Verify race is running
      expect(screen.getByTestId('race-paused')).toHaveTextContent('false');
      
      // Execute pit stop
      await waitFor(() => {
        contextRef.current.actions.confirmPitStop();
      });
      
      // Verify race is still running
      expect(mockRaceState.pauseRace).not.toHaveBeenCalled();
      expect(screen.getByTestId('race-paused')).toHaveTextContent('false');
    });
    
    test('should NOT stop the race when doing a pit stop', async () => {
      renderWithContext();
      
      // Verify race is started
      expect(screen.getByTestId('race-started')).toHaveTextContent('true');
      
      // Execute pit stop
      await waitFor(() => {
        contextRef.current.actions.confirmPitStop();
      });
      
      // Verify race is still running
      expect(mockRaceState.stopRace).not.toHaveBeenCalled();
      expect(screen.getByTestId('race-started')).toHaveTextContent('true');
    });
  });
  
  describe('Pit Stop during FCY', () => {
    test('should turn OFF FCY when doing a pit stop during FCY period', async () => {
      // Set FCY as initially active
      mockRaceState.fcyActive = true;
      
      renderWithContext();
      
      // Verify FCY is initially active
      expect(screen.getByTestId('fcy-active')).toHaveTextContent('true');
      
      // Execute pit stop during FCY
      await waitFor(() => {
        contextRef.current.actions.confirmPitStop();
      });
      
      // Verify FCY was turned off after pit stop
      expect(mockRaceState.toggleFCY).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('Race State Preservation', () => {
    test('should preserve all race state during pit stop execution', async () => {
      const initialRaceState = {
        raceStarted: true,
        racePaused: false,
        raceStartTime: new Date('2024-01-01T10:00:00'),
        fcyActive: false
      };
      
      // Set initial state
      Object.assign(mockRaceState, initialRaceState);
      
      renderWithContext();
      
      // Execute pit stop
      await waitFor(() => {
        contextRef.current.actions.confirmPitStop();
      });
      
      // Verify race state is preserved
      expect(screen.getByTestId('race-started')).toHaveTextContent('true');
      expect(screen.getByTestId('race-paused')).toHaveTextContent('false');
      expect(screen.getByTestId('fcy-active')).toHaveTextContent('false');
      
      // Verify no unintended race state changes
      expect(mockRaceState.startRace).not.toHaveBeenCalled();
      expect(mockRaceState.pauseRace).not.toHaveBeenCalled();
      expect(mockRaceState.stopRace).not.toHaveBeenCalled();
      expect(mockRaceState.updateRaceStartTime).not.toHaveBeenCalled();
    });
    
    test('should only affect team state, not race timing', async () => {
      renderWithContext();
      
      const initialCurrentTime = mockRaceState.currentTime;
      const initialStartTime = mockRaceState.raceStartTime;
      
      // Execute pit stop
      await waitFor(() => {
        contextRef.current.actions.confirmPitStop();
      });
      
      // Verify race timing is unchanged
      expect(mockRaceState.currentTime).toBe(initialCurrentTime);
      expect(mockRaceState.raceStartTime).toBe(initialStartTime);
      
      // Verify team state functions were called (pit stop affects team, not race)
      expect(mockPitStop.executePitStop).toHaveBeenCalled();
    });
  });
  
  describe('Unscheduled Pit Stops', () => {
    test('should recalculate stint plan for unscheduled fuel stops', async () => {
      // Set up unscheduled fuel stop
      mockModals.pitReason = 'unscheduled';
      mockModals.fuelTaken = true;
      
      renderWithContext();
      
      // Execute unscheduled pit stop
      await waitFor(() => {
        contextRef.current.actions.confirmPitStop();
      });
      
      // Wait for timeout in confirmPitStop
      await waitFor(() => {
        expect(mockTeamState.recalculateTeamStintPlan).toHaveBeenCalledWith(0);
      }, { timeout: 200 });
      
      // Verify FCY was not affected by recalculation
      expect(mockRaceState.toggleFCY).not.toHaveBeenCalled();
    });
    
    test('should NOT recalculate stint plan for scheduled stops', async () => {
      // Set up scheduled stop
      mockModals.pitReason = 'scheduled';
      mockModals.fuelTaken = true;
      
      renderWithContext();
      
      // Execute scheduled pit stop
      await waitFor(() => {
        contextRef.current.actions.confirmPitStop();
      });
      
      // Wait to ensure timeout doesn't trigger
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Verify stint plan was NOT recalculated
      expect(mockTeamState.recalculateTeamStintPlan).not.toHaveBeenCalled();
    });
  });
});
