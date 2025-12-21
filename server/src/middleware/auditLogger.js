import { SecurityAuditLog } from "../../models/SecurityAuditLog.js";

/**
 * Security Audit Logging Middleware
 * Provides centralized logging for security operations
 */

class AuditLogger {
    constructor() {
        this.logQueue = [];
        this.isProcessing = false;
        this.batchSize = 10;
        this.flushInterval = 5000; // 5 seconds

        // Start batch processing
        this.startBatchProcessor();
    }

    /**
     * Log a security event
     * @param {string} userId - User ID performing the action
     * @param {string} action - Action being performed
     * @param {boolean} success - Whether the action was successful
     * @param {Object} details - Additional details about the action
     * @param {Object} req - Express request object for IP and User-Agent
     * @returns {Promise<void>}
     */
    async logSecurityEvent(userId, action, success, details = {}, req = null) {
        try {
            const logEntry = {
                userId,
                action,
                success,
                details,
                ipAddress: this.extractIpAddress(req),
                userAgent: this.extractUserAgent(req),
                timestamp: new Date()
            };

            // Add to queue for batch processing
            this.logQueue.push(logEntry);

            // If queue is full, process immediately
            if (this.logQueue.length >= this.batchSize) {
                await this.processBatch();
            }

        } catch (error) {
            console.error('Failed to queue security event:', error);
            // Don't throw error to avoid breaking the main application flow
        }
    }

    /**
     * Extract IP address from request
     * @param {Object} req - Express request object
     * @returns {string} IP address
     */
    extractIpAddress(req) {
        if (!req) return 'unknown';

        return req.ip ||
            req.connection?.remoteAddress ||
            req.socket?.remoteAddress ||
            req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
            req.headers['x-real-ip'] ||
            'unknown';
    }

    /**
     * Extract User-Agent from request
     * @param {Object} req - Express request object
     * @returns {string} User-Agent string
     */
    extractUserAgent(req) {
        if (!req) return 'unknown';
        return req.get('User-Agent') || req.headers['user-agent'] || 'unknown';
    }

    /**
     * Process queued log entries in batches
     * @returns {Promise<void>}
     */
    async processBatch() {
        if (this.isProcessing || this.logQueue.length === 0) {
            return;
        }

        this.isProcessing = true;

        try {
            const batch = this.logQueue.splice(0, this.batchSize);

            if (batch.length > 0) {
                const logEntries = batch.map(entry => new SecurityAuditLog({
                    userId: entry.userId,
                    action: entry.action,
                    success: entry.success,
                    details: entry.details,
                    ipAddress: entry.ipAddress,
                    userAgent: entry.userAgent
                }));

                await SecurityAuditLog.insertMany(logEntries);
                console.log(`Processed ${batch.length} audit log entries`);
            }

        } catch (error) {
            console.error('Failed to process audit log batch:', error);
            // In production, you might want to implement retry logic or dead letter queue
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Start the batch processor with interval
     */
    startBatchProcessor() {
        setInterval(async () => {
            await this.processBatch();
        }, this.flushInterval);
    }

    /**
     * Flush all pending logs (useful for graceful shutdown)
     * @returns {Promise<void>}
     */
    async flush() {
        while (this.logQueue.length > 0) {
            await this.processBatch();
        }
    }

    /**
     * Get audit logs for a specific user
     * @param {string} userId - User ID
     * @param {Object} options - Query options
     * @returns {Promise<Array>} Array of audit logs
     */
    async getUserAuditLogs(userId, options = {}) {
        try {
            const {
                limit = 50,
                skip = 0,
                action = null,
                success = null,
                startDate = null,
                endDate = null
            } = options;

            const query = { userId };

            if (action) {
                query.action = action;
            }

            if (success !== null) {
                query.success = success;
            }

            if (startDate || endDate) {
                query.createdAt = {};
                if (startDate) query.createdAt.$gte = new Date(startDate);
                if (endDate) query.createdAt.$lte = new Date(endDate);
            }

            return await SecurityAuditLog.find(query)
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip(skip)
                .lean();

        } catch (error) {
            console.error('Failed to get user audit logs:', error);
            throw error;
        }
    }

    /**
     * Get security statistics
     * @param {Object} options - Query options
     * @returns {Promise<Object>} Security statistics
     */
    async getSecurityStats(options = {}) {
        try {
            const {
                startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
                endDate = new Date()
            } = options;

            const matchStage = {
                createdAt: {
                    $gte: startDate,
                    $lte: endDate
                }
            };

            const stats = await SecurityAuditLog.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: {
                            action: '$action',
                            success: '$success'
                        },
                        count: { $sum: 1 }
                    }
                },
                {
                    $group: {
                        _id: '$_id.action',
                        total: { $sum: '$count' },
                        successful: {
                            $sum: {
                                $cond: [{ $eq: ['$_id.success', true] }, '$count', 0]
                            }
                        },
                        failed: {
                            $sum: {
                                $cond: [{ $eq: ['$_id.success', false] }, '$count', 0]
                            }
                        }
                    }
                },
                {
                    $project: {
                        action: '$_id',
                        total: 1,
                        successful: 1,
                        failed: 1,
                        successRate: {
                            $multiply: [
                                { $divide: ['$successful', '$total'] },
                                100
                            ]
                        }
                    }
                }
            ]);

            return stats;

        } catch (error) {
            console.error('Failed to get security stats:', error);
            throw error;
        }
    }

    /**
     * Detect suspicious activity patterns
     * @param {string} userId - User ID to check
     * @param {Object} options - Detection options
     * @returns {Promise<Object>} Suspicious activity report
     */
    async detectSuspiciousActivity(userId, options = {}) {
        try {
            const {
                timeWindow = 60 * 60 * 1000, // 1 hour
                failureThreshold = 5
            } = options;

            const startTime = new Date(Date.now() - timeWindow);

            // Get recent failed attempts
            const recentFailures = await SecurityAuditLog.find({
                userId,
                success: false,
                createdAt: { $gte: startTime }
            }).sort({ createdAt: -1 });

            // Group by action type
            const failuresByAction = recentFailures.reduce((acc, log) => {
                if (!acc[log.action]) {
                    acc[log.action] = [];
                }
                acc[log.action].push(log);
                return acc;
            }, {});

            // Detect patterns
            const suspiciousPatterns = [];

            for (const [action, failures] of Object.entries(failuresByAction)) {
                if (failures.length >= failureThreshold) {
                    suspiciousPatterns.push({
                        type: 'excessive_failures',
                        action,
                        count: failures.length,
                        timeWindow: timeWindow / 60000, // minutes
                        firstFailure: failures[failures.length - 1].createdAt,
                        lastFailure: failures[0].createdAt
                    });
                }
            }

            // Check for rapid successive attempts
            const allRecentAttempts = await SecurityAuditLog.find({
                userId,
                createdAt: { $gte: startTime }
            }).sort({ createdAt: 1 });

            if (allRecentAttempts.length >= 10) {
                const timeSpan = allRecentAttempts[allRecentAttempts.length - 1].createdAt - allRecentAttempts[0].createdAt;
                if (timeSpan < 5 * 60 * 1000) { // 5 minutes
                    suspiciousPatterns.push({
                        type: 'rapid_attempts',
                        count: allRecentAttempts.length,
                        timeSpan: timeSpan / 1000, // seconds
                        actions: [...new Set(allRecentAttempts.map(log => log.action))]
                    });
                }
            }

            return {
                userId,
                timeWindow: timeWindow / 60000, // minutes
                totalAttempts: allRecentAttempts.length,
                failedAttempts: recentFailures.length,
                suspiciousPatterns,
                riskLevel: suspiciousPatterns.length > 0 ? 'high' : 'low'
            };

        } catch (error) {
            console.error('Failed to detect suspicious activity:', error);
            throw error;
        }
    }
}

// Create singleton instance
const auditLogger = new AuditLogger();

/**
 * Express middleware for automatic audit logging
 * @param {Object} options - Middleware options
 * @returns {Function} Express middleware function
 */
export function createAuditMiddleware(options = {}) {
    const {
        logAllRequests = false,
        sensitiveRoutes = [
            '/api/users/change-password',
            '/api/users/update-phone',
            '/api/users/delete-account',
            '/api/verification/send-otp',
            '/api/verification/verify-otp'
        ]
    } = options;

    return (req, res, next) => {
        // Only log sensitive routes unless logAllRequests is true
        const shouldLog = logAllRequests || sensitiveRoutes.some(route => req.path.includes(route));

        if (shouldLog) {
            const originalSend = res.send;
            const startTime = Date.now();

            res.send = function (data) {
                const duration = Date.now() - startTime;
                const userId = req.headers["x-user-id"] || 'anonymous';
                const success = res.statusCode < 400;

                // Determine action based on route and method
                let action = 'api_request';
                if (req.path.includes('/change-password')) action = 'password_change_request';
                else if (req.path.includes('/update-phone')) action = 'phone_update_request';
                else if (req.path.includes('/delete-account')) action = 'account_deletion_request';
                else if (req.path.includes('/send-otp')) action = 'otp_request';
                else if (req.path.includes('/verify-otp')) action = 'otp_verification_request';

                // Log the request
                auditLogger.logSecurityEvent(userId, action, success, {
                    method: req.method,
                    path: req.path,
                    statusCode: res.statusCode,
                    duration,
                    requestSize: req.get('content-length') || 0
                }, req);

                return originalSend.call(this, data);
            };
        }

        next();
    };
}

export default auditLogger;