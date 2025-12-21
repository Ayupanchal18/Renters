import jwt from "jsonwebtoken";
import { z } from "zod";
import { User } from "../../models/User.js";
import { connectDB } from "../config/db.js";

/**
 * API Security Middleware Collection
 * Provides authentication, authorization, input validation, and error handling
 */

/* ---------------------- AUTHENTICATION MIDDLEWARE ---------------------- */

/**
 * JWT Authentication Middleware
 * Verifies JWT tokens and sets req.user
 */
export const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        // For development mode, allow x-user-id header as fallback
        if (!token && process.env.NODE_ENV === 'development') {
            const userId = req.headers["x-user-id"];
            if (userId) {
                await connectDB();
                const user = await User.findById(userId).lean();
                if (user) {
                    req.user = user;
                    return next();
                }
            }
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                error: "Authentication required",
                message: "Access token is missing"
            });
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');

        // Get user from database
        await connectDB();
        const user = await User.findById(decoded.sub).lean();

        if (!user) {
            return res.status(401).json({
                success: false,
                error: "Invalid token",
                message: "User not found"
            });
        }

        // Add user to request object
        req.user = user;
        next();

    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                error: "Invalid token",
                message: "Token is malformed or invalid"
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: "Token expired",
                message: "Access token has expired"
            });
        }

        console.error('Authentication error:', error);
        return res.status(500).json({
            success: false,
            error: "Authentication error",
            message: "Failed to authenticate token"
        });
    }
};

/**
 * Optional Authentication Middleware
 * Sets req.user if token is valid, but doesn't require authentication
 */
export const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];

        // For development mode, allow x-user-id header as fallback
        if (!token && process.env.NODE_ENV === 'development') {
            const userId = req.headers["x-user-id"];
            if (userId) {
                await connectDB();
                const user = await User.findById(userId).lean();
                if (user) {
                    req.user = user;
                }
            }
        } else if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
                await connectDB();
                const user = await User.findById(decoded.sub).lean();
                if (user) {
                    req.user = user;
                }
            } catch (error) {
                // Ignore token errors for optional auth
                console.log('Optional auth token error:', error.message);
            }
        }

        next();
    } catch (error) {
        console.error('Optional auth error:', error);
        next(); // Continue even if optional auth fails
    }
};

/* ---------------------- AUTHORIZATION MIDDLEWARE ---------------------- */

/**
 * Role-based Authorization Middleware
 * @param {string|Array} allowedRoles - Single role or array of allowed roles
 */
export const requireRole = (allowedRoles) => {
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: "Authentication required",
                message: "User must be authenticated"
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: "Insufficient permissions",
                message: `Access denied. Required role: ${roles.join(' or ')}`
            });
        }

        next();
    };
};

/**
 * Resource Ownership Authorization
 * Ensures user can only access their own resources
 * @param {string} userIdField - Field name containing the user ID (default: 'userId')
 */
export const requireOwnership = (userIdField = 'userId') => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: "Authentication required",
                message: "User must be authenticated"
            });
        }

        // Get user ID from params, body, or query
        const resourceUserId = req.params[userIdField] ||
            req.body[userIdField] ||
            req.query[userIdField] ||
            req.params.id; // Common case where :id is the user ID

        // For routes like /users/me, allow access
        if (req.params.id === 'me' || resourceUserId === 'me') {
            return next();
        }

        // Check if user owns the resource or is admin
        if (req.user._id.toString() !== resourceUserId && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: "Access denied",
                message: "You can only access your own resources"
            });
        }

        next();
    };
};

/**
 * Admin-only Authorization
 */
export const requireAdmin = requireRole('admin');

/* ---------------------- INPUT VALIDATION MIDDLEWARE ---------------------- */

/**
 * Zod Schema Validation Middleware
 * @param {Object} schemas - Object containing schemas for body, params, query
 * @param {z.ZodSchema} schemas.body - Zod schema for request body
 * @param {z.ZodSchema} schemas.params - Zod schema for request params
 * @param {z.ZodSchema} schemas.query - Zod schema for request query
 */
export const validateInput = (schemas) => {
    return (req, res, next) => {
        try {
            const errors = {};

            // Validate request body
            if (schemas.body) {
                try {
                    req.body = schemas.body.parse(req.body);
                } catch (error) {
                    if (error.errors) {
                        errors.body = error.errors;
                    }
                }
            }

            // Validate request params
            if (schemas.params) {
                try {
                    req.params = schemas.params.parse(req.params);
                } catch (error) {
                    if (error.errors) {
                        errors.params = error.errors;
                    }
                }
            }

            // Validate request query
            if (schemas.query) {
                try {
                    req.query = schemas.query.parse(req.query);
                } catch (error) {
                    if (error.errors) {
                        errors.query = error.errors;
                    }
                }
            }

            // Only return error if there are actual validation errors
            const hasErrors = Object.keys(errors).some(key => errors[key] && errors[key].length > 0);

            if (hasErrors) {
                return res.status(400).json({
                    success: false,
                    error: "Validation failed",
                    message: "Request data is invalid",
                    details: errors
                });
            }

            next();
        } catch (error) {
            console.error('Validation middleware error:', error);
            return res.status(500).json({
                success: false,
                error: "Validation error",
                message: "Failed to validate request data"
            });
        }
    };
};

/**
 * Common validation schemas
 */
export const commonSchemas = {
    // MongoDB ObjectId validation
    objectId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId format"),

    // Pagination parameters
    pagination: z.object({
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
        sort: z.string().optional(),
        order: z.enum(['asc', 'desc']).default('desc')
    }),

    // User profile update
    userProfileUpdate: z.object({
        name: z.string().min(1).max(100).optional(),
        avatar: z.string().url().optional(),
        bio: z.string().max(500).optional(),
        address: z.string().max(200).optional()
    }),

    // Password validation
    password: z.string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/\d/, "Password must contain at least one number")
        .regex(/[@$!%*?&]/, "Password must contain at least one special character"),

    // Email validation
    email: z.string().email("Invalid email format"),

    // Phone validation
    phone: z.string().regex(/^\+?[\d\s\-\(\)]{10,}$/, "Invalid phone number format"),

    // OTP validation
    otp: z.string().length(6, "OTP must be 6 digits").regex(/^\d{6}$/, "OTP must contain only digits")
};

/* ---------------------- ERROR HANDLING MIDDLEWARE ---------------------- */

/**
 * Consistent Error Response Formatter
 * Standardizes error responses across the API
 */
export const errorHandler = (err, req, res, next) => {
    console.error('API Error:', err);

    // Default error response
    let statusCode = 500;
    let errorResponse = {
        success: false,
        error: "Internal server error",
        message: "An unexpected error occurred"
    };

    // Handle specific error types
    if (err.name === 'ValidationError') {
        // Mongoose validation error
        statusCode = 400;
        errorResponse = {
            success: false,
            error: "Validation failed",
            message: "Request data is invalid",
            details: Object.values(err.errors).map(e => ({
                field: e.path,
                message: e.message
            }))
        };
    } else if (err.name === 'CastError') {
        // MongoDB cast error (invalid ObjectId, etc.)
        statusCode = 400;
        errorResponse = {
            success: false,
            error: "Invalid data format",
            message: `Invalid ${err.path}: ${err.value}`
        };
    } else if (err.code === 11000) {
        // MongoDB duplicate key error
        statusCode = 409;
        const field = Object.keys(err.keyPattern)[0];
        errorResponse = {
            success: false,
            error: "Duplicate entry",
            message: `${field} already exists`
        };
    } else if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        errorResponse = {
            success: false,
            error: "Invalid token",
            message: "Authentication token is invalid"
        };
    } else if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        errorResponse = {
            success: false,
            error: "Token expired",
            message: "Authentication token has expired"
        };
    } else if (err.status || err.statusCode) {
        // Custom error with status code
        statusCode = err.status || err.statusCode;
        errorResponse = {
            success: false,
            error: err.name || "Error",
            message: err.message || "An error occurred"
        };
    }

    // Add request ID for debugging (if available)
    if (req.id) {
        errorResponse.requestId = req.id;
    }

    // Don't expose internal error details in production
    if (process.env.NODE_ENV === 'production' && statusCode === 500) {
        errorResponse.message = "Internal server error";
        delete errorResponse.details;
    }

    res.status(statusCode).json(errorResponse);
};

/**
 * 404 Not Found Handler
 */
export const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        error: "Not found",
        message: `Route ${req.method} ${req.path} not found`
    });
};

/**
 * Success Response Helper
 * Standardizes success responses
 */
export const sendSuccess = (res, data = null, message = "Success", statusCode = 200) => {
    const response = {
        success: true,
        message
    };

    if (data !== null) {
        response.data = data;
    }

    res.status(statusCode).json(response);
};

/* ---------------------- RATE LIMITING MIDDLEWARE ---------------------- */

/**
 * Simple in-memory rate limiter
 * For production, consider using Redis-based rate limiting
 */
export const createRateLimiter = (options = {}) => {
    const {
        windowMs = 15 * 60 * 1000, // 15 minutes
        maxRequests = 100,
        message = "Too many requests, please try again later",
        keyGenerator = (req) => req.ip || req.connection.remoteAddress
    } = options;

    const requests = new Map();

    // Clean up old entries periodically
    setInterval(() => {
        const now = Date.now();
        for (const [key, data] of requests.entries()) {
            if (now - data.resetTime > windowMs) {
                requests.delete(key);
            }
        }
    }, windowMs);

    return (req, res, next) => {
        const key = keyGenerator(req);
        const now = Date.now();

        if (!requests.has(key)) {
            requests.set(key, {
                count: 1,
                resetTime: now
            });
            return next();
        }

        const requestData = requests.get(key);

        // Reset if window has passed
        if (now - requestData.resetTime > windowMs) {
            requestData.count = 1;
            requestData.resetTime = now;
            return next();
        }

        // Check if limit exceeded
        if (requestData.count >= maxRequests) {
            const resetTime = Math.ceil((requestData.resetTime + windowMs - now) / 1000);

            return res.status(429).json({
                success: false,
                error: "Rate limit exceeded",
                message,
                retryAfter: resetTime
            });
        }

        // Increment counter
        requestData.count++;
        next();
    };
};

/* ---------------------- REQUEST ID MIDDLEWARE ---------------------- */

/**
 * Add unique request ID for tracking
 */
export const addRequestId = (req, res, next) => {
    req.id = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    res.setHeader('X-Request-ID', req.id);
    next();
};

/* ---------------------- SECURITY HEADERS MIDDLEWARE ---------------------- */

/**
 * Add security headers
 */
export const securityHeaders = (req, res, next) => {
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');

    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Enable XSS protection
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Referrer policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Content Security Policy - more permissive for development
    if (process.env.NODE_ENV === 'development') {
        res.setHeader('Content-Security-Policy',
            "default-src 'self'; " +
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
            "font-src 'self' https://fonts.gstatic.com; " +
            "img-src 'self' data: https: blob:; " +
            "connect-src 'self' ws: wss: https://api.bigdatacloud.net; " +
            "frame-src 'self' https://maps.google.com https://www.google.com https://*.google.com https://www.openstreetmap.org https://*.openstreetmap.org;"
        );
    } else {
        // Stricter CSP for production - include Google Maps and OpenStreetMap for map embeds
        res.setHeader('Content-Security-Policy',
            "default-src 'self'; " +
            "script-src 'self' 'unsafe-inline'; " +
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
            "font-src 'self' https://fonts.gstatic.com; " +
            "img-src 'self' data: https: blob:; " +
            "connect-src 'self' https://api.bigdatacloud.net; " +
            "frame-src 'self' https://maps.google.com https://www.google.com https://*.google.com https://www.openstreetmap.org https://*.openstreetmap.org;"
        );
    }

    next();
};