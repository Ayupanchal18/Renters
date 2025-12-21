/**
 * Loading State Components for Async Operations
 * Provides consistent loading indicators across the application
 * Validates: Requirements 1.4, 7.5, 9.1, 9.2, 9.4
 */

import React from 'react';
import { Loader2, RefreshCw, CheckCircle, AlertCircle, Clock, Wifi } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './button';

/**
 * Generic Loading Spinner
 */
export function LoadingSpinner({ 
  size = 'md', // 'sm' | 'md' | 'lg' | 'xl'
  variant = 'default', // 'default' | 'primary' | 'secondary'
  className = ''
}) {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-4 h-4';
      case 'lg':
        return 'w-8 h-8';
      case 'xl':
        return 'w-12 h-12';
      default:
        return 'w-6 h-6';
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'text-primary';
      case 'secondary':
        return 'text-muted-foreground';
      default:
        return 'text-foreground';
    }
  };

  return (
    <Loader2 
      className={cn(
        "animate-spin",
        getSizeClasses(),
        getVariantClasses(),
        className
      )} 
    />
  );
}

/**
 * Inline Loading State
 */
export function InlineLoading({ 
  text = 'Loading...', 
  size = 'md',
  className = ''
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <LoadingSpinner size={size} />
      <span className="text-sm text-muted-foreground">{text}</span>
    </div>
  );
}

/**
 * Button Loading State
 */
export function LoadingButton({ 
  children, 
  isLoading = false, 
  loadingText = 'Loading...',
  disabled = false,
  onClick,
  variant = 'default',
  size = 'default',
  className = '',
  ...props
}) {
  return (
    <Button
      onClick={onClick}
      disabled={isLoading || disabled}
      variant={variant}
      size={size}
      className={className}
      {...props}
    >
      {isLoading ? (
        <>
          <LoadingSpinner size="sm" className="mr-2" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </Button>
  );
}

/**
 * Card Loading State
 */
export function LoadingCard({ 
  title = 'Loading...', 
  description = 'Please wait while we fetch your data.',
  showSpinner = true,
  className = ''
}) {
  return (
    <div className={cn(
      "bg-card rounded-lg border border-border p-8 text-center",
      className
    )}>
      {showSpinner && (
        <div className="flex justify-center mb-4">
          <LoadingSpinner size="lg" variant="primary" />
        </div>
      )}
      <h3 className="text-lg font-medium text-card-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

/**
 * Overlay Loading State
 */
export function LoadingOverlay({ 
  isVisible = false,
  text = 'Loading...',
  backdrop = true,
  className = ''
}) {
  if (!isVisible) return null;

  return (
    <div className={cn(
      "absolute inset-0 flex items-center justify-center z-50",
      backdrop && "bg-background/80",
      className
    )}>
      <div className="flex flex-col items-center gap-3">
        <LoadingSpinner size="lg" variant="primary" />
        <span className="text-sm font-medium text-foreground">{text}</span>
      </div>
    </div>
  );
}

/**
 * Page Loading State
 */
export function PageLoading({ 
  title = 'Loading Dashboard',
  description = 'Please wait while we prepare your dashboard.',
  className = ''
}) {
  return (
    <div className={cn(
      "min-h-screen flex items-center justify-center bg-muted/50",
      className
    )}>
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <LoadingSpinner size="xl" variant="primary" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">{title}</h2>
        <p className="text-muted-foreground max-w-md">{description}</p>
      </div>
    </div>
  );
}

/**
 * Operation Status Indicator
 */
export function OperationStatus({ 
  status = 'loading', // 'loading' | 'success' | 'error' | 'warning'
  message = '',
  onRetry,
  onDismiss,
  className = ''
}) {
  const getIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-destructive" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-warning" />;
      default:
        return <LoadingSpinner size="md" variant="primary" />;
    }
  };

  const getBackgroundClasses = () => {
    switch (status) {
      case 'success':
        return 'bg-emerald-50 border-emerald-200';
      case 'error':
        return 'bg-destructive/10 border-destructive/20';
      case 'warning':
        return 'bg-warning/10 border-warning/20';
      default:
        return 'bg-primary/10 border-primary/20';
    }
  };

  const getTextClasses = () => {
    switch (status) {
      case 'success':
        return 'text-emerald-800';
      case 'error':
        return 'text-destructive';
      case 'warning':
        return 'text-warning';
      default:
        return 'text-primary';
    }
  };

  return (
    <div className={cn(
      "flex items-center gap-3 p-4 border rounded-lg",
      getBackgroundClasses(),
      className
    )}>
      {getIcon()}
      
      <div className="flex-1">
        <span className={cn("text-sm font-medium", getTextClasses())}>
          {message}
        </span>
      </div>
      
      {(onRetry || onDismiss) && (
        <div className="flex gap-2">
          {onRetry && status === 'error' && (
            <Button
              size="sm"
              variant="outline"
              onClick={onRetry}
              className="text-destructive border-destructive/30 hover:bg-destructive/10"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Retry
            </Button>
          )}
          {onDismiss && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onDismiss}
              className={getTextClasses()}
            >
              Dismiss
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Async Operation Wrapper
 */
export function AsyncOperation({ 
  isLoading = false,
  error = null,
  success = null,
  loadingText = 'Processing...',
  onRetry,
  onDismiss,
  children,
  className = ''
}) {
  if (error) {
    return (
      <OperationStatus
        status="error"
        message={error}
        onRetry={onRetry}
        onDismiss={onDismiss}
        className={className}
      />
    );
  }

  if (success) {
    return (
      <OperationStatus
        status="success"
        message={success}
        onDismiss={onDismiss}
        className={className}
      />
    );
  }

  if (isLoading) {
    return (
      <OperationStatus
        status="loading"
        message={loadingText}
        className={className}
      />
    );
  }

  return children;
}

/**
 * Retry Loading State
 */
export function RetryLoading({ 
  attempt = 1,
  maxAttempts = 3,
  message = 'Retrying...',
  onCancel,
  className = ''
}) {
  return (
    <div className={cn(
      "flex items-center justify-between p-4 bg-warning/10 border border-warning/20 rounded-lg",
      className
    )}>
      <div className="flex items-center gap-3">
        <RefreshCw className="w-5 h-5 text-warning animate-spin" />
        <div>
          <span className="text-sm font-medium text-warning">
            {message}
          </span>
          <div className="text-xs text-warning/80">
            Attempt {attempt} of {maxAttempts}
          </div>
        </div>
      </div>
      
      {onCancel && (
        <Button
          size="sm"
          variant="ghost"
          onClick={onCancel}
          className="text-warning hover:bg-warning/10"
        >
          Cancel
        </Button>
      )}
    </div>
  );
}

/**
 * Network Status Indicator
 */
export function NetworkStatus({ 
  isOnline = true,
  isConnecting = false,
  onRetry,
  className = ''
}) {
  if (isOnline && !isConnecting) {
    return null;
  }

  return (
    <div className={cn(
      "flex items-center gap-3 p-3 border rounded-lg",
      isConnecting ? "bg-warning/10 border-warning/20" : "bg-destructive/10 border-destructive/20",
      className
    )}>
      {isConnecting ? (
        <LoadingSpinner size="sm" variant="primary" />
      ) : (
        <Wifi className="w-4 h-4 text-destructive" />
      )}
      
      <span className={cn(
        "text-sm font-medium",
        isConnecting ? "text-warning" : "text-destructive"
      )}>
        {isConnecting ? 'Reconnecting...' : 'Connection lost'}
      </span>
      
      {!isConnecting && onRetry && (
        <Button
          size="sm"
          variant="outline"
          onClick={onRetry}
          className="ml-auto text-destructive border-destructive/30 hover:bg-destructive/10"
        >
          <RefreshCw className="w-3 h-3 mr-1" />
          Retry
        </Button>
      )}
    </div>
  );
}

/**
 * Timeout Loading State
 */
export function TimeoutLoading({ 
  timeLeft = 30,
  onCancel,
  message = 'This is taking longer than expected...',
  className = ''
}) {
  return (
    <div className={cn(
      "flex items-center justify-between p-4 bg-orange/10 border border-orange/20 rounded-lg",
      className
    )}>
      <div className="flex items-center gap-3">
        <Clock className="w-5 h-5 text-orange" />
        <div>
          <span className="text-sm font-medium text-orange">
            {message}
          </span>
          <div className="text-xs text-orange/80">
            Timeout in {timeLeft}s
          </div>
        </div>
      </div>
      
      {onCancel && (
        <Button
          size="sm"
          variant="ghost"
          onClick={onCancel}
          className="text-orange hover:bg-orange/10"
        >
          Cancel
        </Button>
      )}
    </div>
  );
}

/**
 * Batch Operation Progress
 */
export function BatchProgress({ 
  completed = 0,
  total = 0,
  currentItem = '',
  className = ''
}) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">
          Processing items...
        </span>
        <span className="text-sm text-muted-foreground">
          {completed} of {total}
        </span>
      </div>
      
      <div className="w-full bg-muted rounded-full h-2">
        <div 
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {currentItem && (
        <div className="text-xs text-muted-foreground">
          Current: {currentItem}
        </div>
      )}
    </div>
  );
}