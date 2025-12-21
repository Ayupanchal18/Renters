import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import {
    authenticateToken,
    requireRole,
    validateInput,
    errorHandler,
    sendSuccess,
    securityHeaders
} from './security.js';
import { User } from '../../models/User.js';

// Mock dependencies
vi.mock('../../models/User.js');
vi.mock('../config/db.js', () => ({
    connectDB: vi.fn().mockResolvedValue(true)
}));

/**
 * **Feature: dashboard-user-management, Property 14: API Authentication and Validation**
 * **Validates: Requirements 10.1, 10.4**
 * 
 * For any API request to user management endpoints, proper authentication, 
 * authorization, and input validation should be enforced before processing.
 */

describe('API Security Middleware - Property-Based Tests', () => {
    let mockReq, mockRes, mockNext;

    beforeEach(() => {
        mockReq = {
            headers: {},
            body: {},
            params: {},
            query: {},
            user: null,
            ip: '127.0.0.1'
        };

        mockRes = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
            setHeader: vi.fn().mockReturnThis()
        };

        mockNext = vi.fn();

        // Reset mocks
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Property 14: API Authentication and Validation', () => {
        it('should enforce authentication for all protected endpoints', async () => {
            await fc.assert(fc.asyncProperty(
                fc.record({
                    hasToken: fc.boolean(),
                    tokenValid: fc.boolean(),
                    userExists: fc.boolean()
                }),
                async ({ hasToken, tokenValid, userExists }) => {
                    // Reset mocks for each iteration
                    vi.clearAllMocks();

                    const userId = '507f1f77bcf86cd799439011';

                    // Setup request with or without token
                    if (hasToken) {
                        const token = tokenValid ?
                            jwt.sign({ userId }, 'fallback-secret') :
                            'invalid-token';
                        mockReq.headers.authorization = `Bearer ${token}`;
                    } else {
                        // Ensure no authorization header when hasToken is false
                        delete mockReq.headers.authorization;
                    }

                    // Mock user lookup with lean() method (only relevant if hasToken and tokenValid)
                    const mockQuery = {
                        lean: vi.fn()
                    };

                    if (hasToken && tokenValid && userExists) {
                        mockQuery.lean.mockResolvedValue({
                            _id: userId,
                            email: 'test@example.com',
                            role: 'user'
                        });
                    } else {
                        mockQuery.lean.mockResolvedValue(null);
                    }

                    User.findById.mockReturnValue(mockQuery);

                    // Call authentication middleware
                    await authenticateToken(mockReq, mockRes, mockNext);

                    // Verify authentication behavior
                    if (!hasToken || (hasToken && !tokenValid) || (hasToken && tokenValid && !userExists)) {
                        // Should result in 401
                        expect(mockRes.status).toHaveBeenCalledWith(401);
                        expect(mockNext).not.toHaveBeenCalled();
                    } else if (hasToken && tokenValid && userExists) {
                        // Valid token and user exists should proceed
                        expect(mockReq.user).toBeDefined();
                        expect(mockNext).toHaveBeenCalled();
                        expect(mockRes.status).not.toHaveBeenCalled();
                    }
                }
            ), { numRuns: 10 });
        });

        it('should enforce role-based authorization correctly', async () => {
            await fc.assert(fc.property(
                fc.record({
                    userRole: fc.constantFrom('user', 'seller', 'admin'),
                    requiredRole: fc.constantFrom('user', 'seller', 'admin'),
                    isAuthenticated: fc.boolean()
                }),
                ({ userRole, requiredRole, isAuthenticated }) => {
                    // Reset mocks for each iteration
                    vi.clearAllMocks();

                    // Setup authenticated user or not
                    if (isAuthenticated) {
                        mockReq.user = {
                            _id: '507f1f77bcf86cd799439011',
                            role: userRole
                        };
                    } else {
                        mockReq.user = null;
                    }

                    // Create role middleware
                    const roleMiddleware = requireRole(requiredRole);
                    roleMiddleware(mockReq, mockRes, mockNext);

                    // Verify authorization behavior
                    if (!isAuthenticated) {
                        // Not authenticated should result in 401
                        expect(mockRes.status).toHaveBeenCalledWith(401);
                        expect(mockNext).not.toHaveBeenCalled();
                    } else if (userRole === requiredRole) {
                        // User has required role should proceed
                        expect(mockNext).toHaveBeenCalled();
                        expect(mockRes.status).not.toHaveBeenCalled();
                    } else {
                        // User doesn't have required role should result in 403
                        expect(mockRes.status).toHaveBeenCalledWith(403);
                        expect(mockNext).not.toHaveBeenCalled();
                    }
                }
            ), { numRuns: 10 });
        });

        it('should validate input data using Zod schemas', async () => {
            await fc.assert(fc.property(
                fc.record({
                    hasValidName: fc.boolean(),
                    hasValidEmail: fc.boolean()
                }),
                ({ hasValidName, hasValidEmail }) => {
                    // Reset mocks for each iteration
                    vi.clearAllMocks();

                    // Setup request body
                    mockReq.body = {};
                    if (hasValidName) {
                        mockReq.body.name = 'Valid Name';
                    } else {
                        mockReq.body.name = ''; // Invalid - too short
                    }

                    if (hasValidEmail) {
                        mockReq.body.email = 'test@example.com';
                    } else {
                        mockReq.body.email = 'invalid-email';
                    }

                    // Create validation schema
                    const schema = {
                        body: z.object({
                            name: z.string().min(1).max(100),
                            email: z.string().email()
                        })
                    };

                    // Create validation middleware
                    const validationMiddleware = validateInput(schema);
                    validationMiddleware(mockReq, mockRes, mockNext);

                    // Check if data should be valid
                    const isDataValid = hasValidName && hasValidEmail;

                    if (isDataValid) {
                        // Valid data should proceed
                        expect(mockNext).toHaveBeenCalled();
                        expect(mockRes.status).not.toHaveBeenCalled();
                    } else {
                        // Invalid data should result in 400
                        expect(mockRes.status).toHaveBeenCalledWith(400);
                        expect(mockNext).not.toHaveBeenCalled();
                    }
                }
            ), { numRuns: 10 });
        });
    });

    /**
     * **Feature: dashboard-user-management, Property 15: API Response Consistency**
     * **Validates: Requirements 10.5**
     * 
     * For any API response from user management endpoints, the response should use 
     * consistent formats and appropriate HTTP status codes.
     */
    describe('Property 15: API Response Consistency', () => {
        it('should return consistent success response format', async () => {
            await fc.assert(fc.property(
                fc.record({
                    hasData: fc.boolean(),
                    message: fc.string({ minLength: 1, maxLength: 100 }),
                    statusCode: fc.constantFrom(200, 201, 202)
                }),
                ({ hasData, message, statusCode }) => {
                    // Reset mocks for each iteration
                    vi.clearAllMocks();

                    const data = hasData ? { id: '123', name: 'Test' } : null;

                    // Call success response helper
                    sendSuccess(mockRes, data, message, statusCode);

                    // Verify consistent success response format
                    expect(mockRes.status).toHaveBeenCalledWith(statusCode);
                    expect(mockRes.json).toHaveBeenCalledWith(
                        expect.objectContaining({
                            success: true,
                            message: message
                        })
                    );

                    // Check data field is included when provided
                    const responseCall = mockRes.json.mock.calls[0][0];
                    if (hasData) {
                        expect(responseCall).toHaveProperty('data', data);
                    } else {
                        expect(responseCall).not.toHaveProperty('data');
                    }
                }
            ), { numRuns: 10 });
        });

        it('should return consistent error response format', async () => {
            await fc.assert(fc.property(
                fc.record({
                    errorType: fc.constantFrom('ValidationError', 'JsonWebTokenError')
                }),
                ({ errorType }) => {
                    // Reset mocks for each iteration
                    vi.clearAllMocks();

                    // Create different types of errors
                    let error;
                    if (errorType === 'ValidationError') {
                        error = new Error('Validation failed');
                        error.name = 'ValidationError';
                        error.errors = {
                            field1: { path: 'field1', message: 'Field 1 error' }
                        };
                    } else {
                        error = new Error('Token error');
                        error.name = 'JsonWebTokenError';
                    }

                    // Call error handler
                    errorHandler(error, mockReq, mockRes, mockNext);

                    // Verify consistent error response format
                    expect(mockRes.status).toHaveBeenCalled();
                    expect(mockRes.json).toHaveBeenCalledWith(
                        expect.objectContaining({
                            success: false,
                            error: expect.any(String),
                            message: expect.any(String)
                        })
                    );

                    // Verify appropriate status codes
                    const actualStatusCode = mockRes.status.mock.calls[0][0];
                    if (errorType === 'ValidationError') {
                        expect(actualStatusCode).toBe(400);
                    } else {
                        expect(actualStatusCode).toBe(401);
                    }
                }
            ), { numRuns: 10 });
        });

        it('should include security headers in all responses', async () => {
            await fc.assert(fc.property(
                fc.record({
                    path: fc.constantFrom('/api/users', '/api/verification'),
                    method: fc.constantFrom('GET', 'POST')
                }),
                ({ path, method }) => {
                    // Reset mocks for each iteration
                    vi.clearAllMocks();

                    // Setup request
                    mockReq.path = path;
                    mockReq.method = method;

                    // Use security headers middleware
                    securityHeaders(mockReq, mockRes, mockNext);

                    // Verify security headers are set
                    expect(mockRes.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
                    expect(mockRes.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
                    expect(mockRes.setHeader).toHaveBeenCalledWith('X-XSS-Protection', '1; mode=block');
                    expect(mockNext).toHaveBeenCalled();
                }
            ), { numRuns: 10 });
        });
    });
});