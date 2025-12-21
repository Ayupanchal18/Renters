/**
 * Comprehensive error handling utilities
 * Validates: Requirements 2.5, 5.5
 */

// Error types for categorization
export const ERROR_TYPES = {
    NETWORK: 'NETWORK',
    VALIDATION: 'VALIDATION',
    AUTHENTICATION: 'AUTHENTICATION',
    AUTHORIZATION: 'AUTHORIZATION',
    NOT_FOUND: 'NOT_FOUND',
    SERVER: 'SERVER',
    CLIENT: 'CLIENT',
    TIMEOUT: 'TIMEOUT',
    UNKNOWN: 'UNKNOWN'
};

// Error severity levels
export const ERROR_SEVERITY = {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    CRITICAL: 'CRITICAL'
};

/**
 * Custom error class for application errors
 */
export class AppError extends Error {
    constructor(message, type = ERROR_TYPES.UNKNOWN, severity = ERROR_SEVERITY.MEDIUM, details = {}) {
        super(message);
        this.name = 'AppError';
        this.type = type;
        this.severity = severity;
        this.details = details;
        this.timestamp = new Date().toISOString();
    }
}

/**
 * Categorizes errors based on error object or response
 * @param {Error|Object} error - Error object or response
 * @returns {Object} - Categorized error information
 */
export function categorizeError(error) {
    if (!error) {
        return {
            type: ERROR_TYPES.UNKNOWN,
            severity: ERROR_SEVERITY.LOW,
            message: 'Unknown error occurred',
            userMessage: 'Something went wrong. Please try again.'
        };
    }

    // Network errors
    if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
        return {
            type: ERROR_TYPES.NETWORK,
            severity: ERROR_SEVERITY.HIGH,
            message: error.message || 'Network connection failed',
            userMessage: 'Unable to connect to the server. Please check your internet connection and try again.',
            retryable: true
        };
    }

    // Timeout errors
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        return {
            type: ERROR_TYPES.TIMEOUT,
            severity: ERROR_SEVERITY.MEDIUM,
            message: error.message || 'Request timed out',
            userMessage: 'The request is taking too long. Please try again.',
            retryable: true
        };
    }

    // HTTP status-based errors
    if (error.response?.status) {
        const status = error.response.status;

        if (status === 401) {
            return {
                type: ERROR_TYPES.AUTHENTICATION,
                severity: ERROR_SEVERITY.HIGH,
                message: 'Authentication failed',
                userMessage: 'Please log in to continue.',
                retryable: false
            };
        }

        if (status === 403) {
            return {
                type: ERROR_TYPES.AUTHORIZATION,
                severity: ERROR_SEVERITY.HIGH,
                message: 'Access denied',
                userMessage: 'You do not have permission to perform this action.',
                retryable: false
            };
        }

        if (status === 404) {
            return {
                type: ERROR_TYPES.NOT_FOUND,
                severity: ERROR_SEVERITY.MEDIUM,
                message: 'Resource not found',
                userMessage: 'The requested information could not be found.',
                retryable: false
            };
        }

        if (status >= 400 && status < 500) {
            return {
                type: ERROR_TYPES.CLIENT,
                severity: ERROR_SEVERITY.MEDIUM,
                message: error.response.data?.message || 'Client error',
                userMessage: error.response.data?.message || 'There was an issue with your request. Please check and try again.',
                retryable: false
            };
        }

        if (status >= 500) {
            return {
                type: ERROR_TYPES.SERVER,
                severity: ERROR_SEVERITY.HIGH,
                message: 'Server error',
                userMessage: 'Our servers are experiencing issues. Please try again later.',
                retryable: true
            };
        }
    }

    // Validation errors
    if (error.name === 'ValidationError' || error.type === 'VALIDATION') {
        return {
            type: ERROR_TYPES.VALIDATION,
            severity: ERROR_SEVERITY.LOW,
            message: error.message || 'Validation failed',
            userMessage: error.message || 'Please check your input and try again.',
            retryable: false
        };
    }

    // Default case
    return {
        type: ERROR_TYPES.UNKNOWN,
        severity: ERROR_SEVERITY.MEDIUM,
        message: error.message || 'An unexpected error occurred',
        userMessage: 'Something went wrong. Please try again.',
        retryable: true
    };
}

/**
 * Creates a retry mechanism with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {Object} options - Retry options
 * @returns {Promise} - Promise that resolves with function result or rejects after max retries
 */
export function createRetryMechanism(fn, options = {}) {
    const {
        maxRetries = 3,
        baseDelay = 1000,
        maxDelay = 10000,
        backoffFactor = 2,
        retryCondition = (error) => categorizeError(error).retryable
    } = options;

    return async function retryWrapper(...args) {
        let lastError;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await fn(...args);
            } catch (error) {
                lastError = error;

                // Don't retry if it's the last attempt or error is not retryable
                if (attempt === maxRetries || !retryCondition(error)) {
                    throw error;
                }

                // Calculate delay with exponential backoff
                const delay = Math.min(
                    baseDelay * Math.pow(backoffFactor, attempt),
                    maxDelay
                );

                // Add some jitter to prevent thundering herd
                const jitteredDelay = delay + Math.random() * 1000;

                await new Promise(resolve => setTimeout(resolve, jitteredDelay));
            }
        }

        throw lastError;
    };
}

/**
 * Enhanced API client with error handling and retry logic
 * @param {Object} apiClient - Axios instance
 * @returns {Object} - Enhanced API client
 */
export function enhanceApiClient(apiClient) {
    // Add response interceptor for error handling
    apiClient.interceptors.response.use(
        (response) => response,
        (error) => {
            const categorized = categorizeError(error);

            // Log error for debugging
            console.error('API Error:', {
                url: error.config?.url,
                method: error.config?.method,
                status: error.response?.status,
                type: categorized.type,
                message: categorized.message
            });

            // Enhance error object with categorization
            error.categorized = categorized;

            return Promise.reject(error);
        }
    );

    // Create retry wrapper for common operations
    const withRetry = (fn, retryOptions = {}) => createRetryMechanism(fn, retryOptions);

    return {
        ...apiClient,
        withRetry,

        // Enhanced methods with built-in retry
        getWithRetry: (url, config = {}) => withRetry(() => apiClient.get(url, config)),
        postWithRetry: (url, data, config = {}) => withRetry(() => apiClient.post(url, data, config)),
        putWithRetry: (url, data, config = {}) => withRetry(() => apiClient.put(url, data, config)),
        deleteWithRetry: (url, config = {}) => withRetry(() => apiClient.delete(url, config))
    };
}

/**
 * Error boundary helper for React components
 * @param {Error} error - Error object
 * @param {Object} errorInfo - Error info from React
 * @returns {Object} - Error state for component
 */
export function handleComponentError(error, errorInfo) {
    const categorized = categorizeError(error);

    // Log error for debugging
    console.error('Component Error:', {
        error: error?.message || 'Unknown error',
        stack: error?.stack || '',
        componentStack: errorInfo?.componentStack,
        type: categorized.type
    });

    return {
        hasError: true,
        error: categorized,
        errorInfo,
        timestamp: new Date().toISOString()
    };
}

/**
 * Creates user-friendly error messages
 * @param {Error|Object} error - Error object
 * @param {string} context - Context where error occurred
 * @returns {Object} - User-friendly error information
 */
export function createUserFriendlyError(error, context = '') {
    const categorized = categorizeError(error);

    const contextMessages = {
        'property-search': 'searching for properties',
        'property-filter': 'filtering properties',
        'property-load': 'loading property details',
        'user-auth': 'authenticating user',
        'data-save': 'saving your data',
        'verification': 'verifying your account',
        'email-verification': 'verifying your email address',
        'phone-verification': 'verifying your phone number',
        'otp-send': 'sending verification code',
        'otp-verify': 'verifying your code',
        'security': 'updating your security settings',
        'password-change': 'changing your password',
        'phone-update': 'updating your phone number',
        'account-delete': 'deleting your account'
    };

    const contextMessage = contextMessages[context] || 'processing your request';

    return {
        title: getErrorTitle(categorized.type),
        message: categorized.userMessage,
        context: `Error occurred while ${contextMessage}`,
        type: categorized.type,
        severity: categorized.severity,
        retryable: categorized.retryable,
        timestamp: new Date().toISOString()
    };
}

/**
 * Gets appropriate error title based on error type
 * @param {string} errorType - Error type
 * @returns {string} - Error title
 */
function getErrorTitle(errorType) {
    const titles = {
        [ERROR_TYPES.NETWORK]: 'Connection Problem',
        [ERROR_TYPES.TIMEOUT]: 'Request Timeout',
        [ERROR_TYPES.AUTHENTICATION]: 'Authentication Required',
        [ERROR_TYPES.AUTHORIZATION]: 'Access Denied',
        [ERROR_TYPES.NOT_FOUND]: 'Not Found',
        [ERROR_TYPES.VALIDATION]: 'Invalid Input',
        [ERROR_TYPES.SERVER]: 'Server Error',
        [ERROR_TYPES.CLIENT]: 'Request Error',
        [ERROR_TYPES.UNKNOWN]: 'Unexpected Error'
    };

    return titles[errorType] || 'Error';
}

/**
 * Global error handler for unhandled errors
 * @param {Error} error - Unhandled error
 * @param {string} source - Source of error (e.g., 'promise', 'script')
 */
export function handleGlobalError(error, source = 'unknown') {
    const categorized = categorizeError(error);

    console.error('Global Error:', {
        source,
        type: categorized.type,
        message: categorized.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
    });

    // In production, you might want to send this to an error tracking service
    // trackError(error, { source, categorized });
}

/**
 * Validates error recovery options
 * @param {Object} error - Categorized error
 * @returns {Array} - Available recovery options
 */
export function getRecoveryOptions(error) {
    const options = [];

    if (error.retryable) {
        options.push({
            label: 'Try Again',
            action: 'retry',
            primary: true
        });
    }

    if (error.type === ERROR_TYPES.NETWORK) {
        options.push({
            label: 'Check Connection',
            action: 'check-connection',
            primary: false
        });
    }

    if (error.type === ERROR_TYPES.AUTHENTICATION) {
        options.push({
            label: 'Log In',
            action: 'login',
            primary: true
        });
    }

    options.push({
        label: 'Go Back',
        action: 'go-back',
        primary: false
    });

    return options;
}