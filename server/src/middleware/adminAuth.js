import jwt from "jsonwebtoken";
import { User } from "../../models/User.js";
import { connectDB } from "../config/db.js";

/**
 * Admin Authentication & Authorization Middleware
 * Provides secure role-based access control for admin routes
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.5
 */

/* ---------------------- ERROR CODES ---------------------- */

const ErrorCodes = {
    AUTH_REQUIRED: 'AUTH_REQUIRED',
    AUTH_INVALID: 'AUTH_INVALID',
    AUTH_EXPIRED: 'AUTH_EXPIRED',
    AUTH_FORBIDDEN: 'AUTH_FORBIDDEN',
    USER_BLOCKED: 'USER_BLOCKED',
    USER_NOT_FOUND: 'USER_NOT_FOUND',
    INTERNAL_ERROR: 'INTERNAL_ERROR'
};

/* ---------------------- HELPER FUNCTIONS ---------------------- */

/**
 * Extract JWT token from Authorization header
 * @param {Object} req - Express request object
 * @returns {string|null} - JWT token or null
 */
const extractToken = (req) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.split(' ')[1];
};

/**
 * Verify JWT token and extract payload
 * @param {string} token - JWT token
 * @returns {Object} - Decoded token payload
 * @throws {Error} - If token is invalid or expired
 */
const verifyToken = (token) => {
    const secret = process.env.JWT_SECRET || 'fallback-secret';
    return jwt.verify(token, secret);
};

/**
 * Check if user is blocked
 * @param {Object} user - User document
 * @returns {boolean} - True if user is blocked
 */
const isUserBlocked = (user) => {
    return user.isBlocked === true;
};

/**
 * Check if user account is active
 * @param {Object} user - User document
 * @returns {boolean} - True if user is active
 */
const isUserActive = (user) => {
    // If isActive field doesn't exist, default to true for backward compatibility
    return user.isActive !== false;
};

/**
 * Check if user is soft-deleted
 * @param {Object} user - User document
 * @returns {boolean} - True if user is deleted
 */
const isUserDeleted = (user) => {
    return user.isDeleted === true;
};

/* ---------------------- CORE AUTHENTICATION ---------------------- */

/**
 * Authenticate Admin Request
 * Verifies JWT token and validates admin role claim
 * 
 * Requirements: 1.1 - JWT with role claim
 * Requirements: 1.5 - Validate role permissions on each request
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const authenticateAdmin = async (req, res, next) => {
    try {
        // Extract token from Authorization header
        const token = extractToken(req);

        // Debug logging
        console.log('=== Admin Auth Debug ===');
        console.log('Has token:', !!token);
        console.log('Authorization header:', req.headers.authorization ? 'Present' : 'Missing');

        // Development mode fallback for testing
        if (!token && process.env.NODE_ENV === 'development') {
            const userId = req.headers["x-user-id"];
            const userRole = req.headers["x-user-role"];

            console.log('Dev mode - userId:', userId, 'userRole:', userRole);

            if (userId && userRole === 'admin') {
                await connectDB();
                const user = await User.findById(userId).lean();

                if (user && user.role === 'admin') {
                    // Check if user is blocked or inactive
                    if (isUserBlocked(user)) {
                        return res.status(403).json({
                            success: false,
                            error: ErrorCodes.USER_BLOCKED,
                            message: "Your account has been blocked. Please contact support."
                        });
                    }

                    if (!isUserActive(user)) {
                        return res.status(403).json({
                            success: false,
                            error: ErrorCodes.AUTH_FORBIDDEN,
                            message: "Your account is inactive. Please contact support."
                        });
                    }

                    if (isUserDeleted(user)) {
                        return res.status(401).json({
                            success: false,
                            error: ErrorCodes.USER_NOT_FOUND,
                            message: "User account not found"
                        });
                    }

                    req.user = user;
                    req.adminAuth = true;
                    return next();
                }
            }

            // Dev mode fallback: if we have userId header, try to authenticate with just that
            if (userId) {
                await connectDB();
                const user = await User.findById(userId).lean();
                console.log('Dev mode - Found user:', user ? user.email : 'Not found', 'Role:', user?.role);

                if (user && user.role === 'admin') {
                    req.user = user;
                    req.adminAuth = true;
                    return next();
                }
            }
        }

        // Token is required
        if (!token) {
            console.log('No token provided, returning 401');
            return res.status(401).json({
                success: false,
                error: ErrorCodes.AUTH_REQUIRED,
                message: "Authentication required. Please provide a valid access token."
            });
        }

        // Verify JWT token
        let decoded;
        try {
            decoded = verifyToken(token);
            console.log('Token decoded successfully:', { sub: decoded.sub, role: decoded.role });
        } catch (error) {
            console.log('Token verification failed:', error.message);
            if (error.name === 'TokenExpiredError') {
                // Requirement 1.4: Force logout on expired token
                return res.status(401).json({
                    success: false,
                    error: ErrorCodes.AUTH_EXPIRED,
                    message: "Your session has expired. Please log in again."
                });
            }

            return res.status(401).json({
                success: false,
                error: ErrorCodes.AUTH_INVALID,
                message: "Invalid authentication token"
            });
        }

        // Validate role claim exists in token (Requirement 1.1)
        if (!decoded.role) {
            console.log('Token missing role claim');
            return res.status(401).json({
                success: false,
                error: ErrorCodes.AUTH_INVALID,
                message: "Invalid token: missing role claim"
            });
        }

        // Get user from database to verify current state
        await connectDB();
        const user = await User.findById(decoded.sub).lean();
        console.log('User from DB:', user ? { email: user.email, role: user.role, isActive: user.isActive, isBlocked: user.isBlocked } : 'Not found');

        if (!user) {
            return res.status(401).json({
                success: false,
                error: ErrorCodes.USER_NOT_FOUND,
                message: "User account not found"
            });
        }

        // Check if user is soft-deleted
        if (isUserDeleted(user)) {
            return res.status(401).json({
                success: false,
                error: ErrorCodes.USER_NOT_FOUND,
                message: "User account not found"
            });
        }

        // Check if user is blocked (Requirement 3.7)
        if (isUserBlocked(user)) {
            return res.status(403).json({
                success: false,
                error: ErrorCodes.USER_BLOCKED,
                message: "Your account has been blocked. Please contact support."
            });
        }

        // Check if user account is active
        if (!isUserActive(user)) {
            return res.status(403).json({
                success: false,
                error: ErrorCodes.AUTH_FORBIDDEN,
                message: "Your account is inactive. Please contact support."
            });
        }

        // Verify role claim matches database (Requirement 1.1)
        if (decoded.role !== user.role) {
            console.log('Role mismatch - Token role:', decoded.role, 'DB role:', user.role);
            return res.status(401).json({
                success: false,
                error: ErrorCodes.AUTH_INVALID,
                message: "Token role mismatch. Please log in again."
            });
        }

        // Attach user to request
        console.log('Admin auth successful for user:', user.email);
        req.user = user;
        req.tokenPayload = decoded;
        next();

    } catch (error) {
        console.error('Admin authentication error:', error);
        return res.status(500).json({
            success: false,
            error: ErrorCodes.INTERNAL_ERROR,
            message: "Authentication failed due to an internal error"
        });
    }
};

/* ---------------------- AUTHORIZATION MIDDLEWARE ---------------------- */

/**
 * Require Admin Role
 * Ensures the authenticated user has admin role
 * 
 * Requirements: 1.2 - Verify admin role before processing
 * Requirements: 1.3 - Return 403 for non-admin users
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const requireAdmin = async (req, res, next) => {
    // First authenticate the request
    await authenticateAdmin(req, res, async () => {
        // Check if user has admin role
        console.log('requireAdmin check - user:', req.user?.email, 'role:', req.user?.role);
        if (!req.user || req.user.role !== 'admin') {
            console.log('requireAdmin DENIED - user role is not admin');
            return res.status(403).json({
                success: false,
                error: ErrorCodes.AUTH_FORBIDDEN,
                message: "Access denied. Admin privileges required."
            });
        }
        console.log('requireAdmin PASSED - proceeding to route handler');
        next();
    });
};

/**
 * Enhanced Role-Based Authorization
 * Allows access based on specified roles with blocked user check
 * 
 * Requirements: 1.5 - Validate role permissions on each request
 * 
 * @param {string|string[]} allowedRoles - Single role or array of allowed roles
 * @returns {Function} - Express middleware function
 */
export const requireRole = (allowedRoles) => {
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    return async (req, res, next) => {
        // First authenticate the request
        await authenticateAdmin(req, res, async () => {
            // Check if user has one of the allowed roles
            if (!req.user || !roles.includes(req.user.role)) {
                return res.status(403).json({
                    success: false,
                    error: ErrorCodes.AUTH_FORBIDDEN,
                    message: `Access denied. Required role: ${roles.join(' or ')}`
                });
            }
            next();
        });
    };
};

/**
 * Require Any Authenticated User (with blocked check)
 * Ensures user is authenticated and not blocked
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const requireAuth = async (req, res, next) => {
    await authenticateAdmin(req, res, next);
};

/* ---------------------- UTILITY FUNCTIONS ---------------------- */

/**
 * Generate JWT token with role claim
 * Utility function for creating tokens with proper role claims
 * 
 * Requirements: 1.1 - JWT containing user role claim
 * 
 * @param {Object} user - User document
 * @param {Object} options - Token options
 * @returns {string} - JWT token
 */
export const generateAdminToken = (user, options = {}) => {
    const {
        expiresIn = '1h',
        secret = process.env.JWT_SECRET || 'fallback-secret'
    } = options;

    const payload = {
        sub: user._id.toString(),
        role: user.role,
        email: user.email,
        iat: Math.floor(Date.now() / 1000)
    };

    return jwt.sign(payload, secret, { expiresIn });
};

/**
 * Verify token and return decoded payload
 * Utility function for token verification
 * 
 * @param {string} token - JWT token
 * @returns {Object|null} - Decoded payload or null if invalid
 */
export const verifyAdminToken = (token) => {
    try {
        return verifyToken(token);
    } catch (error) {
        return null;
    }
};

/**
 * Check if token is expired
 * 
 * @param {string} token - JWT token
 * @returns {boolean} - True if token is expired
 */
export const isTokenExpired = (token) => {
    try {
        const decoded = jwt.decode(token);
        if (!decoded || !decoded.exp) {
            return true;
        }
        return decoded.exp < Math.floor(Date.now() / 1000);
    } catch (error) {
        return true;
    }
};

/* ---------------------- EXPORTS ---------------------- */

export default {
    authenticateAdmin,
    requireAdmin,
    requireRole,
    requireAuth,
    generateAdminToken,
    verifyAdminToken,
    isTokenExpired,
    ErrorCodes
};
