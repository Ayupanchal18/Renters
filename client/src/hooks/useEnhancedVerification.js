import { useState, useCallback, useEffect } from 'react';
import {
    useSendOTP,
    useVerifyOTP,
    useDeliveryStatus,
    useRetryDelivery,
    useDeliveryHistory,
    useVerificationStatus,
    useServiceStatus,
    useDeliveryPreferences,
    useUpdateDeliveryPreferences,
    useTestDelivery,
    useTroubleshootingInfo,
    useConnectivityTest,
    useDeliveryDiagnostics,
} from './useAPI.js';
import {
    validateServiceStatus,
    convertServicesToArray,
    logServiceStatusError,
    getFallbackDeliveryMethods
} from '../utils/ServiceStatusValidator.js';
import {
    showSuccessToast,
    showErrorToast,
    showRateLimitToast,
    showOTPExpirationToast,
    OPERATION_CONTEXTS
} from '../utils/toastNotifications.jsx';
import { categorizeError } from '../utils/errorHandling.js';

/**
 * Enhanced verification hook with comprehensive OTP delivery management
 * Provides real-time status updates, delivery preferences, and diagnostics
 */
export function useEnhancedVerification() {
    const [verificationState, setVerificationState] = useState({
        isLoading: false,
        error: null,
        currentDeliveryId: null,
        selectedMethod: null,
        otpSent: false,
        otpExpiry: null,
        attempts: 0,
        maxAttempts: 5,
        cooldownUntil: null,
        lastOperationType: null,
        retryCount: 0,
        deliveryProgress: null,
    });

    // API hooks
    const sendOTPMutation = useSendOTP();
    const verifyOTPMutation = useVerifyOTP();
    const retryDeliveryMutation = useRetryDelivery();
    const testDeliveryMutation = useTestDelivery();
    const connectivityTestMutation = useConnectivityTest();

    // Query hooks
    const { data: deliveryPreferences } = useDeliveryPreferences();
    const { data: serviceStatus } = useServiceStatus();
    const { data: verificationStatus } = useVerificationStatus();
    const { data: deliveryStatus, refetch: refetchDeliveryStatus } = useDeliveryStatus(
        verificationState.currentDeliveryId
    );
    const { data: deliveryHistory } = useDeliveryHistory({ limit: 5 });

    // Update delivery preferences
    const updatePreferencesMutation = useUpdateDeliveryPreferences();

    // Real-time delivery status updates
    useEffect(() => {
        if (deliveryStatus?.deliveryStatus) {
            setVerificationState(prev => ({
                ...prev,
                deliveryProgress: deliveryStatus.deliveryStatus,
            }));

            // Handle delivery completion
            if (deliveryStatus.deliveryStatus.status === 'delivered') {
                showSuccessToast(
                    'Verification code delivered successfully',
                    OPERATION_CONTEXTS.OTP_DELIVERY,
                    { duration: 3000 }
                );
            } else if (deliveryStatus.deliveryStatus.status === 'failed') {
                showErrorToast(
                    deliveryStatus.deliveryStatus.error || 'Delivery failed',
                    OPERATION_CONTEXTS.OTP_DELIVERY,
                    { duration: 5000 }
                );
            }
        }
    }, [deliveryStatus]);

    // Enhanced OTP sending with delivery method selection
    const sendOTP = useCallback(async (type, contact, options = {}) => {
        try {
            setVerificationState(prev => ({
                ...prev,
                isLoading: true,
                error: null,
                lastOperationType: 'send',
                retryCount: 0,
                selectedMethod: options.method || deliveryPreferences?.preferredMethod || 'auto',
            }));

            const requestData = {
                type,
                contact,
                ...options,
            };

            const result = await sendOTPMutation.mutateAsync(requestData);

            if (result.success) {
                setVerificationState(prev => ({
                    ...prev,
                    isLoading: false,
                    otpSent: true,
                    currentDeliveryId: result.deliveryId,
                    otpExpiry: result.expiresAt ? new Date(result.expiresAt) : null,
                    attempts: 0,
                    retryCount: 0,
                    deliveryProgress: {
                        status: 'sent',
                        serviceName: result.serviceName,
                        deliveryMethod: result.deliveryMethod,
                        estimatedDelivery: result.estimatedDelivery,
                    },
                }));

                showSuccessToast(
                    result.message || `Verification code sent via ${result.serviceName}`,
                    OPERATION_CONTEXTS.OTP_SEND,
                    {
                        title: 'Code Sent',
                        duration: 4000,
                    }
                );

                return {
                    success: true,
                    message: result.message,
                    deliveryId: result.deliveryId,
                    serviceName: result.serviceName,
                    deliveryMethod: result.deliveryMethod,
                };
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
                retryCount: 0,
            }));

            // Handle rate limiting
            if (error.response?.status === 429) {
                const retryAfter = error.response.data?.retryAfter || 60;
                showRateLimitToast(retryAfter, OPERATION_CONTEXTS.OTP_SEND);

                setVerificationState(prev => ({
                    ...prev,
                    cooldownUntil: new Date(Date.now() + retryAfter * 1000),
                }));
            } else {
                showErrorToast(
                    errorMessage,
                    OPERATION_CONTEXTS.OTP_SEND,
                    {
                        title: 'Failed to Send Code',
                        onRetry: categorized.retryable ? () => sendOTP(type, contact, options) : undefined,
                        duration: 8000,
                    }
                );
            }

            return { success: false, error: errorMessage };
        }
    }, [sendOTPMutation, deliveryPreferences]);

    // Enhanced OTP verification
    const verifyOTP = useCallback(async (type, contact, otp) => {
        try {
            setVerificationState(prev => ({
                ...prev,
                isLoading: true,
                error: null,
                lastOperationType: 'verify',
                retryCount: 0,
            }));

            const result = await verifyOTPMutation.mutateAsync({ type, contact, otp });

            if (result.success && result.verified) {
                setVerificationState(prev => ({
                    ...prev,
                    isLoading: false,
                    otpSent: false,
                    attempts: 0,
                    retryCount: 0,
                    currentDeliveryId: null,
                    deliveryProgress: null,
                }));

                const context = type === 'email' ? OPERATION_CONTEXTS.EMAIL_VERIFICATION : OPERATION_CONTEXTS.PHONE_VERIFICATION;
                showSuccessToast(
                    result.message || `${type === 'email' ? 'Email' : 'Phone'} verified successfully`,
                    context,
                    { duration: 5000 }
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
                        cooldownUntil: shouldCooldown ? new Date(Date.now() + 15 * 60 * 1000) : null,
                        retryCount: 0,
                    };
                });

                showErrorToast(
                    result.message || 'Invalid verification code',
                    OPERATION_CONTEXTS.OTP_VERIFY,
                    {
                        title: 'Verification Failed',
                        duration: 6000,
                    }
                );

                return {
                    success: false,
                    error: result.message || 'Invalid verification code',
                    attemptsRemaining: Math.max(0, verificationState.maxAttempts - (verificationState.attempts + 1)),
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
                retryCount: 0,
            }));

            if (error.response?.status === 429) {
                const retryAfter = error.response.data?.retryAfter || 60;
                showRateLimitToast(retryAfter, OPERATION_CONTEXTS.OTP_VERIFY);

                setVerificationState(prev => ({
                    ...prev,
                    cooldownUntil: new Date(Date.now() + retryAfter * 1000),
                }));
            } else if (categorized.type !== 'VALIDATION') {
                showErrorToast(
                    errorMessage,
                    OPERATION_CONTEXTS.OTP_VERIFY,
                    {
                        title: 'Verification Error',
                        onRetry: categorized.retryable ? () => verifyOTP(type, contact, otp) : undefined,
                        duration: 8000,
                    }
                );
            }

            return { success: false, error: errorMessage };
        }
    }, [verifyOTPMutation, verificationState.maxAttempts, verificationState.attempts]);

    // Retry delivery with method selection
    const retryDelivery = useCallback(async (method = null) => {
        if (!verificationState.currentDeliveryId) {
            return { success: false, error: 'No active delivery to retry' };
        }

        try {
            setVerificationState(prev => ({
                ...prev,
                isLoading: true,
                error: null,
                retryCount: prev.retryCount + 1,
            }));

            const result = await retryDeliveryMutation.mutateAsync({
                deliveryId: verificationState.currentDeliveryId,
                method,
            });

            if (result.success) {
                setVerificationState(prev => ({
                    ...prev,
                    isLoading: false,
                    deliveryProgress: {
                        status: 'sent',
                        serviceName: result.attempt.serviceName,
                        deliveryMethod: result.attempt.method,
                        estimatedDelivery: result.attempt.estimatedDelivery,
                    },
                }));

                showSuccessToast(
                    result.message || 'Retry initiated successfully',
                    OPERATION_CONTEXTS.OTP_RETRY,
                    { duration: 3000 }
                );

                // Refetch delivery status
                refetchDeliveryStatus();

                return { success: true, message: result.message };
            } else {
                throw new Error(result.message || 'Retry failed');
            }
        } catch (error) {
            const errorMessage = error.message || 'Failed to retry delivery';

            setVerificationState(prev => ({
                ...prev,
                isLoading: false,
                error: errorMessage,
            }));

            showErrorToast(
                errorMessage,
                OPERATION_CONTEXTS.OTP_RETRY,
                {
                    title: 'Retry Failed',
                    duration: 5000,
                }
            );

            return { success: false, error: errorMessage };
        }
    }, [verificationState.currentDeliveryId, retryDeliveryMutation, refetchDeliveryStatus]);

    // Test delivery functionality
    const testDelivery = useCallback(async (contact, method) => {
        try {
            const result = await testDeliveryMutation.mutateAsync({ contact, method });

            if (result.success) {
                showSuccessToast(
                    result.message || 'Test delivery completed successfully',
                    OPERATION_CONTEXTS.TEST_DELIVERY,
                    { duration: 4000 }
                );
            } else {
                showErrorToast(
                    result.message || 'Test delivery failed',
                    OPERATION_CONTEXTS.TEST_DELIVERY,
                    { duration: 5000 }
                );
            }

            return result;
        } catch (error) {
            const errorMessage = error.message || 'Test delivery failed';
            showErrorToast(
                errorMessage,
                OPERATION_CONTEXTS.TEST_DELIVERY,
                { duration: 5000 }
            );

            return { success: false, error: errorMessage };
        }
    }, [testDeliveryMutation]);

    // Run connectivity test
    const runConnectivityTest = useCallback(async (contact, method) => {
        try {
            const result = await connectivityTestMutation.mutateAsync({ contact, method });

            if (result.success) {
                showSuccessToast(
                    'Connectivity test passed',
                    OPERATION_CONTEXTS.CONNECTIVITY_TEST,
                    { duration: 3000 }
                );
            } else {
                showErrorToast(
                    result.message || 'Connectivity test failed',
                    OPERATION_CONTEXTS.CONNECTIVITY_TEST,
                    { duration: 5000 }
                );
            }

            return result;
        } catch (error) {
            const errorMessage = error.message || 'Connectivity test failed';
            showErrorToast(
                errorMessage,
                OPERATION_CONTEXTS.CONNECTIVITY_TEST,
                { duration: 5000 }
            );

            return { success: false, error: errorMessage };
        }
    }, [connectivityTestMutation]);

    // Update delivery preferences
    const updateDeliveryPreferences = useCallback(async (preferences) => {
        try {
            const result = await updatePreferencesMutation.mutateAsync(preferences);

            if (result.success) {
                showSuccessToast(
                    'Delivery preferences updated successfully',
                    OPERATION_CONTEXTS.PREFERENCES_UPDATE,
                    { duration: 3000 }
                );
            }

            return result;
        } catch (error) {
            const errorMessage = error.message || 'Failed to update preferences';
            showErrorToast(
                errorMessage,
                OPERATION_CONTEXTS.PREFERENCES_UPDATE,
                { duration: 5000 }
            );

            return { success: false, error: errorMessage };
        }
    }, [updatePreferencesMutation]);

    // Reset verification state
    const resetVerification = useCallback(() => {
        setVerificationState({
            isLoading: false,
            error: null,
            currentDeliveryId: null,
            selectedMethod: null,
            otpSent: false,
            otpExpiry: null,
            attempts: 0,
            maxAttempts: 5,
            cooldownUntil: null,
            lastOperationType: null,
            retryCount: 0,
            deliveryProgress: null,
        });
    }, []);

    // Utility functions
    const isOTPExpired = useCallback(() => {
        if (!verificationState.otpExpiry) return false;
        return new Date() > verificationState.otpExpiry;
    }, [verificationState.otpExpiry]);

    const isInCooldown = useCallback(() => {
        if (!verificationState.cooldownUntil) return false;
        return new Date() < verificationState.cooldownUntil;
    }, [verificationState.cooldownUntil]);

    const getCooldownRemaining = useCallback(() => {
        if (!verificationState.cooldownUntil) return 0;
        return Math.max(0, Math.floor((verificationState.cooldownUntil - new Date()) / 1000));
    }, [verificationState.cooldownUntil]);

    const getOTPTimeRemaining = useCallback(() => {
        if (!verificationState.otpExpiry) return 0;
        return Math.max(0, Math.floor((verificationState.otpExpiry - new Date()) / 1000));
    }, [verificationState.otpExpiry]);

    // Get available delivery methods based on service status
    const getAvailableDeliveryMethods = useCallback(() => {
        // Validate service status data
        const validation = validateServiceStatus(serviceStatus);

        if (!validation.isValid) {
            logServiceStatusError('getAvailableDeliveryMethods', validation);
            return getFallbackDeliveryMethods();
        }

        // Convert services object to array format for processing
        const servicesArray = convertServicesToArray(validation.data.services);

        const methods = [];

        // Check SMS availability
        const smsServices = servicesArray.filter(s =>
            s.capabilities?.includes('sms') && s.status === 'healthy'
        );
        if (smsServices.length > 0) {
            methods.push({
                method: 'sms',
                label: 'SMS',
                icon: 'phone',
                available: true,
                services: smsServices,
            });
        }

        // Check Email availability
        const emailServices = servicesArray.filter(s =>
            s.capabilities?.includes('email') && s.status === 'healthy'
        );
        if (emailServices.length > 0) {
            methods.push({
                method: 'email',
                label: 'Email',
                icon: 'mail',
                available: true,
                services: emailServices,
            });
        }

        return methods;
    }, [serviceStatus]);

    return {
        // State
        isLoading: verificationState.isLoading ||
            sendOTPMutation.isPending ||
            verifyOTPMutation.isPending ||
            retryDeliveryMutation.isPending,
        error: verificationState.error,
        otpSent: verificationState.otpSent,
        attempts: verificationState.attempts,
        attemptsRemaining: Math.max(0, verificationState.maxAttempts - verificationState.attempts),
        retryCount: verificationState.retryCount,
        lastOperationType: verificationState.lastOperationType,
        currentDeliveryId: verificationState.currentDeliveryId,
        selectedMethod: verificationState.selectedMethod,
        deliveryProgress: verificationState.deliveryProgress,

        // Actions
        sendOTP,
        verifyOTP,
        retryDelivery,
        testDelivery,
        runConnectivityTest,
        updateDeliveryPreferences,
        resetVerification,

        // Utilities
        isOTPExpired,
        isInCooldown,
        getCooldownRemaining,
        getOTPTimeRemaining,
        getAvailableDeliveryMethods,

        // Computed state
        canSendOTP: !verificationState.isLoading && !isInCooldown(),
        canVerifyOTP: verificationState.otpSent && !isOTPExpired() && !isInCooldown(),
        canRetry: verificationState.currentDeliveryId && !verificationState.isLoading,

        // Data from queries
        deliveryPreferences,
        serviceStatus,
        verificationStatus,
        deliveryStatus: deliveryStatus?.deliveryStatus,
        deliveryHistory: deliveryHistory?.history,

        // Enhanced state
        hasRecentError: !!verificationState.error && verificationState.lastOperationType,
        isRetrying: verificationState.retryCount > 0,
        hasActiveDelivery: !!verificationState.currentDeliveryId,
    };
}