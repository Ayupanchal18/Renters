/**
 * Route Protection Utilities
 * 
 * Centralized configuration and utilities for route protection
 */

// Define protected routes and their requirements
export const PROTECTED_ROUTES = {
    // Authentication required routes
    AUTHENTICATED: [
        '/post-property',
        '/dashboard',
        '/wishlist',
        '/messages',
        '/notifications'
    ],

    // Admin role required routes
    ADMIN: [
        '/admin',
        '/admin/*'
    ]
};

// Route access levels
export const ACCESS_LEVELS = {
    PUBLIC: 'public',
    AUTHENTICATED: 'authenticated',
    ADMIN: 'admin',
    MODERATOR: 'moderator'
};

// User roles
export const USER_ROLES = {
    USER: 'user',
    MODERATOR: 'moderator',
    ADMIN: 'admin'
};

/**
 * Check if a route requires authentication
 * @param {string} pathname - Route pathname
 * @returns {boolean} - True if authentication required
 */
export const requiresAuthentication = (pathname) => {
    return PROTECTED_ROUTES.AUTHENTICATED.some(route => {
        if (route.endsWith('/*')) {
            return pathname.startsWith(route.slice(0, -2));
        }
        return pathname === route;
    });
};

/**
 * Check if a route requires admin access
 * @param {string} pathname - Route pathname  
 * @returns {boolean} - True if admin access required
 */
export const requiresAdminAccess = (pathname) => {
    return PROTECTED_ROUTES.ADMIN.some(route => {
        if (route.endsWith('/*')) {
            return pathname.startsWith(route.slice(0, -2));
        }
        return pathname === route;
    });
};

/**
 * Get required access level for a route
 * @param {string} pathname - Route pathname
 * @returns {string} - Required access level
 */
export const getRequiredAccessLevel = (pathname) => {
    if (requiresAdminAccess(pathname)) {
        return ACCESS_LEVELS.ADMIN;
    }

    if (requiresAuthentication(pathname)) {
        return ACCESS_LEVELS.AUTHENTICATED;
    }

    return ACCESS_LEVELS.PUBLIC;
};

/**
 * Check if user role meets required access level
 * @param {string} userRole - User's role
 * @param {string} requiredLevel - Required access level
 * @returns {boolean} - True if access granted
 */
export const hasRequiredAccess = (userRole, requiredLevel) => {
    const roleHierarchy = {
        [USER_ROLES.USER]: [ACCESS_LEVELS.PUBLIC, ACCESS_LEVELS.AUTHENTICATED],
        [USER_ROLES.MODERATOR]: [ACCESS_LEVELS.PUBLIC, ACCESS_LEVELS.AUTHENTICATED, ACCESS_LEVELS.MODERATOR],
        [USER_ROLES.ADMIN]: [ACCESS_LEVELS.PUBLIC, ACCESS_LEVELS.AUTHENTICATED, ACCESS_LEVELS.MODERATOR, ACCESS_LEVELS.ADMIN]
    };

    const userPermissions = roleHierarchy[userRole] || [ACCESS_LEVELS.PUBLIC];
    return userPermissions.includes(requiredLevel);
};

/**
 * Get user-friendly route names for error messages
 */
export const ROUTE_NAMES = {
    '/post-property': 'Post Property',
    '/dashboard': 'Dashboard',
    '/wishlist': 'Wishlist',
    '/messages': 'Messages',
    '/notifications': 'Notifications',
    '/admin': 'Admin Panel',
    '/admin/users': 'User Management',
    '/admin/properties': 'Property Management',
    '/admin/settings': 'System Settings'
};

/**
 * Get friendly name for a route
 * @param {string} pathname - Route pathname
 * @returns {string} - Friendly route name
 */
export const getRouteName = (pathname) => {
    // Check exact matches first
    if (ROUTE_NAMES[pathname]) {
        return ROUTE_NAMES[pathname];
    }

    // Check for admin sub-routes
    if (pathname.startsWith('/admin/')) {
        return ROUTE_NAMES[pathname] || 'Admin Panel';
    }

    // Default fallback
    return pathname.split('/').pop()?.replace('-', ' ') || 'Page';
};

/**
 * Generate appropriate error message for unauthorized access
 * @param {string} pathname - Route pathname
 * @param {string} userRole - User's current role
 * @returns {Object} - Error message configuration
 */
export const getUnauthorizedMessage = (pathname, userRole = null) => {
    const routeName = getRouteName(pathname);
    const requiredLevel = getRequiredAccessLevel(pathname);

    if (requiredLevel === ACCESS_LEVELS.AUTHENTICATED && !userRole) {
        return {
            type: 'authentication',
            title: 'Sign In Required',
            message: `Please sign in to access ${routeName}.`,
            action: 'login'
        };
    }

    if (requiredLevel === ACCESS_LEVELS.ADMIN && userRole !== USER_ROLES.ADMIN) {
        return {
            type: 'authorization',
            title: 'Admin Access Required',
            message: `You need administrator privileges to access ${routeName}.`,
            action: 'contact_admin'
        };
    }

    return {
        type: 'authorization',
        title: 'Access Denied',
        message: `You do not have permission to access ${routeName}.`,
        action: 'go_home'
    };
};

export default {
    PROTECTED_ROUTES,
    ACCESS_LEVELS,
    USER_ROLES,
    requiresAuthentication,
    requiresAdminAccess,
    getRequiredAccessLevel,
    hasRequiredAccess,
    getRouteName,
    getUnauthorizedMessage
};