/**
 * Error Boundary Components for graceful error handling
 * Validates: Requirements 2.5, 5.5
 */

import React from 'react';
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react';
import { Button } from './button';
import { Card } from './card';
import { handleComponentError, createUserFriendlyError, getRecoveryOptions } from '../../utils/errorHandling';

/**
 * Main Error Boundary Component
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    const errorState = handleComponentError(error, errorInfo);
    this.setState(errorState);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleGoBack = () => {
    window.history.back();
  };

  render() {
    if (this.state.hasError) {
      const userError = createUserFriendlyError(this.state.error?.error, this.props.context);
      const recoveryOptions = getRecoveryOptions(userError);

      return (
        <ErrorFallback
          error={userError}
          recoveryOptions={recoveryOptions}
          onRetry={this.handleRetry}
          onGoHome={this.handleGoHome}
          onGoBack={this.handleGoBack}
          fallbackComponent={this.props.fallback}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Error Fallback Component
 */
export function ErrorFallback({ 
  error, 
  recoveryOptions = [], 
  onRetry, 
  onGoHome, 
  onGoBack,
  fallbackComponent: FallbackComponent 
}) {
  // If custom fallback component is provided, use it
  if (FallbackComponent) {
    return <FallbackComponent error={error} onRetry={onRetry} />;
  }

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
        // Could open network diagnostics or show connection tips
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
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>
        
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {error?.title || 'Something went wrong'}
        </h2>
        
        <p className="text-gray-600 mb-6">
          {error?.message || 'An unexpected error occurred. Please try again.'}
        </p>
        
        {error?.context && (
          <p className="text-sm text-gray-500 mb-6">
            {error.context}
          </p>
        )}
        
        <div className="space-y-2">
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
        </div>
        
        {import.meta.env.DEV && error?.stack && (
          <details className="mt-6 text-left">
            <summary className="text-sm text-gray-500 cursor-pointer">
              Technical Details (Development)
            </summary>
            <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-h-32">
              {error.stack}
            </pre>
          </details>
        )}
      </Card>
    </div>
  );
}

/**
 * Lightweight Error Display Component
 */
export function ErrorDisplay({ 
  error, 
  onRetry, 
  onDismiss, 
  className = '',
  variant = 'card' 
}) {
  if (!error) return null;

  const userError = typeof error === 'string' 
    ? { message: error, retryable: true }
    : createUserFriendlyError(error);

  if (variant === 'inline') {
    return (
      <div className={`bg-destructive/10 border border-destructive/20 rounded-lg p-4 ${className}`}>
        <div className="flex items-start">
          <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 mr-3 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-destructive">{userError.message}</p>
            {(onRetry || onDismiss) && (
              <div className="mt-2 flex gap-2">
                {onRetry && userError.retryable && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onRetry}
                    className="text-destructive border-destructive/30 hover:bg-destructive/10"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Try Again
                  </Button>
                )}
                {onDismiss && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={onDismiss}
                    className="text-red-700 hover:bg-red-100"
                  >
                    Dismiss
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className={`p-4 border-destructive/20 bg-destructive/10 ${className}`}>
      <div className="flex items-center">
        <AlertTriangle className="w-5 h-5 text-destructive mr-3" />
        <div className="flex-1">
          <p className="text-sm font-medium text-destructive">
            {userError.title || 'Error'}
          </p>
          <p className="text-sm text-destructive/80 mt-1">
            {userError.message}
          </p>
        </div>
        {onRetry && userError.retryable && (
          <Button
            size="sm"
            variant="outline"
            onClick={onRetry}
            className="ml-3 text-destructive border-destructive/30 hover:bg-destructive/10"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Retry
          </Button>
        )}
      </div>
    </Card>
  );
}

/**
 * Network Error Component
 */
export function NetworkError({ onRetry, className = '' }) {
  return (
    <div className={`text-center py-8 ${className}`}>
      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertTriangle className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        Connection Problem
      </h3>
      <p className="text-gray-600 mb-4">
        Unable to connect to the server. Please check your internet connection.
      </p>
      {onRetry && (
        <Button onClick={onRetry} className="bg-indigo-600 hover:bg-indigo-700">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      )}
    </div>
  );
}

/**
 * Loading Error Component
 */
export function LoadingError({ onRetry, message, className = '' }) {
  return (
    <div className={`text-center py-6 ${className}`}>
      <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
      <p className="text-gray-600 mb-3">
        {message || 'Failed to load content'}
      </p>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
        >
          <RefreshCw className="w-3 h-3 mr-1" />
          Try Again
        </Button>
      )}
    </div>
  );
}

/**
 * Property-specific Error Component
 */
export function PropertyError({ error, onRetry, onGoBack, className = '' }) {
  const userError = createUserFriendlyError(error, 'property-load');
  
  return (
    <div className={`text-center py-8 ${className}`}>
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertTriangle className="w-8 h-8 text-red-600" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {userError.title}
      </h3>
      <p className="text-gray-600 mb-4">
        {userError.message}
      </p>
      <div className="flex justify-center gap-3">
        {onGoBack && (
          <Button variant="outline" onClick={onGoBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        )}
        {onRetry && userError.retryable && (
          <Button onClick={onRetry} className="bg-indigo-600 hover:bg-indigo-700">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Verification-specific Error Boundary Component
 */
export class VerificationErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    const errorState = handleComponentError(error, errorInfo);
    this.setState(errorState);
    
    // Log verification-specific errors
    console.error('Verification Error:', {
      error: error.message,
      component: this.props.context || 'verification',
      stack: error.stack
    });
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <VerificationError
          error={this.state.error?.error}
          onRetry={this.handleRetry}
          onCancel={this.props.onCancel}
          className={this.props.className}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Verification-specific Error Component
 */
export function VerificationError({ error, onRetry, onCancel, className = '' }) {
  const userError = createUserFriendlyError(error, 'verification');
  
  return (
    <div className={`text-center py-6 ${className}`}>
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertTriangle className="w-8 h-8 text-red-600" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {userError.title}
      </h3>
      <p className="text-gray-600 mb-4">
        {userError.message}
      </p>
      <div className="flex justify-center gap-3">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        {onRetry && userError.retryable && (
          <Button onClick={onRetry} className="bg-indigo-600 hover:bg-indigo-700">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Security Operations Error Boundary Component
 */
export class SecurityErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    const errorState = handleComponentError(error, errorInfo);
    this.setState(errorState);
    
    // Log security-specific errors
    console.error('Security Operation Error:', {
      error: error.message,
      operation: this.props.operation || 'unknown',
      component: this.props.context || 'security',
      stack: error.stack
    });
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <SecurityError
          error={this.state.error?.error}
          operation={this.props.operation}
          onRetry={this.handleRetry}
          onCancel={this.props.onCancel}
          className={this.props.className}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Security Operations Error Component
 */
export function SecurityError({ error, operation, onRetry, onCancel, className = '' }) {
  const userError = createUserFriendlyError(error, 'security');
  
  const getOperationMessage = (op) => {
    switch (op) {
      case 'password':
        return 'changing your password';
      case 'phone':
        return 'updating your phone number';
      case 'delete':
        return 'deleting your account';
      default:
        return 'performing this security operation';
    }
  };

  return (
    <div className={`text-center py-6 ${className}`}>
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertTriangle className="w-8 h-8 text-red-600" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        Security Operation Failed
      </h3>
      <p className="text-gray-600 mb-2">
        {userError.message}
      </p>
      {operation && (
        <p className="text-sm text-gray-500 mb-4">
          Error occurred while {getOperationMessage(operation)}
        </p>
      )}
      <div className="flex justify-center gap-3">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        {onRetry && userError.retryable && (
          <Button onClick={onRetry} className="bg-indigo-600 hover:bg-indigo-700">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
}

// Helper function to get action icons
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