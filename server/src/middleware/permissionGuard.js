import { ROLE_PERMISSIONS } from "../config/permissions.js";
import { authenticateAdmin } from "./adminAuth.js";

/**
 * Granular Permission Guard Middleware
 * Ensures the authenticated user has the required resource permission.
 * Delegates to authenticateAdmin first.
 * 
 * @param {string} requiredPermission - Resource-action string (e.g., 'users:read')
 * @returns {Function} - Express middleware
 */
export const requirePermission = (requiredPermission) => {
    return async (req, res, next) => {
        await authenticateAdmin(req, res, () => {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: "UNAUTHORIZED",
                    message: "User must be authenticated"
                });
            }

            const userRole = req.user.role;
            const userPermissions = ROLE_PERMISSIONS[userRole] || [];

            // 1. Wildcard match (e.g., super_admin or legacy admin)
            if (userPermissions.includes('*')) {
                return next();
            }

            // 2. Direct exact permission match
            if (userPermissions.includes(requiredPermission)) {
                return next();
            }

            // 3. Namespace wildcard match (e.g., 'users:*' matches 'users:read')
            const [resource] = requiredPermission.split(':');
            if (userPermissions.includes(`${resource}:*`)) {
                return next();
            }

            // Deny access
            return res.status(403).json({
                success: false,
                error: "FORBIDDEN",
                message: `Access denied. Required permission: ${requiredPermission}`
            });
        });
    };
};
