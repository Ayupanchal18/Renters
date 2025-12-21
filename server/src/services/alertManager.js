import { Alert } from "../../models/Alert.js";
import { DeliveryAttempt } from "../../models/DeliveryAttempt.js";
import { ServiceConfiguration } from "../../models/ServiceConfiguration.js";
import { deliveryMetricsService } from "./deliveryMetricsService.js";
import { logVerificationEvent } from "../utils/auditUtils.js";

/**
 * Alert Manager Service
 * Generates, manages, and tracks alerts based on delivery metrics and system health
 * Implements Requirements 3.5 and 8.2 for automated alerting
 */
export class AlertManager {
    constructor() {
        this.alertThresholds = {
            // Delivery failure rate thresholds
            criticalFailureRate: 75, // Critical alert if failure rate exceeds 75%
            warningFailureRate: 50,  // Warning alert if failure rate exceeds 50%

            // Service-specific thresholds
            serviceFailureRate: 80,  // Alert if individual service failure rate exceeds 80%

            // Time-based thresholds
            noDeliveryMinutes: 15,   // Alert if no successful deliveries in 15 minutes
            staleValidationMinutes: 30, // Alert if service validation is older than 30 minutes

            // Error count thresholds
            highErrorCount: 10,      // Alert if service error count exceeds 10
            criticalErrorCount: 25,  // Critical alert if error count exceeds 25

            // System health thresholds
            minActiveServices: 1,    // Alert if fewer than 1 service is active
            maxResponseTime: 30000   // Alert if average response time exceeds 30 seconds
        };

        this.alertCooldowns = new Map(); // Prevent alert spam
        this.defaultCooldownMinutes = 15;

        // Start monitoring intervals
        this.startMonitoring();
    }

    /**
     * Start automated monitoring and alert generation
     */
    startMonitoring() {
        // Check delivery metrics every 5 minutes
        setInterval(() => {
            this.checkDeliveryMetrics().catch(error => {
                console.error('Error checking delivery metrics:', error);
            });
        }, 5 * 60 * 1000);

        // Check service health every 2 minutes
        setInterval(() => {
            this.checkServiceHealth().catch(error => {
                console.error('Error checking service health:', error);
            });
        }, 2 * 60 * 1000);

        // Process alert escalations every 10 minutes
        setInterval(() => {
            this.processEscalations().catch(error => {
                console.error('Error processing escalations:', error);
            });
        }, 10 * 60 * 1000);

        // Clean up resolved alerts older than 30 days
        setInterval(() => {
            this.cleanupOldAlerts().catch(error => {
                console.error('Error cleaning up old alerts:', error);
            });
        }, 24 * 60 * 60 * 1000); // Daily cleanup
    }

    /**
     * Check delivery metrics and generate alerts
     */
    async checkDeliveryMetrics() {
        try {
            const metrics = await deliveryMetricsService.getDeliveryMetrics(1); // Last hour

            // Check overall delivery failure rate
            await this.checkOverallFailureRate(metrics.delivery);

            // Check service-specific failure rates
            await this.checkServiceFailureRates(metrics.services);

            // Check for no deliveries
            await this.checkNoDeliveries(metrics.delivery);

            // Check error patterns
            await this.checkErrorPatterns();

        } catch (error) {
            console.error('Error in checkDeliveryMetrics:', error);
            await this.createAlert({
                type: 'system_degradation',
                severity: 'warning',
                title: 'Metrics Collection Error',
                description: `Failed to collect delivery metrics: ${error.message}`,
                source: 'delivery_metrics',
                context: { error: error.message }
            });
        }
    }

    /**
     * Check overall delivery failure rate
     */
    async checkOverallFailureRate(deliveryStats) {
        if (deliveryStats.totalAttempts === 0) return;

        const failureRate = (deliveryStats.failedAttempts / deliveryStats.totalAttempts) * 100;

        let severity = null;
        let threshold = null;

        if (failureRate >= this.alertThresholds.criticalFailureRate) {
            severity = 'critical';
            threshold = this.alertThresholds.criticalFailureRate;
        } else if (failureRate >= this.alertThresholds.warningFailureRate) {
            severity = 'warning';
            threshold = this.alertThresholds.warningFailureRate;
        }

        if (severity && !this.isInCooldown('delivery_failure_rate')) {
            await this.createAlert({
                type: 'delivery_failure_rate',
                severity,
                title: `High Delivery Failure Rate Detected`,
                description: `OTP delivery failure rate is ${failureRate.toFixed(1)}% (threshold: ${threshold}%) over the last hour`,
                source: 'delivery_metrics',
                affectedServices: ['all'],
                metrics: {
                    failureRate: failureRate,
                    errorCount: deliveryStats.failedAttempts,
                    affectedDeliveries: deliveryStats.totalAttempts,
                    timeRange: '1 hour',
                    threshold: threshold,
                    actualValue: failureRate
                },
                context: {
                    totalAttempts: deliveryStats.totalAttempts,
                    successfulAttempts: deliveryStats.successfulAttempts,
                    failedAttempts: deliveryStats.failedAttempts,
                    averageDeliveryTime: deliveryStats.averageDeliveryTime
                }
            });

            this.setCooldown('delivery_failure_rate');
        }
    }

    /**
     * Check service-specific failure rates
     */
    async checkServiceFailureRates(serviceStats) {
        for (const service of serviceStats) {
            const serviceName = service._id;
            const failureRate = 100 - service.successRate;

            if (failureRate >= this.alertThresholds.serviceFailureRate &&
                service.totalAttempts >= 5 && // Minimum attempts to avoid false positives
                !this.isInCooldown(`service_failure_${serviceName}`)) {

                await this.createAlert({
                    type: 'service_unavailable',
                    severity: failureRate >= 90 ? 'critical' : 'warning',
                    title: `${serviceName} Service Experiencing High Failure Rate`,
                    description: `${serviceName} service has a ${failureRate.toFixed(1)}% failure rate over the last hour`,
                    source: 'service_monitor',
                    affectedServices: [serviceName],
                    metrics: {
                        failureRate: failureRate,
                        errorCount: service.failedAttempts,
                        affectedDeliveries: service.totalAttempts,
                        timeRange: '1 hour',
                        threshold: this.alertThresholds.serviceFailureRate,
                        actualValue: failureRate
                    },
                    context: {
                        serviceName,
                        totalAttempts: service.totalAttempts,
                        successfulAttempts: service.successfulAttempts,
                        failedAttempts: service.failedAttempts,
                        averageDeliveryTime: service.averageDeliveryTime
                    }
                });

                this.setCooldown(`service_failure_${serviceName}`);
            }
        }
    }

    /**
     * Check for no deliveries in specified time period
     */
    async checkNoDeliveries(deliveryStats) {
        if (deliveryStats.successfulAttempts === 0 && deliveryStats.totalAttempts > 0) {
            if (!this.isInCooldown('no_deliveries')) {
                await this.createAlert({
                    type: 'no_deliveries',
                    severity: 'critical',
                    title: 'No Successful Deliveries Detected',
                    description: `No successful OTP deliveries in the last hour despite ${deliveryStats.totalAttempts} attempts`,
                    source: 'delivery_metrics',
                    affectedServices: ['all'],
                    metrics: {
                        failureRate: 100,
                        errorCount: deliveryStats.failedAttempts,
                        affectedDeliveries: deliveryStats.totalAttempts,
                        timeRange: '1 hour',
                        threshold: 0,
                        actualValue: 0
                    },
                    context: {
                        totalAttempts: deliveryStats.totalAttempts,
                        failedAttempts: deliveryStats.failedAttempts,
                        timeRange: '1 hour'
                    }
                });

                this.setCooldown('no_deliveries');
            }
        }
    }

    /**
     * Check error patterns and high error counts
     */
    async checkErrorPatterns() {
        try {
            const failureAnalysis = await deliveryMetricsService.getFailureAnalysis(1);

            // Check for high error counts per service
            for (const errorData of failureAnalysis.breakdown) {
                const serviceName = errorData.service;
                const errorCount = errorData.count;

                if (errorCount >= this.alertThresholds.criticalErrorCount &&
                    !this.isInCooldown(`high_errors_${serviceName}`)) {

                    await this.createAlert({
                        type: 'high_error_count',
                        severity: 'critical',
                        title: `High Error Count for ${serviceName}`,
                        description: `${serviceName} has generated ${errorCount} errors in the last hour`,
                        source: 'delivery_metrics',
                        affectedServices: [serviceName],
                        metrics: {
                            errorCount: errorCount,
                            timeRange: '1 hour',
                            threshold: this.alertThresholds.criticalErrorCount,
                            actualValue: errorCount
                        },
                        context: {
                            serviceName,
                            errorType: errorData.errorType,
                            percentage: errorData.percentage,
                            examples: errorData.examples
                        }
                    });

                    this.setCooldown(`high_errors_${serviceName}`);
                }
            }
        } catch (error) {
            console.error('Error checking error patterns:', error);
        }
    }

    /**
     * Check service health and configuration status
     */
    async checkServiceHealth() {
        try {
            const serviceConfigs = await ServiceConfiguration.find({});
            let activeServices = 0;

            for (const config of serviceConfigs) {
                if (config.isEnabled && config.healthStatus === 'healthy') {
                    activeServices++;
                }

                // Check for stale validation
                if (config.isEnabled && config.lastValidated) {
                    const validationAge = Date.now() - config.lastValidated.getTime();
                    const staleThreshold = this.alertThresholds.staleValidationMinutes * 60 * 1000;

                    if (validationAge > staleThreshold &&
                        !this.isInCooldown(`stale_validation_${config.serviceName}`)) {

                        await this.createAlert({
                            type: 'configuration_invalid',
                            severity: 'warning',
                            title: `Stale Service Validation for ${config.serviceName}`,
                            description: `${config.serviceName} validation is ${Math.round(validationAge / (60 * 1000))} minutes old`,
                            source: 'service_monitor',
                            affectedServices: [config.serviceName],
                            context: {
                                serviceName: config.serviceName,
                                lastValidated: config.lastValidated,
                                validationAge: validationAge,
                                validationStatus: config.validationStatus
                            }
                        });

                        this.setCooldown(`stale_validation_${config.serviceName}`);
                    }
                }

                // Check for invalid configurations
                if (config.isEnabled && config.validationStatus === 'invalid' &&
                    !this.isInCooldown(`invalid_config_${config.serviceName}`)) {

                    await this.createAlert({
                        type: 'configuration_invalid',
                        severity: 'critical',
                        title: `Invalid Configuration for ${config.serviceName}`,
                        description: `${config.serviceName} has invalid configuration and cannot process deliveries`,
                        source: 'service_monitor',
                        affectedServices: [config.serviceName],
                        context: {
                            serviceName: config.serviceName,
                            validationStatus: config.validationStatus,
                            lastError: config.lastError,
                            errorCount: config.errorCount
                        }
                    });

                    this.setCooldown(`invalid_config_${config.serviceName}`);
                }
            }

            // Check for insufficient active services
            if (activeServices < this.alertThresholds.minActiveServices &&
                !this.isInCooldown('insufficient_services')) {

                await this.createAlert({
                    type: 'system_degradation',
                    severity: 'critical',
                    title: 'Insufficient Active Services',
                    description: `Only ${activeServices} service(s) are currently active and healthy`,
                    source: 'system_health',
                    affectedServices: ['all'],
                    context: {
                        activeServices,
                        totalServices: serviceConfigs.length,
                        threshold: this.alertThresholds.minActiveServices
                    }
                });

                this.setCooldown('insufficient_services');
            }

        } catch (error) {
            console.error('Error checking service health:', error);
        }
    }

    /**
     * Create a new alert
     */
    async createAlert(alertData) {
        try {
            // Check if similar alert already exists and is active
            const existingAlert = await Alert.findOne({
                type: alertData.type,
                status: { $in: ['active', 'acknowledged'] },
                affectedServices: { $in: alertData.affectedServices || [] }
            });

            if (existingAlert) {
                // Update existing alert with new context
                existingAlert.context = { ...existingAlert.context, ...alertData.context };
                existingAlert.metrics = alertData.metrics || existingAlert.metrics;
                await existingAlert.save();
                return existingAlert;
            }

            // Create new alert
            const generatedAlertId = `ALT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
            const alert = new Alert({
                ...alertData,
                alertId: generatedAlertId
            });
            await alert.save();

            // Log alert creation
            await logVerificationEvent(null, 'alert', 'created', true, {
                alertId: alert.alertId,
                type: alert.type,
                severity: alert.severity,
                affectedServices: alert.affectedServices
            });

            console.log(`Alert created: ${alert.alertId} - ${alert.title}`);
            return alert;

        } catch (error) {
            console.error('Error creating alert:', error);
            throw error;
        }
    }

    /**
     * Process alert escalations
     */
    async processEscalations() {
        try {
            const escalationCandidates = await Alert.getEscalationCandidates(30); // 30 minutes

            for (const alert of escalationCandidates) {
                await alert.escalate('Automatic escalation due to age');

                await logVerificationEvent(null, 'alert', 'escalated', true, {
                    alertId: alert.alertId,
                    escalationLevel: alert.escalationLevel,
                    reason: 'Automatic escalation due to age'
                });

                console.log(`Alert escalated: ${alert.alertId} to level ${alert.escalationLevel}`);
            }

        } catch (error) {
            console.error('Error processing escalations:', error);
        }
    }

    /**
     * Auto-resolve alerts when conditions improve
     */
    async autoResolveAlerts() {
        try {
            const activeAlerts = await Alert.getActiveAlerts();

            for (const alert of activeAlerts) {
                let shouldResolve = false;
                let resolution = '';

                switch (alert.type) {
                    case 'delivery_failure_rate':
                        const currentMetrics = await deliveryMetricsService.getDeliveryMetrics(1);
                        const currentFailureRate = currentMetrics.delivery.totalAttempts > 0 ?
                            (currentMetrics.delivery.failedAttempts / currentMetrics.delivery.totalAttempts) * 100 : 0;

                        if (currentFailureRate < this.alertThresholds.warningFailureRate) {
                            shouldResolve = true;
                            resolution = `Delivery failure rate improved to ${currentFailureRate.toFixed(1)}%`;
                        }
                        break;

                    case 'no_deliveries':
                        const recentMetrics = await deliveryMetricsService.getDeliveryMetrics(0.5); // Last 30 minutes
                        if (recentMetrics.delivery.successfulAttempts > 0) {
                            shouldResolve = true;
                            resolution = `Successful deliveries resumed: ${recentMetrics.delivery.successfulAttempts} in last 30 minutes`;
                        }
                        break;

                    case 'service_unavailable':
                        if (alert.affectedServices.length > 0) {
                            const serviceName = alert.affectedServices[0];
                            const serviceConfig = await ServiceConfiguration.findOne({ serviceName });

                            if (serviceConfig && serviceConfig.healthStatus === 'healthy' &&
                                serviceConfig.validationStatus === 'valid') {
                                shouldResolve = true;
                                resolution = `${serviceName} service health restored`;
                            }
                        }
                        break;

                    case 'configuration_invalid':
                        if (alert.affectedServices.length > 0) {
                            const serviceName = alert.affectedServices[0];
                            const serviceConfig = await ServiceConfiguration.findOne({ serviceName });

                            if (serviceConfig && serviceConfig.validationStatus === 'valid') {
                                shouldResolve = true;
                                resolution = `${serviceName} configuration validated successfully`;
                            }
                        }
                        break;
                }

                if (shouldResolve) {
                    alert.status = 'resolved';
                    alert.autoResolved = true;
                    alert.resolvedBy = {
                        username: 'system',
                        resolvedAt: new Date(),
                        resolution: resolution,
                        resolutionNotes: 'Automatically resolved when conditions improved'
                    };
                    alert.resolutionTime = Date.now() - alert.createdAt.getTime();
                    await alert.save();

                    await logVerificationEvent(null, 'alert', 'auto_resolved', true, {
                        alertId: alert.alertId,
                        resolution: resolution
                    });

                    console.log(`Alert auto-resolved: ${alert.alertId} - ${resolution}`);
                }
            }

        } catch (error) {
            console.error('Error auto-resolving alerts:', error);
        }
    }

    /**
     * DISABLED: Alert cleanup is disabled for data safety
     */
    async cleanupOldAlerts() {
        console.log('⚠️ Alert cleanup is DISABLED for data safety');
        console.log('Old alerts will be retained to prevent accidental data loss');
        return { deletedCount: 0, message: 'Alert cleanup disabled for data safety' };
    }

    /**
     * Get alert dashboard data
     */
    async getAlertDashboard() {
        try {
            const [activeAlerts, alertMetrics, recentAlerts] = await Promise.all([
                Alert.getActiveAlerts(),
                Alert.getAlertMetrics(24),
                Alert.find({}).sort({ createdAt: -1 }).limit(10)
            ]);

            // Process metrics
            const metricsMap = {};
            alertMetrics.forEach(metric => {
                const key = `${metric._id.severity}_${metric._id.status}`;
                metricsMap[key] = {
                    count: metric.count,
                    avgResolutionTime: metric.avgResolutionTime
                };
            });

            return {
                summary: {
                    totalActive: activeAlerts.length,
                    critical: activeAlerts.filter(a => a.severity === 'critical').length,
                    warning: activeAlerts.filter(a => a.severity === 'warning').length,
                    info: activeAlerts.filter(a => a.severity === 'info').length
                },
                activeAlerts: activeAlerts.slice(0, 20), // Limit to 20 most recent
                metrics: metricsMap,
                recentAlerts,
                generatedAt: new Date()
            };

        } catch (error) {
            console.error('Error getting alert dashboard:', error);
            throw error;
        }
    }

    /**
     * Cooldown management to prevent alert spam
     */
    isInCooldown(alertKey) {
        const cooldownEnd = this.alertCooldowns.get(alertKey);
        if (cooldownEnd && Date.now() < cooldownEnd) {
            return true;
        }
        return false;
    }

    setCooldown(alertKey, minutes = this.defaultCooldownMinutes) {
        const cooldownEnd = Date.now() + (minutes * 60 * 1000);
        this.alertCooldowns.set(alertKey, cooldownEnd);
    }

    /**
     * Manual alert creation for user escalations
     */
    async createUserEscalationAlert(userId, escalationData) {
        try {
            return await this.createAlert({
                type: 'user_escalation',
                severity: escalationData.priority === 'high' ? 'critical' : 'warning',
                title: `User Escalation: ${escalationData.reason}`,
                description: `User ${userId} escalated due to: ${escalationData.reason}`,
                source: 'user_escalation',
                affectedUsers: [userId],
                context: {
                    userId,
                    escalationReason: escalationData.reason,
                    userAnalysis: escalationData.analysisData,
                    escalationTime: new Date()
                }
            });

        } catch (error) {
            console.error('Error creating user escalation alert:', error);
            throw error;
        }
    }
}

// Export singleton instance
export const alertManager = new AlertManager();