import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { isAuthenticated, getToken, getTokenPayload } from '../utils/auth';
import { showWarningToast, showErrorToast } from '../utils/toastNotifications';

/**
 * Route Guard Hook
 * 
 * Provides centralized route protection logic with proper user feedback
 * 
 * @param {Object} options - Guard configuration
 * @param {boolean} options.requireAuth - Require authentication
 * @param {string|string[]} options.requireRole - Required role(s)
 * @param {string} options.redirectTo - Redirect path for unauthorized access
 * @param {boolean} options.showToast - Show toast notifications
 * @returns {Object} Guard state and utilities
 */
export const useRouteGuard = ({
    requireAuth = false,
    requireRole = null,
    redirectTo = '/login',
    showToast = true
} = {}) => {
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [authError, setAuthError] = useState(null);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const checkAccess = () => {
            setIsLoading(true);
            setAuthError(null);

            // Check authentication if required
            if (requireAuth) {
                if (!isAuthenticated()) {
                    setAuthError({
                        type: 'authentication',
                        message: 'Authentication required to access this page'
                    });

                    if (showToast) {
                        showWarningToast(
                            'Please log in to access this page',
                            'authentication',
                            {
                                title: 'Authentication Required',
                                description: 'You need to be logged in to view this content'
                            }
                        );
                    }

                    setIsAuthorized(false);
                    setIsLoading(false);
                    return;
                }

                // Check role if required
                if (requireRole) {
                    const token = getToken();
                    const payload = getTokenPayload(token);
                    const userRole = payload?.role;

                    const requiredRoles = Array.isArray(requireRole) ? requireRole : [requireRole];
                    const hasRequiredRole = requiredRoles.includes(userRole);

                    if (!hasRequiredRole) {
                        setAuthError({
                            type: 'authorization',
                            message: `Access denied. Required role: ${requiredRoles.join(' or ')}`
                        });

                        if (showToast) {
                            showErrorToast(
                                'Access denied. Insufficient privileges.',
                                'authorization',
                                {
                                    title: 'Access Denied',
                                    description: 'You do not have permission to access this page'
                                }
                            );
                        }

                        setIsAuthorized(false);
                        setIsLoading(false);
                        return;
                    }
                }
            }

            // All checks passed
            setIsAuthorized(true);
            setIsLoading(false);
        };

        checkAccess();
    }, [requireAuth, requireRole, location.pathname, showToast]);

    /**
     * Redirect to appropriate page based on error type
     */
    const redirectUnauthorized = () => {
        if (authError?.type === 'authentication') {
            navigate(redirectTo, {
                state: { from: location },
                replace: true
            });
        } else if (authError?.type === 'authorization') {
            navigate('/', { replace: true });
        }
    };

    /**
     * Get current user info
     */
    const getCurrentUser = () => {
        const token = getToken();
        return getTokenPayload(token);
    };

    /**
     * Check if user has specific role
     */
    const hasRole = (role) => {
        const user = getCurrentUser();
        return user?.role === role;
    };

    /**
     * Check if user has any of the specified roles
     */
    const hasAnyRole = (roles) => {
        const user = getCurrentUser();
        const roleArray = Array.isArray(roles) ? roles : [roles];
        return roleArray.includes(user?.role);
    };

    return {
        isLoading,
        isAuthorized,
        authError,
        redirectUnauthorized,
        getCurrentUser,
        hasRole,
        hasAnyRole,
        // Utility functions
        isAuthenticated: isAuthenticated(),
        userRole: getCurrentUser()?.role
    };
};

/**
 * Higher-order component for route protection
 */
export const withRouteGuard = (WrappedComponent, guardOptions = {}) => {
    return function GuardedComponent(props) {
        const guard = useRouteGuard(guardOptions);

        if (guard.isLoading) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-background">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm text-muted-foreground">Checking access...</p>
                    </div>
                </div>
            );
        }

        if (!guard.isAuthorized) {
            guard.redirectUnauthorized();
            return null;
        }

        return <WrappedComponent {...props} guard={guard} />;
    };
};

export default useRouteGuard;