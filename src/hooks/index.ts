/**
 * Export all custom hooks
 */
export { useRaceState } from './useRaceState';
export { useTeamState } from './useTeamState';
export { useModals } from './useModals';
export { useDragAndDrop } from './useDragAndDrop';
export { usePitStop } from './usePitStop';

// Persistence hooks
export { useDataPersistence } from './persistence/useDataPersistence';
export { useAutoSave } from './persistence/useAutoSave';
export type { RaceSessionData, AutoSaveSettings } from './persistence/useDataPersistence';

// Performance optimized hooks
export { 
  useOptimizedTimer, 
  useRaceTimer, 
  useMultipleTimers, 
  useDebouncedTimeUpdate 
} from './useOptimizedTimer';
export type { OptimizedTimerOptions } from './useOptimizedTimer';

// Performance monitoring
export { usePerformanceMonitoring } from '../utils/performance/performanceMonitoring';

// Business logic hooks
export { useStintCalculations, useFCYStrategy, useRaceValidation } from './business';

// PWA hooks
export { usePWAInstall } from './usePWAInstall';
export { useOffline } from './useOffline';
export { useServiceWorker } from './useServiceWorker';
export { useAutoSave as usePWAAutoSave } from './useAutoSave';
export { useDataPersistence as usePWADataPersistence } from './useDataPersistence';

// PWA Types
export type {
  PWAInstallHook,
  OfflineHook,
  ServiceWorkerHook,
  DataPersistenceHook,
  RaceState,
  SavedRace,
  AutoSaveOptions
} from './pwaTypes';
