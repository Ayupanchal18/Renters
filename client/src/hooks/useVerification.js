import { useState, useCallback } from 'react';
import { useSendOTP, useVerifyOTP } from './useAPI';
import {
    showSuccessToast,
    showErrorToast,
    showRateLimitToast,
    showOTPExpirationToast,
    OPERATION_CONTEXTS
} from '../utils/toastNotifications';
import {
    createOTPSendRetry,
    createOTPVerifyRetry,
    executeWithCircuitBreaker
} from '../utils/retryMechanisms';
import { categorizeError } from '../utils/errorHandling';

/**
 * Custom hook for managing verification operations (email and phone)
 * Provides state management and operations for OTP-based verification flows
 * Enhanced with error handling, retry mechanisms, and user feedback
 */
export function useVerification() {
    const [verificationState, setVerificationState] = useState({
        isLoading: false,
        error: null,
        otpSent: false,
        otpExpiry: null,
        attempts: 0,
        maxAttempts: 5,
        cooldownUntil: null,
        lastOperationType: null,
        retryCount: 0
    });

    const sendOTPMutation = useSendOTP();
    const verifyOTPMutation = useVerifyOTP();

    // Create retry-enabled OTP operations
    const sendOTPWithRetry = useCallback(
        createOTPSendRetry(
            async (type, contact) => {
                return sendOTPMutation.mutateAsync({ type, contact });
            },
            {
                onRetryAttempt: (error, attempt, delay) => {
                    setVerificationState(prev => ({
                        ...prev,
                        retryCount: attempt,
                        error: `Retrying... (attempt ${attempt})`
                    }));
                }
            }
        ),
        [sendOTPMutation]
    );

    const verifyOTPWithRetry = useCallback(
        createOTPVerifyRetry(
            async (type, contact, otp) => {
                return verifyOTPMutation.mutateAsync({ type, contact, otp });
            },
            {
                onRetryAttempt: (error, attempt, delay) => {
                    setVerificationState(prev => ({
                        ...prev,
                        retryCount: attempt,
                        error: `Retrying verification... (attempt ${attempt})`
                    }));
                }
            }
        ),
        [verifyOTPMutation]
    );

    // Send OTP for verification with enhanced error handling
    const sendOTP = useCallback(async (type, contact) => {
        try {
            setVerificationState(prev => ({
                ...prev,
                isLoading: true,
                error: null,
                lastOperationType: 'send',
                retryCount: 0
            }));

            const result = await executeWithCircuitBreaker(
                () => sendOTPWithRetry(type, contact),
                'otpSend'
            );

            if (result.success) {
                setVerificationState(prev => ({
                    ...prev,
                    isLoading: false,
                    otpSent: true,
                    otpExpiry: result.expiresAt ? new Date(result.expiresAt) : null,
                    attempts: 0,
                    retryCount: 0
                }));

                // Show success toast
                const context = type === 'email' ? OPERATION_CONTEXTS.EMAIL_VERIFICATION : OPERATION_CONTEXTS.PHONE_VERIFICATION;
                showSuccessToast(
                    result.message || `Verification code sent to your ${type}`,
                    OPERATION_CONTEXTS.OTP_SEND,
                    {
                        title: `Code Sent`,
                        duration: 4000
                    }
                );

                return { success: true, message: result.message };
            } else {
                throw new Error(result.message || 'Failed to send OTP');
            }
        } catch (error) {
            const categorized = categorizeError(error);
            const errorMessage = error.message || 'Failed to send verification code';

            setVerificationState(prev => ({
                ...prev,
                isLoading: false,
                error: errorMessage,
                retryCount: 0
            }));

            // Handle rate limiting
            if (error.response?.status === 429) {
                const retryAfter = error.response.data?.retryAfter || 60;
                showRateLimitToast(retryAfter, OPERATION_CONTEXTS.OTP_SEND);

                setVerificationState(prev => ({
                    ...prev,
                    cooldownUntil: new Date(Date.now() + retryAfter * 1000)
                }));
            } else {
                // Show error toast with retry option if retryable
                const context = type === 'email' ? OPERATION_CONTEXTS.EMAIL_VERIFICATION : OPERATION_CONTEXTS.PHONE_VERIFICATION;
                showErrorToast(
                    errorMessage,
                    OPERATION_CONTEXTS.OTP_SEND,
                    {
                        title: 'Failed to Send Code',
                        onRetry: categorized.retryable ? () => sendOTP(type, contact) : undefined,
                        duration: 8000
                    }
                );
            }

            return { success: false, error: errorMessage };
        }
    }, [sendOTPWithRetry]);

    // Verify OTP with enhanced error handling
    const verifyOTP = useCallback(async (type, contact, otp) => {
        try {
            setVerificationState(prev => ({
                ...prev,
                isLoading: true,
                error: null,
                lastOperationType: 'verify',
                retryCount: 0
            }));

            const result = await executeWithCircuitBreaker(
                () => verifyOTPWithRetry(type, contact, otp),
                'otpVerify'
            );

            if (result.success && result.verified) {
                setVerificationState(prev => ({
                    ...prev,
                    isLoading: false,
                    otpSent: false,
                    attempts: 0,
                    retryCount: 0
                }));

                // Show success toast
                const context = type === 'email' ? OPERATION_CONTEXTS.EMAIL_VERIFICATION : OPERATION_CONTEXTS.PHONE_VERIFICATION;
                showSuccessToast(
                    result.message || `${type === 'email' ? 'Email' : 'Phone'} verified successfully`,
                    context,
                    {
                        duration: 5000
                    }
                );

                return { success: true, message: result.message };
            } else {
                // Increment attempts on failure
                setVerificationState(prev => {
                    const newAttempts = prev.attempts + 1;
                    const shouldCooldown = newAttempts >= prev.maxAttempts;

                    return {
                        ...prev,
                        isLoading: false,
                        attempts: newAttempts,
                        error: result.message || 'Invalid verification code',
                        cooldownUntil: shouldCooldown ? new Date(Date.now() + 15 * 60 * 1000) : null, // 15 minutes
                        retryCount: 0
                    };
                });

                // Show error toast
                showErrorToast(
                    result.message || 'Invalid verification code',
                    OPERATION_CONTEXTS.OTP_VERIFY,
                    {
                        title: 'Verification Failed',
                        duration: 6000
                    }
                );

                return {
                    success: false,
                    error: result.message || 'Invalid verification code',
                    attemptsRemaining: Math.max(0, verificationState.maxAttempts - (verificationState.attempts + 1))
                };
            }
        } catch (error) {
            const categorized = categorizeError(error);
            const errorMessage = error.message || 'Verification failed';

            setVerificationState(prev => ({
                ...prev,
                isLoading: false,
                error: errorMessage,
                attempts: prev.attempts + 1,
                retryCount: 0
            }));

            // Handle rate limiting
            if (error.response?.status === 429) {
                const retryAfter = error.response.data?.retryAfter || 60;
                showRateLimitToast(retryAfter, OPERATION_CONTEXTS.OTP_VERIFY);

                setVerificationState(prev => ({
                    ...prev,
                    cooldownUntil: new Date(Date.now() + retryAfter * 1000)
                }));
            } else {
                // Show error toast with retry option if retryable and not a validation error
                if (categorized.type !== 'VALIDATION') {
                    showErrorToast(
                        errorMessage,
                        OPERATION_CONTEXTS.OTP_VERIFY,
                        {
                            title: 'Verification Error',
                            onRetry: categorized.retryable ? () => verifyOTP(type, contact, otp) : undefined,
                            duration: 8000
                        }
                    );
                }
            }

            return { success: false, error: errorMessage };
        }
    }, [verifyOTPWithRetry, verificationState.maxAttempts, verificationState.attempts]);

    // Reset verification state
    const resetVerification = useCallback(() => {
        setVerificationState({
            isLoading: false,
            error: null,
            otpSent: false,
            otpExpiry: null,
            attempts: 0,
            maxAttempts: 5,
            cooldownUntil: null
        });
    }, []);

    // Check if OTP has expired
    const isOTPExpired = useCallback(() => {
        if (!verificationState.otpExpiry) return false;
        return new Date() > verificationState.otpExpiry;
    }, [verificationState.otpExpiry]);

    // Check if in cooldown period
    const isInCooldown = useCallback(() => {
        if (!verificationState.cooldownUntil) return false;
        return new Date() < verificationState.cooldownUntil;
    }, [verificationState.cooldownUntil]);

    // Get remaining cooldown time in seconds
    const getCooldownRemaining = useCallback(() => {
        if (!verificationState.cooldownUntil) return 0;
        const remaining = Math.max(0, Math.floor((verificationState.cooldownUntil - new Date()) / 1000));
        return remaining;
    }, [verificationState.cooldownUntil]);

    // Get remaining OTP time in seconds
    const getOTPTimeRemaining = useCallback(() => {
        if (!verificationState.otpExpiry) return 0;
        const remaining = Math.max(0, Math.floor((verificationState.otpExpiry - new Date()) / 1000));
        return remaining;
    }, [verificationState.otpExpiry]);

    // Handle OTP expiration with user notification
    const handleOTPExpiration = useCallback((type) => {
        showOTPExpirationToast(type, () => {
            // Auto-retry sending OTP when user clicks resend from toast
            const contact = verificationState.lastContact || '';
            if (contact) {
                sendOTP(type, contact);
            }
        });
    }, [sendOTP, verificationState.lastContact]);

    return {
        // State
        isLoading: verificationState.isLoading || sendOTPMutation.isPending || verifyOTPMutation.isPending,
        error: verificationState.error,
        otpSent: verificationState.otpSent,
        attempts: verificationState.attempts,
        attemptsRemaining: Math.max(0, verificationState.maxAttempts - verificationState.attempts),
        retryCount: verificationState.retryCount,
        lastOperationType: verificationState.lastOperationType,

        // Actions
        sendOTP,
        verifyOTP,
        resetVerification,
        handleOTPExpiration,

        // Utilities
        isOTPExpired,
        isInCooldown,
        getCooldownRemaining,
        getOTPTimeRemaining,

        // Computed state
        canSendOTP: !verificationState.isLoading && !isInCooldown(),
        canVerifyOTP: verificationState.otpSent && !isOTPExpired() && !isInCooldown(),

        // Enhanced state
        hasRecentError: !!verificationState.error && verificationState.lastOperationType,
        isRetrying: verificationState.retryCount > 0
    };
}