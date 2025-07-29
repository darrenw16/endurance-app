import React, { type ReactNode } from 'react';
import {
  RaceTimingProvider,
  useRaceTiming,
  TeamManagementProvider,
  useTeamManagement,
  PitStopProvider,
  UIStateProvider
} from './index';
import type { RaceConfig } from '../../types';

/**
 * Composite provider that properly nests all the split contexts
 * This creates the proper context hierarchy for data flow
 */
interface CompositeRaceProviderProps {
  children: ReactNode;
  raceConfig: RaceConfig;
  setRaceConfig: React.Dispatch<React.SetStateAction<RaceConfig>>;
}

/**
 * Inner provider that accesses timing context to provide it to team management
 */
const TeamManagementWrapper: React.FC<CompositeRaceProviderProps> = ({ children, raceConfig, setRaceConfig }) => {
  const raceTiming = useRaceTiming();
  
  return (
    <TeamManagementProvider
      raceConfig={raceConfig}
      raceStartTime={raceTiming.raceStartTime}
      currentTime={raceTiming.currentTime}
      setRaceConfig={setRaceConfig}
    >
      <PitStopWrapper raceConfig={raceConfig} setRaceConfig={setRaceConfig}>
        {children}
      </PitStopWrapper>
    </TeamManagementProvider>
  );
};

/**
 * Inner provider that accesses team management context to provide it to pit stop
 */
const PitStopWrapper: React.FC<CompositeRaceProviderProps> = ({ children, raceConfig, setRaceConfig }) => {
  const raceTiming = useRaceTiming();
  const teamManagement = useTeamManagement();
  
  return (
    <PitStopProvider
      raceConfig={raceConfig}
      teamStates={teamManagement.teamStates}
      currentTime={raceTiming.currentTime}
      fcyActive={raceTiming.fcyActive}
    >
      {children}
    </PitStopProvider>
  );
};

/**
 * Main composite provider that sets up the proper context hierarchy
 */
export const CompositeRaceProvider: React.FC<CompositeRaceProviderProps> = ({ children, raceConfig, setRaceConfig }) => {
  return (
    <RaceTimingProvider raceConfig={raceConfig}>
      <UIStateProvider>
        <TeamManagementWrapper raceConfig={raceConfig} setRaceConfig={setRaceConfig}>
          {children}
        </TeamManagementWrapper>
      </UIStateProvider>
    </RaceTimingProvider>
  );
};
