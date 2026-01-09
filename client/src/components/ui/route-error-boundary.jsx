/**
 * Route-level Error Boundary Component
 * Provides graceful error handling for route-level components
 * Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.6
 */

import React from 'react';
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react';
import { Button } from './button';
import { Card } from './card';
import { handleComponentError, createUserFriendlyError, getRecoveryOptions } from '../../utils/errorHandling';

/**
 * Route-level Error Boundary Component
 * Wraps route components to catch and handle errors gracefully
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to wrap
 * @param {React.ReactNode} [props.fallback] - Custom fallback component
 * @param {Function} [props.onError] - Callback when error is caught
 * @param {Function} [props.onRetry] - Callback when retry is triggered
 * @param {string} [props.routeName] - Name of the route for logging context
 */
export class RouteErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render shows the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Process the error using existing error handling utilities
    const errorState = handleComponentError(error, errorInfo);
    
    // Log the error with route context
    this.logError(error, errorInfo);
    
    // Update state with processed error
    this.setState({
      ...errorState,
      error: errorState.error,
      errorInfo: errorInfo
    });
    
    // Call optional onError callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  /**
   * Logs error to console with component stack trace
   * Will integrate with centralized logger when available
   */
  logError = (error, errorInfo) => {
    const routeName = this.props.routeName || 'Unknown Route';
    
    console.error('[RouteErrorBoundary] Error caught:', {
      route: routeName,
      error: {
        name: error?.name || 'Error',
        message: error?.message || 'Unknown error',
        stack: error?.stack || ''
      },
      componentStack: errorInfo?.componentStack || '',
      timestamp: new Date().toISOString(),
      retryCount: this.state.retryCount
    });
  };

  /**
   * Handles retry action - resets error state and increments retry count
   */
  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
    
    // Call optional onRetry callback
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  /**
   * Navigates to home page
   */
  handleGoHome = () => {
    window.location.href = '/';
  };

  /**
   * Navigates back in history
   */
  handleGoBack = () => {
    window.history.back();
  };

  render() {
    if (this.state.hasError) {
      // Create user-friendly error from the caught error
      const userError = createUserFriendlyError(
        this.state.error?.error || this.state.error,
        this.props.routeName || 'route'
      );
      
      // Get recovery options based on error type
      const recoveryOptions = getRecoveryOptions(userError);

      // Use custom fallback if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={userError}
            onRetry={this.handleRetry}
            onGoHome={this.handleGoHome}
            onGoBack={this.handleGoBack}
            retryCount={this.state.retryCount}
          />
        );
      }

      // Default fallback UI
      return (
        <RouteErrorFallback
          error={userError}
          recoveryOptions={recoveryOptions}
          onRetry={this.handleRetry}
          onGoHome={this.handleGoHome}
          onGoBack={this.handleGoBack}
          retryCount={this.state.retryCount}
          componentStack={this.state.errorInfo?.componentStack}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Default fallback UI for route errors
 */
export function RouteErrorFallback({
  error,
  recoveryOptions = [],
  onRetry,
  onGoHome,
  onGoBack,
  retryCount = 0,
  componentStack
}) {
  const handleAction = (action) => {
    switch (action) {
      case 'retry':
        onRetry?.();
        break;
      case 'go-home':
        onGoHome?.();
        break;
      case 'go-back':
        onGoBack?.();
        break;
      case 'check-connection':
        alert('Please check your internet connection and try again.');
        break;
      case 'login':
        window.location.href = '/login';
        break;
      default:
        console.warn('Unknown recovery action:', action);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-lg p-8 text-center">
        {/* Error Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400" />
          </div>
        </div>

        {/* Error Title */}
        <h1 className="text-2xl font-semibold text-foreground mb-3">
          {error?.title || 'Something went wrong'}
        </h1>

        {/* Error Message */}
        <p className="text-muted-foreground mb-4">
          {error?.message || 'An unexpected error occurred while loading this page.'}
        </p>

        {/* Context Message */}
        {error?.context && (
          <p className="text-sm text-muted-foreground mb-6">
            {error.context}
          </p>
        )}

        {/* Retry Count Warning */}
        {retryCount > 2 && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-6">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Multiple retry attempts failed. The issue may require technical support.
            </p>
          </div>
        )}

        {/* Recovery Actions */}
        <div className="space-y-3">
          {recoveryOptions.map((option, index) => (
            <Button
              key={index}
              variant={option.primary ? 'default' : 'outline'}
              className="w-full"
              onClick={() => handleAction(option.action)}
            >
              {getActionIcon(option.action)}
              {option.label}
            </Button>
          ))}

          {/* Always show Go Home if not in recovery options */}
          {!recoveryOptions.some(opt => opt.action === 'go-home') && (
            <Button
              variant="outline"
              className="w-full"
              onClick={onGoHome}
            >
              <Home className="w-4 h-4 mr-2" />
              Go to Home
            </Button>
          )}
        </div>

        {/* Technical Details (Development Only) */}
        {import.meta.env.DEV && (
          <details className="mt-8 text-left">
            <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
              Technical Details (Development Only)
            </summary>
            <div className="mt-3 space-y-3">
              {error?.stack && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Error Stack:</p>
                  <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-32">
                    {error.stack}
                  </pre>
                </div>
              )}
              {componentStack && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Component Stack:</p>
                  <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-32">
                    {componentStack}
                  </pre>
                </div>
              )}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Error Info:</p>
                <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-24">
                  {JSON.stringify({
                    type: error?.type,
                    severity: error?.severity,
                    retryable: error?.retryable,
                    timestamp: error?.timestamp,
                    retryCount
                  }, null, 2)}
                </pre>
              </div>
            </div>
          </details>
        )}
      </Card>
    </div>
  );
}

/**
 * Helper function to get action icons
 */
function getActionIcon(action) {
  const icons = {
    retry: <RefreshCw className="w-4 h-4 mr-2" />,
    'go-home': <Home className="w-4 h-4 mr-2" />,
    'go-back': <ArrowLeft className="w-4 h-4 mr-2" />,
    'check-connection': <AlertTriangle className="w-4 h-4 mr-2" />,
    login: null
  };

  return icons[action] || null;
}

export default RouteErrorBoundary;
