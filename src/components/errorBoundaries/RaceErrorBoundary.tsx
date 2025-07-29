import React from 'react';
import { BaseErrorBoundary, RaceAppError, type ErrorFallbackProps } from './BaseErrorBoundary';
import { AlertTriangle, RefreshCw, Settings } from 'lucide-react';

// Race-specific error fallback
const RaceErrorFallback: React.FC<ErrorFallbackProps & { 
  onReturnToConfig?: () => void;
}> = ({ error, resetError, errorId, onReturnToConfig }) => {
  const handleReturnToConfig = () => {
    if (onReturnToConfig) {
      onReturnToConfig();
    }
    resetError();
  };

  return (
    <div className="bg-red-900/20 border border-red-400/30 rounded-lg p-6 m-4">
      <div className="flex items-center mb-4">
        <AlertTriangle className="h-6 w-6 text-red-400 mr-3" />
        <h2 className="text-lg font-semibold text-gray-100">
          Race Operation Error
        </h2>
      </div>

      <div className="mb-4">
        <p className="text-gray-300 mb-2">
          There was an error during race operations. Your race data might still be preserved.
        </p>
        <p className="text-sm text-gray-400">
          Error: {error?.message}
        </p>
        {errorId && (
          <p className="text-xs text-gray-500 mt-1">
            ID: {errorId}
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <button
          onClick={resetError}
          className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Resume Race
        </button>

        {onReturnToConfig && (
          <button
            onClick={handleReturnToConfig}
            className="flex items-center bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Settings className="h-4 w-4 mr-2" />
            Back to Setup
          </button>
        )}
      </div>
    </div>
  );
};

// Configuration-specific error fallback
const ConfigErrorFallback: React.FC<ErrorFallbackProps> = ({ 
  error, 
  resetError, 
  errorId 
}) => {
  return (
    <div className="bg-orange-900/20 border border-orange-400/30 rounded-lg p-6 m-4">
      <div className="flex items-center mb-4">
        <AlertTriangle className="h-6 w-6 text-orange-400 mr-3" />
        <h2 className="text-lg font-semibold text-gray-100">
          Configuration Error
        </h2>
      </div>

      <div className="mb-4">
        <p className="text-gray-300 mb-2">
          There was an error with the race configuration. Please check your settings.
        </p>
        <p className="text-sm text-gray-400">
          Error: {error?.message}
        </p>
        {errorId && (
          <p className="text-xs text-gray-500 mt-1">
            ID: {errorId}
          </p>
        )}
      </div>

      <button
        onClick={resetError}
        className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
      >
        <RefreshCw className="h-4 w-4 mr-2" />
        Reset Configuration
      </button>
    </div>
  );
};

// Team management error fallback
const TeamErrorFallback: React.FC<ErrorFallbackProps> = ({ 
  error, 
  resetError, 
  errorId 
}) => {
  return (
    <div className="bg-yellow-900/20 border border-yellow-400/30 rounded-lg p-4 m-2">
      <div className="flex items-center mb-3">
        <AlertTriangle className="h-5 w-5 text-yellow-400 mr-2" />
        <h3 className="text-md font-medium text-gray-100">
          Team Operation Error
        </h3>
      </div>

      <div className="mb-3">
        <p className="text-sm text-gray-300 mb-1">
          There was an error with team operations.
        </p>
        <p className="text-xs text-gray-400">
          {error?.message}
        </p>
      </div>

      <button
        onClick={resetError}
        className="text-sm bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded transition-colors"
      >
        Retry
      </button>
    </div>
  );
};

// Props for race error boundary
interface RaceErrorBoundaryProps {
  children: React.ReactNode;
  onReturnToConfig?: () => void;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

// Race-specific error boundary
export const RaceErrorBoundary: React.FC<RaceErrorBoundaryProps> = ({ 
  children, 
  onReturnToConfig,
  onError 
}) => {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Log race-specific context
    console.group('🏁 Race Error Boundary');
    console.error('Race operation failed:', error.message);
    console.error('Error details:', { error, errorInfo });
    console.groupEnd();

    // Call parent error handler if provided
    if (onError) {
      onError(error, errorInfo);
    }

    // Could send to analytics/error reporting service here
    if (process.env.NODE_ENV === 'production') {
      // Example: sendErrorToAnalytics('race_error', error, errorInfo);
    }
  };

  return (
    <BaseErrorBoundary
      fallback={(props) => (
        <RaceErrorFallback {...props} onReturnToConfig={onReturnToConfig} />
      )}
      onError={handleError}
    >
      {children}
    </BaseErrorBoundary>
  );
};

// Configuration error boundary
export const ConfigErrorBoundary: React.FC<{
  children: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}> = ({ children, onError }) => {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    console.group('⚙️ Configuration Error Boundary');
    console.error('Configuration error:', error.message);
    console.error('Error details:', { error, errorInfo });
    console.groupEnd();

    if (onError) {
      onError(error, errorInfo);
    }
  };

  return (
    <BaseErrorBoundary
      fallback={ConfigErrorFallback}
      onError={handleError}
    >
      {children}
    </BaseErrorBoundary>
  );
};

// Team management error boundary
export const TeamErrorBoundary: React.FC<{
  children: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}> = ({ children, onError }) => {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    console.group('👥 Team Error Boundary');
    console.error('Team operation error:', error.message);
    console.error('Error details:', { error, errorInfo });
    console.groupEnd();

    if (onError) {
      onError(error, errorInfo);
    }
  };

  return (
    <BaseErrorBoundary
      fallback={TeamErrorFallback}
      onError={handleError}
      isolate={true} // Prevent bubbling up to parent boundaries
    >
      {children}
    </BaseErrorBoundary>
  );
};
