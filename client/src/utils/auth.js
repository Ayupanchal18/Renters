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
 */

// Storage keys
const STORAGE_KEYS = {
    TOKEN: 'authToken',
    USER: 'user',
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

        // Log token validation result
        logTokenEvent('TOKEN_VALIDATION', {
            hasToken: true,
            isExpired,
            expiresAt: decoded.exp,
            currentTime,
            timeUntilExpiry: decoded.exp - currentTime,
            result: isExpired ? 'expired' : 'valid'
        });

        return isExpired;
    } catch (error) {
        // Log token decode error
        logAuthenticationError(error, AUTH_ERROR_CONTEXTS.TOKEN_VALIDATION, {
            tokenLength: token.length,
            tokenPrefix: token.substring(0, 10) + '...',
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
        console.error('Error getting token from localStorage:', error);
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
            console.log('=== setToken() called ===');
            console.log('Token to set:', token);
            console.log('Storage key:', STORAGE_KEYS.TOKEN);
            localStorage.setItem(STORAGE_KEYS.TOKEN, token);
            console.log('Token set in localStorage successfully');

            // Verify it was set
            const storedToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
            console.log('Verification - Token in localStorage:', storedToken);
            console.log('Tokens match:', storedToken === token);
        } else {
            console.warn('⚠️ setToken() called with empty/null token');
        }
    } catch (error) {
        console.error('Error setting token in localStorage:', error);
    }
};

/**
 * Remove the token from localStorage
 */
export const removeToken = () => {
    try {
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
    } catch (error) {
        console.error('Error removing token from localStorage:', error);
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
        console.error('Error getting user from localStorage:', error);
        return null;
    }
};

/**
 * Set user data in localStorage
 * @param {object} user - User data to store
 */
export const setUser = (user) => {
    try {
        if (user) {
            console.log('=== setUser() called ===');
            console.log('User to set:', user);
            console.log('Storage key:', STORAGE_KEYS.USER);

            // Check if user object has a token field
            if (user.token) {
                console.log('⚠️ User object contains token field:', user.token);
                console.log('This token should be saved separately in authToken');
            }

            localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
            console.log('User data set in localStorage successfully');
        } else {
            console.warn('⚠️ setUser() called with empty/null user');
        }
    } catch (error) {
        console.error('Error setting user in localStorage:', error);
    }
};

/**
 * Remove user data from localStorage
 */
export const removeUser = () => {
    try {
        localStorage.removeItem(STORAGE_KEYS.USER);
    } catch (error) {
        console.error('Error removing user from localStorage:', error);
    }
};

/**
 * Check if user is authenticated (has valid token)
 * @returns {boolean} - True if authenticated
 */
export const isAuthenticated = () => {
    const token = getToken();
    return token && !isTokenExpired(token);
};

/**
 * Clear all authentication data
 */
export const clearAuth = () => {
    const hadToken = !!getToken();
    const hadUser = !!getUser();

    removeToken();
    removeUser();

    // Disconnect socket on auth cleanup (Requirement 4.2)
    disconnectSocket();

    // Log authentication cleanup
    logTokenEvent('AUTH_CLEANUP', {
        hadToken,
        hadUser,
        reason: 'clearAuth_called'
    });
};

/**
 * Logout user - clear auth data and redirect to login
 * @param {function} navigate - React Router navigate function (required)
 */
export const logout = (navigate) => {
    // Log logout event
    logAuthenticationSuccess(AUTH_ERROR_CONTEXTS.LOGOUT, {
        hasNavigate: !!navigate,
        userInitiated: true
    });

    clearAuth();

    if (navigate) {
        navigate('/login', { replace: true });
    } else {
        logAuthenticationError(
            new Error('Navigate function not provided to logout'),
            AUTH_ERROR_CONTEXTS.LOGOUT,
            {
                navigateProvided: false,
                fallbackRequired: true
            }
        );
    }
};

/**
 * Decode token and get user info
 * @param {string} token - JWT token
 * @returns {object|null} - Decoded token payload or null
 */
export const getTokenPayload = (token) => {
    try {
        return token ? jwtDecode(token) : null;
    } catch (error) {
        console.error('Error decoding token:', error);
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
        return decoded.exp - currentTime;
    } catch (error) {
        console.error('Error calculating time until expiry:', error);
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
