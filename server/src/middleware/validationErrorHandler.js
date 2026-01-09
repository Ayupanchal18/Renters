import { z } from "zod";

/**
 * Standardized Validation Error Response Handler
 * 
 * This module provides consistent validation error formatting across the API.
 * All validation errors return the same structure for predictable client handling.
 * 
 * Requirements: 9.2, 9.3
 */

/**
 * Standard validation error response format
 * @typedef {Object} ValidationErrorResponse
 * @property {boolean} success - Always false for errors
 * @property {string} error - Error type identifier
 * @property {Array<{field: string, message: string}>} details - Field-level error messages
 */

/**
 * Format Zod validation errors into standardized response format
 * @param {z.ZodError} zodError - Zod validation error
 * @returns {Array<{field: string, message: string}>} Formatted error details
 */
export function formatZodErrors(zodError) {
    if (!zodError || !zodError.errors) {
        return [];
    }

    return zodError.errors.map(err => ({
        field: err.path.join('.') || 'unknown',
        message: err.message
    }));
}

/**
 * Create a standardized validation error response
 * @param {z.ZodError|Error|Object} error - The validation error
 * @param {string} [requestId] - Optional request ID for debugging
 * @returns {ValidationErrorResponse} Standardized error response
 */
export function createValidationErrorResponse(error, requestId = null) {
    let details = [];

    if (error instanceof z.ZodError) {
        details = formatZodErrors(error);
    } else if (error.errors && Array.isArray(error.errors)) {
        // Handle pre-formatted errors
        details = error.errors.map(err => ({
            field: err.path?.join('.') || err.field || 'unknown',
            message: err.message
        }));
    } else if (error.message) {
        details = [{ field: 'unknown', message: error.message }];
    }

    const response = {
        success: false,
        error: "Validation failed",
        details
    };

    if (requestId) {
        response.requestId = requestId;
    }

    return response;
}

/**
 * Enhanced validation middleware with standardized error responses
 * Extends the existing validateInput functionality with consistent error formatting
 * 
 * @param {Object} schemas - Object containing schemas for body, params, query
 * @param {z.ZodSchema} [schemas.body] - Zod schema for request body
 * @param {z.ZodSchema} [schemas.params] - Zod schema for request params
 * @param {z.ZodSchema} [schemas.query] - Zod schema for request query
 * @returns {Function} Express middleware function
 */
export function validateWithStandardErrors(schemas) {
    return (req, res, next) => {
        try {
            const allErrors = [];

            // Validate request body
            if (schemas.body) {
                const bodyResult = schemas.body.safeParse(req.body);
                if (!bodyResult.success) {
                    const bodyErrors = formatZodErrors(bodyResult.error).map(err => ({
                        ...err,
                        field: err.field === 'unknown' ? err.field : `body.${err.field}`
                    }));
                    allErrors.push(...bodyErrors);
                } else {
                    req.body = bodyResult.data;
                }
            }

            // Validate request params
            if (schemas.params) {
                const paramsResult = schemas.params.safeParse(req.params);
                if (!paramsResult.success) {
                    const paramsErrors = formatZodErrors(paramsResult.error).map(err => ({
                        ...err,
                        field: err.field === 'unknown' ? err.field : `params.${err.field}`
                    }));
                    allErrors.push(...paramsErrors);
                } else {
                    req.params = paramsResult.data;
                }
            }

            // Validate request query
            if (schemas.query) {
                const queryResult = schemas.query.safeParse(req.query);
                if (!queryResult.success) {
                    const queryErrors = formatZodErrors(queryResult.error).map(err => ({
                        ...err,
                        field: err.field === 'unknown' ? err.field : `query.${err.field}`
                    }));
                    allErrors.push(...queryErrors);
                } else {
                    req.query = queryResult.data;
                }
            }

            // Return standardized error response if there are validation errors
            if (allErrors.length > 0) {
                const response = {
                    success: false,
                    error: "Validation failed",
                    details: allErrors
                };

                // Add request ID if available
                if (req.id) {
                    response.requestId = req.id;
                }

                return res.status(400).json(response);
            }

            next();
        } catch (error) {
            console.error('Validation middleware error:', error);

            const response = {
                success: false,
                error: "Validation failed",
                details: [{ field: 'unknown', message: 'Failed to validate request data' }]
            };

            if (req.id) {
                response.requestId = req.id;
            }

            return res.status(500).json(response);
        }
    };
}

/**
 * Middleware to handle Zod errors thrown in route handlers
 * Use this as an error handler middleware after routes
 * 
 * @param {Error} err - The error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export function zodErrorHandler(err, req, res, next) {
    if (err instanceof z.ZodError) {
        const response = createValidationErrorResponse(err, req.id);
        return res.status(400).json(response);
    }

    // Pass to next error handler if not a Zod error
    next(err);
}

/**
 * Helper to validate data against a schema and return standardized result
 * Useful for manual validation in route handlers
 * 
 * @param {z.ZodSchema} schema - Zod schema to validate against
 * @param {any} data - Data to validate
 * @returns {{success: boolean, data?: any, error?: ValidationErrorResponse}}
 */
export function validateData(schema, data) {
    const result = schema.safeParse(data);

    if (result.success) {
        return { success: true, data: result.data };
    }

    return {
        success: false,
        error: createValidationErrorResponse(result.error)
    };
}

export default {
    formatZodErrors,
    createValidationErrorResponse,
    validateWithStandardErrors,
    zodErrorHandler,
    validateData
};
