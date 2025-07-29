import React, { Component } from 'react';
import type { ErrorInfo as ReactErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

// Custom error types for better error categorization
export class RaceAppError extends Error {
  constructor(
    message: string,
    public code: string,
    public severity: 'low' | 'medium' | 'high' = 'medium',
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'RaceAppError';
  }
}

// Error details interface (renamed to avoid conflict with React.ErrorInfo)
interface ErrorDetails {
  error: Error;
  errorInfo: ReactErrorInfo;
  timestamp: Date;
  userAgent: string;
  url: string;
}

// Props for error boundary
interface Props {
  children: ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: ReactErrorInfo) => void;
  isolate?: boolean; // If true, only this boundary catches errors, doesn't bubble up
}

// State for error boundary
interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ReactErrorInfo | null;
  errorId: string | null;
}

// Props for error fallback component
export interface ErrorFallbackProps {
  error: Error | null;
  errorInfo: ReactErrorInfo | null;
  resetError: () => void;
  errorId: string | null;
}

// Default error fallback component
const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({ 
  error, 
  errorInfo, 
  resetError, 
  errorId 
}) => {
  const [showDetails, setShowDetails] = React.useState(false);
  
  const isRaceAppError = error instanceof RaceAppError;
  const severity = isRaceAppError ? error.severity : 'high';
  
  const severityConfig = {
    low: {
      icon: AlertTriangle,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-900/20',
      borderColor: 'border-yellow-400/30',
      title: 'Minor Issue Detected'
    },
    medium: {
      icon: AlertTriangle,
      color: 'text-orange-400',
      bgColor: 'bg-orange-900/20',
      borderColor: 'border-orange-400/30',
      title: 'Something Went Wrong'
    },
    high: {
      icon: Bug,
      color: 'text-red-400',
      bgColor: 'bg-red-900/20',
      borderColor: 'border-red-400/30',
      title: 'Critical Error'
    }
  };

  const config = severityConfig[severity];
  const Icon = config.icon;

  const handleRefresh = () => {
    resetError();
    window.location.reload();
  };

  const handleGoHome = () => {
    resetError();
    window.location.href = '/';
  };

  const copyErrorDetails = () => {
    const details = `
Error ID: ${errorId}
Error: ${error?.message}
Stack: ${error?.stack}
Component Stack: ${errorInfo?.componentStack}
Timestamp: ${new Date().toISOString()}
User Agent: ${navigator.userAgent}
URL: ${window.location.href}
    `;
    
    navigator.clipboard.writeText(details).then(() => {
      alert('Error details copied to clipboard');
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
      <div className={`max-w-lg w-full ${config.bgColor} ${config.borderColor} border rounded-lg p-6`}>
        <div className="flex items-center mb-4">
          <Icon className={`h-8 w-8 ${config.color} mr-3`} />
          <h1 className="text-xl font-bold text-gray-100">
            {config.title}
          </h1>
        </div>

        <div className="mb-6">
          <p className="text-gray-300 mb-2">
            {isRaceAppError 
              ? error.message
              : "The race application encountered an unexpected error. Your race data may still be saved."
            }
          </p>
          
          {errorId && (
            <p className="text-sm text-gray-400">
              Error ID: <code className="bg-gray-800 px-1 rounded">{errorId}</code>
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3 mb-4">
          <button
            onClick={resetError}
            className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </button>

          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              className="flex-1 flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Page
            </button>

            <button
              onClick={handleGoHome}
              className="flex-1 flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Home className="h-4 w-4 mr-2" />
              Start Over
            </button>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-4">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-gray-400 hover:text-gray-300 mb-2"
          >
            {showDetails ? 'Hide' : 'Show'} Error Details
          </button>

          {showDetails && (
            <div className="bg-gray-800 rounded p-3 text-xs text-gray-300 font-mono overflow-auto max-h-40">
              <div className="mb-2">
                <strong>Error:</strong> {error?.message}
              </div>
              {error?.stack && (
                <div className="mb-2">
                  <strong>Stack:</strong>
                  <pre className="whitespace-pre-wrap mt-1">{error.stack}</pre>
                </div>
              )}
              {isRaceAppError && error.context && (
                <div className="mb-2">
                  <strong>Context:</strong>
                  <pre className="whitespace-pre-wrap mt-1">
                    {JSON.stringify(error.context, null, 2)}
                  </pre>
                </div>
              )}
              <button
                onClick={copyErrorDetails}
                className="text-blue-400 hover:text-blue-300 text-xs mt-2"
              >
                Copy Error Details
              </button>
            </div>
          )}
        </div>

        <div className="mt-4 text-xs text-gray-500">
          If this problem persists, please report it with the error details above.
        </div>
      </div>
    </div>
  );
};

// Main error boundary class component
export class BaseErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: number | null = null;

  constructor(props: Props) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Generate unique error ID
    const errorId = `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ReactErrorInfo) {
    const errorDetails: ErrorDetails = {
      error,
      errorInfo,
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    this.setState({
      errorInfo: errorInfo,
    });

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error details
    console.group('🚨 Error Boundary Caught Error');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Error Details:', errorDetails);
    console.groupEnd();

    // In development, also log to console for debugging
    if (process.env.NODE_ENV === 'development') {
      console.warn('Error Boundary Details:', {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      });
    }
  }

  resetError = () => {
    // Clear any existing timeout
    if (this.resetTimeoutId) {
      window.clearTimeout(this.resetTimeoutId);
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      
      return (
        <FallbackComponent
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          resetError={this.resetError}
          errorId={this.state.errorId}
        />
      );
    }

    return this.props.children;
  }
}

// HOC for wrapping components with error boundaries
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <BaseErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </BaseErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Hook for throwing errors that will be caught by error boundaries
export const useErrorHandler = () => {
  const [error, setError] = React.useState<Error | null>(null);

  const throwError = React.useCallback((error: Error | string, context?: Record<string, any>) => {
    const errorObj = typeof error === 'string' 
      ? new RaceAppError(error, 'USER_THROWN', 'medium', context)
      : error;
    
    setError(errorObj);
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  // Throw the error in a useEffect to trigger error boundary
  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { throwError, clearError };
};
