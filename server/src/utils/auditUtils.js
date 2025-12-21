import auditLogger from "../middleware/auditLogger.js";
import securityMonitoringService from "../services/securityMonitoringService.js";

/**
 * Audit Utilities
 * Provides convenient functions for logging security events with monitoring
 */

/**
 * Enhanced security event logging with monitoring
 * @param {string} userId - User ID performing the action
 * @param {string} action - Action being performed
 * @param {boolean} success - Whether the action was successful
 * @param {Object} details - Additional details about the action
 * @param {Object} req - Express request object
 * @returns {Promise<void>}
 */
export async function logSecurityEvent(userId, action, success, details = {}, req = null) {
    try {
        // Log the event
        await auditLogger.logSecurityEvent(userId, action, success, details, req);

        // Monitor for suspicious activity
        await securityMonitoringService.monitorUserActivity(userId, action, success, details, req);

    } catch (error) {
        console.error('Enhanced security logging error:', error);
        // Don't throw to avoid breaking application flow
    }
}

/**
 * Log authentication events
 * @param {string} userId - User ID
 * @param {string} eventType - Type of auth event (login, logout, etc.)
 * @param {boolean} success - Whether the event was successful
 * @param {Object} details - Additional details
 * @param {Object} req - Express request object
 * @returns {Promise<void>}
 */
export async function logAuthEvent(userId, eventType, success, details = {}, req = null) {
    const action = `auth_${eventType}`;
    await logSecurityEvent(userId, action, success, details, req);
}

/**
 * Log password-related events
 * @param {string} userId - User ID
 * @param {string} eventType - Type of password event (change, reset, etc.)
 * @param {boolean} success - Whether the event was successful
 * @param {Object} details - Additional details
 * @param {Object} req - Express request object
 * @returns {Promise<void>}
 */
export async function logPasswordEvent(userId, eventType, success, details = {}, req = null) {
    const action = `password_${eventType}`;
    await logSecurityEvent(userId, action, success, details, req);
}

/**
 * Log verification events
 * @param {string} userId - User ID
 * @param {string} verificationType - Type of verification (email, phone)
 * @param {string} eventType - Type of event (sent, verified, failed)
 * @param {boolean} success - Whether the event was successful
 * @param {Object} details - Additional details
 * @param {Object} req - Express request object
 * @returns {Promise<void>}
 */
export async function logVerificationEvent(userId, verificationType, eventType, success, details = {}, req = null) {
    const action = `${verificationType}_${eventType}`;
    await logSecurityEvent(userId, action, success, details, req);
}

/**
 * Log account management events
 * @param {string} userId - User ID
 * @param {string} eventType - Type of account event (update, delete, etc.)
 * @param {boolean} success - Whether the event was successful
 * @param {Object} details - Additional details
 * @param {Object} req - Express request object
 * @returns {Promise<void>}
 */
export async function logAccountEvent(userId, eventType, success, details = {}, req = null) {
    const action = `account_${eventType}`;
    await logSecurityEvent(userId, action, success, details, req);
}

/**
 * Log data access events
 * @param {string} userId - User ID
 * @param {string} resource - Resource being accessed
 * @param {string} operation - Operation performed (read, write, delete)
 * @param {boolean} success - Whether the operation was successful
 * @param {Object} details - Additional details
 * @param {Object} req - Express request object
 * @returns {Promise<void>}
 */
export async function logDataAccessEvent(userId, resource, operation, success, details = {}, req = null) {
    const action = `data_${operation}_${resource}`;
    await logSecurityEvent(userId, action, success, details, req);
}

/**
 * Log API access events
 * @param {string} userId - User ID (can be 'anonymous' for unauthenticated requests)
 * @param {string} endpoint - API endpoint accessed
 * @param {string} method - HTTP method
 * @param {boolean} success - Whether the request was successful
 * @param {Object} details - Additional details
 * @param {Object} req - Express request object
 * @returns {Promise<void>}
 */
export async function logApiAccessEvent(userId, endpoint, method, success, details = {}, req = null) {
    const action = `api_${method.toLowerCase()}_${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`;
    await logSecurityEvent(userId, action, success, details, req);
}

/**
 * Create audit middleware for specific routes
 * @param {string} actionName - Name of the action being audited
 * @param {Object} options - Middleware options
 * @returns {Function} Express middleware function
 */
export function createRouteAuditMiddleware(actionName, options = {}) {
    const {
        extractUserId = (req) => req.headers["x-user-id"] || 'anonymous',
        extractDetails = (req, res) => ({
            method: req.method,
            path: req.path,
            statusCode: res.statusCode
        }),
        logOnRequest = false,
        logOnResponse = true
    } = options;

    return (req, res, next) => {
        const startTime = Date.now();
        const userId = extractUserId(req);

        // Log on request if enabled
        if (logOnRequest) {
            logSecurityEvent(userId, `${actionName}_started`, true, {
                ...extractDetails(req, res),
                timestamp: new Date().toISOString()
            }, req);
        }

        // Override res.send to log on response
        if (logOnResponse) {
            const originalSend = res.send;
            res.send = function (data) {
                const duration = Date.now() - startTime;
                const success = res.statusCode < 400;

                logSecurityEvent(userId, actionName, success, {
                    ...extractDetails(req, res),
                    duration,
                    timestamp: new Date().toISOString()
                }, req);

                return originalSend.call(this, data);
            };
        }

        next();
    };
}

/**
 * Batch log multiple events (useful for bulk operations)
 * @param {Array} events - Array of event objects
 * @param {Object} req - Express request object
 * @returns {Promise<void>}
 */
export async function logBatchEvents(events, req = null) {
    try {
        const promises = events.map(event =>
            logSecurityEvent(
                event.userId,
                event.action,
                event.success,
                event.details || {},
                req
            )
        );

        await Promise.all(promises);

    } catch (error) {
        console.error('Batch event logging error:', error);
    }
}

/**
 * Get audit trail for a specific user
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Array of audit log entries
 */
export async function getUserAuditTrail(userId, options = {}) {
    return await auditLogger.getUserAuditLogs(userId, options);
}

/**
 * Get security statistics
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Security statistics
 */
export async function getSecurityStatistics(options = {}) {
    return await securityMonitoringService.getSecurityStats(options);
}

/**
 * Check for suspicious activity for a user
 * @param {string} userId - User ID
 * @param {Object} options - Detection options
 * @returns {Promise<Object>} Suspicious activity report
 */
export async function checkSuspiciousActivity(userId, options = {}) {
    return await auditLogger.detectSuspiciousActivity(userId, options);
}

/**
 * Flush all pending audit logs (useful for graceful shutdown)
 * @returns {Promise<void>}
 */
export async function flushAuditLogs() {
    await auditLogger.flush();
}

/**
 * DISABLED: Audit log retention cleanup is disabled for data safety
 * @param {number} retentionDays - Number of days to retain logs
 * @returns {Promise<Object>} Cleanup result
 */
export async function cleanupOldAuditLogs(retentionDays = 365) {
    console.error('❌ Audit log cleanup is DISABLED for data safety');
    return {
        success: false,
        error: 'Audit log cleanup operations are disabled to prevent accidental data loss',
        deletedCount: 0
    };
}