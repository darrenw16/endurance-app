// Error boundary exports
export { 
  BaseErrorBoundary, 
  RaceAppError, 
  withErrorBoundary, 
  useErrorHandler,
  type ErrorFallbackProps 
} from './BaseErrorBoundary';

export { 
  RaceErrorBoundary, 
  ConfigErrorBoundary, 
  TeamErrorBoundary 
} from './RaceErrorBoundary';
