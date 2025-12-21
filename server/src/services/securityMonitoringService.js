import auditLogger from "../middleware/auditLogger.js";
import notificationService from "./notificationService.js";
import { User } from "../../models/User.js";

/**
 * Security Monitoring Service
 * Monitors security events and triggers alerts for suspicious activities
 */

class SecurityMonitoringService {
    constructor() {
        this.alertThresholds = {
            failedLoginAttempts: 5,
            failedOtpAttempts: 3,
            passwordChangeAttempts: 3,
            timeWindow: 15 * 60 * 1000, // 15 minutes
            rapidRequestThreshold: 20,
            rapidRequestWindow: 5 * 60 * 1000 // 5 minutes
        };

        this.monitoringEnabled = process.env.SECURITY_MONITORING_ENABLED !== 'false';
        this.alertingEnabled = process.env.SECURITY_ALERTING_ENABLED !== 'false';
    }

    /**
     * Monitor user activity for suspicious patterns
     * @param {string} userId - User ID to monitor
     * @param {string} action - Action performed
     * @param {boolean} success - Whether action was successful
     * @param {Object} details - Additional details
     * @param {Object} req - Request object
     * @returns {Promise<Object>} Monitoring result
     */
    async monitorUserActivity(userId, action, success, details = {}, req = null) {
        if (!this.monitoringEnabled) {
            return { monitored: false };
        }

        try {
            // Detect suspicious activity
            const suspiciousActivity = await auditLogger.detectSuspiciousActivity(userId, {
                timeWindow: this.alertThresholds.timeWindow,
                failureThreshold: this.getFailureThreshold(action)
            });

            // Check if we need to trigger alerts
            if (suspiciousActivity.riskLevel === 'high') {
                await this.handleSuspiciousActivity(userId, suspiciousActivity, req);
            }

            // Check for specific patterns
            await this.checkSpecificPatterns(userId, action, success, details, req);

            return {
                monitored: true,
                riskLevel: suspiciousActivity.riskLevel,
                patterns: suspiciousActivity.suspiciousPatterns
            };

        } catch (error) {
            console.error('Security monitoring error:', error);
            return { monitored: false, error: error.message };
        }
    }

    /**
     * Get failure threshold for specific actions
     * @param {string} action - Action type
     * @returns {number} Failure threshold
     */
    getFailureThreshold(action) {
        const thresholds = {
            'password_change': this.alertThresholds.passwordChangeAttempts,
            'email_verification': this.alertThresholds.failedOtpAttempts,
            'phone_verification': this.alertThresholds.failedOtpAttempts,
            'email_otp_sent': this.alertThresholds.failedOtpAttempts,
            'phone_otp_sent': this.alertThresholds.failedOtpAttempts
        };

        return thresholds[action] || this.alertThresholds.failedLoginAttempts;
    }

    /**
     * Handle suspicious activity detection
     * @param {string} userId - User ID
     * @param {Object} suspiciousActivity - Suspicious activity report
     * @param {Object} req - Request object
     * @returns {Promise<void>}
     */
    async handleSuspiciousActivity(userId, suspiciousActivity, req) {
        try {
            // Log the security alert
            await auditLogger.logSecurityEvent(userId, 'security_alert_triggered', true, {
                riskLevel: suspiciousActivity.riskLevel,
                patterns: suspiciousActivity.suspiciousPatterns,
                totalAttempts: suspiciousActivity.totalAttempts,
                failedAttempts: suspiciousActivity.failedAttempts
            }, req);

            if (this.alertingEnabled) {
                // Get user information for notifications
                const user = await User.findById(userId).select('email name');

                if (user && user.email) {
                    // Send security alert to user
                    await this.sendSecurityAlert(user, suspiciousActivity, req);
                }

                // Send alert to administrators
                await this.sendAdminAlert(userId, suspiciousActivity, req);
            }

            // Implement temporary account restrictions if needed
            await this.implementSecurityMeasures(userId, suspiciousActivity);

        } catch (error) {
            console.error('Failed to handle suspicious activity:', error);
        }
    }

    /**
     * Check for specific security patterns
     * @param {string} userId - User ID
     * @param {string} action - Action performed
     * @param {boolean} success - Whether action was successful
     * @param {Object} details - Additional details
     * @param {Object} req - Request object
     * @returns {Promise<void>}
     */
    async checkSpecificPatterns(userId, action, success, details, req) {
        try {
            // Check for password change from new location
            if (action === 'password_change' && success) {
                await this.checkLocationChange(userId, req);
            }

            // Check for verification attempts from multiple IPs
            if (action.includes('verification') && !success) {
                await this.checkMultipleIpAttempts(userId, req);
            }

            // Check for rapid successive requests
            if (req) {
                await this.checkRapidRequests(userId, req);
            }

        } catch (error) {
            console.error('Pattern checking error:', error);
        }
    }

    /**
     * Check for location changes during sensitive operations
     * @param {string} userId - User ID
     * @param {Object} req - Request object
     * @returns {Promise<void>}
     */
    async checkLocationChange(userId, req) {
        try {
            const currentIp = auditLogger.extractIpAddress(req);

            // Get recent successful logins/operations from different IPs
            const recentLogs = await auditLogger.getUserAuditLogs(userId, {
                limit: 10,
                success: true
            });

            const recentIps = [...new Set(recentLogs.map(log => log.ipAddress))];

            if (recentIps.length > 1 && !recentIps.includes(currentIp)) {
                await auditLogger.logSecurityEvent(userId, 'location_change_detected', true, {
                    currentIp,
                    recentIps: recentIps.slice(0, 3), // Limit for privacy
                    action: 'password_change'
                }, req);
            }

        } catch (error) {
            console.error('Location change check error:', error);
        }
    }

    /**
     * Check for verification attempts from multiple IPs
     * @param {string} userId - User ID
     * @param {Object} req - Request object
     * @returns {Promise<void>}
     */
    async checkMultipleIpAttempts(userId, req) {
        try {
            const timeWindow = 30 * 60 * 1000; // 30 minutes
            const startTime = new Date(Date.now() - timeWindow);

            const recentAttempts = await auditLogger.getUserAuditLogs(userId, {
                startDate: startTime,
                action: 'email_verification'
            });

            const uniqueIps = [...new Set(recentAttempts.map(log => log.ipAddress))];

            if (uniqueIps.length >= 3) {
                await auditLogger.logSecurityEvent(userId, 'multiple_ip_verification_attempts', true, {
                    uniqueIpCount: uniqueIps.length,
                    timeWindow: timeWindow / 60000, // minutes
                    totalAttempts: recentAttempts.length
                }, req);
            }

        } catch (error) {
            console.error('Multiple IP check error:', error);
        }
    }

    /**
     * Check for rapid successive requests
     * @param {string} userId - User ID
     * @param {Object} req - Request object
     * @returns {Promise<void>}
     */
    async checkRapidRequests(userId, req) {
        try {
            const startTime = new Date(Date.now() - this.alertThresholds.rapidRequestWindow);

            const recentRequests = await auditLogger.getUserAuditLogs(userId, {
                startDate: startTime,
                limit: 50
            });

            if (recentRequests.length >= this.alertThresholds.rapidRequestThreshold) {
                await auditLogger.logSecurityEvent(userId, 'rapid_requests_detected', true, {
                    requestCount: recentRequests.length,
                    timeWindow: this.alertThresholds.rapidRequestWindow / 60000, // minutes
                    actions: [...new Set(recentRequests.map(log => log.action))]
                }, req);
            }

        } catch (error) {
            console.error('Rapid requests check error:', error);
        }
    }

    /**
     * Send security alert to user
     * @param {Object} user - User object
     * @param {Object} suspiciousActivity - Suspicious activity report
     * @param {Object} req - Request object
     * @returns {Promise<void>}
     */
    async sendSecurityAlert(user, suspiciousActivity, req) {
        try {
            const ipAddress = auditLogger.extractIpAddress(req);
            const timestamp = new Date().toLocaleString();

            const emailContent = `
                <h2>Security Alert for Your Account</h2>
                <p>Hello ${user.name},</p>
                <p>We detected suspicious activity on your account:</p>
                <ul>
                    <li><strong>Time:</strong> ${timestamp}</li>
                    <li><strong>IP Address:</strong> ${ipAddress}</li>
                    <li><strong>Total Attempts:</strong> ${suspiciousActivity.totalAttempts}</li>
                    <li><strong>Failed Attempts:</strong> ${suspiciousActivity.failedAttempts}</li>
                </ul>
                <p><strong>Detected Patterns:</strong></p>
                <ul>
                    ${suspiciousActivity.suspiciousPatterns.map(pattern =>
                `<li>${pattern.type}: ${pattern.count} attempts</li>`
            ).join('')}
                </ul>
                <p>If this was not you, please change your password immediately and contact support.</p>
                <p>If this was you, you can ignore this message.</p>
                <br>
                <p>Best regards,<br>Security Team</p>
            `;

            await notificationService.sendEmail(
                user.email,
                'Security Alert - Suspicious Activity Detected',
                emailContent
            );

        } catch (error) {
            console.error('Failed to send security alert:', error);
        }
    }

    /**
     * Send alert to administrators
     * @param {string} userId - User ID
     * @param {Object} suspiciousActivity - Suspicious activity report
     * @param {Object} req - Request object
     * @returns {Promise<void>}
     */
    async sendAdminAlert(userId, suspiciousActivity, req) {
        try {
            const adminEmail = process.env.ADMIN_ALERT_EMAIL;
            if (!adminEmail) return;

            const ipAddress = auditLogger.extractIpAddress(req);
            const userAgent = auditLogger.extractUserAgent(req);
            const timestamp = new Date().toLocaleString();

            const emailContent = `
                <h2>Security Alert - Suspicious Activity Detected</h2>
                <p><strong>User ID:</strong> ${userId}</p>
                <p><strong>Time:</strong> ${timestamp}</p>
                <p><strong>IP Address:</strong> ${ipAddress}</p>
                <p><strong>User Agent:</strong> ${userAgent}</p>
                <p><strong>Risk Level:</strong> ${suspiciousActivity.riskLevel}</p>
                <p><strong>Total Attempts:</strong> ${suspiciousActivity.totalAttempts}</p>
                <p><strong>Failed Attempts:</strong> ${suspiciousActivity.failedAttempts}</p>
                <p><strong>Detected Patterns:</strong></p>
                <ul>
                    ${suspiciousActivity.suspiciousPatterns.map(pattern =>
                `<li>${pattern.type}: ${pattern.count} attempts in ${pattern.timeWindow || 'unknown'} minutes</li>`
            ).join('')}
                </ul>
                <p>Please review the user's activity and take appropriate action if necessary.</p>
            `;

            await notificationService.sendEmail(
                adminEmail,
                `Security Alert - User ${userId}`,
                emailContent
            );

        } catch (error) {
            console.error('Failed to send admin alert:', error);
        }
    }

    /**
     * Implement security measures based on suspicious activity
     * @param {string} userId - User ID
     * @param {Object} suspiciousActivity - Suspicious activity report
     * @returns {Promise<void>}
     */
    async implementSecurityMeasures(userId, suspiciousActivity) {
        try {
            // For now, just log the recommendation
            // In a production system, you might implement temporary locks, CAPTCHA requirements, etc.

            const measures = [];

            if (suspiciousActivity.failedAttempts >= 10) {
                measures.push('temporary_account_lock');
            }

            if (suspiciousActivity.suspiciousPatterns.some(p => p.type === 'rapid_attempts')) {
                measures.push('rate_limit_increase');
            }

            if (measures.length > 0) {
                await auditLogger.logSecurityEvent(userId, 'security_measures_recommended', true, {
                    recommendedMeasures: measures,
                    reason: 'suspicious_activity_detected'
                });
            }

        } catch (error) {
            console.error('Failed to implement security measures:', error);
        }
    }

    /**
     * Get security monitoring statistics
     * @param {Object} options - Query options
     * @returns {Promise<Object>} Security statistics
     */
    async getSecurityStats(options = {}) {
        try {
            const stats = await auditLogger.getSecurityStats(options);

            // Add additional monitoring metrics
            const alertStats = await auditLogger.getUserAuditLogs(null, {
                action: 'security_alert_triggered',
                ...options
            });

            return {
                actionStats: stats,
                alertCount: alertStats.length,
                monitoringEnabled: this.monitoringEnabled,
                alertingEnabled: this.alertingEnabled
            };

        } catch (error) {
            console.error('Failed to get security stats:', error);
            throw error;
        }
    }

    /**
     * Update monitoring configuration
     * @param {Object} config - New configuration
     * @returns {void}
     */
    updateConfig(config) {
        if (config.alertThresholds) {
            this.alertThresholds = { ...this.alertThresholds, ...config.alertThresholds };
        }

        if (typeof config.monitoringEnabled === 'boolean') {
            this.monitoringEnabled = config.monitoringEnabled;
        }

        if (typeof config.alertingEnabled === 'boolean') {
            this.alertingEnabled = config.alertingEnabled;
        }
    }
}

// Create singleton instance
const securityMonitoringService = new SecurityMonitoringService();

export default securityMonitoringService;