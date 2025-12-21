/**
 * Toast notification utilities for verification and security operations
 * Validates: Requirements 2.3, 3.3, 4.5, 5.5, 6.5, 9.3, 9.4, 9.5
 */

import { toast } from '../hooks/use-toast';
import { CheckCircle, AlertCircle, AlertTriangle, Info, Mail, Phone, Lock, Shield } from 'lucide-react';

// Toast types for different operations
export const TOAST_TYPES = {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info'
};

// Operation contexts
export const OPERATION_CONTEXTS = {
    EMAIL_VERIFICATION: 'email_verification',
    PHONE_VERIFICATION: 'phone_verification',
    PASSWORD_CHANGE: 'password_change',
    PHONE_UPDATE: 'phone_update',
    ACCOUNT_DELETE: 'account_delete',
    OTP_SEND: 'otp_send',
    OTP_VERIFY: 'otp_verify',
    OTP_DELIVERY: 'otp_delivery',
    OTP_RETRY: 'otp_retry',
    TEST_DELIVERY: 'test_delivery',
    CONNECTIVITY_TEST: 'connectivity_test',
    PREFERENCES_UPDATE: 'preferences_update',
    SECURITY_GENERAL: 'security_general'
};

/**
 * Show success toast notification
 * @param {string} message - Success message
 * @param {string} context - Operation context
 * @param {Object} options - Additional options
 */
export function showSuccessToast(message, context = '', options = {}) {
    const { title, description, duration = 5000 } = options;

    const contextTitles = {
        [OPERATION_CONTEXTS.EMAIL_VERIFICATION]: 'Email Verified',
        [OPERATION_CONTEXTS.PHONE_VERIFICATION]: 'Phone Verified',
        [OPERATION_CONTEXTS.PASSWORD_CHANGE]: 'Password Updated',
        [OPERATION_CONTEXTS.PHONE_UPDATE]: 'Phone Updated',
        [OPERATION_CONTEXTS.ACCOUNT_DELETE]: 'Account Deleted',
        [OPERATION_CONTEXTS.OTP_SEND]: 'Code Sent',
        [OPERATION_CONTEXTS.OTP_VERIFY]: 'Code Verified',
        [OPERATION_CONTEXTS.OTP_DELIVERY]: 'Delivery Status',
        [OPERATION_CONTEXTS.OTP_RETRY]: 'Retry Initiated',
        [OPERATION_CONTEXTS.TEST_DELIVERY]: 'Test Complete',
        [OPERATION_CONTEXTS.CONNECTIVITY_TEST]: 'Connection Test',
        [OPERATION_CONTEXTS.PREFERENCES_UPDATE]: 'Preferences Updated',
        [OPERATION_CONTEXTS.SECURITY_GENERAL]: 'Security Updated'
    };

    const contextIcons = {
        [OPERATION_CONTEXTS.EMAIL_VERIFICATION]: Mail,
        [OPERATION_CONTEXTS.PHONE_VERIFICATION]: Phone,
        [OPERATION_CONTEXTS.PASSWORD_CHANGE]: Lock,
        [OPERATION_CONTEXTS.PHONE_UPDATE]: Phone,
        [OPERATION_CONTEXTS.ACCOUNT_DELETE]: Shield,
        [OPERATION_CONTEXTS.OTP_SEND]: Mail,
        [OPERATION_CONTEXTS.OTP_VERIFY]: CheckCircle,
        [OPERATION_CONTEXTS.OTP_DELIVERY]: CheckCircle,
        [OPERATION_CONTEXTS.OTP_RETRY]: Info,
        [OPERATION_CONTEXTS.TEST_DELIVERY]: CheckCircle,
        [OPERATION_CONTEXTS.CONNECTIVITY_TEST]: CheckCircle,
        [OPERATION_CONTEXTS.PREFERENCES_UPDATE]: CheckCircle,
        [OPERATION_CONTEXTS.SECURITY_GENERAL]: Shield
    };

    const Icon = contextIcons[context] || CheckCircle;

    toast({
        title: title || contextTitles[context] || 'Success',
        description: description || message,
        duration,
        className: 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/50',
        action: (
            <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-green-600" />
            </div>
        )
    });
}

/**
 * Show error toast notification with retry option
 * @param {string|Error} error - Error message or error object
 * @param {string} context - Operation context
 * @param {Object} options - Additional options including retry callback
 */
export function showErrorToast(error, context = '', options = {}) {
    const { title, description, duration = 8000, onRetry, retryLabel = 'Try Again' } = options;

    const errorMessage = typeof error === 'string' ? error : error?.message || 'An error occurred';

    const contextTitles = {
        [OPERATION_CONTEXTS.EMAIL_VERIFICATION]: 'Email Verification Failed',
        [OPERATION_CONTEXTS.PHONE_VERIFICATION]: 'Phone Verification Failed',
        [OPERATION_CONTEXTS.PASSWORD_CHANGE]: 'Password Change Failed',
        [OPERATION_CONTEXTS.PHONE_UPDATE]: 'Phone Update Failed',
        [OPERATION_CONTEXTS.ACCOUNT_DELETE]: 'Account Deletion Failed',
        [OPERATION_CONTEXTS.OTP_SEND]: 'Failed to Send Code',
        [OPERATION_CONTEXTS.OTP_VERIFY]: 'Code Verification Failed',
        [OPERATION_CONTEXTS.SECURITY_GENERAL]: 'Security Operation Failed'
    };

    const toastConfig = {
        title: title || contextTitles[context] || 'Error',
        description: description || errorMessage,
        duration,
        variant: 'destructive',
        className: 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/50'
    };

    // Add retry action if provided
    if (onRetry && typeof onRetry === 'function') {
        toastConfig.action = (
            <button
                onClick={onRetry}
                className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition-colors"
            >
                <AlertCircle className="h-3 w-3" />
                {retryLabel}
            </button>
        );
    }

    toast(toastConfig);
}

/**
 * Show warning toast notification
 * @param {string} message - Warning message
 * @param {string} context - Operation context
 * @param {Object} options - Additional options
 */
export function showWarningToast(message, context = '', options = {}) {
    const { title, description, duration = 6000, action } = options;

    const contextTitles = {
        [OPERATION_CONTEXTS.EMAIL_VERIFICATION]: 'Email Verification Warning',
        [OPERATION_CONTEXTS.PHONE_VERIFICATION]: 'Phone Verification Warning',
        [OPERATION_CONTEXTS.PASSWORD_CHANGE]: 'Password Warning',
        [OPERATION_CONTEXTS.PHONE_UPDATE]: 'Phone Update Warning',
        [OPERATION_CONTEXTS.ACCOUNT_DELETE]: 'Account Deletion Warning',
        [OPERATION_CONTEXTS.OTP_SEND]: 'Code Sending Warning',
        [OPERATION_CONTEXTS.OTP_VERIFY]: 'Code Verification Warning',
        [OPERATION_CONTEXTS.SECURITY_GENERAL]: 'Security Warning'
    };

    toast({
        title: title || contextTitles[context] || 'Warning',
        description: description || message,
        duration,
        className: 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/50',
        action: action || (
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
        )
    });
}

/**
 * Show info toast notification
 * @param {string} message - Info message
 * @param {string} context - Operation context
 * @param {Object} options - Additional options
 */
export function showInfoToast(message, context = '', options = {}) {
    const { title, description, duration = 4000 } = options;

    const contextTitles = {
        [OPERATION_CONTEXTS.EMAIL_VERIFICATION]: 'Email Verification Info',
        [OPERATION_CONTEXTS.PHONE_VERIFICATION]: 'Phone Verification Info',
        [OPERATION_CONTEXTS.PASSWORD_CHANGE]: 'Password Info',
        [OPERATION_CONTEXTS.PHONE_UPDATE]: 'Phone Update Info',
        [OPERATION_CONTEXTS.ACCOUNT_DELETE]: 'Account Deletion Info',
        [OPERATION_CONTEXTS.OTP_SEND]: 'Code Sending Info',
        [OPERATION_CONTEXTS.OTP_VERIFY]: 'Code Verification Info',
        [OPERATION_CONTEXTS.SECURITY_GENERAL]: 'Security Info'
    };

    toast({
        title: title || contextTitles[context] || 'Information',
        description: description || message,
        duration,
        className: 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/50',
        action: (
            <Info className="h-4 w-4 text-blue-600" />
        )
    });
}

/**
 * Show rate limit toast notification
 * @param {number} retryAfter - Seconds until next attempt allowed
 * @param {string} context - Operation context
 */
export function showRateLimitToast(retryAfter, context = '') {
    const minutes = Math.ceil(retryAfter / 60);
    const timeText = minutes > 1 ? `${minutes} minutes` : `${retryAfter} seconds`;

    const contextMessages = {
        [OPERATION_CONTEXTS.EMAIL_VERIFICATION]: 'Too many email verification attempts',
        [OPERATION_CONTEXTS.PHONE_VERIFICATION]: 'Too many phone verification attempts',
        [OPERATION_CONTEXTS.PASSWORD_CHANGE]: 'Too many password change attempts',
        [OPERATION_CONTEXTS.OTP_SEND]: 'Too many code requests',
        [OPERATION_CONTEXTS.OTP_VERIFY]: 'Too many verification attempts'
    };

    const message = contextMessages[context] || 'Too many attempts';

    showWarningToast(
        `${message}. Please wait ${timeText} before trying again.`,
        context,
        {
            title: 'Rate Limit Exceeded',
            duration: 10000
        }
    );
}

/**
 * Show OTP expiration toast notification
 * @param {string} type - 'email' or 'phone'
 * @param {Function} onResend - Callback to resend OTP
 */
export function showOTPExpirationToast(type, onResend) {
    const context = type === 'email' ? OPERATION_CONTEXTS.EMAIL_VERIFICATION : OPERATION_CONTEXTS.PHONE_VERIFICATION;

    showWarningToast(
        `Your ${type} verification code has expired.`,
        context,
        {
            title: 'Code Expired',
            duration: 8000,
            action: onResend ? (
                <button
                    onClick={onResend}
                    className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-accent text-accent-foreground rounded hover:bg-accent/90 transition-colors"
                >
                    <Mail className="h-3 w-3" />
                    Resend Code
                </button>
            ) : undefined
        }
    );
}

/**
 * Show password strength warning
 * @param {string} strength - Password strength level
 */
export function showPasswordStrengthWarning(strength) {
    const messages = {
        weak: 'Your password is too weak. Consider using a stronger password.',
        fair: 'Your password could be stronger. Add more characters or symbols.',
        good: 'Good password strength. Consider adding more complexity for better security.'
    };

    if (messages[strength]) {
        showWarningToast(
            messages[strength],
            OPERATION_CONTEXTS.PASSWORD_CHANGE,
            {
                title: 'Password Strength',
                duration: 5000
            }
        );
    }
}

/**
 * Show security event notification
 * @param {string} event - Security event type
 * @param {Object} details - Event details
 */
export function showSecurityEventToast(event, details = {}) {
    const eventMessages = {
        'password_changed': 'Your password has been successfully changed.',
        'phone_updated': 'Your phone number has been successfully updated.',
        'email_verified': 'Your email address has been successfully verified.',
        'phone_verified': 'Your phone number has been successfully verified.',
        'account_deleted': 'Your account has been successfully deleted.',
        'login_detected': 'New login detected from a different device or location.',
        'security_alert': 'Unusual security activity detected on your account.'
    };

    const message = eventMessages[event] || 'Security event occurred.';

    if (['login_detected', 'security_alert'].includes(event)) {
        showWarningToast(
            message,
            OPERATION_CONTEXTS.SECURITY_GENERAL,
            {
                title: 'Security Alert',
                duration: 10000
            }
        );
    } else {
        showSuccessToast(
            message,
            OPERATION_CONTEXTS.SECURITY_GENERAL,
            {
                duration: 5000
            }
        );
    }
}

/**
 * Dismiss all toasts
 */
export function dismissAllToasts() {
    // This would need to be implemented based on the toast library being used
    // For now, we'll just log it
    console.log('Dismissing all toasts');
}