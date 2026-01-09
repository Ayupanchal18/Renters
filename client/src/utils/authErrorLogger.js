/**
 * Authentication Error Logging Utility
 * Provides comprehensive error logging for authentication failures
 * Validates: Requirements 2.5, 3.3
 */

import { categorizeError, ERROR_TYPES, ERROR_SEVERITY } from './errorHandling.js';

// Development mode detection
const isDevelopment = import.meta.env.DEV || process.env.NODE_ENV === 'development';

// Error context types for authentication
export const AUTH_ERROR_CONTEXTS = {
    LOGIN: 'login',
    TOKEN_VALIDATION: 'token_validation',
    API_REQUEST: 'api_request',
    VERIFICATION_STATUS: 'verification_status',
    USER_PROFILE: 'user_profile',
    HEADER_CONSTRUCTION: 'header_construction',
    TOKEN_EXPIRY: 'token_expiry',
    LOGOUT: 'logout'
};

/**
 * Enhanced authentication error logger
 * @param {Error|Object} error - Error object or response
 * @param {string} context - Authentication context where error occurred
 * @param {Object} metadata - Additional metadata for debugging
 */
export function logAuthenticationError(error, context = '', metadata = {}) {
    const categorized = categorizeError(error);
    const timestamp = new Date().toISOString();

    // Base error information (exclude sensitive data from metadata)
    const { token, ...safeMetadata } = metadata;
    const errorInfo = {
        timestamp,
        context,
        type: categorized.type,
        severity: categorized.severity,
        message: categorized.message,
        userMessage: categorized.userMessage,
        retryable: categorized.retryable,
        ...safeMetadata
    };

    // Add authentication-specific details
    if (error.response) {
        errorInfo.httpStatus = error.response.status;
        errorInfo.httpStatusText = error.response.statusText;
        errorInfo.responseHeaders = error.response.headers;

        // Try to extract error details from response
        try {
            if (error.response.data) {
                errorInfo.responseData = error.response.data;
                errorInfo.serverMessage = error.response.data.message || error.response.data.error;
            }
        } catch (parseError) {
            errorInfo.responseParseError = parseError.message;
        }
    }

    // Add request details if available
    if (error.config) {
        errorInfo.requestUrl = error.config.url;
        errorInfo.requestMethod = error.config.method;
        errorInfo.requestHeaders = error.config.headers;

        // Don't log sensitive data in production
        if (isDevelopment) {
            errorInfo.requestData = error.config.data;
        }
    }

    // Add browser/environment context
    errorInfo.userAgent = navigator.userAgent;
    errorInfo.url = window.location.href;
    errorInfo.isDevelopment = isDevelopment;

    // Add token information (without exposing the actual token)
    if (token) {
        errorInfo.hasToken = !!token;
        errorInfo.tokenLength = token.length;
        errorInfo.tokenPrefix = token.substring(0, 10) + '...';

        // Try to decode token for debugging (development only)
        if (isDevelopment) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                errorInfo.tokenPayload = {
                    userId: payload.sub || payload.userId,
                    email: payload.email,
                    exp: payload.exp,
                    iat: payload.iat,
                    isExpired: payload.exp < Date.now() / 1000
                };
            } catch (tokenDecodeError) {
                errorInfo.tokenDecodeError = tokenDecodeError.message;
            }
        }
    }

    // Log based on severity and environment
    if (categorized.severity === ERROR_SEVERITY.CRITICAL) {
        console.error('🚨 CRITICAL AUTH ERROR:', errorInfo);
    } else if (categorized.severity === ERROR_SEVERITY.HIGH) {
        console.error('❌ AUTH ERROR:', errorInfo);
    } else if (categorized.severity === ERROR_SEVERITY.MEDIUM) {
        console.warn('⚠️ AUTH WARNING:', errorInfo);
    } else {
        console.log('ℹ️ AUTH INFO:', errorInfo);
    }

    // In development, also log to a structured format for easier debugging
    if (isDevelopment) {
        console.group(`🔍 AUTH DEBUG - ${context.toUpperCase()}`);
        console.log('Error Type:', categorized.type);
        console.log('Severity:', categorized.severity);
        console.log('Message:', categorized.message);
        console.log('User Message:', categorized.userMessage);
        console.log('Retryable:', categorized.retryable);
        console.log('Full Error Info:', errorInfo);
        console.groupEnd();
    }

    return errorInfo;
}

/**
 * Log authentication success events for debugging
 * Only logs when VITE_DEBUG_AUTH=true to reduce console spam
 * @param {string} context - Authentication context
 * @param {Object} metadata - Success metadata
 */
export function logAuthenticationSuccess(context, metadata = {}) {
    if (!isDevelopment || import.meta.env.VITE_DEBUG_AUTH !== 'true') return;

    const successInfo = {
        timestamp: new Date().toISOString(),
        context,
        type: 'SUCCESS',
        ...metadata
    };

    console.log('✅ AUTH SUCCESS:', successInfo);
}

/**
 * Log token-related events
 * Only logs errors or important events to reduce console spam
 * @param {string} event - Token event type
 * @param {Object} details - Event details
 */
export function logTokenEvent(event, details = {}) {
    // Only log token events in development when there's an issue or explicit debug mode
    const shouldLog = import.meta.env.VITE_DEBUG_AUTH === 'true';

    // Always log errors regardless of debug mode
    const isError = event.includes('ERROR') || event.includes('EXPIRED') || event.includes('INVALID');

    if (!isDevelopment || (!shouldLog && !isError)) return;

    const { token, ...safeDetails } = details;
    const tokenInfo = {
        timestamp: new Date().toISOString(),
        event,
        ...safeDetails
    };

    // Handle token information safely
    if (token) {
        tokenInfo.hasToken = !!token;
        tokenInfo.tokenLength = token.length;
    }

    if (isError) {
        console.warn('🔑 TOKEN ERROR:', tokenInfo);
    } else {
        console.log('🔑 TOKEN EVENT:', tokenInfo);
    }
}

/**
 * Log API request authentication details
 * Only logs when VITE_DEBUG_AUTH=true to reduce console spam
 * @param {string} url - Request URL
 * @param {Object} headers - Request headers
 * @param {string} method - HTTP method
 */
export function logApiRequestAuth(url, headers, method = 'GET') {
    if (!isDevelopment || import.meta.env.VITE_DEBUG_AUTH !== 'true') return;

    const authInfo = {
        timestamp: new Date().toISOString(),
        url,
        method,
        hasAuthHeader: !!headers.Authorization,
        hasUserIdHeader: !!headers['x-user-id'],
        authHeaderFormat: headers.Authorization ?
            (headers.Authorization.startsWith('Bearer ') ? 'Bearer Token' : 'Other') :
            'None'
    };

    console.log('📡 API AUTH REQUEST:', authInfo);
}

/**
 * Create context-specific error logger
 * @param {string} context - Default context for this logger
 * @returns {Function} - Configured error logger
 */
export function createAuthErrorLogger(context) {
    return (error, metadata = {}) => {
        return logAuthenticationError(error, context, metadata);
    };
}

/**
 * Enhanced error logger for verification operations
 * @param {Error|Object} error - Error object
 * @param {string} verificationType - 'email' or 'phone'
 * @param {Object} metadata - Additional metadata
 */
export function logVerificationError(error, verificationType, metadata = {}) {
    const context = `${verificationType}_verification`;
    const enhancedMetadata = {
        ...metadata,
        verificationType,
        verificationContext: context
    };

    return logAuthenticationError(error, context, enhancedMetadata);
}

/**
 * Log header construction issues
 * @param {Object} headerDetails - Details about header construction
 */
export function logHeaderConstructionIssue(headerDetails) {
    const errorInfo = {
        timestamp: new Date().toISOString(),
        context: AUTH_ERROR_CONTEXTS.HEADER_CONSTRUCTION,
        type: 'HEADER_CONSTRUCTION_ISSUE',
        ...headerDetails
    };

    if (isDevelopment) {
        console.warn('🔧 HEADER CONSTRUCTION ISSUE:', errorInfo);
    }
}

/**
 * Performance logger for authentication operations
 * Only logs slow operations or when VITE_DEBUG_AUTH=true
 * @param {string} operation - Operation name
 * @param {number} duration - Duration in milliseconds
 * @param {boolean} success - Whether operation succeeded
 */
export function logAuthPerformance(operation, duration, success = true) {
    if (!isDevelopment) return;

    // Only log slow operations (>1s) or when debug mode is enabled
    const shouldLog = duration > 1000 || import.meta.env.VITE_DEBUG_AUTH === 'true';
    if (!shouldLog) return;

    const perfInfo = {
        timestamp: new Date().toISOString(),
        operation,
        duration,
        success,
        performance: duration > 1000 ? 'SLOW' : duration > 500 ? 'MEDIUM' : 'FAST'
    };

    if (duration > 1000) {
        console.warn('🐌 SLOW AUTH OPERATION:', perfInfo);
    } else {
        console.log('⚡ AUTH PERFORMANCE:', perfInfo);
    }
}