/**
 * Progress Indicator Components for Multi-step Flows
 * Provides visual feedback for verification and security operations
 * Validates: Requirements 9.1, 9.2, 9.4
 */

import React from 'react';
import { CheckCircle, Circle, Loader2, AlertCircle, Clock, ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * Step Status Types
 */
export const STEP_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active', 
  LOADING: 'loading',
  COMPLETED: 'completed',
  ERROR: 'error',
  SKIPPED: 'skipped'
};

/**
 * Multi-step Progress Indicator
 */
export function StepProgress({ 
  steps = [], 
  currentStep = 0, 
  className = '',
  orientation = 'horizontal' // 'horizontal' | 'vertical'
}) {
  const isHorizontal = orientation === 'horizontal';
  
  return (
    <div className={cn(
      "flex",
      isHorizontal ? "items-center justify-between" : "flex-col space-y-4",
      className
    )}>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        const stepStatus = getStepStatus(step, index, currentStep);
        
        return (
          <div key={index} className={cn(
            "flex items-center",
            isHorizontal ? "flex-1" : "w-full"
          )}>
            {/* Step Circle */}
            <div className="flex items-center">
              <StepCircle 
                status={stepStatus}
                stepNumber={index + 1}
                title={step.title}
                description={step.description}
              />
              
              {/* Step Label (for vertical layout) */}
              {!isHorizontal && (
                <div className="ml-4 flex-1">
                  <div className={cn(
                    "text-sm font-medium",
                    stepStatus === STEP_STATUS.COMPLETED && "text-emerald-700",
                    stepStatus === STEP_STATUS.ACTIVE && "text-primary",
                    stepStatus === STEP_STATUS.ERROR && "text-destructive",
                    stepStatus === STEP_STATUS.PENDING && "text-muted-foreground"
                  )}>
                    {step.title}
                  </div>
                  {step.description && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {step.description}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Connector Line */}
            {!isLast && (
              <div className={cn(
                isHorizontal ? "flex-1 h-px mx-4" : "w-px h-8 ml-4",
                stepStatus === STEP_STATUS.COMPLETED ? "bg-emerald-300" : "bg-border"
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Individual Step Circle Component
 */
function StepCircle({ status, stepNumber, title, description }) {
  const getIcon = () => {
    switch (status) {
      case STEP_STATUS.COMPLETED:
        return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      case STEP_STATUS.LOADING:
        return <Loader2 className="w-5 h-5 text-primary animate-spin" />;
      case STEP_STATUS.ERROR:
        return <AlertCircle className="w-5 h-5 text-destructive" />;
      case STEP_STATUS.ACTIVE:
        return (
          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-primary-foreground" />
          </div>
        );
      default:
        return (
          <div className="w-5 h-5 rounded-full border-2 border-border flex items-center justify-center">
            <span className="text-xs font-medium text-muted-foreground">{stepNumber}</span>
          </div>
        );
    }
  };

  const getCircleClasses = () => {
    const baseClasses = "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all";
    
    switch (status) {
      case STEP_STATUS.COMPLETED:
        return cn(baseClasses, "bg-emerald-50 border-emerald-300");
      case STEP_STATUS.LOADING:
      case STEP_STATUS.ACTIVE:
        return cn(baseClasses, "bg-primary/10 border-primary/30");
      case STEP_STATUS.ERROR:
        return cn(baseClasses, "bg-destructive/10 border-destructive/30");
      default:
        return cn(baseClasses, "bg-muted border-border");
    }
  };

  return (
    <div className="relative group">
      <div className={getCircleClasses()}>
        {getIcon()}
      </div>
      
      {/* Tooltip */}
      {(title || description) && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
          <div className="bg-popover text-popover-foreground text-xs rounded-lg px-3 py-2 whitespace-nowrap border shadow-md">
            {title && <div className="font-medium">{title}</div>}
            {description && <div className="text-muted-foreground">{description}</div>}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-popover" />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * OTP Verification Progress
 */
export function OTPProgress({ 
  currentStep = 'send', // 'send' | 'verify' | 'complete'
  isLoading = false,
  error = null,
  className = ''
}) {
  const steps = [
    {
      id: 'send',
      title: 'Send Code',
      description: 'Sending verification code'
    },
    {
      id: 'verify', 
      title: 'Enter Code',
      description: 'Enter the 6-digit code'
    },
    {
      id: 'complete',
      title: 'Verified',
      description: 'Verification complete'
    }
  ];

  const getCurrentStepIndex = () => {
    return steps.findIndex(step => step.id === currentStep);
  };

  const getStepStatus = (step, index) => {
    const currentIndex = getCurrentStepIndex();
    
    if (error && index === currentIndex) {
      return STEP_STATUS.ERROR;
    }
    
    if (isLoading && index === currentIndex) {
      return STEP_STATUS.LOADING;
    }
    
    if (index < currentIndex) {
      return STEP_STATUS.COMPLETED;
    }
    
    if (index === currentIndex) {
      return STEP_STATUS.ACTIVE;
    }
    
    return STEP_STATUS.PENDING;
  };

  return (
    <div className={cn("mb-6", className)}>
      <StepProgress
        steps={steps.map((step, index) => ({
          ...step,
          status: getStepStatus(step, index)
        }))}
        currentStep={getCurrentStepIndex()}
        orientation="horizontal"
      />
      
      {error && (
        <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-destructive" />
            <span className="text-sm text-destructive">{error}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Security Operation Progress
 */
export function SecurityProgress({ 
  operation = 'password', // 'password' | 'phone' | 'delete'
  currentStep = 'authenticate',
  isLoading = false,
  error = null,
  className = ''
}) {
  const getSteps = () => {
    switch (operation) {
      case 'password':
        return [
          { id: 'authenticate', title: 'Verify Identity', description: 'Enter current password' },
          { id: 'validate', title: 'New Password', description: 'Set new password' },
          { id: 'complete', title: 'Updated', description: 'Password changed' }
        ];
      case 'phone':
        return [
          { id: 'authenticate', title: 'Verify Identity', description: 'Enter current password' },
          { id: 'verify', title: 'Verify Phone', description: 'Enter OTP code' },
          { id: 'complete', title: 'Updated', description: 'Phone number changed' }
        ];
      case 'delete':
        return [
          { id: 'authenticate', title: 'Verify Identity', description: 'Enter password' },
          { id: 'confirm', title: 'Confirm Deletion', description: 'Type confirmation' },
          { id: 'complete', title: 'Deleted', description: 'Account deleted' }
        ];
      default:
        return [];
    }
  };

  const steps = getSteps();
  const getCurrentStepIndex = () => {
    return steps.findIndex(step => step.id === currentStep);
  };

  return (
    <div className={cn("mb-6", className)}>
      <StepProgress
        steps={steps.map((step, index) => {
          const currentIndex = getCurrentStepIndex();
          let status = STEP_STATUS.PENDING;
          
          if (error && index === currentIndex) {
            status = STEP_STATUS.ERROR;
          } else if (isLoading && index === currentIndex) {
            status = STEP_STATUS.LOADING;
          } else if (index < currentIndex) {
            status = STEP_STATUS.COMPLETED;
          } else if (index === currentIndex) {
            status = STEP_STATUS.ACTIVE;
          }
          
          return { ...step, status };
        })}
        currentStep={getCurrentStepIndex()}
        orientation="horizontal"
      />
    </div>
  );
}

/**
 * Linear Progress Bar
 */
export function LinearProgress({ 
  value = 0, 
  max = 100, 
  showLabel = true,
  label = '',
  variant = 'default', // 'default' | 'success' | 'warning' | 'error'
  className = ''
}) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  const getVariantClasses = () => {
    switch (variant) {
      case 'success':
        return 'bg-emerald-500';
      case 'warning':
        return 'bg-warning';
      case 'error':
        return 'bg-destructive';
      default:
        return 'bg-primary';
    }
  };

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-foreground">
            {label || 'Progress'}
          </span>
          <span className="text-sm text-muted-foreground">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
      
      <div className="w-full bg-muted rounded-full h-2">
        <div 
          className={cn(
            "h-2 rounded-full transition-all duration-300 ease-out",
            getVariantClasses()
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Circular Progress Indicator
 */
export function CircularProgress({ 
  value = 0, 
  max = 100, 
  size = 'md', // 'sm' | 'md' | 'lg'
  showLabel = true,
  label = '',
  variant = 'default',
  className = ''
}) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-12 h-12';
      case 'lg':
        return 'w-20 h-20';
      default:
        return 'w-16 h-16';
    }
  };

  const getVariantColor = () => {
    switch (variant) {
      case 'success':
        return 'stroke-green-500';
      case 'warning':
        return 'stroke-yellow-500';
      case 'error':
        return 'stroke-red-500';
      default:
        return 'stroke-blue-500';
    }
  };

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className={cn("relative", getSizeClasses())}>
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-muted"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={cn("transition-all duration-300 ease-out", getVariantColor())}
          />
        </svg>
        
        {/* Center label */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-semibold text-foreground">
            {Math.round(percentage)}%
          </span>
        </div>
      </div>
      
      {showLabel && label && (
        <span className="mt-2 text-sm text-muted-foreground text-center">
          {label}
        </span>
      )}
    </div>
  );
}

/**
 * Utility function to determine step status
 */
function getStepStatus(step, index, currentStep) {
  if (step.status) {
    return step.status;
  }
  
  if (index < currentStep) {
    return STEP_STATUS.COMPLETED;
  } else if (index === currentStep) {
    return STEP_STATUS.ACTIVE;
  } else {
    return STEP_STATUS.PENDING;
  }
}