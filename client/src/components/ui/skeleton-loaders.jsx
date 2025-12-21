/**
 * Skeleton Loading Components for Dashboard Sections
 * Provides consistent loading states across the application
 * Validates: Requirements 1.4, 7.5, 9.1, 9.2, 9.4
 */

import React from 'react';
import { Skeleton } from './skeleton';
import { cn } from '../../lib/utils';

/**
 * Profile Card Skeleton Loader
 */
export function ProfileCardSkeleton({ className = '' }) {
  return (
    <div className={cn("bg-gradient-to-br from-primary/80 to-primary/60 rounded-2xl p-6 h-full", className)}>
      <div className="flex items-center gap-4 mb-6">
        <Skeleton className="w-14 h-14 rounded-xl bg-white/20" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-32 bg-white/20" />
          <Skeleton className="h-4 w-40 bg-white/20" />
        </div>
      </div>
      
      <div className="bg-white/10 rounded-xl p-4 mb-5">
        <div className="flex justify-between mb-3">
          <Skeleton className="h-4 w-32 bg-white/20" />
          <Skeleton className="h-4 w-12 bg-white/20" />
        </div>
        <Skeleton className="h-2.5 w-full rounded-full bg-white/20" />
      </div>
      
      <Skeleton className="h-12 w-full rounded-xl bg-white/30" />
    </div>
  );
}

/**
 * Verification Section Skeleton Loader
 */
export function VerificationSectionSkeleton({ className = '' }) {
  return (
    <div className={cn("bg-card rounded-lg border border-border p-8", className)}>
      {/* Header */}
      <Skeleton className="h-6 w-48 mb-6" />
      
      {/* Verification items grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Skeleton className="w-4 h-4" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="w-5 h-5 rounded-full" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-3 w-40 mb-3" />
            <Skeleton className="h-8 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Security Section Skeleton Loader
 */
export function SecuritySectionSkeleton({ className = '' }) {
  return (
    <div className={cn("bg-card rounded-lg border border-border p-8", className)}>
      {/* Header */}
      <div className="mb-6">
        <Skeleton className="h-6 w-48 mb-2" />
        <Skeleton className="h-4 w-80" />
      </div>
      
      {/* Security actions grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div key={idx} className="border rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-lg">
                  <Skeleton className="w-5 h-5" />
                </div>
                <div>
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
              <Skeleton className="w-6 h-6" />
            </div>
          </div>
        ))}
      </div>
      
      {/* Security information */}
      <div className="p-4 bg-muted rounded-lg">
        <Skeleton className="h-5 w-40 mb-2" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="flex justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Properties Section Skeleton Loader
 */
export function PropertiesSectionSkeleton({ className = '', count = 3 }) {
  return (
    <div className={cn("bg-card rounded-lg border border-border p-8", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
      
      {/* Filter controls */}
      <div className="flex items-center gap-4 mb-6 p-4 bg-muted rounded-lg">
        <div className="flex items-center gap-2">
          <Skeleton className="w-4 h-4" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="w-4 h-4" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
      
      {/* Property cards */}
      <div className="space-y-4">
        {Array.from({ length: count }).map((_, idx) => (
          <div key={idx} className="border border-border rounded-lg p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                {/* Property image */}
                <Skeleton className="w-20 h-20 rounded-lg" />
                
                <div className="flex-1 space-y-3">
                  {/* Title and status */}
                  <div className="flex items-start justify-between">
                    <Skeleton className="h-5 w-64" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                  
                  {/* Property details */}
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  
                  {/* Metrics grid */}
                  <div className="grid grid-cols-4 gap-3">
                    {Array.from({ length: 4 }).map((_, metricIdx) => (
                      <div key={metricIdx} className="bg-muted rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Skeleton className="w-3 h-3" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                        <Skeleton className="h-5 w-12" />
                      </div>
                    ))}
                  </div>
                  
                  {/* Performance indicators */}
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </div>
                  
                  {/* Property type details */}
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
              </div>
              
              {/* Action menu */}
              <Skeleton className="w-8 h-8" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Stats Grid Skeleton Loader
 */
export function StatsGridSkeleton({ className = '' }) {
  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-3 gap-4 h-full", className)}>
      {Array.from({ length: 3 }).map((_, idx) => (
        <div key={idx} className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-start justify-between mb-4">
            <Skeleton className="w-12 h-12 rounded-xl" />
            <Skeleton className="w-5 h-5" />
          </div>
          <Skeleton className="h-4 w-24 mb-1" />
          <Skeleton className="h-8 w-16 mb-2" />
          <div className="flex items-center gap-1.5">
            <Skeleton className="w-3 h-3" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Dashboard Page Skeleton Loader
 */
export function DashboardSkeleton({ className = '' }) {
  return (
    <div className={cn("space-y-8", className)}>
      {/* Profile Card */}
      <ProfileCardSkeleton />
      
      {/* Stats Grid */}
      <StatsGridSkeleton />
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Verification Section */}
        <VerificationSectionSkeleton />
        
        {/* Security Section */}
        <SecuritySectionSkeleton />
      </div>
      
      {/* Properties Section */}
      <PropertiesSectionSkeleton />
    </div>
  );
}

/**
 * Generic Content Skeleton
 */
export function ContentSkeleton({ 
  lines = 3, 
  showImage = false, 
  showButton = false,
  className = '' 
}) {
  return (
    <div className={cn("space-y-4", className)}>
      {showImage && <Skeleton className="w-full h-48 rounded-lg" />}
      
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, idx) => (
          <Skeleton 
            key={idx} 
            className={cn(
              "h-4",
              idx === lines - 1 ? "w-3/4" : "w-full"
            )} 
          />
        ))}
      </div>
      
      {showButton && <Skeleton className="h-10 w-32" />}
    </div>
  );
}

/**
 * List Skeleton Loader
 */
export function ListSkeleton({ 
  count = 5, 
  showAvatar = false, 
  showActions = false,
  className = '' 
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="flex items-center gap-3 p-3 border rounded-lg">
          {showAvatar && <Skeleton className="w-10 h-10 rounded-full" />}
          
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          
          {showActions && <Skeleton className="w-8 h-8" />}
        </div>
      ))}
    </div>
  );
}

/**
 * Form Skeleton Loader
 */
export function FormSkeleton({ 
  fields = 3, 
  showSubmit = true,
  className = '' 
}) {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: fields }).map((_, idx) => (
        <div key={idx} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      
      {showSubmit && (
        <div className="flex gap-3 pt-4">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-20" />
        </div>
      )}
    </div>
  );
}