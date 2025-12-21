/**
 * Property-specific Loading State Components
 * Provides loading indicators for property page operations
 * Validates: Requirements 6.1
 */


import React from 'react';
import { Loader2, Image, MapPin, DollarSign, User, Home } from 'lucide-react';
import { Card } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { LoadingSpinner, PageLoading } from '../ui/loading-states';

/**
 * Property Page Loading State
 */
export function PropertyPageLoading({ className = '' }) {
  return (
    <PageLoading
      title="Loading Property Details"
      description="Please wait while we fetch the property information and images."
      className={className}
    />
  );
}

/**
 * Property Card Loading Skeleton
 */
export function PropertyCardSkeleton({ className = '' }) {
  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
        
        {/* Price */}
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        
        {/* Quick facts */}
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-6 w-12" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
        
        {/* Buttons */}
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </Card>
  );
}

/**
 * Property Gallery Loading State
 */
export function PropertyGalleryLoading({ className = '' }) {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main image */}
      <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <Image className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <LoadingSpinner size="md" />
          <p className="text-sm text-gray-500 mt-2">Loading images...</p>
        </div>
      </div>
      
      {/* Thumbnail strip */}
      <div className="flex gap-2 overflow-hidden">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="w-16 h-16 rounded flex-shrink-0" />
        ))}
      </div>
    </div>
  );
}

/**
 * Property Details Loading State
 */
export function PropertyDetailsLoading({ className = '' }) {
  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-6">
        {/* Section header */}
        <div className="flex items-center gap-2">
          <Home className="w-5 h-5 text-gray-400" />
          <Skeleton className="h-6 w-32" />
        </div>
        
        {/* Description */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        
        {/* Specifications */}
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="space-y-1">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-16" />
            </div>
          ))}
        </div>
        
        {/* Amenities */}
        <div className="space-y-3">
          <Skeleton className="h-5 w-24" />
          <div className="grid grid-cols-2 gap-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

/**
 * Financial Details Loading State
 */
export function FinancialDetailsLoading({ className = '' }) {
  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-4">
        {/* Section header */}
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-gray-400" />
          <Skeleton className="h-6 w-40" />
        </div>
        
        {/* Price breakdown */}
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex justify-between items-center">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-20" />
            </div>
          ))}
        </div>
        
        {/* Total */}
        <div className="border-t pt-3">
          <div className="flex justify-between items-center">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-6 w-24" />
          </div>
        </div>
      </div>
    </Card>
  );
}

/**
 * Property Location Loading State
 */
export function PropertyLocationLoading({ className = '' }) {
  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-4">
        {/* Section header */}
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-gray-400" />
          <Skeleton className="h-6 w-24" />
        </div>
        
        {/* Address */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        
        {/* Map placeholder */}
        <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <LoadingSpinner size="md" />
            <p className="text-sm text-gray-500 mt-2">Loading map...</p>
          </div>
        </div>
      </div>
    </Card>
  );
}

/**
 * Owner Contact Loading State
 */
export function OwnerContactLoading({ className = '' }) {
  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-4">
        {/* Section header */}
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-gray-400" />
          <Skeleton className="h-6 w-20" />
        </div>
        
        {/* Owner info */}
        <div className="flex items-center gap-3">
          <Skeleton className="w-12 h-12 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        
        {/* Contact methods */}
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
              <Skeleton className="w-5 h-5" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

/**
 * Nearby Recommendations Loading State
 */
export function NearbyRecommendationsLoading({ className = '' }) {
  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-4">
        {/* Section header */}
        <Skeleton className="h-6 w-48" />
        
        {/* Recommendations list */}
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
              <Skeleton className="w-10 h-10 rounded" />
              <div className="space-y-1 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

/**
 * Property Action Loading State
 */
export function PropertyActionLoading({ 
  action = 'Processing',
  className = '' 
}) {
  return (
    <div className={`flex items-center justify-center p-4 bg-blue-50 border border-blue-200 rounded-lg ${className}`}>
      <LoadingSpinner size="sm" variant="primary" className="mr-3" />
      <span className="text-sm font-medium text-blue-800">
        {action}...
      </span>
    </div>
  );
}

/**
 * Property Update Loading Overlay
 */
export function PropertyUpdateLoading({ 
  isVisible = false,
  message = 'Updating property information...',
  className = '' 
}) {
  if (!isVisible) return null;

  return (
    <div className={`absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50 rounded-lg ${className}`}>
      <div className="text-center">
        <LoadingSpinner size="lg" variant="primary" className="mb-3" />
        <p className="text-sm font-medium text-gray-700">{message}</p>
      </div>
    </div>
  );
}

/**
 * Batch Property Loading State
 */
export function BatchPropertyLoading({ 
  current = 0,
  total = 0,
  currentItem = '',
  className = '' 
}) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Loading Properties</h3>
          <span className="text-sm text-gray-500">
            {current} of {total}
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
        
        {currentItem && (
          <p className="text-sm text-gray-600">
            Loading: {currentItem}
          </p>
        )}
        
        <div className="flex items-center justify-center">
          <LoadingSpinner size="md" variant="primary" />
        </div>
      </div>
    </Card>
  );
}