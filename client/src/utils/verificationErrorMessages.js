/**
 * User-friendly error messages for verification failures
 * Provides context-aware error messages and recovery suggestions
 * Validates: Requirements 2.5
 */

import { ERROR_TYPES } from './errorHandling.js';
import { showErrorToast, showWarningToast, OPERATION_CONTEXTS } from './toastNotifications.jsx';

// Verification error types
export const VERIFICATION_ERROR_TYPES = {
    OTP_EXPIRED: 'OTP_EXPIRED',
    OTP_INVALID: 'OTP_INVALID',
    OTP_SEND_FAILED: 'OTP_SEND_FAILED',
    RATE_LIMITED: 'RATE_LIMITED',
    CONTACT_INVALID: 'CONTACT_INVALID',
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
    NETWORK_ERROR: 'NETWORK_ERROR',
    AUTHENTICATION_REQUIRED: 'AUTHENTICATION_REQUIRED',
    VERIFICATION_ALREADY_COMPLETE: 'VERIFICATION_ALREADY_COMPLETE',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

/**
 * Get user-friendly error message for verification failures
 * @param {Error|Object} error - Error object or response
 * @param {string} verificationType - 'email' or 'phone'
 * @param {string} contact - Email address or phone number
 * @returns {Object} - Formatted error message with recovery options
 */
export function getVerificationErrorMessage(error, verificationType = 'email', contact = '') {
    const errorType = categorizeVerificationError(error);
    const isEmail = verificationType === 'email';
    const contactType = isEmail ? 'email address' : 'phone number';
    const maskedContact = maskContact(contact, isEmail);

    const errorMessages = {
        [VERIFICATION_ERROR_TYPES.OTP_EXPIRED]: {
            title: 'Verification Code Expired',
            message: `Your ${verificationType} verification code has expired. Please request a new code.`,
            suggestion: 'Click "Resend Code" to get a new verification code.',
            recoveryActions: ['resend', 'change_contact'],
            severity: 'warning',
            retryable: true
        },

        [VERIFICATION_ERROR_TYPES.OTP_INVALID]: {
            title: 'Invalid Verification Code',
            message: `The verification code you entered is incorrect. Please check the code and try again.`,
            suggestion: 'Double-check the code in your messages and enter it exactly as shown.',
            recoveryActions: ['retry', 'resend'],
            severity: 'error',
            retryable: true
        },

        [VERIFICATION_ERROR_TYPES.OTP_SEND_FAILED]: {
            title: `Failed to Send ${isEmail ? 'Email' : 'SMS'}`,
            message: `We couldn't send a verification code to your ${contactType}${maskedContact ? ` (${maskedContact})` : ''}.`,
            suggestion: isEmail
                ? 'Please check that your email address is correct and try again.'
                : 'Please check that your phone number is correct and includes the country code.',
            recoveryActions: ['retry', 'change_contact', 'check_contact'],
            severity: 'error',
            retryable: true
        },

        [VERIFICATION_ERROR_TYPES.RATE_LIMITED]: {
            title: 'Too Many Attempts',
            message: `You've made too many verification attempts. Please wait before requesting another code.`,
            suggestion: 'Wait a few minutes before trying again to avoid being rate limited.',
            recoveryActions: ['wait', 'contact_support'],
            severity: 'warning',
            retryable: false
        },

        [VERIFICATION_ERROR_TYPES.CONTACT_INVALID]: {
            title: `Invalid ${isEmail ? 'Email Address' : 'Phone Number'}`,
            message: `The ${contactType} you provided appears to be invalid.`,
            suggestion: isEmail
                ? 'Please enter a valid email address (e.g., user@example.com).'
                : 'Please enter a valid phone number with country code (e.g., +1234567890).',
            recoveryActions: ['change_contact', 'check_format'],
            severity: 'error',
            retryable: false
        },

        [VERIFICATION_ERROR_TYPES.SERVICE_UNAVAILABLE]: {
            title: 'Verification Service Unavailable',
            message: `Our ${verificationType} verification service is temporarily unavailable.`,
            suggestion: 'Please try again in a few minutes. If the problem persists, contact support.',
            recoveryActions: ['retry_later', 'contact_support'],
            severity: 'error',
            retryable: true
        },

        [VERIFICATION_ERROR_TYPES.NETWORK_ERROR]: {
            title: 'Connection Problem',
            message: 'Unable to connect to our verification service.',
            suggestion: 'Please check your internet connection and try again.',
            recoveryActions: ['check_connection', 'retry'],
            severity: 'error',
            retryable: true
        },

        [VERIFICATION_ERROR_TYPES.AUTHENTICATION_REQUIRED]: {
            title: 'Authentication Required',
            message: 'You need to be logged in to verify your account.',
            suggestion: 'Please log in to your account and try again.',
            recoveryActions: ['login'],
            severity: 'error',
            retryable: false
        },

        [VERIFICATION_ERROR_TYPES.VERIFICATION_ALREADY_COMPLETE]: {
            title: 'Already Verified',
            message: `Your ${contactType} is already verified.`,
            suggestion: 'No further action is needed.',
            recoveryActions: ['refresh'],
            severity: 'info',
            retryable: false
        },

        [VERIFICATION_ERROR_TYPES.UNKNOWN_ERROR]: {
            title: 'Verification Failed',
            message: 'An unexpected error occurred during verification.',
            suggestion: 'Please try again. If the problem persists, contact support.',
            recoveryActions: ['retry', 'contact_support'],
            severity: 'error',
            retryable: true
        }
    };

    const errorInfo = errorMessages[errorType] || errorMessages[VERIFICATION_ERROR_TYPES.UNKNOWN_ERROR];

    return {
        ...errorInfo,
        errorType,
        verificationType,
        contact: maskedContact,
        timestamp: new Date().toISOString(),
        originalError: error?.message || 'Unknown error'
    };
}

/**
 * Categorize verification error based on error object
 * @param {Error|Object} error - Error object or response
 * @returns {string} - Verification error type
 */
function categorizeVerificationError(error) {
    if (!error) return VERIFICATION_ERROR_TYPES.UNKNOWN_ERROR;

    const message = error.message || error.error || '';
    const status = error.status || error.response?.status;

    // Check for specific error patterns
    if (message.toLowerCase().includes('expired') || message.toLowerCase().includes('timeout')) {
        return VERIFICATION_ERROR_TYPES.OTP_EXPIRED;
    }

    if (message.toLowerCase().includes('invalid') || message.toLowerCase().includes('incorrect')) {
        return VERIFICATION_ERROR_TYPES.OTP_INVALID;
    }

    if (message.toLowerCase().includes('rate limit') || message.toLowerCase().includes('too many')) {
        return VERIFICATION_ERROR_TYPES.RATE_LIMITED;
    }

    if (message.toLowerCase().includes('already verified') || message.toLowerCase().includes('already complete')) {
        return VERIFICATION_ERROR_TYPES.VERIFICATION_ALREADY_COMPLETE;
    }

    if (message.toLowerCase().includes('invalid email') || message.toLowerCase().includes('invalid phone')) {
        return VERIFICATION_ERROR_TYPES.CONTACT_INVALID;
    }

    if (message.toLowerCase().includes('send failed') || message.toLowerCase().includes('delivery failed')) {
        return VERIFICATION_ERROR_TYPES.OTP_SEND_FAILED;
    }

    // Check HTTP status codes
    if (status === 401 || status === 403) {
        return VERIFICATION_ERROR_TYPES.AUTHENTICATION_REQUIRED;
    }

    if (status === 429) {
        return VERIFICATION_ERROR_TYPES.RATE_LIMITED;
    }

    if (status >= 500) {
        return VERIFICATION_ERROR_TYPES.SERVICE_UNAVAILABLE;
    }

    if (error.code === 'NETWORK_ERROR' || message.toLowerCase().includes('network')) {
        return VERIFICATION_ERROR_TYPES.NETWORK_ERROR;
    }

    return VERIFICATION_ERROR_TYPES.UNKNOWN_ERROR;
}

/**
 * Mask contact information for display
 * @param {string} contact - Email or phone number
 * @param {boolean} isEmail - Whether contact is email
 * @returns {string} - Masked contact
 */
function maskContact(contact, isEmail) {
    if (!contact) return '';

    if (isEmail) {
        const [local, domain] = contact.split('@');
        if (!domain) return contact;

        const maskedLocal = local.length > 2
            ? local.substring(0, 2) + '*'.repeat(local.length - 2)
            : local;

        return `${maskedLocal}@${domain}`;
    } else {
        // Mask phone number
        if (contact.length > 4) {
            return contact.substring(0, contact.length - 4).replace(/\d/g, '*') + contact.slice(-4);
        }
        return contact;
    }
}

/**
 * Show verification error toast with appropriate styling and actions
 * @param {Error|Object} error - Error object
 * @param {string} verificationType - 'email' or 'phone'
 * @param {string} contact - Contact information
 * @param {Object} callbacks - Recovery action callbacks
 */
export function showVerificationErrorToast(error, verificationType, contact, callbacks = {}) {
    const errorInfo = getVerificationErrorMessage(error, verificationType, contact);
    const context = verificationType === 'email'
        ? OPERATION_CONTEXTS.EMAIL_VERIFICATION
        : OPERATION_CONTEXTS.PHONE_VERIFICATION;

    const toastOptions = {
        title: errorInfo.title,
        description: `${errorInfo.message} ${errorInfo.suggestion}`,
        duration: errorInfo.severity === 'error' ? 8000 : 6000
    };

    // Add retry action if available and error is retryable
    if (errorInfo.retryable && callbacks.onRetry) {
        toastOptions.onRetry = callbacks.onRetry;
        toastOptions.retryLabel = getRetryLabel(errorInfo.errorType);
    }

    if (errorInfo.severity === 'error') {
        showErrorToast(errorInfo.message, context, toastOptions);
    } else if (errorInfo.severity === 'warning') {
        showWarningToast(errorInfo.message, context, toastOptions);
    }

    return errorInfo;
}

/**
 * Get appropriate retry label for error type
 * @param {string} errorType - Verification error type
 * @returns {string} - Retry button label
 */
function getRetryLabel(errorType) {
    const labels = {
        [VERIFICATION_ERROR_TYPES.OTP_EXPIRED]: 'Resend Code',
        [VERIFICATION_ERROR_TYPES.OTP_INVALID]: 'Try Again',
        [VERIFICATION_ERROR_TYPES.OTP_SEND_FAILED]: 'Resend Code',
        [VERIFICATION_ERROR_TYPES.SERVICE_UNAVAILABLE]: 'Retry',
        [VERIFICATION_ERROR_TYPES.NETWORK_ERROR]: 'Retry',
        [VERIFICATION_ERROR_TYPES.UNKNOWN_ERROR]: 'Try Again'
    };

    return labels[errorType] || 'Try Again';
}

/**
 * Get recovery suggestions for verification errors
 * @param {string} errorType - Verification error type
 * @param {string} verificationType - 'email' or 'phone'
 * @returns {Array} - Array of recovery suggestion objects
 */
export function getVerificationRecoverySuggestions(errorType, verificationType) {
    const isEmail = verificationType === 'email';
    const contactType = isEmail ? 'email address' : 'phone number';

    const suggestions = {
        [VERIFICATION_ERROR_TYPES.OTP_EXPIRED]: [
            { action: 'resend', label: 'Request New Code', primary: true },
            { action: 'check_spam', label: isEmail ? 'Check Spam Folder' : 'Check Messages', primary: false }
        ],

        [VERIFICATION_ERROR_TYPES.OTP_INVALID]: [
            { action: 'retry', label: 'Try Again', primary: true },
            { action: 'resend', label: 'Get New Code', primary: false },
            { action: 'check_format', label: 'Check Code Format', primary: false }
        ],

        [VERIFICATION_ERROR_TYPES.OTP_SEND_FAILED]: [
            { action: 'retry', label: 'Try Again', primary: true },
            { action: 'check_contact', label: `Verify ${contactType}`, primary: false },
            { action: 'change_contact', label: `Update ${contactType}`, primary: false }
        ],

        [VERIFICATION_ERROR_TYPES.RATE_LIMITED]: [
            { action: 'wait', label: 'Wait and Try Later', primary: true },
            { action: 'contact_support', label: 'Contact Support', primary: false }
        ],

        [VERIFICATION_ERROR_TYPES.CONTACT_INVALID]: [
            { action: 'change_contact', label: `Update ${contactType}`, primary: true },
            { action: 'check_format', label: 'Check Format', primary: false }
        ],

        [VERIFICATION_ERROR_TYPES.SERVICE_UNAVAILABLE]: [
            { action: 'retry_later', label: 'Try Again Later', primary: true },
            { action: 'contact_support', label: 'Contact Support', primary: false }
        ],

        [VERIFICATION_ERROR_TYPES.NETWORK_ERROR]: [
            { action: 'check_connection', label: 'Check Connection', primary: true },
            { action: 'retry', label: 'Try Again', primary: false }
        ],

        [VERIFICATION_ERROR_TYPES.AUTHENTICATION_REQUIRED]: [
            { action: 'login', label: 'Log In', primary: true }
        ],

        [VERIFICATION_ERROR_TYPES.VERIFICATION_ALREADY_COMPLETE]: [
            { action: 'refresh', label: 'Refresh Page', primary: true }
        ]
    };

    return suggestions[errorType] || [
        { action: 'retry', label: 'Try Again', primary: true },
        { action: 'contact_support', label: 'Contact Support', primary: false }
    ];
}