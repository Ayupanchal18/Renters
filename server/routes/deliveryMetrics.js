import express from "express";
import { deliveryMetricsService } from "../src/services/deliveryMetricsService.js";
import { DeliveryAttempt } from "../models/DeliveryAttempt.js";
import { ServiceConfiguration } from "../models/ServiceConfiguration.js";
import { OTP } from "../models/OTP.js";

const router = express.Router();

/**
 * Get comprehensive delivery metrics
 * GET /api/delivery-metrics?timeRange=24
 */
router.get("/", async (req, res) => {
    try {
        const timeRange = parseInt(req.query.timeRange) || 24;

        if (timeRange < 1 || timeRange > 168) { // Max 1 week
            return res.status(400).json({
                error: "Time range must be between 1 and 168 hours"
            });
        }

        const metrics = await deliveryMetricsService.getDeliveryMetrics(timeRange);
        res.json(metrics);
    } catch (error) {
        console.error("Error getting delivery metrics:", error);
        res.status(500).json({
            error: "Failed to retrieve delivery metrics",
            message: error.message
        });
    }
});

/**
 * Get system health status
 * GET /api/delivery-metrics/health
 */
router.get("/health", async (req, res) => {
    try {
        const health = await deliveryMetricsService.getSystemHealth();
        res.json(health);
    } catch (error) {
        console.error("Error getting system health:", error);
        res.status(500).json({
            error: "Failed to retrieve system health",
            message: error.message
        });
    }
});

/**
 * Get active alerts
 * GET /api/delivery-metrics/alerts
 */
router.get("/alerts", async (req, res) => {
    try {
        const alerts = await deliveryMetricsService.getActiveAlerts();
        res.json({
            alerts,
            count: alerts.length,
            critical: alerts.filter(a => a.severity === 'critical').length,
            warning: alerts.filter(a => a.severity === 'warning').length,
            generatedAt: new Date()
        });
    } catch (error) {
        console.error("Error getting alerts:", error);
        res.status(500).json({
            error: "Failed to retrieve alerts",
            message: error.message
        });
    }
});

/**
 * Get delivery trends
 * GET /api/delivery-metrics/trends?days=7
 */
router.get("/trends", async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 7;

        if (days < 1 || days > 30) {
            return res.status(400).json({
                error: "Days must be between 1 and 30"
            });
        }

        const trends = await deliveryMetricsService.getDeliveryTrends(days);
        res.json({
            trends,
            period: `${days} days`,
            generatedAt: new Date()
        });
    } catch (error) {
        console.error("Error getting delivery trends:", error);
        res.status(500).json({
            error: "Failed to retrieve delivery trends",
            message: error.message
        });
    }
});

/**
 * Get failure analysis
 * GET /api/delivery-metrics/failures?timeRange=24
 */
router.get("/failures", async (req, res) => {
    try {
        const timeRange = parseInt(req.query.timeRange) || 24;

        if (timeRange < 1 || timeRange > 168) {
            return res.status(400).json({
                error: "Time range must be between 1 and 168 hours"
            });
        }

        const analysis = await deliveryMetricsService.getFailureAnalysis(timeRange);
        res.json(analysis);
    } catch (error) {
        console.error("Error getting failure analysis:", error);
        res.status(500).json({
            error: "Failed to retrieve failure analysis",
            message: error.message
        });
    }
});

/**
 * Get service comparison
 * GET /api/delivery-metrics/services?timeRange=24
 */
router.get("/services", async (req, res) => {
    try {
        const timeRange = parseInt(req.query.timeRange) || 24;

        if (timeRange < 1 || timeRange > 168) {
            return res.status(400).json({
                error: "Time range must be between 1 and 168 hours"
            });
        }

        const comparison = await deliveryMetricsService.getServiceComparison(timeRange);
        res.json(comparison);
    } catch (error) {
        console.error("Error getting service comparison:", error);
        res.status(500).json({
            error: "Failed to retrieve service comparison",
            message: error.message
        });
    }
});

/**
 * Get user delivery diagnostics
 * GET /api/delivery-metrics/user/:userId?limit=20
 */
router.get("/user/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const limit = parseInt(req.query.limit) || 20;

        if (limit < 1 || limit > 100) {
            return res.status(400).json({
                error: "Limit must be between 1 and 100"
            });
        }

        const diagnostics = await deliveryMetricsService.getUserDeliveryDiagnostics(userId, limit);
        res.json(diagnostics);
    } catch (error) {
        console.error("Error getting user diagnostics:", error);
        res.status(500).json({
            error: "Failed to retrieve user diagnostics",
            message: error.message
        });
    }
});

/**
 * Generate comprehensive system report
 * GET /api/delivery-metrics/report?timeRange=24
 */
router.get("/report", async (req, res) => {
    try {
        const timeRange = parseInt(req.query.timeRange) || 24;

        if (timeRange < 1 || timeRange > 168) {
            return res.status(400).json({
                error: "Time range must be between 1 and 168 hours"
            });
        }

        const report = await deliveryMetricsService.generateSystemReport(timeRange);
        res.json(report);
    } catch (error) {
        console.error("Error generating system report:", error);
        res.status(500).json({
            error: "Failed to generate system report",
            message: error.message
        });
    }
});

/**
 * Get delivery history for a specific delivery ID
 * GET /api/delivery-metrics/delivery/:deliveryId
 */
router.get("/delivery/:deliveryId", async (req, res) => {
    try {
        const { deliveryId } = req.params;

        const [otp, deliveryAttempts] = await Promise.all([
            OTP.findOne({ deliveryId }).lean(),
            DeliveryAttempt.find({ deliveryId }).sort({ createdAt: 1 }).lean()
        ]);

        if (!otp) {
            return res.status(404).json({
                error: "Delivery not found"
            });
        }

        res.json({
            deliveryId,
            otp,
            attempts: deliveryAttempts,
            totalAttempts: deliveryAttempts.length,
            lastAttempt: deliveryAttempts[deliveryAttempts.length - 1],
            generatedAt: new Date()
        });
    } catch (error) {
        console.error("Error getting delivery history:", error);
        res.status(500).json({
            error: "Failed to retrieve delivery history",
            message: error.message
        });
    }
});

/**
 * Get real-time delivery statistics (lightweight endpoint for dashboards)
 * GET /api/delivery-metrics/stats
 */
router.get("/stats", async (req, res) => {
    try {
        const [hourlyStats, dailyStats, serviceHealth] = await Promise.all([
            DeliveryAttempt.getDeliveryStats(1),
            DeliveryAttempt.getDeliveryStats(24),
            ServiceConfiguration.getHealthSummary()
        ]);

        const stats = {
            hourly: {
                attempts: hourlyStats.totalAttempts,
                successful: hourlyStats.successfulAttempts,
                failed: hourlyStats.failedAttempts,
                successRate: hourlyStats.totalAttempts > 0 ?
                    ((hourlyStats.successfulAttempts / hourlyStats.totalAttempts) * 100) : 0,
                avgDeliveryTime: hourlyStats.averageDeliveryTime
            },
            daily: {
                attempts: dailyStats.totalAttempts,
                successful: dailyStats.successfulAttempts,
                failed: dailyStats.failedAttempts,
                successRate: dailyStats.totalAttempts > 0 ?
                    ((dailyStats.successfulAttempts / dailyStats.totalAttempts) * 100) : 0,
                avgDeliveryTime: dailyStats.averageDeliveryTime
            },
            services: {
                healthy: serviceHealth.find(s => s._id === 'healthy')?.count || 0,
                degraded: serviceHealth.find(s => s._id === 'degraded')?.count || 0,
                down: serviceHealth.find(s => s._id === 'down')?.count || 0,
                unknown: serviceHealth.find(s => s._id === 'unknown')?.count || 0
            },
            timestamp: new Date()
        };

        res.json(stats);
    } catch (error) {
        console.error("Error getting delivery stats:", error);
        res.status(500).json({
            error: "Failed to retrieve delivery stats",
            message: error.message
        });
    }
});

export default router;