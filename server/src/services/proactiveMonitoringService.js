import escalationService from './escalationService.js';
import { DeliveryAttempt } from '../../models/DeliveryAttempt.js';
import { ServiceConfiguration } from '../../models/ServiceConfiguration.js';
import configurationValidator from './configurationValidator.js';
import { logVerificationEvent } from '../utils/auditUtils.js';

/**
 * Proactive Monitoring Service for OTP Delivery
 * Monitors system health, detects issues, and provides proactive solutions
 */
class ProactiveMonitoringService {
    constructor() {
        this.monitoringInterval = null;
        this.alertThresholds = {
            systemSuccessRate: 80, // System-wide success rate threshold
            userSuccessRate: 50,   // Individual user success rate threshold
            serviceSuccessRate: 70, // Individual service success rate threshold
            errorRate: 20,         // Error rate threshold
            responseTime: 30000    // Response time threshold (30 seconds)
        };

        this.monitoringEnabled = process.env.PROACTIVE_MONITORING_ENABLED !== 'false';
        this.monitoringIntervalMs = parseInt(process.env.MONITORING_INTERVAL_MS) || 5 * 60 * 1000; // 5 minutes

        if (this.monitoringEnabled) {
            this.startMonitoring();
        }
    }

    /**
     * Start proactive monitoring
     */
    startMonitoring() {
        console.log('Starting proactive OTP delivery monitoring...');

        this.monitoringInterval = setInterval(async () => {
            try {
                await this.performMonitoringCycle();
            } catch (error) {
                console.error('Error in monitoring cycle:', error);
            }
        }, this.monitoringIntervalMs);

        // Perform initial monitoring cycle
        setTimeout(() => this.performMonitoringCycle(), 10000); // 10 seconds delay
    }

    /**
     * Stop proactive monitoring
     */
    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
            console.log('Proactive monitoring stopped');
        }
    }

    /**
     * Perform a complete monitoring cycle
     */
    async performMonitoringCycle() {
        console.log('Performing proactive monitoring cycle...');

        try {
            // Monitor system-wide health
            const systemHealth = await this.monitorSystemHealth();

            // Monitor service-specific health
            const serviceHealth = await this.monitorServiceHealth();

            // Monitor user-specific issues
            const userIssues = await this.monitorUserIssues();

            // Generate proactive alerts and solutions
            const alerts = await this.generateProactiveAlerts(systemHealth, serviceHealth, userIssues);

            // Process alerts and escalations
            await this.processAlerts(alerts);

            console.log(`Monitoring cycle completed. Generated ${alerts.length} alerts.`);

        } catch (error) {
            console.error('Error in monitoring cycle:', error);
        }
    }

    /**
     * Monitor overall system health
     * @returns {Promise<object>} System health metrics
     */
    async monitorSystemHealth() {
        const timeWindow = 60 * 60 * 1000; // 1 hour
        const cutoffTime = new Date(Date.now() - timeWindow);

        try {
            // Get delivery statistics for the last hour
            const deliveryStats = await DeliveryAttempt.aggregate([
                {
                    $match: {
                        createdAt: { $gte: cutoffTime }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalAttempts: { $sum: 1 },
                        successfulAttempts: {
                            $sum: {
                                $cond: [
                                    { $in: ['$status', ['sent', 'delivered']] },
                                    1,
                                    0
                                ]
                            }
                        },
                        failedAttempts: {
                            $sum: {
                                $cond: [
                                    { $eq: ['$status', 'failed'] },
                                    1,
                                    0
                                ]
                            }
                        },
                        avgResponseTime: { $avg: '$responseTime' }
                    }
                }
            ]);

            const stats = deliveryStats[0] || {
                totalAttempts: 0,
                successfulAttempts: 0,
                failedAttempts: 0,
                avgResponseTime: 0
            };

            const successRate = stats.totalAttempts > 0
                ? (stats.successfulAttempts / stats.totalAttempts) * 100
                : 100;

            const errorRate = stats.totalAttempts > 0
                ? (stats.failedAttempts / stats.totalAttempts) * 100
                : 0;

            // Get service configuration health
            const serviceConfigs = await ServiceConfiguration.find({});
            const healthyServices = serviceConfigs.filter(config =>
                config.healthStatus === 'healthy'
            ).length;

            return {
                timestamp: new Date(),
                totalAttempts: stats.totalAttempts,
                successRate,
                errorRate,
                avgResponseTime: stats.avgResponseTime || 0,
                healthyServices,
                totalServices: serviceConfigs.length,
                serviceAvailability: serviceConfigs.length > 0
                    ? (healthyServices / serviceConfigs.length) * 100
                    : 0,
                issues: this.identifySystemIssues(successRate, errorRate, stats.avgResponseTime, serviceConfigs)
            };

        } catch (error) {
            console.error('Error monitoring system health:', error);
            return {
                timestamp: new Date(),
                error: error.message,
                issues: ['monitoring_error']
            };
        }
    }

    /**
     * Monitor individual service health
     * @returns {Promise<Array>} Service health metrics
     */
    async monitorServiceHealth() {
        const timeWindow = 60 * 60 * 1000; // 1 hour
        const cutoffTime = new Date(Date.now() - timeWindow);

        try {
            // Get per-service statistics
            const serviceStats = await DeliveryAttempt.aggregate([
                {
                    $match: {
                        createdAt: { $gte: cutoffTime }
                    }
                },
                {
                    $group: {
                        _id: '$service',
                        totalAttempts: { $sum: 1 },
                        successfulAttempts: {
                            $sum: {
                                $cond: [
                                    { $in: ['$status', ['sent', 'delivered']] },
                                    1,
                                    0
                                ]
                            }
                        },
                        failedAttempts: {
                            $sum: {
                                $cond: [
                                    { $eq: ['$status', 'failed'] },
                                    1,
                                    0
                                ]
                            }
                        },
                        errors: { $push: '$error' },
                        avgResponseTime: { $avg: '$responseTime' }
                    }
                }
            ]);

            return serviceStats.map(stat => {
                const successRate = stat.totalAttempts > 0
                    ? (stat.successfulAttempts / stat.totalAttempts) * 100
                    : 100;

                const errorRate = stat.totalAttempts > 0
                    ? (stat.failedAttempts / stat.totalAttempts) * 100
                    : 0;

                const commonErrors = this.getCommonErrors(stat.errors.filter(e => e));

                return {
                    serviceName: stat._id,
                    totalAttempts: stat.totalAttempts,
                    successRate,
                    errorRate,
                    avgResponseTime: stat.avgResponseTime || 0,
                    commonErrors,
                    issues: this.identifyServiceIssues(stat._id, successRate, errorRate, commonErrors)
                };
            });

        } catch (error) {
            console.error('Error monitoring service health:', error);
            return [];
        }
    }

    /**
     * Monitor user-specific issues
     * @returns {Promise<Array>} Users with delivery issues
     */
    async monitorUserIssues() {
        const timeWindow = 24 * 60 * 60 * 1000; // 24 hours
        const cutoffTime = new Date(Date.now() - timeWindow);

        try {
            // Find users with multiple failed deliveries
            const userIssues = await DeliveryAttempt.aggregate([
                {
                    $match: {
                        createdAt: { $gte: cutoffTime }
                    }
                },
                {
                    $group: {
                        _id: '$userId',
                        totalAttempts: { $sum: 1 },
                        failedAttempts: {
                            $sum: {
                                $cond: [
                                    { $eq: ['$status', 'failed'] },
                                    1,
                                    0
                                ]
                            }
                        },
                        recentErrors: { $push: '$error' },
                        lastAttempt: { $max: '$createdAt' }
                    }
                },
                {
                    $match: {
                        $or: [
                            { failedAttempts: { $gte: 3 } }, // 3+ failures
                            {
                                $expr: {
                                    $lt: [
                                        { $divide: [{ $subtract: ['$totalAttempts', '$failedAttempts'] }, '$totalAttempts'] },
                                        0.5 // Less than 50% success rate
                                    ]
                                }
                            }
                        ]
                    }
                }
            ]);

            return userIssues.map(user => {
                const successRate = user.totalAttempts > 0
                    ? ((user.totalAttempts - user.failedAttempts) / user.totalAttempts) * 100
                    : 0;

                return {
                    userId: user._id,
                    totalAttempts: user.totalAttempts,
                    failedAttempts: user.failedAttempts,
                    successRate,
                    recentErrors: user.recentErrors.filter(e => e),
                    lastAttempt: user.lastAttempt,
                    needsAttention: successRate < this.alertThresholds.userSuccessRate
                };
            });

        } catch (error) {
            console.error('Error monitoring user issues:', error);
            return [];
        }
    }

    /**
     * Generate proactive alerts based on monitoring data
     * @param {object} systemHealth - System health metrics
     * @param {Array} serviceHealth - Service health metrics
     * @param {Array} userIssues - User issues
     * @returns {Promise<Array>} Generated alerts
     */
    async generateProactiveAlerts(systemHealth, serviceHealth, userIssues) {
        const alerts = [];

        // System-wide alerts
        if (systemHealth.successRate < this.alertThresholds.systemSuccessRate) {
            alerts.push({
                type: 'system_degradation',
                severity: systemHealth.successRate < 50 ? 'critical' : 'high',
                title: 'System-wide delivery success rate below threshold',
                description: `Current success rate: ${systemHealth.successRate.toFixed(1)}%`,
                metrics: systemHealth,
                solutions: await this.getSystemDegradationSolutions(systemHealth),
                escalationNeeded: systemHealth.successRate < 50,
                affectedUsers: 'all'
            });
        }

        if (systemHealth.serviceAvailability < 70) {
            alerts.push({
                type: 'service_availability',
                severity: 'high',
                title: 'Multiple services experiencing issues',
                description: `Only ${systemHealth.serviceAvailability.toFixed(1)}% of services are healthy`,
                metrics: systemHealth,
                solutions: [
                    'Check service configurations and credentials',
                    'Review service provider status pages',
                    'Enable backup services if available',
                    'Contact service providers for support'
                ],
                escalationNeeded: true,
                affectedUsers: 'all'
            });
        }

        // Service-specific alerts
        serviceHealth.forEach(service => {
            if (service.successRate < this.alertThresholds.serviceSuccessRate && service.totalAttempts >= 5) {
                alerts.push({
                    type: 'service_degradation',
                    severity: service.successRate < 30 ? 'critical' : 'medium',
                    title: `${service.serviceName} service experiencing issues`,
                    description: `Success rate: ${service.successRate.toFixed(1)}%`,
                    serviceName: service.serviceName,
                    metrics: service,
                    solutions: this.getServiceSpecificSolutions(service),
                    escalationNeeded: service.successRate < 30,
                    affectedUsers: 'service_users'
                });
            }
        });

        // User-specific alerts
        userIssues.forEach(user => {
            if (user.needsAttention) {
                alerts.push({
                    type: 'user_delivery_issues',
                    severity: 'medium',
                    title: 'User experiencing persistent delivery failures',
                    description: `User ${user.userId} has ${user.failedAttempts} failures out of ${user.totalAttempts} attempts`,
                    userId: user.userId,
                    metrics: user,
                    solutions: this.getUserSpecificSolutions(user),
                    escalationNeeded: user.successRate < 20,
                    affectedUsers: 'individual'
                });
            }
        });

        return alerts;
    }

    /**
     * Process generated alerts
     * @param {Array} alerts - Generated alerts
     */
    async processAlerts(alerts) {
        for (const alert of alerts) {
            try {
                // Log the alert
                console.log(`Processing alert: ${alert.type} - ${alert.title}`);

                // Create escalation ticket if needed
                if (alert.escalationNeeded) {
                    await this.createEscalationFromAlert(alert);
                }

                // Send notifications based on severity
                await this.sendAlertNotifications(alert);

                // Store alert for dashboard display
                await this.storeAlert(alert);

            } catch (error) {
                console.error('Error processing alert:', error);
            }
        }
    }

    /**
     * Create escalation ticket from alert
     * @param {object} alert - Alert object
     */
    async createEscalationFromAlert(alert) {
        try {
            let escalationReason;

            switch (alert.type) {
                case 'system_degradation':
                    escalationReason = 'system_outage';
                    break;
                case 'service_degradation':
                    escalationReason = 'service_degradation';
                    break;
                case 'user_delivery_issues':
                    escalationReason = 'persistent_delivery_failure';
                    break;
                default:
                    escalationReason = 'general_support';
            }

            const ticket = await escalationService.createEscalationTicket(
                alert.userId || 'system',
                escalationReason,
                alert.metrics,
                {
                    alertType: alert.type,
                    alertSeverity: alert.severity,
                    proactivelyDetected: true,
                    detectionTime: new Date()
                }
            );

            console.log(`Created escalation ticket: ${ticket.ticketId} for alert: ${alert.type}`);

        } catch (error) {
            console.error('Error creating escalation from alert:', error);
        }
    }

    /**
     * Send alert notifications
     * @param {object} alert - Alert object
     */
    async sendAlertNotifications(alert) {
        // This would integrate with notification systems
        // For now, just log the notification
        console.log(`Alert notification: [${alert.severity.toUpperCase()}] ${alert.title}`);

        // In a real implementation, this would send:
        // - Email notifications to administrators
        // - Slack/Teams messages
        // - SMS alerts for critical issues
        // - Dashboard notifications
    }

    /**
     * Store alert for dashboard display
     * @param {object} alert - Alert object
     */
    async storeAlert(alert) {
        // This would store alerts in a database for dashboard display
        // For now, just log the storage
        console.log(`Storing alert: ${alert.type} - ${alert.severity}`);
    }

    /**
     * Helper methods for identifying issues and generating solutions
     */
    identifySystemIssues(successRate, errorRate, avgResponseTime, serviceConfigs) {
        const issues = [];

        if (successRate < this.alertThresholds.systemSuccessRate) {
            issues.push('low_success_rate');
        }

        if (errorRate > this.alertThresholds.errorRate) {
            issues.push('high_error_rate');
        }

        if (avgResponseTime > this.alertThresholds.responseTime) {
            issues.push('slow_response_time');
        }

        const unhealthyServices = serviceConfigs.filter(config =>
            config.healthStatus !== 'healthy'
        ).length;

        if (unhealthyServices > serviceConfigs.length / 2) {
            issues.push('multiple_service_failures');
        }

        return issues;
    }

    identifyServiceIssues(serviceName, successRate, errorRate, commonErrors) {
        const issues = [];

        if (successRate < this.alertThresholds.serviceSuccessRate) {
            issues.push('low_success_rate');
        }

        if (errorRate > this.alertThresholds.errorRate) {
            issues.push('high_error_rate');
        }

        // Identify specific error patterns
        commonErrors.forEach(error => {
            if (error.error.toLowerCase().includes('timeout')) {
                issues.push('timeout_errors');
            }
            if (error.error.toLowerCase().includes('rate')) {
                issues.push('rate_limiting');
            }
            if (error.error.toLowerCase().includes('auth')) {
                issues.push('authentication_errors');
            }
        });

        return issues;
    }

    async getSystemDegradationSolutions(systemHealth) {
        const solutions = [
            'Check all service configurations and health status',
            'Review recent system changes or deployments',
            'Monitor network connectivity and infrastructure',
            'Enable backup services and fallback mechanisms'
        ];

        if (systemHealth.serviceAvailability < 50) {
            solutions.push('Investigate potential infrastructure issues');
            solutions.push('Contact service providers for status updates');
        }

        return solutions;
    }

    getServiceSpecificSolutions(service) {
        const solutions = [];

        if (service.issues.includes('timeout_errors')) {
            solutions.push('Check service endpoint connectivity and response times');
            solutions.push('Review service provider status for performance issues');
        }

        if (service.issues.includes('rate_limiting')) {
            solutions.push('Review API usage and rate limits');
            solutions.push('Implement request throttling and retry logic');
        }

        if (service.issues.includes('authentication_errors')) {
            solutions.push('Verify API credentials and authentication tokens');
            solutions.push('Check for expired or invalid credentials');
        }

        solutions.push(`Temporarily route traffic away from ${service.serviceName}`);
        solutions.push('Monitor service recovery and re-enable when stable');

        return solutions;
    }

    getUserSpecificSolutions(user) {
        const solutions = [
            'Review user\'s contact information for accuracy',
            'Test connectivity to user\'s delivery methods',
            'Check for user-specific delivery preferences',
            'Provide alternative delivery methods'
        ];

        if (user.successRate < 20) {
            solutions.push('Escalate to technical support for personalized assistance');
        }

        return solutions;
    }

    getCommonErrors(errors) {
        const errorCounts = {};
        errors.forEach(error => {
            if (error) {
                errorCounts[error] = (errorCounts[error] || 0) + 1;
            }
        });

        return Object.entries(errorCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([error, count]) => ({ error, count }));
    }

    /**
     * Get current monitoring status
     * @returns {object} Monitoring status
     */
    getMonitoringStatus() {
        return {
            enabled: this.monitoringEnabled,
            running: this.monitoringInterval !== null,
            intervalMs: this.monitoringIntervalMs,
            thresholds: this.alertThresholds,
            lastCycle: this.lastCycleTime || null
        };
    }

    /**
     * Update monitoring configuration
     * @param {object} config - New configuration
     */
    updateConfiguration(config) {
        if (config.thresholds) {
            this.alertThresholds = { ...this.alertThresholds, ...config.thresholds };
        }

        if (config.intervalMs && config.intervalMs !== this.monitoringIntervalMs) {
            this.monitoringIntervalMs = config.intervalMs;

            // Restart monitoring with new interval
            if (this.monitoringInterval) {
                this.stopMonitoring();
                this.startMonitoring();
            }
        }

        if (config.enabled !== undefined && config.enabled !== this.monitoringEnabled) {
            this.monitoringEnabled = config.enabled;

            if (config.enabled && !this.monitoringInterval) {
                this.startMonitoring();
            } else if (!config.enabled && this.monitoringInterval) {
                this.stopMonitoring();
            }
        }
    }
}

// Create and export singleton instance
const proactiveMonitoringService = new ProactiveMonitoringService();

// Graceful shutdown
process.on('SIGTERM', () => {
    proactiveMonitoringService.stopMonitoring();
});

process.on('SIGINT', () => {
    proactiveMonitoringService.stopMonitoring();
});

export default proactiveMonitoringService;