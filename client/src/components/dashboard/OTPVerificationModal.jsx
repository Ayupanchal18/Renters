import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog.jsx';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Loader2, Mail, Phone, CheckCircle, AlertCircle, Clock, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';
import { VerificationErrorBoundary, ErrorDisplay } from '../ui/error-boundary';
import { OTPProgress } from '../ui/progress-indicators';
import { 
  showSuccessToast,
  showErrorToast,
  OPERATION_CONTEXTS 
} from '../../utils/toastNotifications';
import { getToken } from '../../utils/auth';

const OTPVerificationModal = React.memo(({
  isOpen,
  type,
  contact,
  onClose,
  onSuccess,
  onError
}) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [localError, setLocalError] = useState('');
  const [success, setSuccess] = useState('');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [hasAutoSubmitted, setHasAutoSubmitted] = useState(false);
  const [currentStep, setCurrentStep] = useState('send'); // 'send' | 'verify' | 'complete'
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  
  const inputRefs = useRef([]);
  const debounceTimerRef = useRef(null);

  // Initialize input refs
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, 6);
  }, []);

  // Timer for OTP expiration
  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;

    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Send OTP when modal opens
  const sendOTP = useCallback(async () => {
    if (!contact || !type) return;
    
    setIsLoading(true);
    setLocalError('');
    setCurrentStep('send');
    
    try {
      const token = getToken();
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }

      const response = await fetch('/api/verification/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ type, contact })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to send OTP');
      }

      setCurrentStep('verify');
      setSuccess('Verification code sent successfully!');
      setTimeLeft(300); // 5 minutes
      setTimeout(() => setSuccess(''), 3000);
      
      // Focus first input
      setTimeout(() => {
        if (inputRefs.current[0]) {
          inputRefs.current[0].focus();
        }
      }, 100);

    } catch (error) {
      console.error('Send OTP error:', error);
      setLocalError(error.message || 'Failed to send verification code');
      setCurrentStep('send');
    } finally {
      setIsLoading(false);
    }
  }, [contact, type]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setOtp(['', '', '', '', '', '']);
      setLocalError('');
      setSuccess('');
      setTimeLeft(300);
      setResendCooldown(0);
      setHasAutoSubmitted(false);
      setCurrentStep('send');
      setIsLoading(false);
      setRetryCount(0);
      setIsRetrying(false);
      
      // Send OTP when modal opens
      sendOTP();
    }
  }, [isOpen, sendOTP]);

  // Handle OTP expiration
  useEffect(() => {
    if (timeLeft === 0 && isOpen) {
      console.log('OTP expired for type:', type);
    }
  }, [timeLeft, isOpen, type]);


  // OTP verification handler - must be defined before debouncedVerifyOtp
  const handleVerifyOtp = useCallback(async (otpCode = otp.join('')) => {
    if (otpCode.length !== 6) {
      setLocalError('Please enter all 6 digits');
      return;
    }

    setLocalError('');
    setHasAutoSubmitted(true);
    setIsLoading(true);

    try {
      const token = getToken();
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }

      const response = await fetch('/api/verification/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ type, contact, otp: otpCode })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Verification failed');
      }

      if (data.success && data.verified) {
        setCurrentStep('complete');
        setSuccess(`${type === 'email' ? 'Email' : 'Phone'} verified successfully!`);
        
        // Show success toast
        const context = type === 'email' ? OPERATION_CONTEXTS.EMAIL_VERIFICATION : OPERATION_CONTEXTS.PHONE_VERIFICATION;
        showSuccessToast(
          `${type === 'email' ? 'Email' : 'Phone'} verified successfully`,
          context
        );

        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 1500);
      } else {
        throw new Error(data.message || 'Verification failed');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      setLocalError(error.message || 'Verification failed. Please try again.');
      setOtp(['', '', '', '', '', '']);
      setHasAutoSubmitted(false);
      inputRefs.current[0]?.focus();
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [otp, type, contact, onSuccess, onClose, onError]);

  // Simple debounced verification using setTimeout
  const debouncedVerifyOtp = useCallback((otpCode) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      handleVerifyOtp(otpCode);
    }, 300);
  }, [handleVerifyOtp]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleOtpChange = useCallback((index, value) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setLocalError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all fields are filled (only if not already auto-submitted)
    if (newOtp.every(digit => digit !== '') && value && !hasAutoSubmitted) {
      debouncedVerifyOtp(newOtp.join(''));
    }
  }, [otp, hasAutoSubmitted, debouncedVerifyOtp]);

  const handleKeyDown = useCallback((index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }, [otp]);

  const handlePaste = useCallback((e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    
    if (pastedData.length === 6) {
      const newOtp = pastedData.split('');
      setOtp(newOtp);
      setLocalError('');
      debouncedVerifyOtp(pastedData);
    }
  }, [debouncedVerifyOtp]);

  const handleResendOtp = useCallback(async () => {
    if (resendCooldown > 0) return;

    setLocalError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const token = getToken();
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }

      const response = await fetch('/api/verification/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ type, contact })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to resend OTP');
      }
      
      setCurrentStep('verify');
      setSuccess('New verification code sent successfully!');
      setTimeLeft(300);
      setResendCooldown(60); // 1 minute cooldown
      setOtp(['', '', '', '', '', '']);
      setHasAutoSubmitted(false);
      inputRefs.current[0]?.focus();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Resend OTP error:', error);
      setLocalError(error.message || 'Failed to resend code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [resendCooldown, type, contact]);

  const formatTime = useCallback((seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  const getContactDisplay = useMemo(() => {
    if (type === 'email') {
      return contact;
    } else {
      // Mask phone number for privacy
      return contact?.replace(/(\+?\d{1,3})\d+(\d{4})/, '$1****$2') || '';
    }
  }, [type, contact]);

  // Combine local errors
  const displayError = localError;

  const getIcon = useMemo(() => {
    if (success) return <CheckCircle className="h-6 w-6 text-green-600" />;
    if (displayError) return <AlertCircle className="h-6 w-6 text-red-600" />;
    return type === 'email' ? 
      <Mail className="h-6 w-6 text-blue-600" /> : 
      <Phone className="h-6 w-6 text-blue-600" />;
  }, [success, displayError, type]);


  return (
    <VerificationErrorBoundary
      context="otp-verification"
      onRetry={() => {
        setLocalError('');
        setOtp(['', '', '', '', '', '']);
        setHasAutoSubmitted(false);
        inputRefs.current[0]?.focus();
      }}
      onCancel={onClose}
    >
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="flex justify-center mb-4">
              {getIcon}
            </div>
            <DialogTitle className="text-xl font-semibold">
              Verify Your {type === 'email' ? 'Email' : 'Phone Number'}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              We've sent a 6-digit verification code to{' '}
              <span className="font-medium text-foreground">{getContactDisplay}</span>
            </DialogDescription>
          </DialogHeader>

          {/* Progress Indicator */}
          <OTPProgress
            currentStep={currentStep}
            isLoading={isLoading}
            error={displayError}
          />

        <div className="space-y-6">
          {/* Success Message */}
          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 rounded-lg">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
              <span className="text-sm text-green-800 dark:text-green-200">{success}</span>
            </div>
          )}

          {/* Error Message */}
          {displayError && (
            <ErrorDisplay
              error={displayError}
              variant="inline"
              onRetry={() => handleVerifyOtp()}
              onDismiss={() => {
                setLocalError('');
              }}
            />
          )}

          {/* Retry Information */}
          {isRetrying && retryCount > 0 && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg">
              <RefreshCw className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-spin flex-shrink-0" />
              <span className="text-sm text-blue-800 dark:text-blue-200">
                Retrying verification... (attempt {retryCount})
              </span>
            </div>
          )}

          {/* OTP Input */}
          <div className="space-y-4">
            <div className="flex justify-center gap-2">
              {otp.map((digit, index) => (
                <Input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className={cn(
                    "w-12 h-12 text-center text-lg font-semibold border-input bg-background text-foreground",
                    displayError && "border-red-300 dark:border-red-700 focus:border-red-500 focus:ring-red-500",
                    success && "border-green-300 dark:border-green-700 focus:border-green-500 focus:ring-green-500"
                  )}
                  disabled={isLoading || success}
                />
              ))}
            </div>

            {/* Timer */}
            <div className="text-center">
              {timeLeft > 0 ? (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Code expires in {formatTime(timeLeft)}</span>
                </div>
              ) : (
                <div className="text-sm text-red-600 dark:text-red-400">
                  Code has expired. Please request a new one.
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => handleVerifyOtp()}
              disabled={isLoading || otp.some(digit => !digit) || success}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Verifying...
                </>
              ) : (
                'Verify Code'
              )}
            </Button>

            <Button
              variant="outline"
              onClick={handleResendOtp}
              disabled={(resendCooldown > 0) || success || isLoading}
              className="w-full"
            >
              {isLoading && !hasAutoSubmitted ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Sending...
                </>
              ) : resendCooldown > 0 ? (
                `Resend in ${resendCooldown}s`
              ) : (
                'Resend Code'
              )}
            </Button>

            <Button
              variant="ghost"
              onClick={onClose}
              disabled={isLoading}
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </VerificationErrorBoundary>
  );
});

export default OTPVerificationModal;
