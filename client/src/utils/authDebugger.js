/**
 * Auth Debugger Utilities
 * Debug helpers for authentication and API requests (development only)
 */

const isDevelopment = typeof process !== 'undefined'
    ? process.env.NODE_ENV === 'development'
    : false;

/**
 * Debug API headers in development mode
 * @param {Object} headers - Request headers
 * @param {string} context - Context description
 */
export function debugApiHeaders(headers, context = 'api_request') {
    if (!isDevelopment) return;

    // Only log in development if explicitly enabled
    if (typeof localStorage !== 'undefined' && localStorage.getItem('DEBUG_AUTH') === 'true') {
        console.debug(`[Auth Debug] ${context}:`, {
            hasAuth: !!headers?.Authorization,
            hasUserId: !!headers?.['x-user-id']
        });
    }
}

/**
 * Debug verification response in development mode
 * @param {Object} data - Verification response data
 */
export function debugVerificationResponse(data) {
    if (!isDevelopment) return;

    // Only log in development if explicitly enabled
    if (typeof localStorage !== 'undefined' && localStorage.getItem('DEBUG_AUTH') === 'true') {
        console.debug('[Auth Debug] Verification response:', {
            success: data?.success,
            emailVerified: data?.verification?.email?.verified,
            phoneVerified: data?.verification?.phone?.verified
        });
    }
}

export default {
    debugApiHeaders,
    debugVerificationResponse
};
