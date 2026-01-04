import { getToken, clearAuth, isTokenExpired } from '../utils/auth.js';
import {
    logAuthenticationError,
    logAuthenticationSuccess,
    logTokenEvent,
    logApiRequestAuth,
    AUTH_ERROR_CONTEXTS
} from '../utils/authErrorLogger.js';
import {
    getVerificationErrorMessage,
    showVerificationErrorToast
} from '../utils/verificationErrorMessages.js';
import {
    debugApiHeaders,
    debugVerificationResponse
} from '../utils/authDebugger.js';

const API_BASE = "/api";

/**
 * Handle authentication errors and cleanup
 * @param {Response} response - Fetch response object
 * @param {Function} navigate - React Router navigate function (optional)
 * @param {string} context - Context where error occurred
 * @returns {boolean} - True if authentication error was handled
 */
export function handleAuthError(response, navigate = null, context = AUTH_ERROR_CONTEXTS.API_REQUEST) {
    if (response.status === 401 || response.status === 403) {
        // Create error object for logging
        const error = {
            response,
            message: `Authentication failed with status ${response.status}`,
            status: response.status
        };

        // Log the authentication error with context
        logAuthenticationError(error, context, {
            url: response.url,
            status: response.status,
            statusText: response.statusText,
            redirecting: !!navigate
        });

        // Log token event for debugging
        const currentToken = getToken();
        logTokenEvent('AUTH_ERROR_CLEANUP', {
            hasToken: !!currentToken,
            tokenExpired: currentToken ? isTokenExpired(currentToken) : null,
            responseStatus: response.status
        });

        // Clear authentication data
        clearAuth();

        // Redirect to login if navigate function is provided
        if (navigate) {
            navigate('/login', { replace: true });
        } else if (typeof window !== 'undefined') {
            // Fallback: use window.location if navigate is not available
            window.location.href = '/login';
        }

        return true;
    }
    return false;
}

/**
 * Enhanced fetch wrapper with authentication error handling
 * @param {string} url - API endpoint URL
 * @param {object} options - Fetch options
 * @param {Function} navigate - React Router navigate function (optional)
 * @returns {Promise<Response>} - Fetch response
 */
export async function authenticatedFetch(url, options = {}, navigate = null) {
    const startTime = performance.now();

    // Check if token is expired before making the request
    const token = getToken();
    if (token && isTokenExpired(token)) {
        const error = new Error('Authentication token has expired');

        logAuthenticationError(error, AUTH_ERROR_CONTEXTS.TOKEN_EXPIRY, {
            url,
            method: options.method || 'GET',
            tokenExpired: true,
            redirecting: !!navigate
        });

        logTokenEvent('TOKEN_EXPIRED_CLEANUP', {
            url,
            hasToken: true,
            tokenExpired: true
        });

        clearAuth();
        if (navigate) {
            navigate('/login', { replace: true });
        } else if (typeof window !== 'undefined') {
            window.location.href = '/login';
        }
        throw error;
    }

    // Log API request authentication details (development only)
    if (options.headers) {
        logApiRequestAuth(url, options.headers, options.method);
    }

    let response;
    try {
        response = await fetch(url, options);

        // Log successful authentication if request succeeded
        if (response.ok && token) {
            logAuthenticationSuccess(AUTH_ERROR_CONTEXTS.API_REQUEST, {
                url,
                method: options.method || 'GET',
                status: response.status,
                duration: performance.now() - startTime
            });
        }
    } catch (fetchError) {
        // Log network or fetch errors
        logAuthenticationError(fetchError, AUTH_ERROR_CONTEXTS.API_REQUEST, {
            url,
            method: options.method || 'GET',
            networkError: true,
            duration: performance.now() - startTime
        });
        throw fetchError;
    }

    // Handle authentication errors
    if (handleAuthError(response, navigate, AUTH_ERROR_CONTEXTS.API_REQUEST)) {
        throw new Error(`Authentication failed (${response.status})`);
    }

    return response;
}

// Helper: add JSON, auth token, and user ID (for local dev)
export function getHeaders(authToken) {
    const headers = { "Content-Type": "application/json" };

    // Use provided token or automatically retrieve from localStorage
    let token = authToken;
    if (!token) {
        token = getToken();
    }

    // Log token retrieval for debugging
    logTokenEvent('HEADER_CONSTRUCTION', {
        providedToken: !!authToken,
        retrievedToken: !!token,
        tokenSource: authToken ? 'parameter' : 'localStorage'
    });

    if (token) {
        // Ensure proper Bearer token format with space
        if (!token.startsWith('Bearer ')) {
            headers["Authorization"] = `Bearer ${token}`;
        } else {
            headers["Authorization"] = token;
        }

        // Log successful token inclusion
        logTokenEvent('TOKEN_INCLUDED_IN_HEADERS', {
            hasAuthHeader: true,
            tokenLength: token.length
        });
    } else {
        // Log missing token for debugging
        logAuthenticationError(
            new Error('No authentication token available'),
            AUTH_ERROR_CONTEXTS.HEADER_CONSTRUCTION,
            {
                providedToken: !!authToken,
                localStorageChecked: true
            }
        );
    }

    // Development fallback: include x-user-id header for development mode
    if (typeof window !== "undefined") {
        const userId = localStorage.getItem("userId");
        if (userId) {
            headers["x-user-id"] = userId;

            // Log development header inclusion
            logTokenEvent('DEV_HEADER_INCLUDED', {
                userId: userId,
                isDevelopment: true
            });
        }
    }

    // Debug headers in development mode
    debugApiHeaders(headers, 'header_construction');

    return headers;
}

/* -------------------------
   AUTH API
------------------------- */
export const authAPI = {
    register: async (data, navigate = null) => {
        const response = await authenticatedFetch(`${API_BASE}/auth/register`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(data),
        }, navigate);
        return response.json();
    },

    login: async (data, navigate = null) => {
        const response = await authenticatedFetch(`${API_BASE}/auth/login`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(data),
        }, navigate);
        return response.json();
    },

    googleLogin: async (credential, navigate = null) => {
        const response = await fetch(`${API_BASE}/auth/google`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ credential }),
        });
        return response.json();
    },

    facebookLogin: async (accessToken, navigate = null) => {
        const response = await fetch(`${API_BASE}/auth/facebook`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ accessToken }),
        });
        return response.json();
    },
};

/* -------------------------
   PROPERTIES API
------------------------- */
export const propertiesAPI = {
    list: async (params, navigate = null) => {
        const q = new URLSearchParams(params);
        const response = await authenticatedFetch(`${API_BASE}/properties?${q}`, {
            headers: getHeaders(),
        }, navigate);
        return response.json();
    },

    get: async (id, navigate = null) => {
        const response = await authenticatedFetch(`${API_BASE}/properties/${id}`, {
            headers: getHeaders(),
        }, navigate);
        return response.json();
    },

    getMyListings: async (navigate = null) => {
        const response = await authenticatedFetch(`${API_BASE}/properties/my-listings`, {
            headers: getHeaders(),
        }, navigate);
        return response.json();
    },

    create: async (data, navigate = null) => {
        const response = await authenticatedFetch(`${API_BASE}/properties`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(data),
        }, navigate);
        return response.json();
    },

    update: async (id, data, navigate = null) => {
        const response = await authenticatedFetch(`${API_BASE}/properties/${id}`, {
            method: "PATCH",
            headers: getHeaders(),
            body: JSON.stringify(data),
        }, navigate);
        return response.json();
    },

    updateStatus: async (id, status, navigate = null) => {
        const response = await authenticatedFetch(`${API_BASE}/properties/${id}/status`, {
            method: "PATCH",
            headers: getHeaders(),
            body: JSON.stringify({ status }),
        }, navigate);
        return response.json();
    },

    delete: async (id, navigate = null) => {
        const response = await authenticatedFetch(`${API_BASE}/properties/${id}`, {
            method: "DELETE",
            headers: getHeaders(),
        }, navigate);
        return response.json();
    },
};

/* -------------------------
   USERS API
------------------------- */
export const usersAPI = {
    getMe: async (navigate = null) => {
        const response = await authenticatedFetch(`${API_BASE}/users/me`, {
            headers: getHeaders(),
        }, navigate);
        return response.json();
    },

    update: async (data, navigate = null) => {
        const response = await authenticatedFetch(`${API_BASE}/users/me`, {
            method: "PATCH",
            headers: getHeaders(),
            body: JSON.stringify(data),
        }, navigate);
        return response.json();
    },

    changePassword: async (data, navigate = null) => {
        const response = await authenticatedFetch(`${API_BASE}/users/change-password`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(data),
        }, navigate);
        return response.json();
    },

    updatePhone: async (data, navigate = null) => {
        const response = await authenticatedFetch(`${API_BASE}/users/update-phone`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(data),
        }, navigate);
        return response.json();
    },

    deleteAccount: async (data, navigate = null) => {
        const response = await authenticatedFetch(`${API_BASE}/users/delete-account`, {
            method: "DELETE",
            headers: getHeaders(),
            body: JSON.stringify(data),
        }, navigate);
        return response.json();
    },
};

/* -------------------------
   WISHLIST API
------------------------- */
export const wishlistAPI = {
    list: async (navigate = null) => {
        const response = await authenticatedFetch(`${API_BASE}/wishlist`, {
            headers: getHeaders(),
        }, navigate);
        return response.json();
    },

    add: async (propertyId, navigate = null) => {
        const response = await authenticatedFetch(`${API_BASE}/wishlist/${propertyId}`, {
            method: "POST",
            headers: getHeaders(),
        }, navigate);
        return response.json();
    },

    remove: async (propertyId, navigate = null) => {
        const response = await authenticatedFetch(`${API_BASE}/wishlist/${propertyId}`, {
            method: "DELETE",
            headers: getHeaders(),
        }, navigate);
        return response.json();
    },
};

/* -------------------------
   CONVERSATIONS API
------------------------- */
export const conversationsAPI = {
    list: async (navigate = null) => {
        const response = await authenticatedFetch(`${API_BASE}/conversations`, {
            headers: getHeaders(),
        }, navigate);
        return response.json();
    },

    get: async (id, navigate = null) => {
        const response = await authenticatedFetch(`${API_BASE}/conversations/${id}`, {
            headers: getHeaders(),
        }, navigate);
        return response.json();
    },

    create: async (data, navigate = null) => {
        const response = await authenticatedFetch(`${API_BASE}/conversations`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(data),
        }, navigate);
        return response.json();
    },

    sendMessage: async (id, text, navigate = null) => {
        const response = await authenticatedFetch(`${API_BASE}/conversations/${id}/messages`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({ text }),
        }, navigate);
        return response.json();
    },
};

/* -------------------------
   NOTIFICATIONS API
------------------------- */
export const notificationsAPI = {
    list: async (params, navigate = null) => {
        const q = new URLSearchParams(params);
        const response = await authenticatedFetch(`${API_BASE}/notifications?${q}`, {
            headers: getHeaders(),
        }, navigate);
        return response.json();
    },

    markAsRead: async (id, navigate = null) => {
        const response = await authenticatedFetch(`${API_BASE}/notifications/${id}/read`, {
            method: "PATCH",
            headers: getHeaders(),
        }, navigate);
        return response.json();
    },

    markAllAsRead: async (navigate = null) => {
        const response = await authenticatedFetch(`${API_BASE}/notifications/read-all`, {
            method: "PATCH",
            headers: getHeaders(),
        }, navigate);
        return response.json();
    },
};

/* -------------------------
   SEARCH API
------------------------- */
export const searchAPI = {
    suggest: async (params, navigate = null) => {
        const q = new URLSearchParams(params);
        const response = await authenticatedFetch(`${API_BASE}/search/suggest?${q}`, {
            headers: getHeaders(),
        }, navigate);
        return response.json();
    },
};

/* -------------------------
   VERIFICATION API
------------------------- */
export const verificationAPI = {
    sendOTP: async (data, navigate = null) => {
        const startTime = performance.now();

        try {
            const response = await authenticatedFetch(`${API_BASE}/verification/send-otp`, {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify(data),
            }, navigate);

            const result = await response.json();

            if (!response.ok) {
                // Create enhanced error for OTP send failure
                const error = new Error(result.message || result.error || 'Failed to send OTP');
                error.response = response;
                error.status = response.status;
                error.data = result;

                // Log OTP send error with verification context
                logAuthenticationError(error, AUTH_ERROR_CONTEXTS.VERIFICATION_STATUS, {
                    operation: 'SEND_OTP',
                    verificationType: data.type,
                    contact: data.contact,
                    status: response.status,
                    duration: performance.now() - startTime
                });

                throw error;
            }

            // Log successful OTP send
            logAuthenticationSuccess(AUTH_ERROR_CONTEXTS.VERIFICATION_STATUS, {
                operation: 'SEND_OTP',
                verificationType: data.type,
                contact: data.contact ? data.contact.substring(0, 3) + '***' : 'unknown',
                duration: performance.now() - startTime
            });

            return result;
        } catch (error) {
            // Show user-friendly error message for OTP send failures
            if (data.type && data.contact) {
                showVerificationErrorToast(error, data.type, data.contact);
            }
            throw error;
        }
    },

    verifyOTP: async (data, navigate = null) => {
        const startTime = performance.now();

        try {
            const response = await authenticatedFetch(`${API_BASE}/verification/verify-otp`, {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify(data),
            }, navigate);

            const result = await response.json();

            if (!response.ok) {
                // Create enhanced error for OTP verification failure
                const error = new Error(result.message || result.error || 'Failed to verify OTP');
                error.response = response;
                error.status = response.status;
                error.data = result;

                // Log OTP verification error
                logAuthenticationError(error, AUTH_ERROR_CONTEXTS.VERIFICATION_STATUS, {
                    operation: 'VERIFY_OTP',
                    verificationType: data.type,
                    otpLength: data.otp ? data.otp.length : 0,
                    status: response.status,
                    duration: performance.now() - startTime
                });

                throw error;
            }

            // Log successful OTP verification
            logAuthenticationSuccess(AUTH_ERROR_CONTEXTS.VERIFICATION_STATUS, {
                operation: 'VERIFY_OTP',
                verificationType: data.type,
                duration: performance.now() - startTime
            });

            return result;
        } catch (error) {
            // Show user-friendly error message for OTP verification failures
            if (data.type) {
                showVerificationErrorToast(error, data.type, data.contact || '');
            }
            throw error;
        }
    },

    // Enhanced OTP delivery management endpoints
    getDeliveryStatus: async (deliveryId, navigate = null) => {
        const response = await authenticatedFetch(`${API_BASE}/verification/delivery-status/${deliveryId}`, {
            headers: getHeaders(),
        }, navigate);
        return response.json();
    },

    retryDelivery: async (data, navigate = null) => {
        const response = await authenticatedFetch(`${API_BASE}/verification/retry-delivery`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(data),
        }, navigate);
        return response.json();
    },

    getDeliveryHistory: async (params = {}, navigate = null) => {
        const q = new URLSearchParams(params);
        const response = await authenticatedFetch(`${API_BASE}/verification/delivery-history?${q}`, {
            headers: getHeaders(),
        }, navigate);
        return response.json();
    },

    getVerificationStatus: async (navigate = null) => {
        const startTime = performance.now();

        try {
            // Ensure we have proper authentication headers
            const headers = getHeaders();

            // Log API request initiation for debugging
            logApiRequestAuth(`${API_BASE}/verification/status`, 'GET', {
                hasAuthHeader: !!headers.Authorization,
                hasDevHeader: !!headers['x-user-id'],
                timestamp: new Date().toISOString()
            });

            const response = await authenticatedFetch(`${API_BASE}/verification/status`, {
                method: 'GET',
                headers,
            }, navigate);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.message || errorData.error || `HTTP ${response.status}: Failed to fetch verification status`;

                // Enhanced error categorization
                let errorType = 'UNKNOWN';
                if (response.status === 401) {
                    errorType = 'AUTHENTICATION_REQUIRED';
                } else if (response.status === 403) {
                    errorType = 'ACCESS_DENIED';
                } else if (response.status === 404) {
                    errorType = 'ENDPOINT_NOT_FOUND';
                } else if (response.status >= 500) {
                    errorType = 'SERVER_ERROR';
                }

                // Log verification status API error with enhanced details
                const error = new Error(errorMessage);
                error.response = response;
                error.status = response.status;
                error.type = errorType;

                logAuthenticationError(error, AUTH_ERROR_CONTEXTS.VERIFICATION_STATUS, {
                    url: `${API_BASE}/verification/status`,
                    status: response.status,
                    statusText: response.statusText,
                    errorType,
                    errorData,
                    duration: performance.now() - startTime,
                    hasAuthHeader: !!headers.Authorization,
                    hasDevHeader: !!headers['x-user-id']
                });

                throw error;
            }

            const data = await response.json();

            // Enhanced response format validation
            const validationErrors = [];

            if (!data.success) {
                validationErrors.push('Missing success field or success is false');
            }

            if (!data.verification) {
                validationErrors.push('Missing verification object');
            } else {
                // Validate verification structure
                if (!data.verification.email || typeof data.verification.email !== 'object') {
                    validationErrors.push('Invalid or missing email verification object');
                }

                if (!data.verification.phone || typeof data.verification.phone !== 'object') {
                    validationErrors.push('Invalid or missing phone verification object');
                }

                // Validate email verification structure
                if (data.verification.email) {
                    if (typeof data.verification.email.verified !== 'boolean') {
                        validationErrors.push('Email verified field must be boolean');
                    }
                }

                // Validate phone verification structure
                if (data.verification.phone) {
                    if (typeof data.verification.phone.verified !== 'boolean') {
                        validationErrors.push('Phone verified field must be boolean');
                    }
                }
            }

            if (validationErrors.length > 0) {
                const formatError = new Error(`Invalid response format from verification status API: ${validationErrors.join(', ')}`);

                logAuthenticationError(formatError, AUTH_ERROR_CONTEXTS.VERIFICATION_STATUS, {
                    url: `${API_BASE}/verification/status`,
                    responseData: data,
                    validationFailed: true,
                    validationErrors,
                    hasSuccess: !!data.success,
                    hasVerification: !!data.verification,
                    duration: performance.now() - startTime
                });

                throw formatError;
            }

            // Debug verification response in development mode
            debugVerificationResponse(data);

            // Log successful verification status fetch with detailed info
            logAuthenticationSuccess(AUTH_ERROR_CONTEXTS.VERIFICATION_STATUS, {
                url: `${API_BASE}/verification/status`,
                emailVerified: data.verification?.email?.verified,
                phoneVerified: data.verification?.phone?.verified,
                emailContact: data.verification?.email?.contact,
                phoneContact: data.verification?.phone?.contact,
                emailVerifiedAt: data.verification?.email?.verifiedAt,
                phoneVerifiedAt: data.verification?.phone?.verifiedAt,
                duration: performance.now() - startTime,
                responseValid: true
            });

            return data;
        } catch (error) {
            // Enhanced error logging for verification status failures
            if (!error.logged) { // Avoid double logging
                logAuthenticationError(error, AUTH_ERROR_CONTEXTS.VERIFICATION_STATUS, {
                    url: `${API_BASE}/verification/status`,
                    networkError: error.message?.includes('fetch') || error.message?.includes('network'),
                    authenticationError: error.status === 401 || error.status === 403,
                    serverError: error.status >= 500,
                    duration: performance.now() - startTime,
                    errorName: error.name,
                    errorType: error.type || 'UNKNOWN'
                });
            }

            // Enhanced error context for different error types
            if (error.status === 401) {
                const authError = new Error('Authentication required: Please log in to view your verification status.');
                authError.originalError = error;
                authError.status = 401;
                authError.type = 'AUTHENTICATION_REQUIRED';
                throw authError;
            }

            if (error.status === 403) {
                const accessError = new Error('Access denied: You do not have permission to view verification status.');
                accessError.originalError = error;
                accessError.status = 403;
                accessError.type = 'ACCESS_DENIED';
                throw accessError;
            }

            // Re-throw with more context if it's a network error
            if (error.message.includes('fetch') || error.code === 'NETWORK_ERROR') {
                const networkError = new Error('Network error: Unable to fetch verification status. Please check your connection and try again.');
                networkError.originalError = error;
                networkError.type = 'NETWORK_ERROR';
                throw networkError;
            }

            // Re-throw with server error context
            if (error.status >= 500) {
                const serverError = new Error('Server error: Verification status service is temporarily unavailable. Please try again later.');
                serverError.originalError = error;
                serverError.status = error.status;
                serverError.type = 'SERVER_ERROR';
                throw serverError;
            }

            throw error;
        }
    },

    getServiceStatus: async (navigate = null) => {
        const response = await authenticatedFetch(`${API_BASE}/verification/service-status`, {
            headers: getHeaders(),
        }, navigate);
        return response.json();
    },
};

/* -------------------------
   DELIVERY PREFERENCES API
------------------------- */
export const deliveryPreferencesAPI = {
    get: async (navigate = null) => {
        const response = await authenticatedFetch(`${API_BASE}/delivery-preferences`, {
            headers: getHeaders(),
        }, navigate);
        return response.json();
    },

    update: async (data, navigate = null) => {
        const response = await authenticatedFetch(`${API_BASE}/delivery-preferences`, {
            method: "PUT",
            headers: getHeaders(),
            body: JSON.stringify(data),
        }, navigate);
        return response.json();
    },

    reset: async (navigate = null) => {
        const response = await authenticatedFetch(`${API_BASE}/delivery-preferences/reset`, {
            method: "POST",
            headers: getHeaders(),
        }, navigate);
        return response.json();
    },

    getDeliveryPlan: async (navigate = null) => {
        const response = await authenticatedFetch(`${API_BASE}/delivery-preferences/delivery-plan`, {
            headers: getHeaders(),
        }, navigate);
        return response.json();
    },

    getRateLimitStatus: async (navigate = null) => {
        const response = await authenticatedFetch(`${API_BASE}/delivery-preferences/rate-limit-status`, {
            headers: getHeaders(),
        }, navigate);
        return response.json();
    },

    testDelivery: async (data, navigate = null) => {
        const response = await authenticatedFetch(`${API_BASE}/delivery-preferences/test-delivery`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(data),
        }, navigate);
        return response.json();
    },
};

/* -------------------------
   USER DIAGNOSTICS API
------------------------- */
export const userDiagnosticsAPI = {
    getTroubleshootingInfo: async (deliveryId, navigate = null) => {
        const response = await authenticatedFetch(`${API_BASE}/user-diagnostics/troubleshoot/${deliveryId}`, {
            headers: getHeaders(),
        }, navigate);
        return response.json();
    },

    runConnectivityTest: async (data, navigate = null) => {
        const response = await authenticatedFetch(`${API_BASE}/user-diagnostics/connectivity-test`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(data),
        }, navigate);
        return response.json();
    },

    getDeliveryDiagnostics: async (deliveryId, navigate = null) => {
        const response = await authenticatedFetch(`${API_BASE}/user-diagnostics/delivery-diagnostics/${deliveryId}`, {
            headers: getHeaders(),
        }, navigate);
        return response.json();
    },

    reportIssue: async (data, navigate = null) => {
        const response = await authenticatedFetch(`${API_BASE}/user-diagnostics/report-issue`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(data),
        }, navigate);
        return response.json();
    },
};

/* -------------------------
   UPLOAD API
------------------------- */
export const uploadAPI = {
    sign: async (filename, contentType, navigate = null) => {
        const response = await authenticatedFetch(`${API_BASE}/upload/sign`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({ filename, contentType }),
        }, navigate);
        return response.json();
    },

    upload: async (url, navigate = null) => {
        const response = await authenticatedFetch(`${API_BASE}/upload`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({ url }),
        }, navigate);
        return response.json();
    },
};
