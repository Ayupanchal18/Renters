/**
 * Property-specific Error Handler Component
 * Handles property page specific errors with appropriate recovery options
 * Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5
 */

import React from 'react';
import { AlertTriangle, RefreshCw, ArrowLeft, Home, Search } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { createUserFriendlyError, categorizeError } from '../../utils/errorHandling';

/**
 * Property Not Found Error Component
 */
export function PropertyNotFoundError({ onRetry, onGoBack, onGoHome, className = '' }) {
  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <Search className="w-10 h-10 text-gray-400" />
      </div>
      
      <h2 className="text-2xl font-semibold text-gray-900 mb-3">
        Property Not Found
      </h2>
      
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        The property you're looking for doesn't exist or may have been removed. 
        Please check the URL or try searching for other properties.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {onGoBack && (
          <Button variant="outline" onClick={onGoBack} className="flex items-center">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        )}
        
        {onRetry && (
          <Button onClick={onRetry} className="flex items-center">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        )}
        
        {onGoHome && (
          <Button variant="outline" onClick={onGoHome} className="flex items-center">
            <Home className="w-4 h-4 mr-2" />
            Browse Properties
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Property Loading Error Component
 */
export function PropertyLoadingError({ 
  error, 
  onRetry, 
  onGoBack, 
  onGoHome,
  retryAttempt = 0,
  maxRetries = 3,
  className = '' 
}) {
  const categorized = categorizeError(error);
  const userError = createUserFriendlyError(error, 'property-load');

  const getErrorSpecificMessage = () => {
    switch (categorized.type) {
      case 'NETWORK':
        return 'Unable to connect to our servers. Please check your internet connection.';
      case 'TIMEOUT':
        return 'The request is taking too long. Our servers might be busy.';
      case 'SERVER':
        return 'Our servers are experiencing issues. Please try again in a few moments.';
      case 'NOT_FOUND':
        return 'This property could not be found. It may have been removed or the link is incorrect.';
      default:
        return 'Something went wrong while loading the property details.';
    }
  };

  const showRetryOption = categorized.retryable && retryAttempt < maxRetries;

  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <AlertTriangle className="w-10 h-10 text-red-600" />
      </div>
      
      <h2 className="text-2xl font-semibold text-gray-900 mb-3">
        {userError.title}
      </h2>
      
      <p className="text-gray-600 mb-2 max-w-md mx-auto">
        {getErrorSpecificMessage()}
      </p>
      
      {retryAttempt > 0 && (
        <p className="text-sm text-gray-500 mb-6">
          Retry attempt {retryAttempt} of {maxRetries}
        </p>
      )}
      
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {onGoBack && (
          <Button variant="outline" onClick={onGoBack} className="flex items-center">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        )}
        
        {showRetryOption && onRetry && (
          <Button onClick={onRetry} className="flex items-center">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        )}
        
        {onGoHome && (
          <Button variant="outline" onClick={onGoHome} className="flex items-center">
            <Home className="w-4 h-4 mr-2" />
            Browse Properties
          </Button>
        )}
      </div>
      
      {import.meta.env.DEV && error?.stack && (
        <details className="mt-8 text-left max-w-2xl mx-auto">
          <summary className="text-sm text-gray-500 cursor-pointer mb-2">
            Technical Details (Development)
          </summary>
          <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto max-h-40 text-left">
            {error.stack}
          </pre>
        </details>
      )}
    </div>
  );
}

/**
 * Property Component Error Fallback
 */
export function PropertyComponentError({ 
  componentName = 'component',
  error, 
  onRetry, 
  onSkip,
  className = '' 
}) {
  const userError = createUserFriendlyError(error, 'property-component');

  return (
    <Card className={`p-6 border-red-200 bg-red-50 ${className}`}>
      <div className="flex items-start">
        <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
        
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800 mb-1">
            Error loading {componentName}
          </h3>
          <p className="text-sm text-red-700 mb-3">
            {userError.message}
          </p>
          
          <div className="flex gap-2">
            {onRetry && userError.retryable && (
              <Button
                size="sm"
                variant="outline"
                onClick={onRetry}
                className="text-red-700 border-red-300 hover:bg-red-100"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Retry
              </Button>
            )}
            
            {onSkip && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onSkip}
                className="text-red-700 hover:bg-red-100"
              >
                Skip Section
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

/**
 * Property Image Loading Error
 */
export function PropertyImageError({ 
  onRetry, 
  onUseDefault,
  className = '' 
}) {
  return (
    <div className={`bg-gray-100 rounded-lg p-8 text-center ${className}`}>
      <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      
      <h3 className="text-lg font-medium text-gray-700 mb-2">
        Images Unavailable
      </h3>
      
      <p className="text-gray-600 mb-4">
        Property images could not be loaded.
      </p>
      
      <div className="flex gap-2 justify-center">
        {onRetry && (
          <Button
            size="sm"
            variant="outline"
            onClick={onRetry}
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Retry
          </Button>
        )}
        
        {onUseDefault && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onUseDefault}
          >
            Use Default
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Property Data Validation Error
 */
export function PropertyDataError({ 
  missingFields = [],
  onRefresh,
  onContinue,
  className = '' 
}) {
  return (
    <Card className={`p-6 border-yellow-200 bg-yellow-50 ${className}`}>
      <div className="flex items-start">
        <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
        
        <div className="flex-1">
          <h3 className="text-sm font-medium text-yellow-800 mb-1">
            Incomplete Property Information
          </h3>
          
          <p className="text-sm text-yellow-700 mb-2">
            Some property details are missing or incomplete:
          </p>
          
          {missingFields.length > 0 && (
            <ul className="text-sm text-yellow-700 mb-3 list-disc list-inside">
              {missingFields.map((field, index) => (
                <li key={index}>{field}</li>
              ))}
            </ul>
          )}
          
          <div className="flex gap-2">
            {onRefresh && (
              <Button
                size="sm"
                variant="outline"
                onClick={onRefresh}
                className="text-yellow-700 border-yellow-300 hover:bg-yellow-100"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Refresh Data
              </Button>
            )}
            
            {onContinue && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onContinue}
                className="text-yellow-700 hover:bg-yellow-100"
              >
                Continue Anyway
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

/**
 * Network Connection Error for Property Page
 */
export function PropertyNetworkError({ 
  onRetry, 
  onOfflineMode,
  className = '' 
}) {
  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <AlertTriangle className="w-10 h-10 text-blue-600" />
      </div>
      
      <h2 className="text-2xl font-semibold text-gray-900 mb-3">
        Connection Problem
      </h2>
      
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        Unable to connect to our servers. Please check your internet connection and try again.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {onRetry && (
          <Button onClick={onRetry} className="flex items-center">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        )}
        
        {onOfflineMode && (
          <Button variant="outline" onClick={onOfflineMode} className="flex items-center">
            View Cached Data
          </Button>
        )}
      </div>
      
      <div className="mt-8 text-sm text-gray-500">
        <p>Troubleshooting tips:</p>
        <ul className="mt-2 space-y-1">
          <li>• Check your internet connection</li>
          <li>• Try refreshing the page</li>
          <li>• Clear your browser cache</li>
        </ul>
      </div>
    </div>
  );
}