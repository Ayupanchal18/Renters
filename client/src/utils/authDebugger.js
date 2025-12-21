/**
 * Development debugging utilities for authentication system
 * Provides detailed debugging information in development mode
 * Validates: Requirements 3.3
 */

import { getToken, getUser, isTokenExpired, getTokenPayload } from './auth.js';

// Development mode detection
const isDevelopment = import.meta.env.DEV || process.env.NODE_ENV === 'development';

/**
 * Debug authentication state and log detailed information
 * Only works in development mode
 */
export function debugAuthState() {
    if (!isDevelopment) return;

    console.group('🔍 AUTH DEBUG STATE');

    try {
        const token = getToken();
        const user = getUser();
        const isAuthenticated = !!token && !isTokenExpired(token);

        console.log('📊 Authentication Overview:');
        console.table({
            'Has Token': !!token,
            'Has User': !!user,
            'Is Authenticated': isAuthenticated,
            'Token Expired': token ? isTokenExpired(token) : 'N/A',
            'Environment': isDevelopment ? 'Development' : 'Production'
        });

        if (token) {
            console.log('🔑 Token Details:');
            console.log('- Length:', token.length);
            console.log('- Prefix:', token.substring(0, 20) + '...');

            try {
                const payload = getTokenPayload(token);
                if (payload) {
                    console.log('- Payload:', {
                        userId: payload.sub || payload.userId,
                        email: payload.email,
                        role: payload.role,
                        issuedAt: new Date(payload.iat * 1000).toISOString(),
                        expiresAt: new Date(payload.exp * 1000).toISOString(),
                        timeUntilExpiry: Math.round((payload.exp * 1000 - Date.now()) / 1000) + ' seconds'
                    });
                }
            } catch (error) {
                console.error('- Token decode error:', error.message);
            }
        } else {
            console.log('🔑 No token found in localStorage');
        }

        if (user) {
            console.log('👤 User Details:');
            console.log('- ID:', user.id || user._id);
            console.log('- Name:', user.name);
            console.log('- Email:', user.email);
            console.log('- Phone:', user.phone);
            console.log('- Email Verified:', user.emailVerified);
            console.log('- Phone Verified:', user.phoneVerified);
        } else {
            console.log('👤 No user data found in localStorage');
        }

        // Check localStorage contents
        console.log('💾 LocalStorage Contents:');
        const authToken = localStorage.getItem('authToken');
        const userData = localStorage.getItem('user');
        const userId = localStorage.getItem('userId');

        console.table({
            'authToken': authToken ? `${authToken.length} chars` : 'null',
            'user': userData ? 'Present' : 'null',
            'userId': userId || 'null'
        });

        // Network status
        console.log('🌐 Network Status:');
        console.table({
            'Online': navigator.onLine,
            'Connection': navigator.connection?.effectiveType || 'unknown',
            'User Agent': navigator.userAgent.substring(0, 50) + '...'
        });

    } catch (error) {
        console.error('❌ Error debugging auth state:', error);
    }

    console.groupEnd();
}

/**
 * Debug API request headers
 * @param {Object} headers - Request headers
 * @param {string} url - Request URL
 */
export function debugApiHeaders(headers, url) {
    if (!isDevelopment) return;

    console.group(`📡 API REQUEST DEBUG: ${url}`);

    console.log('🔧 Headers Analysis:');
    console.table({
        'Content-Type': headers['Content-Type'] || 'missing',
        'Authorization': headers['Authorization'] ?
            (headers['Authorization'].startsWith('Bearer ') ?
                `Bearer ${headers['Authorization'].substring(7, 17)}...` :
                'Invalid format') :
            'missing',
        'x-user-id': headers['x-user-id'] || 'missing'
    });

    // Validate Authorization header format
    if (headers['Authorization']) {
        const authHeader = headers['Authorization'];
        const isValidFormat = authHeader.startsWith('Bearer ') && authHeader.length > 7;
        const hasSpace = authHeader.includes(' ');

        console.log('✅ Authorization Header Validation:');
        console.table({
            'Format': isValidFormat ? 'Valid' : 'Invalid',
            'Has Bearer Prefix': authHeader.startsWith('Bearer'),
            'Has Space After Bearer': hasSpace,
            'Token Length': authHeader.length > 7 ? authHeader.length - 7 : 0
        });

        if (!isValidFormat) {
            console.warn('⚠️ Authorization header format issues detected!');
            if (!authHeader.startsWith('Bearer ')) {
                console.warn('- Missing "Bearer " prefix');
            }
            if (!hasSpace) {
                console.warn('- Missing space after "Bearer"');
            }
        }
    } else {
        console.warn('⚠️ No Authorization header found');
    }

    console.groupEnd();
}

/**
 * Debug verification status response
 * @param {Object} response - Verification status response
 */
export function debugVerificationResponse(response) {
    if (!isDevelopment) return;

    console.group('🔍 VERIFICATION RESPONSE DEBUG');

    try {
        console.log('📊 Response Structure:');
        console.table({
            'Has Success Field': 'success' in response,
            'Success Value': response.success,
            'Has Verification Field': 'verification' in response,
            'Has Email Verification': response.verification?.email ? 'Yes' : 'No',
            'Has Phone Verification': response.verification?.phone ? 'Yes' : 'No'
        });

        if (response.verification) {
            console.log('📧 Email Verification:');
            const email = response.verification.email;
            if (email) {
                console.table({
                    'Verified': email.verified,
                    'Contact': email.contact,
                    'Verified At': email.verifiedAt || 'Not set'
                });
            } else {
                console.log('- No email verification data');
            }

            console.log('📱 Phone Verification:');
            const phone = response.verification.phone;
            if (phone) {
                console.table({
                    'Verified': phone.verified,
                    'Contact': phone.contact,
                    'Verified At': phone.verifiedAt || 'Not set'
                });
            } else {
                console.log('- No phone verification data');
            }
        }

        // Validate response format
        const isValidFormat = response.success !== undefined && response.verification !== undefined;
        console.log('✅ Format Validation:', isValidFormat ? 'Valid' : 'Invalid');

        if (!isValidFormat) {
            console.warn('⚠️ Response format issues:');
            if (response.success === undefined) console.warn('- Missing "success" field');
            if (response.verification === undefined) console.warn('- Missing "verification" field');
        }

    } catch (error) {
        console.error('❌ Error debugging verification response:', error);
    }

    console.groupEnd();
}

/**
 * Debug token expiration and timing
 * @param {string} token - JWT token
 */
export function debugTokenTiming(token) {
    if (!isDevelopment || !token) return;

    console.group('⏰ TOKEN TIMING DEBUG');

    try {
        const payload = getTokenPayload(token);
        if (!payload) {
            console.error('❌ Cannot decode token');
            return;
        }

        const now = Date.now() / 1000;
        const issuedAt = payload.iat;
        const expiresAt = payload.exp;
        const age = now - issuedAt;
        const timeUntilExpiry = expiresAt - now;
        const totalLifetime = expiresAt - issuedAt;

        console.log('📊 Token Timing Analysis:');
        console.table({
            'Issued At': new Date(issuedAt * 1000).toISOString(),
            'Expires At': new Date(expiresAt * 1000).toISOString(),
            'Current Time': new Date(now * 1000).toISOString(),
            'Age (seconds)': Math.round(age),
            'Time Until Expiry (seconds)': Math.round(timeUntilExpiry),
            'Total Lifetime (seconds)': Math.round(totalLifetime),
            'Is Expired': timeUntilExpiry <= 0
        });

        // Warnings for token timing issues
        if (timeUntilExpiry <= 0) {
            console.warn('🚨 Token is EXPIRED');
        } else if (timeUntilExpiry < 300) { // 5 minutes
            console.warn('⚠️ Token expires soon (< 5 minutes)');
        } else if (timeUntilExpiry < 900) { // 15 minutes
            console.warn('⚠️ Token expires in < 15 minutes');
        }

        if (age > 86400) { // 24 hours
            console.warn('⚠️ Token is very old (> 24 hours)');
        }

    } catch (error) {
        console.error('❌ Error debugging token timing:', error);
    }

    console.groupEnd();
}

/**
 * Debug localStorage authentication data
 */
export function debugLocalStorage() {
    if (!isDevelopment) return;

    console.group('💾 LOCALSTORAGE DEBUG');

    try {
        const keys = ['authToken', 'user', 'userId'];
        const data = {};

        keys.forEach(key => {
            const value = localStorage.getItem(key);
            data[key] = {
                exists: value !== null,
                type: typeof value,
                length: value ? value.length : 0,
                preview: value ? (value.length > 50 ? value.substring(0, 50) + '...' : value) : null
            };
        });

        console.table(data);

        // Check for common issues
        const authToken = localStorage.getItem('authToken');
        const user = localStorage.getItem('user');

        console.log('🔍 Common Issues Check:');
        const issues = [];

        if (!authToken) issues.push('No authToken found');
        if (!user) issues.push('No user data found');
        if (authToken && authToken.startsWith('Bearer')) issues.push('authToken includes Bearer prefix (should be token only)');

        if (user) {
            try {
                const userData = JSON.parse(user);
                if (userData.token) issues.push('User object contains token field (should be separate)');
            } catch (e) {
                issues.push('User data is not valid JSON');
            }
        }

        if (issues.length > 0) {
            console.warn('⚠️ Issues found:');
            issues.forEach(issue => console.warn(`- ${issue}`));
        } else {
            console.log('✅ No common issues detected');
        }

    } catch (error) {
        console.error('❌ Error debugging localStorage:', error);
    }

    console.groupEnd();
}

/**
 * Comprehensive authentication debug report
 */
export function debugAuthReport() {
    if (!isDevelopment) return;

    console.log('🔍 COMPREHENSIVE AUTH DEBUG REPORT');
    console.log('='.repeat(50));

    debugAuthState();
    debugLocalStorage();

    const token = getToken();
    if (token) {
        debugTokenTiming(token);
    }

    console.log('='.repeat(50));
}

// Auto-debug on errors (development only)
if (isDevelopment) {
    window.debugAuth = debugAuthReport;
    window.debugAuthState = debugAuthState;
    window.debugLocalStorage = debugLocalStorage;

    console.log('🔧 Auth debugging utilities available:');
    console.log('- window.debugAuth() - Full auth report');
    console.log('- window.debugAuthState() - Current auth state');
    console.log('- window.debugLocalStorage() - LocalStorage contents');
}