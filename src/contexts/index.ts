// Original monolithic context (for backward compatibility)
export { RaceProvider, useRaceContext, RaceContext } from './RaceContext';

// Split contexts for better organization
export {
  RaceTimingProvider,
  useRaceTiming,
  RaceTimingContext,
  TeamManagementProvider,
  useTeamManagement,
  TeamManagementContext,
  PitStopProvider,
  usePitStopContext,
  PitStopContext,
  UIStateProvider,
  useUIState,
  UIStateContext
} from './split';
