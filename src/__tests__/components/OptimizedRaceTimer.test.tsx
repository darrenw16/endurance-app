import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the performance monitoring hook to prevent issues
jest.mock('../../utils/performance/performanceMonitoring', () => ({
  usePerformanceMonitoring: jest.fn(() => ({
    recordRender: jest.fn(() => jest.fn())
  })),
  throttle: jest.fn((fn) => fn)
}));

// Mock the timer hooks
jest.mock('../../hooks/useOptimizedTimer', () => ({
  useOptimizedTimer: jest.fn(() => ({
    currentTime: new Date('2024-01-01T10:00:00'),
    lastUpdateTime: 0,
    forceUpdate: jest.fn()
  })),
  useRaceTimer: jest.fn(() => ({
    currentTime: new Date('2024-01-01T10:00:00'),
    elapsedTime: 0,
    formattedElapsedTime: '00:00:00'
  }))
}));

import { OptimizedRaceTimer } from '../../components/optimized/OptimizedRaceTimer';

const mockProps = {
  raceStartTime: null,
  raceLengthHours: 24,
  isRaceStarted: false,
  isRacePaused: false,
  fcyActive: false,
  onStartRace: jest.fn(),
  onPauseRace: jest.fn(),
  onStopRace: jest.fn(),
  onToggleFCY: jest.fn()
};

describe('OptimizedRaceTimer Component', () => {
  beforeEach(() => {
    // Mock browser APIs for each test
    global.alert = jest.fn();
    global.confirm = jest.fn(() => true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders without crashing', () => {
    render(<OptimizedRaceTimer {...mockProps} />);
    expect(document.body).toBeInTheDocument();
  });

  test('renders timer component', () => {
    render(<OptimizedRaceTimer {...mockProps} />);
    expect(screen.getByText('24-Hour Endurance Race')).toBeInTheDocument();
  });

  test('renders control buttons', () => {
    render(<OptimizedRaceTimer {...mockProps} />);
    expect(screen.getByText('Start Race')).toBeInTheDocument();
    expect(screen.getByText('Pause')).toBeInTheDocument();
    expect(screen.getByText('Stop')).toBeInTheDocument();
  });
});
