import { getElapsedTime, getRemainingTime, getRemainingRaceTime, canPitOnFCY } from '../../utils/stintCalculations';
import type { TeamState, RaceConfig } from '../../types';

describe('Stint Calculations', () => {
  const mockTeamState: TeamState = {
    currentStint: 1,
    stintStartTime: new Date('2024-01-01T10:00:00'),
    currentDriver: 0,
    stints: [{
      stintNumber: 1,
      plannedStart: new Date('2024-01-01T10:00:00'),
      plannedLength: 108,
      calculatedLength: null,
      predictedStart: null,
      plannedFinish: null,
      predictedFinish: null,
      actualStart: null,
      actualFinish: null,
      pitTime: 170,
      actualPitTime: null,
      fuelTaken: null,
      driver: 'Driver A',
      elapsed: 0,
      remaining: 108,
      fcyBuffer: 0,
      status: 'active',
      isUnscheduled: false
    }],
    lastPitTime: null,
    position: 1
  };

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

  test('getElapsedTime calculates elapsed time correctly', () => {
    const startTime = new Date('2024-01-01T10:00:00');
    const currentTime = new Date('2024-01-01T11:00:00');
    
    expect(getElapsedTime(startTime, currentTime)).toBe(60); // 60 minutes
  });

  test('getElapsedTime handles null start time', () => {
    const currentTime = new Date('2024-01-01T11:00:00');
    
    expect(getElapsedTime(null, currentTime)).toBe(0);
  });

  test('getRemainingTime calculates remaining stint time', () => {
    const startTime = new Date('2024-01-01T10:00:00');
    const currentTime = new Date('2024-01-01T10:30:00');
    const plannedLength = 108;
    
    expect(getRemainingTime(startTime, plannedLength, currentTime)).toBe(78); // 108 - 30 = 78
  });

  test('getRemainingRaceTime calculates remaining race time', () => {
    const raceStartTime = new Date('2024-01-01T10:00:00');
    const currentTime = new Date('2024-01-01T11:00:00');
    const raceLengthHours = 24;
    
    expect(getRemainingRaceTime(raceStartTime, raceLengthHours, currentTime)).toBe(1380); // 24*60 - 60 = 1380
  });

  test('canPitOnFCY returns boolean', () => {
    const currentTime = new Date('2024-01-01T11:00:00');
    const raceStartTime = new Date('2024-01-01T10:00:00');
    
    const result = canPitOnFCY(mockTeamState, mockRaceConfig, currentTime, raceStartTime);
    expect(typeof result).toBe('boolean');
  });
});
