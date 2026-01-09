/**
 * Request Logging Middleware
 * Logs request start and completion with timing information
 * 
 * Requirements: 4.2 - Server response time tracking
 */

import logger from '../services/loggerService.js';

/**
 * Request logging middleware
 * Logs request start with method, path, requestId
 * Logs request completion with duration and status
 * 
 * @param {Object} options - Configuration options
 * @param {boolean} options.logRequestStart - Whether to log request start (default: true)
 * @param {boolean} options.logRequestBody - Whether to log request body (default: false)
 * @param {number} options.slowRequestThreshold - Threshold in ms to mark slow requests (default: 1000)
 * @param {string[]} options.excludePaths - Paths to exclude from logging (default: [])
 * @returns {Function} Express middleware function
 */
export function createRequestLogger(options = {}) {
    const {
        // Disable request start logging by default in development to reduce noise
        logRequestStart = process.env.LOG_REQUEST_START === 'true' || process.env.NODE_ENV === 'production',
        logRequestBody = false,
        slowRequestThreshold = 1000,
        excludePaths = ['/api/ping', '/health', '/favicon.ico', '/api/messages', '/api/notifications']
    } = options;

    return (req, res, next) => {
        // Skip excluded paths
        if (excludePaths.some(path => req.path.startsWith(path))) {
            return next();
        }

        const startTime = process.hrtime.bigint();
        const requestId = req.id || req.headers['x-request-id'] || 'unknown';

        // Create a child logger with request context
        const reqLogger = logger.child({ requestId });

        // Attach logger to request for use in route handlers
        req.logger = reqLogger;

        // Log request start
        if (logRequestStart) {
            const startContext = {
                method: req.method,
                path: req.path,
                query: Object.keys(req.query).length > 0 ? req.query : undefined,
                userAgent: req.headers['user-agent'],
                ip: req.ip || req.connection?.remoteAddress,
                userId: req.user?._id?.toString()
            };

            if (logRequestBody && req.body && Object.keys(req.body).length > 0) {
                startContext.body = req.body;
            }

            reqLogger.info('Request started', startContext);
        }

        // Capture response data
        const originalSend = res.send;
        const originalJson = res.json;
        let responseBody;

        res.send = function (body) {
            responseBody = body;
            return originalSend.call(this, body);
        };

        res.json = function (body) {
            responseBody = body;
            return originalJson.call(this, body);
        };

        // Log on response finish
        res.on('finish', () => {
            const endTime = process.hrtime.bigint();
            const durationNs = endTime - startTime;
            const durationMs = Number(durationNs) / 1_000_000;

            const completionContext = {
                method: req.method,
                path: req.path,
                statusCode: res.statusCode,
                duration: Math.round(durationMs * 100) / 100, // Round to 2 decimal places
                contentLength: res.get('content-length'),
                userId: req.user?._id?.toString()
            };

            // Determine log level based on status code and duration
            let logLevel = 'info';
            let message = 'Request completed';

            if (res.statusCode >= 500) {
                logLevel = 'error';
                message = 'Request failed with server error';
            } else if (res.statusCode >= 400) {
                logLevel = 'warn';
                message = 'Request failed with client error';
            } else if (durationMs > slowRequestThreshold) {
                logLevel = 'warn';
                message = 'Slow request completed';
                completionContext.slow = true;
            }

            reqLogger[logLevel](message, completionContext);
        });

        // Log on response error
        res.on('error', (error) => {
            const endTime = process.hrtime.bigint();
            const durationNs = endTime - startTime;
            const durationMs = Number(durationNs) / 1_000_000;

            reqLogger.error('Request error', {
                method: req.method,
                path: req.path,
                duration: Math.round(durationMs * 100) / 100,
                userId: req.user?._id?.toString()
            }, error);
        });

        next();
    };
}

/**
 * Simple request logger middleware with default options
 */
export const requestLogger = createRequestLogger();

export default requestLogger;
