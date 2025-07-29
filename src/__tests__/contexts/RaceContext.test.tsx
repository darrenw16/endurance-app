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
    drivers: ['Driver A', 'Driver B'],
    driverAssignments: []
  }]
};

const TestComponent = () => <div>Context Test Component</div>;

describe('Race Context Provider', () => {
  beforeEach(() => {
    // Mock alert and confirm for each test
    global.alert = jest.fn();
    global.confirm = jest.fn(() => true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('provides context without crashing', () => {
    const setRaceConfig = jest.fn();
    
    render(
      <CompositeRaceProvider raceConfig={mockRaceConfig} setRaceConfig={setRaceConfig}>
        <TestComponent />
      </CompositeRaceProvider>
    );
    
    expect(screen.getByText('Context Test Component')).toBeInTheDocument();
  });
});
