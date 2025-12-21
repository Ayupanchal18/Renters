/**
 * Enhanced Error Handler utility for consistent error management
 * Validates: Requirements 1.2, 4.5, 5.4, 8.5
 * 
 * This utility extends the existing error handling with property-specific
 * error management and recovery mechanisms.
 */

import {
    categorizeError,
    createUserFriendlyError,
    getRecoveryOptions,
    ERROR_TYPES,
    ERROR_SEVERITY,
    AppError
} from './errorHandling.js';

export class EnhancedErrorHandler {
    constructor() {
        this.errorHistory = [];
        this.maxHistorySize = 50;
        this.retryAttempts = new Map();
        this.maxRetryAttempts = 3;
    }

    /**
     * Handles property-specific errors with context-aware messaging
     * @param {Error|Object} error - Error object
     * @param {string} context - Context where error occurred
     * @param {Object} metadata - Additional error metadata
     * @returns {Object} - Processed error with recovery options
     */
    handlePropertyError(error, context = 'property-operation', metadata = {}) {
        const errorId = this.generateErrorId();
        const timestamp = new Date().toISOString();

        try {
            // Categorize the error
            const categorized = categorizeError(error);

            // Create user-friendly error
            const userFriendly = createUserFriendlyError(error, context);

            // Get recovery options
            const recoveryOptions = this.getContextualRecoveryOptions(categorized, context);

            // Create enhanced error object
            const enhancedError = {
                id: errorId,
                timestamp,
                context,
                metadata,
                original: error,
                categorized,
                userFriendly,
                recoveryOptions,
                retryCount: this.getRetryCount(context),
                canRetry: this.canRetry(categorized, context),
                severity: this.calculateSeverity(categorized, context)
            };

            // Log error for debugging
            this.logError(enhancedError);

            // Add to history
            this.addToHistory(enhancedError);

            return enhancedError;
        } catch (processingError) {
            console.error('EnhancedErrorHandler: Error processing error:', processingError);
            return this.createFallbackError(error, context, errorId, timestamp);
        }
    }

    /**
     * Handles property data loading errors
     * @param {Error} error - Loading error
     * @param {string} propertyId - Property ID that failed to load
     * @returns {Object} - Processed error with property-specific context
     */
    handlePropertyLoadError(error, propertyId = null) {
        const metadata = {
            propertyId,
            operation: 'load',
            userAction: 'viewing property details'
        };

        return this.handlePropertyError(error, 'property-load', metadata);
    }

    /**
     * Handles image loading errors
     * @param {Error} error - Image loading error
     * @param {string} imageUrl - URL of failed image
     * @param {string} imageType - Type of image (property, owner, etc.)
     * @returns {Object} - Processed error with image fallback options
     */
    handleImageLoadError(error, imageUrl = null, imageType = 'property') {
        const metadata = {
            imageUrl,
            imageType,
            operation: 'image-load',
            fallbackAvailable: true
        };

        const processedError = this.handlePropertyError(error, 'image-load', metadata);

        // Add image-specific recovery options
        processedError.recoveryOptions.push({
            label: 'Use Placeholder Image',
            action: 'use-placeholder',
            primary: true,
            data: { imageType }
        });

        return processedError;
    }

    /**
     * Handles API errors with retry logic
     * @param {Error} error - API error
     * @param {string} endpoint - API endpoint that failed
     * @param {Object} requestData - Original request data
     * @returns {Object} - Processed error with retry options
     */
    handleApiError(error, endpoint = null, requestData = {}) {
        const metadata = {
            endpoint,
            requestData,
            operation: 'api-call',
            timestamp: new Date().toISOString()
        };

        const processedError = this.handlePropertyError(error, 'api-call', metadata);

        // Increment retry count for this endpoint
        if (endpoint) {
            this.incrementRetryCount(endpoint);
        }

        return processedError;
    }

    /**
     * Handles validation errors with field-specific guidance
     * @param {Array|Object} validationErrors - Validation errors
     * @param {string} formContext - Form or component context
     * @returns {Object} - Processed validation error
     */
    handleValidationError(validationErrors, formContext = 'form') {
        const metadata = {
            validationErrors,
            formContext,
            operation: 'validation',
            fieldCount: Array.isArray(validationErrors) ? validationErrors.length : 1
        };

        // Create synthetic error for validation
        const syntheticError = new AppError(
            'Validation failed',
            ERROR_TYPES.VALIDATION,
            ERROR_SEVERITY.LOW,
            { validationErrors }
        );

        return this.handlePropertyError(syntheticError, 'validation', metadata);
    }

    /**
     * Gets contextual recovery options based on error type and context
     * @param {Object} categorizedError - Categorized error
     * @param {string} context - Error context
     * @returns {Array} - Array of recovery options
     */
    getContextualRecoveryOptions(categorizedError, context) {
        const baseOptions = getRecoveryOptions(categorizedError);
        const contextualOptions = [];

        // Add context-specific options
        switch (context) {
            case 'property-load':
                if (categorizedError.retryable) {
                    contextualOptions.push({
                        label: 'Reload Property',
                        action: 'reload-property',
                        primary: true
                    });
                }
                contextualOptions.push({
                    label: 'Browse Other Properties',
                    action: 'browse-properties',
                    primary: false
                });
                break;

            case 'image-load':
                contextualOptions.push({
                    label: 'Show Property Details Only',
                    action: 'hide-images',
                    primary: false
                });
                break;

            case 'api-call':
                if (categorizedError.retryable && this.canRetry(categorizedError, context)) {
                    contextualOptions.push({
                        label: 'Retry Request',
                        action: 'retry-api',
                        primary: true
                    });
                }
                break;

            case 'validation':
                contextualOptions.push({
                    label: 'Review Input',
                    action: 'review-input',
                    primary: true
                });
                break;
        }

        return [...contextualOptions, ...baseOptions];
    }

    /**
     * Calculates error severity based on context
     * @param {Object} categorizedError - Categorized error
     * @param {string} context - Error context
     * @returns {string} - Calculated severity level
     */
    calculateSeverity(categorizedError, context) {
        let baseSeverity = categorizedError.severity;

        // Adjust severity based on context
        switch (context) {
            case 'property-load':
                // Property load failures are critical for user experience
                if (baseSeverity === ERROR_SEVERITY.MEDIUM) {
                    baseSeverity = ERROR_SEVERITY.HIGH;
                }
                break;

            case 'image-load':
                // Image load failures are less critical
                if (baseSeverity === ERROR_SEVERITY.HIGH) {
                    baseSeverity = ERROR_SEVERITY.MEDIUM;
                }
                break;

            case 'validation':
                // Validation errors are typically low severity
                baseSeverity = ERROR_SEVERITY.LOW;
                break;
        }

        return baseSeverity;
    }

    /**
     * Checks if operation can be retried
     * @param {Object} categorizedError - Categorized error
     * @param {string} context - Error context
     * @returns {boolean} - True if retry is allowed
     */
    canRetry(categorizedError, context) {
        if (!categorizedError.retryable) {
            return false;
        }

        const retryCount = this.getRetryCount(context);
        return retryCount < this.maxRetryAttempts;
    }

    /**
     * Gets retry count for a context
     * @param {string} context - Error context
     * @returns {number} - Current retry count
     */
    getRetryCount(context) {
        return this.retryAttempts.get(context) || 0;
    }

    /**
     * Increments retry count for a context
     * @param {string} context - Error context
     */
    incrementRetryCount(context) {
        const current = this.getRetryCount(context);
        this.retryAttempts.set(context, current + 1);
    }

    /**
     * Resets retry count for a context
     * @param {string} context - Error context
     */
    resetRetryCount(context) {
        this.retryAttempts.delete(context);
    }

    /**
     * Creates fallback error when error processing fails
     * @param {Error} originalError - Original error
     * @param {string} context - Error context
     * @param {string} errorId - Generated error ID
     * @param {string} timestamp - Error timestamp
     * @returns {Object} - Fallback error object
     */
    createFallbackError(originalError, context, errorId, timestamp) {
        return {
            id: errorId,
            timestamp,
            context,
            metadata: {},
            original: originalError,
            categorized: {
                type: ERROR_TYPES.UNKNOWN,
                severity: ERROR_SEVERITY.MEDIUM,
                message: 'An unexpected error occurred',
                userMessage: 'Something went wrong. Please try again.',
                retryable: true
            },
            userFriendly: {
                title: 'Unexpected Error',
                message: 'Something went wrong. Please try again.',
                context: `Error occurred while ${context.replace('-', ' ')}`,
                type: ERROR_TYPES.UNKNOWN,
                severity: ERROR_SEVERITY.MEDIUM,
                retryable: true,
                timestamp
            },
            recoveryOptions: [
                {
                    label: 'Try Again',
                    action: 'retry',
                    primary: true
                },
                {
                    label: 'Go Back',
                    action: 'go-back',
                    primary: false
                }
            ],
            retryCount: 0,
            canRetry: true,
            severity: ERROR_SEVERITY.MEDIUM,
            isFallback: true
        };
    }

    /**
     * Generates unique error ID
     * @returns {string} - Unique error identifier
     */
    generateErrorId() {
        return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Logs error for debugging
     * @param {Object} enhancedError - Enhanced error object
     */
    logError(enhancedError) {
        const logLevel = this.getLogLevel(enhancedError.severity);

        const logData = {
            id: enhancedError.id,
            context: enhancedError.context,
            type: enhancedError.categorized.type,
            message: enhancedError.categorized.message,
            severity: enhancedError.severity,
            retryCount: enhancedError.retryCount,
            timestamp: enhancedError.timestamp
        };

        console[logLevel]('EnhancedErrorHandler:', logData);

        // In production, you might want to send this to an error tracking service
        // this.sendToErrorTracking(enhancedError);
    }

    /**
     * Gets appropriate log level for error severity
     * @param {string} severity - Error severity
     * @returns {string} - Console log level
     */
    getLogLevel(severity) {
        switch (severity) {
            case ERROR_SEVERITY.CRITICAL:
            case ERROR_SEVERITY.HIGH:
                return 'error';
            case ERROR_SEVERITY.MEDIUM:
                return 'warn';
            case ERROR_SEVERITY.LOW:
            default:
                return 'info';
        }
    }

    /**
     * Adds error to history
     * @param {Object} enhancedError - Enhanced error object
     */
    addToHistory(enhancedError) {
        this.errorHistory.unshift(enhancedError);

        // Maintain history size limit
        if (this.errorHistory.length > this.maxHistorySize) {
            this.errorHistory = this.errorHistory.slice(0, this.maxHistorySize);
        }
    }

    /**
     * Gets error history
     * @param {number} limit - Maximum number of errors to return
     * @returns {Array} - Array of recent errors
     */
    getErrorHistory(limit = 10) {
        return this.errorHistory.slice(0, limit);
    }

    /**
     * Clears error history
     */
    clearErrorHistory() {
        this.errorHistory = [];
        this.retryAttempts.clear();
    }

    /**
     * Gets error statistics
     * @returns {Object} - Error statistics
     */
    getErrorStatistics() {
        const total = this.errorHistory.length;
        const byType = {};
        const bySeverity = {};
        const byContext = {};

        this.errorHistory.forEach(error => {
            // Count by type
            const type = error.categorized.type;
            byType[type] = (byType[type] || 0) + 1;

            // Count by severity
            const severity = error.severity;
            bySeverity[severity] = (bySeverity[severity] || 0) + 1;

            // Count by context
            const context = error.context;
            byContext[context] = (byContext[context] || 0) + 1;
        });

        return {
            total,
            byType,
            bySeverity,
            byContext,
            retryAttempts: Object.fromEntries(this.retryAttempts)
        };
    }
}

// Export singleton instance for convenience
export const enhancedErrorHandler = new EnhancedErrorHandler();

// Export class for custom instances
export default EnhancedErrorHandler;