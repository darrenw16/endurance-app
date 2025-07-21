// App.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import App from '../App'; // Import from src directory

describe('PitStrategyApp', () => {
  beforeEach(() => {
    // Set up fake timers for each test
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-01T10:00:00.000Z'));
    
    // Mock alert and confirm
    global.alert = jest.fn();
    global.confirm = jest.fn(() => true);
  });

  afterEach(() => {
    // Clean up timers after each test
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('Initial Configuration', () => {
    test('renders race configuration screen initially', () => {
      render(<App />);
      
      expect(screen.getByText('Race Configuration')).toBeInTheDocument();
      expect(screen.getByLabelText(/track name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/race length/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/fuel range/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/minimum pit time/i)).toBeInTheDocument();
    });

    test('has default values for race configuration', () => {
      render(<App />);
      
      expect(screen.getByDisplayValue('24')).toBeInTheDocument(); // Race length
      expect(screen.getByDisplayValue('108')).toBeInTheDocument(); // Fuel range
      expect(screen.getByDisplayValue('170')).toBeInTheDocument(); // Min pit time
    });

    test('start race button is disabled when required fields are empty', () => {
      render(<App />);
      
      const startButton = screen.getByRole('button', { name: /start race/i });
      expect(startButton).toBeDisabled();
    });

    test('start race button is enabled when all required fields are filled', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<App />);
      
      // Fill in required fields
      await user.type(screen.getByLabelText(/track name/i), 'Le Mans');
      await user.type(screen.getByPlaceholderText('#3'), '42');
      await user.type(screen.getByPlaceholderText('Apex Twin Racing'), 'Test Team');
      
      const startButton = screen.getByRole('button', { name: /start race/i });
      expect(startButton).toBeEnabled();
    });
  });

  describe('Team Management', () => {
    test('can add a new team', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<App />);
      
      const addTeamButton = screen.getByRole('button', { name: /add team/i });
      await user.click(addTeamButton);
      
      expect(screen.getByText('Team 2')).toBeInTheDocument();
    });

    test('can add drivers to a team', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<App />);
      
      const addDriverButton = screen.getByRole('button', { name: /add driver/i });
      await user.click(addDriverButton);
      
      const driverInputs = screen.getAllByPlaceholderText(/driver \d+/i);
      expect(driverInputs).toHaveLength(2);
    });
  });

  describe('Race Operations', () => {
    const setupRaceWithTeam = async (user: any) => {
      // Fill in required fields and start race
      await user.type(screen.getByLabelText(/track name/i), 'Le Mans');
      await user.type(screen.getByPlaceholderText('#3'), '42');
      await user.type(screen.getByPlaceholderText('Apex Twin Racing'), 'Test Team');
      await user.type(screen.getByPlaceholderText('Driver 1'), 'John Doe');
      
      const startButton = screen.getByRole('button', { name: /start race/i });
      await user.click(startButton);
    };

    test('can start a race and transitions to race view', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<App />);
      
      await setupRaceWithTeam(user);
      
      expect(screen.getByText('Le Mans')).toBeInTheDocument();
      expect(screen.getByText('24-Hour Endurance Race')).toBeInTheDocument();
      // Use getAllByText to handle multiple elements with same text
      expect(screen.getAllByText('#42 - Test Team')).toHaveLength(2); // Button and heading
    });

    test('displays race timer when race is started', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<App />);
      
      await setupRaceWithTeam(user);
      
      expect(screen.getByText('Time Remaining')).toBeInTheDocument();
      expect(screen.getByText('24:00:00')).toBeInTheDocument();
    });

    test('can pause and resume race', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<App />);
      
      await setupRaceWithTeam(user);
      
      const pauseButton = screen.getByRole('button', { name: /pause/i });
      await user.click(pauseButton);
      
      expect(screen.getByText('PAUSED')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /resume/i })).toBeInTheDocument();
    });

    test('can toggle FCY status', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<App />);
      
      await setupRaceWithTeam(user);
      
      const fcyButton = screen.getByRole('button', { name: /^FCY$/i });
      await user.click(fcyButton);
      
      expect(screen.getByRole('button', { name: /fcy active/i })).toBeInTheDocument();
    });
  });

  describe('Pit Stop Operations', () => {
    const setupActiveRace = async (user: any) => {
      await user.type(screen.getByLabelText(/track name/i), 'Le Mans');
      await user.type(screen.getByPlaceholderText('#3'), '42');
      await user.type(screen.getByPlaceholderText('Apex Twin Racing'), 'Test Team');
      await user.type(screen.getByPlaceholderText('Driver 1'), 'John Doe');
      
      const startButton = screen.getByRole('button', { name: /start race/i });
      await user.click(startButton);
    };

    test('can open pit stop dialog', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<App />);
      
      await setupActiveRace(user);
      
      // The pit button text is "PIT", not "pit stop"
      const pitButton = screen.getByRole('button', { name: /^PIT$/i });
      await user.click(pitButton);
      
      // Use heading role to specifically target the dialog title, not the button
      expect(screen.getByRole('heading', { name: /confirm pit stop/i })).toBeInTheDocument();
      expect(screen.getByText('Reason for Pit Stop')).toBeInTheDocument();
      expect(screen.getByText('Fuel Taken?')).toBeInTheDocument();
      expect(screen.getByText('Driver Changed?')).toBeInTheDocument();
    });

    test('can confirm pit stop', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<App />);
      
      await setupActiveRace(user);
      
      // The pit button text is "PIT", not "pit stop"
      const pitButton = screen.getByRole('button', { name: /^PIT$/i });
      await user.click(pitButton);
      
      const confirmButton = screen.getByRole('button', { name: /confirm pit stop/i });
      await user.click(confirmButton);
      
      // Dialog should close
      expect(screen.queryByRole('heading', { name: /confirm pit stop/i })).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('handles invalid fuel range input', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<App />);
      
      await user.type(screen.getByLabelText(/track name/i), 'Le Mans');
      await user.type(screen.getByPlaceholderText('#3'), '42');
      await user.type(screen.getByPlaceholderText('Apex Twin Racing'), 'Test Team');
      await user.type(screen.getByPlaceholderText('Driver 1'), 'John Doe');
      
      const startButton = screen.getByRole('button', { name: /start race/i });
      await user.click(startButton);
      
      // Try to set invalid fuel range
      const fuelRangeElement = screen.getByText('108 min');
      await user.click(fuelRangeElement);
      
      const fuelInput = screen.getByPlaceholderText('108');
      await user.clear(fuelInput);
      await user.type(fuelInput, '25'); // Below minimum of 30
      
      const updateButton = screen.getByRole('button', { name: /update fuel range/i });
      await user.click(updateButton);
      
      expect(global.alert).toHaveBeenCalledWith(
        'Please enter a valid fuel range between 30 and 300 minutes'
      );
    });
  });

  describe('Accessibility', () => {
    test('has proper form labels', () => {
      render(<App />);
      
      expect(screen.getByLabelText(/track name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/race length/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/fuel range/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/minimum pit time/i)).toBeInTheDocument();
    });
  });
});
