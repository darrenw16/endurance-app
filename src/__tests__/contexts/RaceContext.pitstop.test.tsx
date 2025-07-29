import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CompositeRaceProvider } from '../../contexts/split/CompositeRaceProvider';
import type { RaceConfig } from '../../types';

const mockRaceConfig: RaceConfig = {
  track: 'Test Track',
  raceLengthHours: 24,
  fuelRangeMinutes: 108,
  minPitTimeSeconds: 170,
  numTeams: 1,
  teams: [{
    number: '42',
    name: 'Test Team',
    drivers: ['Driver A'],
    driverAssignments: []
  }]
};

const TestComponent = () => <div>Pit Stop Test</div>;

describe('Pit Stop Context', () => {
  beforeEach(() => {
    // Mock browser APIs for each test
    global.alert = jest.fn();
    global.confirm = jest.fn(() => true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('provides pit stop context without errors', () => {
    const setRaceConfig = jest.fn();
    
    render(
      <CompositeRaceProvider raceConfig={mockRaceConfig} setRaceConfig={setRaceConfig}>
        <TestComponent />
      </CompositeRaceProvider>
    );
    
    expect(screen.getByText('Pit Stop Test')).toBeInTheDocument();
  });
});
