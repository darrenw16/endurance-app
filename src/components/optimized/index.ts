// Optimized component exports
export { 
  OptimizedStintSchedule, 
  OptimizedTeamStatus, 
  StintRow 
} from './OptimizedStintComponents';

export { OptimizedRaceTimer } from './OptimizedRaceTimer';
export { PerformanceDashboard, usePerformanceDashboard } from './PerformanceDashboard';

// Performance utilities
export {
  calculateStintTiming,
  calculateTeamStats,
  calculateNextPitWindow,
  calculateAllTeamStats,
  generateOptimizedStintPlan,
  clearStintCalculationCache,
  optimizedCalculateStintTiming,
  optimizedCalculateTeamStats,
  optimizedCalculateNextPitWindow,
  optimizedGenerateStintPlan
} from '../../utils/performance/stintCalculations';

// Performance monitoring
export {
  performanceMonitor,
  usePerformanceMonitoring,
  withPerformanceMonitoring,
  debounce,
  throttle,
  memoize,
  PERFORMANCE_THRESHOLDS
} from '../../utils/performance/performanceMonitoring';
