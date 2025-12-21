import { DeliveryAttempt } from "../../models/DeliveryAttempt.js";
import { ServiceConfiguration } from "../../models/ServiceConfiguration.js";
import { OTP } from "../../models/OTP.js";

/**
 * Service for collecting and analyzing OTP delivery metrics
 * Provides comprehensive monitoring and alerting capabilities
 */
export class DeliveryMetricsService {
    constructor() {
        this.alertThresholds = {
            failureRate: 50, // Alert if failure rate exceeds 50%
            serviceFailureRate: 75, // Alert if individual service failure rate exceeds 75%
            noDeliveryMinutes: 15, // Alert if no successful deliveries in 15 minutes
            staleValidationMinutes: 30, // Alert if service validation is older than 30 minutes
            highErrorCount: 10 // Alert if service error count exceeds 10
        };
    }

    /**
     * Get comprehensive delivery metrics for a time range
     */
    async getDeliveryMetrics(timeRangeHours = 24) {
        try {
            const [deliveryStats, otpStats, serviceStats, trends] = await Promise.all([
                DeliveryAttempt.getDeliveryStats(timeRangeHours),
                OTP.getDeliveryMetrics(timeRangeHours),
                DeliveryAttempt.getServiceStats(timeRangeHours),
                this.getDeliveryTrends(Math.min(timeRangeHours / 24, 7))
            ]);

            return {
                timeRange: `${timeRangeHours} hours`,
                delivery: deliveryStats,
                otp: otpStats,
                services: serviceStats,
                trends: trends,
                generatedAt: new Date()
            };
        } catch (error) {
            console.error('Error getting delivery metrics:', error);
            throw error;
        }
    }

    /**
     * Get real-time system health status
     */
    async getSystemHealth() {
        try {
            const [serviceHealth, recentAlerts, deliveryHealth] = await Promise.all([
                ServiceConfiguration.getHealthSummary(),
                this.getActiveAlerts(),
                this.getDeliveryHealth()
            ]);

            const overallHealth = this.calculateOverallHealth(serviceHealth, recentAlerts, deliveryHealth);

            return {
                overall: overallHealth,
                services: serviceHealth,
                delivery: deliveryHealth,
                alerts: recentAlerts,
                timestamp: new Date()
            };
        } catch (error) {
            console.error('Error getting system health:', error);
            throw error;
        }
    }

    /**
     * Get active alerts from all monitoring systems
     */
    async getActiveAlerts() {
        try {
            const [deliveryAlerts, configAlerts] = await Promise.all([
                DeliveryAttempt.getAlertConditions(),
                ServiceConfiguration.getConfigurationAlerts()
            ]);

            const allAlerts = [...deliveryAlerts, ...configAlerts];

            // Sort by severity (critical first, then warning)
            allAlerts.sort((a, b) => {
                const severityOrder = { critical: 0, warning: 1, info: 2 };
                return severityOrder[a.severity] - severityOrder[b.severity];
            });

            return allAlerts;
        } catch (error) {
            console.error('Error getting active alerts:', error);
            throw error;
        }
    }

    /**
     * Get delivery trends over time
     */
    async getDeliveryTrends(days = 7) {
        try {
            const trends = await DeliveryAttempt.getDeliveryTrends(days);

            // Process trends to calculate success rates
            const processedTrends = trends.map(trend => {
                const statusMap = {};
                trend.statusCounts.forEach(status => {
                    statusMap[status.status] = status.count;
                });

                const successful = (statusMap.sent || 0) + (statusMap.delivered || 0);
                const failed = statusMap.failed || 0;
                const total = trend.totalAttempts;

                return {
                    date: trend._id.date,
                    service: trend._id.service,
                    total: total,
                    successful: successful,
                    failed: failed,
                    successRate: total > 0 ? (successful / total) * 100 : 0,
                    statusBreakdown: statusMap
                };
            });

            return processedTrends;
        } catch (error) {
            console.error('Error getting delivery trends:', error);
            throw error;
        }
    }

    /**
     * Get failure analysis with categorized errors
     */
    async getFailureAnalysis(timeRangeHours = 24) {
        try {
            const analysis = await DeliveryAttempt.getFailureAnalysis(timeRangeHours);

            // Calculate total failures and percentages
            const totalFailures = analysis.reduce((sum, item) => sum + item.count, 0);

            const processedAnalysis = analysis.map(item => ({
                service: item._id.service,
                errorType: item._id.errorType,
                count: item.count,
                percentage: totalFailures > 0 ? (item.count / totalFailures) * 100 : 0,
                examples: item.examples
            }));

            return {
                totalFailures,
                timeRange: `${timeRangeHours} hours`,
                breakdown: processedAnalysis,
                generatedAt: new Date()
            };
        } catch (error) {
            console.error('Error getting failure analysis:', error);
            throw error;
        }
    }

    /**
     * Get user-specific delivery diagnostics
     */
    async getUserDeliveryDiagnostics(userId, limit = 20) {
        try {
            const [otpHistory, deliveryHistory] = await Promise.all([
                OTP.getUserOTPHistory(userId, limit),
                DeliveryAttempt.getUserDeliveryHistory(userId, limit)
            ]);

            // Calculate user-specific metrics
            const totalOTPs = otpHistory.length;
            const verifiedOTPs = otpHistory.filter(otp => otp.verified).length;
            const failedDeliveries = deliveryHistory.filter(delivery => delivery.status === 'failed').length;

            const userMetrics = {
                totalOTPs,
                verifiedOTPs,
                verificationRate: totalOTPs > 0 ? (verifiedOTPs / totalOTPs) * 100 : 0,
                totalDeliveryAttempts: deliveryHistory.length,
                failedDeliveries,
                deliverySuccessRate: deliveryHistory.length > 0 ?
                    ((deliveryHistory.length - failedDeliveries) / deliveryHistory.length) * 100 : 0
            };

            return {
                userId,
                metrics: userMetrics,
                otpHistory,
                deliveryHistory,
                generatedAt: new Date()
            };
        } catch (error) {
            console.error('Error getting user delivery diagnostics:', error);
            throw error;
        }
    }

    /**
     * Get service performance comparison
     */
    async getServiceComparison(timeRangeHours = 24) {
        try {
            const [serviceStats, serviceMetrics] = await Promise.all([
                DeliveryAttempt.getServiceStats(timeRangeHours),
                ServiceConfiguration.getServiceMetrics()
            ]);

            // Merge delivery stats with service configuration metrics
            const comparison = serviceStats.map(stat => {
                const config = serviceMetrics.find(m => m.serviceName === stat._id);
                return {
                    service: stat._id,
                    deliveryStats: {
                        totalAttempts: stat.totalAttempts,
                        successful: stat.successfulAttempts,
                        failed: stat.failedAttempts,
                        successRate: stat.successRate,
                        averageDeliveryTime: stat.averageDeliveryTime
                    },
                    serviceHealth: config ? {
                        isEnabled: config.isEnabled,
                        healthStatus: config.healthStatus,
                        validationStatus: config.validationStatus,
                        totalRequests: config.metrics?.totalRequests || 0,
                        averageResponseTime: config.metrics?.averageResponseTime || 0,
                        configSuccessRate: config.successRate || 0
                    } : null
                };
            });

            return {
                timeRange: `${timeRangeHours} hours`,
                services: comparison,
                generatedAt: new Date()
            };
        } catch (error) {
            console.error('Error getting service comparison:', error);
            throw error;
        }
    }

    /**
     * Calculate delivery health metrics
     */
    async getDeliveryHealth() {
        try {
            const oneHourStats = await DeliveryAttempt.getDeliveryStats(1);
            const twentyFourHourStats = await DeliveryAttempt.getDeliveryStats(24);

            const recentSuccessRate = oneHourStats.totalAttempts > 0 ?
                ((oneHourStats.successfulAttempts / oneHourStats.totalAttempts) * 100) : 100;

            const dailySuccessRate = twentyFourHourStats.totalAttempts > 0 ?
                ((twentyFourHourStats.successfulAttempts / twentyFourHourStats.totalAttempts) * 100) : 100;

            let healthStatus = 'healthy';
            if (recentSuccessRate < 50) {
                healthStatus = 'critical';
            } else if (recentSuccessRate < 80 || dailySuccessRate < 90) {
                healthStatus = 'degraded';
            }

            return {
                status: healthStatus,
                recentSuccessRate: Math.round(recentSuccessRate * 100) / 100,
                dailySuccessRate: Math.round(dailySuccessRate * 100) / 100,
                recentAttempts: oneHourStats.totalAttempts,
                dailyAttempts: twentyFourHourStats.totalAttempts,
                averageDeliveryTime: oneHourStats.averageDeliveryTime
            };
        } catch (error) {
            console.error('Error calculating delivery health:', error);
            return {
                status: 'unknown',
                recentSuccessRate: 0,
                dailySuccessRate: 0,
                recentAttempts: 0,
                dailyAttempts: 0,
                averageDeliveryTime: 0
            };
        }
    }

    /**
     * Calculate overall system health
     */
    calculateOverallHealth(serviceHealth, alerts, deliveryHealth) {
        const criticalAlerts = alerts.filter(alert => alert.severity === 'critical').length;
        const warningAlerts = alerts.filter(alert => alert.severity === 'warning').length;

        const downServices = serviceHealth.find(h => h._id === 'down')?.count || 0;
        const degradedServices = serviceHealth.find(h => h._id === 'degraded')?.count || 0;

        if (criticalAlerts > 0 || downServices > 0 || deliveryHealth.status === 'critical') {
            return 'critical';
        }

        if (warningAlerts > 2 || degradedServices > 1 || deliveryHealth.status === 'degraded') {
            return 'degraded';
        }

        return 'healthy';
    }

    /**
     * Generate a comprehensive system report
     */
    async generateSystemReport(timeRangeHours = 24) {
        try {
            const [metrics, health, failureAnalysis, serviceComparison] = await Promise.all([
                this.getDeliveryMetrics(timeRangeHours),
                this.getSystemHealth(),
                this.getFailureAnalysis(timeRangeHours),
                this.getServiceComparison(timeRangeHours)
            ]);

            return {
                reportId: `report_${Date.now()}`,
                generatedAt: new Date(),
                timeRange: `${timeRangeHours} hours`,
                summary: {
                    overallHealth: health.overall,
                    totalDeliveries: metrics.delivery.totalAttempts,
                    successRate: metrics.delivery.totalAttempts > 0 ?
                        ((metrics.delivery.successfulAttempts / metrics.delivery.totalAttempts) * 100) : 0,
                    activeAlerts: health.alerts.length,
                    criticalAlerts: health.alerts.filter(a => a.severity === 'critical').length
                },
                metrics,
                health,
                failureAnalysis,
                serviceComparison
            };
        } catch (error) {
            console.error('Error generating system report:', error);
            throw error;
        }
    }
}

// Export singleton instance
export const deliveryMetricsService = new DeliveryMetricsService();