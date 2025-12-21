/**
 * Retry mechanisms for verification and security operations
 * Validates: Requirements 2.3, 3.3, 4.5, 5.5, 6.5, 9.3, 9.4, 9.5
 */

import { categorizeError } from './errorHandling';
import { showErrorToast, showWarningToast, OPERATION_CONTEXTS } from './toastNotifications';

/**
 * Retry configuration for different operation types
 */
export const RETRY_CONFIGS = {
    OTP_SEND: {
        maxRetries: 3,
        baseDelay: 2000,
        maxDelay: 10000,
        backoffFactor: 2,
        retryableErrors: ['NETWORK', 'TIMEOUT', 'SERVER']
    },
    OTP_VERIFY: {
        maxRetries: 5,
        baseDelay: 1000,
        maxDelay: 5000,
        backoffFactor: 1.5,
        retryableErrors: ['NETWORK', 'TIMEOUT', 'SERVER']
    },
    PASSWORD_CHANGE: {
        maxRetries: 3,
        baseDelay: 1500,
        maxDelay: 8000,
        backoffFactor: 2,
        retryableErrors: ['NETWORK', 'TIMEOUT', 'SERVER']
    },
    PHONE_UPDATE: {
        maxRetries: 3,
        baseDelay: 2000,
        maxDelay: 10000,
        backoffFactor: 2,
        retryableErrors: ['NETWORK', 'TIMEOUT', 'SERVER']
    },
    ACCOUNT_DELETE: {
        maxRetries: 2,
        baseDelay: 3000,
        maxDelay: 15000,
        backoffFactor: 2,
        retryableErrors: ['NETWORK', 'TIMEOUT', 'SERVER']
    }
};

/**
 * Enhanced retry mechanism with operation-specific configurations
 * @param {Function} operation - The operation to retry
 * @param {string} operationType - Type of operation (OTP_SEND, OTP_VERIFY, etc.)
 * @param {Object} options - Additional options
 * @returns {Promise} - Promise that resolves with operation result
 */
export async function retryOperation(operation, operationType, options = {}) {
    const config = RETRY_CONFIGS[operationType] || RETRY_CONFIGS.OTP_SEND;
    const {
        maxRetries = config.maxRetries,
        baseDelay = config.baseDelay,
        maxDelay = config.maxDelay,
        backoffFactor = config.backoffFactor,
        retryableErrors = config.retryableErrors,
        onRetryAttempt,
        onMaxRetriesReached,
        context = ''
    } = { ...config, ...options };

    let lastError;
    let attempt = 0;

    while (attempt <= maxRetries) {
        try {
            const result = await operation();

            // If we had previous failures but this succeeded, show recovery message
            if (attempt > 0) {
                console.log(`Operation succeeded after ${attempt} retries`);
            }

            return result;
        } catch (error) {
            lastError = error;
            attempt++;

            const categorized = categorizeError(error);
            const isRetryable = retryableErrors.includes(categorized.type);

            // Don't retry if it's the last attempt or error is not retryable
            if (attempt > maxRetries || !isRetryable) {
                if (onMaxRetriesReached) {
                    onMaxRetriesReached(error, attempt - 1);
                }
                break;
            }

            // Calculate delay with exponential backoff and jitter
            const delay = Math.min(
                baseDelay * Math.pow(backoffFactor, attempt - 1),
                maxDelay
            );
            const jitteredDelay = delay + Math.random() * 1000;

            // Notify about retry attempt
            if (onRetryAttempt) {
                onRetryAttempt(error, attempt, jitteredDelay);
            }

            console.log(`Retrying operation (attempt ${attempt}/${maxRetries}) after ${Math.round(jitteredDelay)}ms`);

            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, jitteredDelay));
        }
    }

    throw lastError;
}

/**
 * Create a retry wrapper for OTP sending operations
 * @param {Function} sendOTPFunction - Function to send OTP
 * @param {Object} options - Retry options
 * @returns {Function} - Wrapped function with retry logic
 */
export function createOTPSendRetry(sendOTPFunction, options = {}) {
    return async (type, contact) => {
        return retryOperation(
            () => sendOTPFunction(type, contact),
            'OTP_SEND',
            {
                ...options,
                context: type === 'email' ? OPERATION_CONTEXTS.EMAIL_VERIFICATION : OPERATION_CONTEXTS.PHONE_VERIFICATION,
                onRetryAttempt: (error, attempt, delay) => {
                    console.log(`Retrying OTP send (${type}) - attempt ${attempt}`);
                    if (options.onRetryAttempt) {
                        options.onRetryAttempt(error, attempt, delay);
                    }
                },
                onMaxRetriesReached: (error, attempts) => {
                    showErrorToast(
                        `Failed to send ${type} verification code after ${attempts} attempts. Please try again later.`,
                        type === 'email' ? OPERATION_CONTEXTS.EMAIL_VERIFICATION : OPERATION_CONTEXTS.PHONE_VERIFICATION,
                        {
                            title: 'Send Failed',
                            duration: 8000
                        }
                    );
                    if (options.onMaxRetriesReached) {
                        options.onMaxRetriesReached(error, attempts);
                    }
                }
            }
        );
    };
}

/**
 * Create a retry wrapper for OTP verification operations
 * @param {Function} verifyOTPFunction - Function to verify OTP
 * @param {Object} options - Retry options
 * @returns {Function} - Wrapped function with retry logic
 */
export function createOTPVerifyRetry(verifyOTPFunction, options = {}) {
    return async (type, contact, otp) => {
        return retryOperation(
            () => verifyOTPFunction(type, contact, otp),
            'OTP_VERIFY',
            {
                ...options,
                context: type === 'email' ? OPERATION_CONTEXTS.EMAIL_VERIFICATION : OPERATION_CONTEXTS.PHONE_VERIFICATION,
                onRetryAttempt: (error, attempt, delay) => {
                    console.log(`Retrying OTP verification (${type}) - attempt ${attempt}`);
                    if (options.onRetryAttempt) {
                        options.onRetryAttempt(error, attempt, delay);
                    }
                },
                onMaxRetriesReached: (error, attempts) => {
                    const categorized = categorizeError(error);

                    // Don't show retry failed message for validation errors (wrong OTP)
                    if (categorized.type !== 'VALIDATION') {
                        showErrorToast(
                            `Failed to verify ${type} code after ${attempts} attempts. Please try again later.`,
                            type === 'email' ? OPERATION_CONTEXTS.EMAIL_VERIFICATION : OPERATION_CONTEXTS.PHONE_VERIFICATION,
                            {
                                title: 'Verification Failed',
                                duration: 8000
                            }
                        );
                    }

                    if (options.onMaxRetriesReached) {
                        options.onMaxRetriesReached(error, attempts);
                    }
                }
            }
        );
    };
}

/**
 * Create a retry wrapper for password change operations
 * @param {Function} changePasswordFunction - Function to change password
 * @param {Object} options - Retry options
 * @returns {Function} - Wrapped function with retry logic
 */
export function createPasswordChangeRetry(changePasswordFunction, options = {}) {
    return async (currentPassword, newPassword) => {
        return retryOperation(
            () => changePasswordFunction(currentPassword, newPassword),
            'PASSWORD_CHANGE',
            {
                ...options,
                context: OPERATION_CONTEXTS.PASSWORD_CHANGE,
                onRetryAttempt: (error, attempt, delay) => {
                    console.log(`Retrying password change - attempt ${attempt}`);
                    if (options.onRetryAttempt) {
                        options.onRetryAttempt(error, attempt, delay);
                    }
                },
                onMaxRetriesReached: (error, attempts) => {
                    showErrorToast(
                        `Failed to change password after ${attempts} attempts. Please try again later.`,
                        OPERATION_CONTEXTS.PASSWORD_CHANGE,
                        {
                            title: 'Password Change Failed',
                            duration: 8000
                        }
                    );
                    if (options.onMaxRetriesReached) {
                        options.onMaxRetriesReached(error, attempts);
                    }
                }
            }
        );
    };
}

/**
 * Create a retry wrapper for phone update operations
 * @param {Function} updatePhoneFunction - Function to update phone
 * @param {Object} options - Retry options
 * @returns {Function} - Wrapped function with retry logic
 */
export function createPhoneUpdateRetry(updatePhoneFunction, options = {}) {
    return async (currentPassword, newPhone, otp) => {
        return retryOperation(
            () => updatePhoneFunction(currentPassword, newPhone, otp),
            'PHONE_UPDATE',
            {
                ...options,
                context: OPERATION_CONTEXTS.PHONE_UPDATE,
                onRetryAttempt: (error, attempt, delay) => {
                    console.log(`Retrying phone update - attempt ${attempt}`);
                    if (options.onRetryAttempt) {
                        options.onRetryAttempt(error, attempt, delay);
                    }
                },
                onMaxRetriesReached: (error, attempts) => {
                    showErrorToast(
                        `Failed to update phone number after ${attempts} attempts. Please try again later.`,
                        OPERATION_CONTEXTS.PHONE_UPDATE,
                        {
                            title: 'Phone Update Failed',
                            duration: 8000
                        }
                    );
                    if (options.onMaxRetriesReached) {
                        options.onMaxRetriesReached(error, attempts);
                    }
                }
            }
        );
    };
}

/**
 * Create a retry wrapper for account deletion operations
 * @param {Function} deleteAccountFunction - Function to delete account
 * @param {Object} options - Retry options
 * @returns {Function} - Wrapped function with retry logic
 */
export function createAccountDeleteRetry(deleteAccountFunction, options = {}) {
    return async (password, confirmation) => {
        return retryOperation(
            () => deleteAccountFunction(password, confirmation),
            'ACCOUNT_DELETE',
            {
                ...options,
                context: OPERATION_CONTEXTS.ACCOUNT_DELETE,
                onRetryAttempt: (error, attempt, delay) => {
                    console.log(`Retrying account deletion - attempt ${attempt}`);
                    if (options.onRetryAttempt) {
                        options.onRetryAttempt(error, attempt, delay);
                    }
                },
                onMaxRetriesReached: (error, attempts) => {
                    showErrorToast(
                        `Failed to delete account after ${attempts} attempts. Please try again later.`,
                        OPERATION_CONTEXTS.ACCOUNT_DELETE,
                        {
                            title: 'Account Deletion Failed',
                            duration: 8000
                        }
                    );
                    if (options.onMaxRetriesReached) {
                        options.onMaxRetriesReached(error, attempts);
                    }
                }
            }
        );
    };
}

/**
 * Circuit breaker pattern for operations that fail frequently
 */
export class CircuitBreaker {
    constructor(options = {}) {
        this.failureThreshold = options.failureThreshold || 5;
        this.resetTimeout = options.resetTimeout || 60000; // 1 minute
        this.monitoringPeriod = options.monitoringPeriod || 300000; // 5 minutes

        this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
        this.failureCount = 0;
        this.lastFailureTime = null;
        this.successCount = 0;
    }

    async execute(operation, operationType = 'UNKNOWN') {
        if (this.state === 'OPEN') {
            if (Date.now() - this.lastFailureTime > this.resetTimeout) {
                this.state = 'HALF_OPEN';
                this.successCount = 0;
            } else {
                throw new Error('Circuit breaker is OPEN. Service temporarily unavailable.');
            }
        }

        try {
            const result = await operation();

            if (this.state === 'HALF_OPEN') {
                this.successCount++;
                if (this.successCount >= 3) {
                    this.reset();
                }
            } else {
                this.reset();
            }

            return result;
        } catch (error) {
            this.recordFailure();

            if (this.state === 'HALF_OPEN') {
                this.state = 'OPEN';
                this.lastFailureTime = Date.now();
            }

            throw error;
        }
    }

    recordFailure() {
        this.failureCount++;
        this.lastFailureTime = Date.now();

        if (this.failureCount >= this.failureThreshold) {
            this.state = 'OPEN';
            console.warn(`Circuit breaker opened due to ${this.failureCount} failures`);
        }
    }

    reset() {
        this.state = 'CLOSED';
        this.failureCount = 0;
        this.lastFailureTime = null;
        this.successCount = 0;
    }

    getState() {
        return {
            state: this.state,
            failureCount: this.failureCount,
            lastFailureTime: this.lastFailureTime
        };
    }
}

/**
 * Global circuit breakers for different operation types
 */
export const circuitBreakers = {
    otpSend: new CircuitBreaker({ failureThreshold: 3, resetTimeout: 120000 }),
    otpVerify: new CircuitBreaker({ failureThreshold: 5, resetTimeout: 60000 }),
    passwordChange: new CircuitBreaker({ failureThreshold: 3, resetTimeout: 180000 }),
    phoneUpdate: new CircuitBreaker({ failureThreshold: 3, resetTimeout: 120000 }),
    accountDelete: new CircuitBreaker({ failureThreshold: 2, resetTimeout: 300000 })
};

/**
 * Execute operation with circuit breaker protection
 * @param {Function} operation - Operation to execute
 * @param {string} operationType - Type of operation
 * @returns {Promise} - Promise that resolves with operation result
 */
export async function executeWithCircuitBreaker(operation, operationType) {
    const breaker = circuitBreakers[operationType];

    if (!breaker) {
        console.warn(`No circuit breaker found for operation type: ${operationType}`);
        return operation();
    }

    return breaker.execute(operation, operationType);
}