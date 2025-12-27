import { jwtDecode } from 'jwt-decode';
import {
    logAuthenticationError,
    logAuthenticationSuccess,
    logTokenEvent,
    AUTH_ERROR_CONTEXTS
} from './authErrorLogger.js';
import { disconnectSocket } from '../lib/socket';

/**
 * Authentication Utility Functions
 * Centralized token management and validation
 * 
 * SECURITY NOTES:
 * - Access tokens are stored in localStorage (short-lived, 15 min)
 * - Refresh tokens are stored in httpOnly cookies (handled by browser)
 * - Never store sensitive data like passwords in localStorage
 */

// Storage keys - SECURITY: Only store non-sensitive data
const STORAGE_KEYS = {
    TOKEN: 'authToken',
    USER: 'user',
};

// Sensitive fields that should never be stored in localStorage
const SENSITIVE_FIELDS = ['password', 'passwordHash', 'refreshToken', 'otp'];

/**
 * Sanitize user object before storing - remove sensitive fields
 * @param {object} user - User object
 * @returns {object} - Sanitized user object
 */
const sanitizeUserForStorage = (user) => {
    if (!user) return null;
    const sanitized = { ...user };
    SENSITIVE_FIELDS.forEach(field => {
        delete sanitized[field];
    });
    return sanitized;
};

/**
 * Check if a JWT token is expired
 * @param {string} token - JWT token
 * @returns {boolean} - True if token is expired or invalid
 */
export const isTokenExpired = (token) => {
    if (!token) {
        logTokenEvent('TOKEN_VALIDATION', {
            hasToken: false,
            result: 'expired'
        });
        return true;
    }

    try {
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000; // Convert to seconds
        const isExpired = decoded.exp < currentTime;

        // Log token validation result (without sensitive data)
        logTokenEvent('TOKEN_VALIDATION', {
            hasToken: true,
            isExpired,
            timeUntilExpiry: Math.round(decoded.exp - currentTime),
            result: isExpired ? 'expired' : 'valid'
        });

        return isExpired;
    } catch (error) {
        // Log token decode error (without exposing token content)
        logAuthenticationError(error, AUTH_ERROR_CONTEXTS.TOKEN_VALIDATION, {
            decodeError: true
        });

        return true; // Consider invalid tokens as expired
    }
};

/**
 * Get the token from localStorage
 * @returns {string|null} - Token or null if not found
 */
export const getToken = () => {
    try {
        return localStorage.getItem(STORAGE_KEYS.TOKEN);
    } catch (error) {
        console.error('Error getting token from localStorage:', error.message);
        return null;
    }
};

/**
 * Set the token in localStorage
 * @param {string} token - JWT token to store
 */
export const setToken = (token) => {
    try {
        if (token) {
            localStorage.setItem(STORAGE_KEYS.TOKEN, token);
        }
    } catch (error) {
        console.error('Error setting token in localStorage:', error.message);
    }
};

/**
 * Remove the token from localStorage
 */
export const removeToken = () => {
    try {
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
    } catch (error) {
        console.error('Error removing token from localStorage:', error.message);
    }
};

/**
 * Get the user data from localStorage
 * @returns {object|null} - User object or null
 */
export const getUser = () => {
    try {
        const user = localStorage.getItem(STORAGE_KEYS.USER);
        return user ? JSON.parse(user) : null;
    } catch (error) {
        console.error('Error getting user from localStorage:', error.message);
        return null;
    }
};

/**
 * Set user data in localStorage (sanitized)
 * @param {object} user - User data to store
 */
export const setUser = (user) => {
    try {
        if (user) {
            // Sanitize user data before storing
            const sanitizedUser = sanitizeUserForStorage(user);
            localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(sanitizedUser));
        }
    } catch (error) {
        console.error('Error setting user in localStorage:', error.message);
    }
};

/**
 * Remove user data from localStorage
 */
export const removeUser = () => {
    try {
        localStorage.removeItem(STORAGE_KEYS.USER);
    } catch (error) {
        console.error('Error removing user from localStorage:', error.message);
    }
};

/**
 * Check if user is authenticated (has valid token)
 * @returns {boolean} - True if authenticated
 */
export const isAuthenticated = () => {
    const token = getToken();
    if (!token) return false;

    // Check if token is expired
    if (isTokenExpired(token)) {
        // Try to refresh the token
        refreshAccessToken().catch(() => {
            // If refresh fails, clear auth
            clearAuth();
        });
        return false;
    }

    return true;
};

/**
 * Refresh the access token using the refresh token (stored in httpOnly cookie)
 * @returns {Promise<string|null>} - New access token or null
 */
export const refreshAccessToken = async () => {
    try {
        const response = await fetch('/api/auth/refresh', {
            method: 'POST',
            credentials: 'include', // Include httpOnly cookies
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Token refresh failed');
        }

        const data = await response.json();

        if (data.success && data.token) {
            setToken(data.token);
            logTokenEvent('TOKEN_REFRESH', { success: true });
            return data.token;
        }

        throw new Error('Invalid refresh response');
    } catch (error) {
        logAuthenticationError(error, AUTH_ERROR_CONTEXTS.TOKEN_REFRESH, {
            refreshFailed: true
        });
        return null;
    }
};

/**
 * Clear all authentication data
 */
export const clearAuth = () => {
    const hadToken = !!getToken();
    const hadUser = !!getUser();

    removeToken();
    removeUser();

    // Disconnect socket on auth cleanup
    disconnectSocket();

    // Log authentication cleanup
    logTokenEvent('AUTH_CLEANUP', {
        hadToken,
        hadUser,
        reason: 'clearAuth_called'
    });
};

/**
 * Logout user - clear auth data, invalidate refresh token, and redirect
 * @param {function} navigate - React Router navigate function (required)
 */
export const logout = async (navigate) => {
    try {
        // Call logout endpoint to invalidate refresh token
        await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
        });
    } catch (error) {
        // Continue with local logout even if server call fails
        console.error('Logout API call failed:', error.message);
    }

    // Log logout event
    logAuthenticationSuccess(AUTH_ERROR_CONTEXTS.LOGOUT, {
        hasNavigate: !!navigate,
        userInitiated: true
    });

    clearAuth();

    if (navigate) {
        navigate('/login', { replace: true });
    }
};

/**
 * Decode token and get user info (without sensitive data)
 * @param {string} token - JWT token
 * @returns {object|null} - Decoded token payload or null
 */
export const getTokenPayload = (token) => {
    try {
        if (!token) return null;
        const decoded = jwtDecode(token);
        // Return only safe fields
        return {
            sub: decoded.sub,
            role: decoded.role,
            exp: decoded.exp,
            iat: decoded.iat
        };
    } catch (error) {
        console.error('Error decoding token:', error.message);
        return null;
    }
};

/**
 * Get time until token expiration in seconds
 * @param {string} token - JWT token
 * @returns {number} - Seconds until expiration (negative if expired)
 */
export const getTimeUntilExpiry = (token) => {
    if (!token) return 0;

    try {
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        return Math.round(decoded.exp - currentTime);
    } catch (error) {
        console.error('Error calculating time until expiry:', error.message);
        return 0;
    }
};

/**
 * Check if token should be refreshed (less than 5 minutes remaining)
 * @param {string} token - JWT token
 * @returns {boolean} - True if token should be refreshed
 */
export const shouldRefreshToken = (token) => {
    const timeUntilExpiry = getTimeUntilExpiry(token);
    const REFRESH_THRESHOLD = 300; // 5 minutes in seconds
    return timeUntilExpiry > 0 && timeUntilExpiry < REFRESH_THRESHOLD;
};

/**
 * Setup automatic token refresh
 * Call this on app initialization
 */
export const setupTokenRefresh = () => {
    // Check token every minute
    const checkInterval = setInterval(async () => {
        const token = getToken();
        if (token && shouldRefreshToken(token)) {
            await refreshAccessToken();
        }
    }, 60000); // Check every minute

    // Return cleanup function
    return () => clearInterval(checkInterval);
};
