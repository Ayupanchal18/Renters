import mongoose from "mongoose";

/**
 * Centralized API Error Handling Middleware
 * Intercepts common Database and routing errors and standardizes JSON responses
 */
export const errorHandler = (err, req, res, next) => {
    // 1. Mongoose Invalid ObjectId (CastError)
    if (err.name === 'CastError') {
        return res.status(400).json({
            success: false,
            error: 'INVALID_ID',
            message: `Invalid identifier format: ${err.value}`
        });
    }

    // 2. Mongoose Schema Validation failure
    if (err.name === 'ValidationError') {
        const details = Object.keys(err.errors).map(key => ({
            field: key,
            message: err.errors[key].message
        }));
        return res.status(400).json({
            success: false,
            error: 'VALIDATION_ERROR',
            message: 'Schema validation failed',
            details
        });
    }

    // 3. MongoDB Duplicate Key (MongoServerError code 11000)
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue || {})[0] || 'field';
        return res.status(409).json({
            success: false,
            error: 'DUPLICATE_KEY',
            message: `A resource with this ${field} already exists.`
        });
    }

    // 4. Default Internal Server Error fallback
    const statusCode = err.status || err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        error: err.code || 'INTERNAL_ERROR',
        message: err.message || 'An internal error occurred on the server.'
    });
};

export default errorHandler;
