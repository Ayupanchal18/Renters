import { useState, useCallback } from 'react';
import { useChangePassword, useUpdatePhone, useDeleteAccount } from './useAPI';
import { useNavigate } from 'react-router-dom';
import {
    showSuccessToast,
    showErrorToast,
    showWarningToast,
    showSecurityEventToast,
    showPasswordStrengthWarning,
    OPERATION_CONTEXTS
} from '../utils/toastNotifications';
import { validatePasswordStrength as validatePassword } from '../utils/passwordValidation';
import {
    createPasswordChangeRetry,
    createPhoneUpdateRetry,
    createAccountDeleteRetry,
    executeWithCircuitBreaker
} from '../utils/retryMechanisms';
import { categorizeError } from '../utils/errorHandling';

/**
 * Custom hook for managing account security operations
 * Handles password changes, phone updates, and account deletion
 * Enhanced with error handling, retry mechanisms, and user feedback
 */
export function useSecurityOperations() {
    const [operationState, setOperationState] = useState({
        isLoading: false,
        error: null,
        success: null,
        operation: null,
        retryCount: 0,
        lastAttempt: null
    });

    const navigate = useNavigate();
    const changePasswordMutation = useChangePassword();
    const updatePhoneMutation = useUpdatePhone();
    const deleteAccountMutation = useDeleteAccount();

    // Enhanced password validation using the new utility - defined early to avoid temporal dead zone
    const validatePasswordStrength = useCallback((password, userInfo = {}) => {
        return validatePassword(password, userInfo);
    }, []);

    // Create retry-enabled security operations
    const changePasswordWithRetry = useCallback(
        createPasswordChangeRetry(
            async (currentPassword, newPassword) => {
                return changePasswordMutation.mutateAsync({ currentPassword, newPassword });
            },
            {
                onRetryAttempt: (attempt) => {
                    setOperationState(prev => ({
                        ...prev,
                        retryCount: attempt,
                        error: `Retrying password change... (attempt ${attempt})`
                    }));
                }
            }
        ),
        [changePasswordMutation]
    );

    const updatePhoneWithRetry = useCallback(
        createPhoneUpdateRetry(
            async (currentPassword, newPhone, otp) => {
                return updatePhoneMutation.mutateAsync({ currentPassword, newPhone, otp });
            },
            {
                onRetryAttempt: (attempt) => {
                    setOperationState(prev => ({
                        ...prev,
                        retryCount: attempt,
                        error: `Retrying phone update... (attempt ${attempt})`
                    }));
                }
            }
        ),
        [updatePhoneMutation]
    );

    const deleteAccountWithRetry = useCallback(
        createAccountDeleteRetry(
            async (password, confirmation) => {
                return deleteAccountMutation.mutateAsync({ password, confirmation });
            },
            {
                onRetryAttempt: (attempt) => {
                    setOperationState(prev => ({
                        ...prev,
                        retryCount: attempt,
                        error: `Retrying account deletion... (attempt ${attempt})`
                    }));
                }
            }
        ),
        [deleteAccountMutation]
    );



    // Change password with enhanced error handling
    const changePassword = useCallback(async (currentPassword, newPassword) => {
        try {
            // Validate password strength before attempting change
            const strengthValidation = validatePasswordStrength(newPassword);
            if (!strengthValidation.isValid) {
                const errorMessage = 'Password does not meet security requirements';
                setOperationState({
                    isLoading: false,
                    error: errorMessage,
                    success: null,
                    operation: null,
                    retryCount: 0
                });

                showErrorToast(
                    errorMessage,
                    OPERATION_CONTEXTS.PASSWORD_CHANGE,
                    {
                        title: 'Invalid Password',
                        duration: 6000
                    }
                );

                return { success: false, error: errorMessage };
            }

            // Show warning for weak passwords
            if (strengthValidation.strength === 'weak' || strengthValidation.strength === 'medium') {
                showPasswordStrengthWarning(strengthValidation.strength);
            }

            setOperationState({
                isLoading: true,
                error: null,
                success: null,
                operation: 'password',
                retryCount: 0,
                lastAttempt: new Date()
            });

            const result = await executeWithCircuitBreaker(
                () => changePasswordWithRetry(currentPassword, newPassword),
                'passwordChange'
            );

            if (result.success) {
                setOperationState({
                    isLoading: false,
                    error: null,
                    success: 'Password changed successfully',
                    operation: null,
                    retryCount: 0
                });

                // Show success notification
                showSuccessToast(
                    result.message || 'Your password has been successfully updated',
                    OPERATION_CONTEXTS.PASSWORD_CHANGE,
                    {
                        duration: 5000
                    }
                );

                // Send security event notification
                showSecurityEventToast('password_changed');

                return { success: true, message: result.message };
            } else {
                throw new Error(result.message || 'Failed to change password');
            }
        } catch (error) {
            const categorized = categorizeError(error);
            const errorMessage = error.message || 'Failed to change password';

            setOperationState({
                isLoading: false,
                error: errorMessage,
                success: null,
                operation: null,
                retryCount: 0
            });

            // Handle specific error cases
            if (error.response?.status === 401) {
                showErrorToast(
                    'Current password is incorrect',
                    OPERATION_CONTEXTS.PASSWORD_CHANGE,
                    {
                        title: 'Authentication Failed',
                        duration: 6000
                    }
                );
            } else if (error.response?.status === 429) {
                const retryAfter = error.response.data?.retryAfter || 60;
                showWarningToast(
                    `Too many password change attempts. Please wait ${Math.ceil(retryAfter / 60)} minutes before trying again.`,
                    OPERATION_CONTEXTS.PASSWORD_CHANGE,
                    {
                        title: 'Rate Limit Exceeded',
                        duration: 10000
                    }
                );
            } else {
                showErrorToast(
                    errorMessage,
                    OPERATION_CONTEXTS.PASSWORD_CHANGE,
                    {
                        title: 'Password Change Failed',
                        onRetry: categorized.retryable ? () => changePassword(currentPassword, newPassword) : undefined,
                        duration: 8000
                    }
                );
            }

            return { success: false, error: errorMessage };
        }
    }, [changePasswordWithRetry]);

    // Update phone number with OTP verification
    const updatePhone = useCallback(async (currentPassword, newPhone, otp) => {
        try {
            setOperationState({
                isLoading: true,
                error: null,
                success: null,
                operation: 'phone'
            });

            const result = await updatePhoneMutation.mutateAsync({
                currentPassword,
                newPhone,
                otp
            });

            if (result.success) {
                setOperationState({
                    isLoading: false,
                    error: null,
                    success: 'Phone number updated successfully',
                    operation: null
                });
                return { success: true, message: result.message };
            } else {
                throw new Error(result.message || 'Failed to update phone number');
            }
        } catch (error) {
            const errorMessage = error.message || 'Failed to update phone number';
            setOperationState({
                isLoading: false,
                error: errorMessage,
                success: null,
                operation: null
            });
            return { success: false, error: errorMessage };
        }
    }, [updatePhoneMutation]);

    // Delete account
    const deleteAccount = useCallback(async (password, confirmation) => {
        try {
            setOperationState({
                isLoading: true,
                error: null,
                success: null,
                operation: 'delete'
            });

            const result = await deleteAccountMutation.mutateAsync({
                password,
                confirmation
            });

            if (result.success) {
                // Clear local storage and redirect
                localStorage.clear();
                sessionStorage.clear();

                setOperationState({
                    isLoading: false,
                    error: null,
                    success: 'Account deleted successfully',
                    operation: null
                });

                // Redirect to home page after a short delay
                setTimeout(() => {
                    navigate('/', { replace: true });
                }, 2000);

                return { success: true, message: result.message };
            } else {
                throw new Error(result.message || 'Failed to delete account');
            }
        } catch (error) {
            const errorMessage = error.message || 'Failed to delete account';
            setOperationState({
                isLoading: false,
                error: errorMessage,
                success: null,
                operation: null
            });
            return { success: false, error: errorMessage };
        }
    }, [deleteAccountMutation, navigate]);



    // Validate phone number format
    const validatePhoneNumber = useCallback((phone) => {
        // Basic phone validation - can be enhanced based on requirements
        const phoneRegex = /^\+?[\d\s\-()]{10,}$/;
        return {
            isValid: phoneRegex.test(phone),
            message: phoneRegex.test(phone) ? '' : 'Please enter a valid phone number'
        };
    }, []);

    // Clear operation state
    const clearOperationState = useCallback(() => {
        setOperationState({
            isLoading: false,
            error: null,
            success: null,
            operation: null
        });
    }, []);

    // Check if any operation is in progress
    const isAnyOperationLoading = useCallback(() => {
        return operationState.isLoading ||
            changePasswordMutation.isPending ||
            updatePhoneMutation.isPending ||
            deleteAccountMutation.isPending;
    }, [operationState.isLoading, changePasswordMutation.isPending, updatePhoneMutation.isPending, deleteAccountMutation.isPending]);

    return {
        // State
        isLoading: isAnyOperationLoading(),
        error: operationState.error,
        success: operationState.success,
        currentOperation: operationState.operation,
        retryCount: operationState.retryCount,
        lastAttempt: operationState.lastAttempt,

        // Operations
        changePassword,
        updatePhone,
        deleteAccount,

        // Validation utilities
        validatePasswordStrength,
        validatePhoneNumber,

        // State management
        clearOperationState,

        // Individual operation states
        isChangingPassword: operationState.operation === 'password' || changePasswordMutation.isPending,
        isUpdatingPhone: operationState.operation === 'phone' || updatePhoneMutation.isPending,
        isDeletingAccount: operationState.operation === 'delete' || deleteAccountMutation.isPending,

        // Enhanced state
        hasRecentError: !!operationState.error && operationState.lastAttempt,
        isRetrying: operationState.retryCount > 0,
        canRetryOperation: operationState.error && !isAnyOperationLoading()
    };
}