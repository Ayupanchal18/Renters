/**
 * Fallback State Components for various error scenarios
 * Validates: Requirements 2.5, 5.5
 */

import React from 'react';
import { 
  AlertTriangle, 
  RefreshCw, 
  Search, 
  Home, 
  Wifi, 
  Clock,
  FileX,
  UserX,
  Settings
} from 'lucide-react';
import { Button } from './button';
import { Card } from './card';

/**
 * Generic Empty State Component
 */
export function EmptyState({ 
  icon: Icon = FileX,
  title = 'No data found',
  description = 'There is no data to display at the moment.',
  action,
  actionLabel = 'Refresh',
  className = ''
}) {
  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
        <Icon className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-sm mx-auto">{description}</p>
      {action && (
        <Button onClick={action} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

/**
 * No Properties Found State
 */
export function NoPropertiesFound({ 
  onClearFilters, 
  onGoHome, 
  hasFilters = false,
  searchQuery = '',
  className = '' 
}) {
  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
        <Search className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium text-foreground mb-2">
        No properties found
      </h3>
      <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
        {searchQuery 
          ? `No properties match your search for "${searchQuery}"`
          : hasFilters 
            ? 'No properties match your current filters'
            : 'There are no properties available at the moment'
        }
      </p>
      <div className="flex justify-center gap-3">
        {hasFilters && onClearFilters && (
          <Button variant="outline" onClick={onClearFilters}>
            Clear Filters
          </Button>
        )}
        {onGoHome && (
          <Button onClick={onGoHome}>
            <Home className="w-4 h-4 mr-2" />
            Browse All Properties
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Network Offline State
 */
export function OfflineState({ onRetry, className = '' }) {
  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
        <Wifi className="w-8 h-8 text-destructive" />
      </div>
      <h3 className="text-lg font-medium text-foreground mb-2">
        You're offline
      </h3>
      <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
        Please check your internet connection and try again.
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
 * Timeout State
 */
export function TimeoutState({ onRetry, className = '' }) {
  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-4">
        <Clock className="w-8 h-8 text-warning" />
      </div>
      <h3 className="text-lg font-medium text-foreground mb-2">
        Request timed out
      </h3>
      <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
        The request is taking longer than expected. Please try again.
      </p>
      {onRetry && (
        <Button onClick={onRetry}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      )}
    </div>
  );
}

/**
 * Unauthorized Access State
 */
export function UnauthorizedState({ onLogin, onGoHome, className = '' }) {
  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
        <UserX className="w-8 h-8 text-destructive" />
      </div>
      <h3 className="text-lg font-medium text-foreground mb-2">
        Access denied
      </h3>
      <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
        You need to be logged in to access this content.
      </p>
      <div className="flex justify-center gap-3">
        {onGoHome && (
          <Button variant="outline" onClick={onGoHome}>
            <Home className="w-4 h-4 mr-2" />
            Go Home
          </Button>
        )}
        {onLogin && (
          <Button onClick={onLogin}>
            Log In
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Server Error State
 */
export function ServerErrorState({ onRetry, onGoHome, className = '' }) {
  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
        <Settings className="w-8 h-8 text-destructive" />
      </div>
      <h3 className="text-lg font-medium text-foreground mb-2">
        Server error
      </h3>
      <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
        Our servers are experiencing issues. Please try again later.
      </p>
      <div className="flex justify-center gap-3">
        {onGoHome && (
          <Button variant="outline" onClick={onGoHome}>
            <Home className="w-4 h-4 mr-2" />
            Go Home
          </Button>
        )}
        {onRetry && (
          <Button onClick={onRetry}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Maintenance Mode State
 */
export function MaintenanceState({ estimatedTime, className = '' }) {
  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
        <Settings className="w-8 h-8 text-primary" />
      </div>
      <h3 className="text-lg font-medium text-foreground mb-2">
        Under maintenance
      </h3>
      <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
        We're currently performing maintenance to improve your experience.
        {estimatedTime && ` Expected completion: ${estimatedTime}`}
      </p>
      <Button 
        variant="outline" 
        onClick={() => window.location.reload()}
      >
        <RefreshCw className="w-4 h-4 mr-2" />
        Check Again
      </Button>
    </div>
  );
}

/**
 * Generic Error Card for inline errors
 */
export function ErrorCard({ 
  error, 
  onRetry, 
  onDismiss, 
  variant = 'default',
  className = '' 
}) {
  const variants = {
    default: 'border-destructive/20 bg-destructive/10',
    warning: 'border-warning/20 bg-warning/10',
    info: 'border-primary/20 bg-primary/10'
  };

  const iconColors = {
    default: 'text-destructive',
    warning: 'text-warning',
    info: 'text-primary'
  };

  const textColors = {
    default: 'text-destructive',
    warning: 'text-warning',
    info: 'text-primary'
  };

  return (
    <Card className={`p-4 ${variants[variant]} ${className}`}>
      <div className="flex items-start">
        <AlertTriangle className={`w-5 h-5 ${iconColors[variant]} mt-0.5 mr-3 flex-shrink-0`} />
        <div className="flex-1">
          <p className={`text-sm font-medium ${textColors[variant]}`}>
            {error?.title || 'Error'}
          </p>
          <p className={`text-sm ${textColors[variant]} mt-1 opacity-90`}>
            {error?.message || 'An error occurred'}
          </p>
          {(onRetry || onDismiss) && (
            <div className="mt-3 flex gap-2">
              {onRetry && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onRetry}
                  className={`${textColors[variant]} border-current hover:bg-current hover:bg-opacity-10`}
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
                  className={`${textColors[variant]} hover:bg-current hover:bg-opacity-10`}
                >
                  Dismiss
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

/**
 * Loading Error with Skeleton
 */
export function LoadingErrorWithSkeleton({ 
  onRetry, 
  skeletonCount = 3,
  showError = true,
  className = '' 
}) {
  return (
    <div className={className}>
      {/* Show skeleton loading state */}
      {Array.from({ length: skeletonCount }).map((_, index) => (
        <div key={index} className="animate-pulse mb-4">
          <div className="bg-muted h-48 rounded-lg mb-3"></div>
          <div className="bg-muted h-4 rounded w-3/4 mb-2"></div>
          <div className="bg-muted h-4 rounded w-1/2"></div>
        </div>
      ))}
      
      {/* Show error overlay */}
      {showError && (
        <div className="absolute inset-0 bg-background/90 flex items-center justify-center">
          <ErrorCard
            error={{
              title: 'Loading failed',
              message: 'Unable to load content. Please try again.'
            }}
            onRetry={onRetry}
            variant="warning"
          />
        </div>
      )}
    </div>
  );
}