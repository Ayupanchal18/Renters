import express from 'express';
import { Alert } from '../models/Alert.js';
import { alertManager } from '../src/services/alertManager.js';
import { adminNotificationService } from '../src/services/adminNotificationService.js';
import { deliveryMetricsService } from '../src/services/deliveryMetricsService.js';

const router = express.Router();

/**
 * Get alert dashboard data
 * GET /api/alerts/dashboard
 */
router.get('/dashboard', async (req, res) => {
    try {
        const dashboard = await alertManager.getAlertDashboard();
        res.json({
            success: true,
            data: dashboard
        });
    } catch (error) {
        console.error('Error getting alert dashboard:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get alert dashboard'
        });
    }
});

/**
 * Get active alerts
 * GET /api/alerts/active
 */
router.get('/active', async (req, res) => {
    try {
        const { severity } = req.query;
        const alerts = await Alert.getActiveAlerts(severity);

        res.json({
            success: true,
            data: alerts
        });
    } catch (error) {
        console.error('Error getting active alerts:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get active alerts'
        });
    }
});

/**
 * Get alert by ID
 * GET /api/alerts/:alertId
 */
router.get('/:alertId', async (req, res) => {
    try {
        const { alertId } = req.params;
        const alert = await Alert.findOne({ alertId });

        if (!alert) {
            return res.status(404).json({
                success: false,
                error: 'Alert not found'
            });
        }

        res.json({
            success: true,
            data: alert
        });
    } catch (error) {
        console.error('Error getting alert:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get alert'
        });
    }
});

/**
 * Acknowledge an alert
 * POST /api/alerts/:alertId/acknowledge
 */
router.post('/:alertId/acknowledge', async (req, res) => {
    try {
        const { alertId } = req.params;
        const { userId, username, notes } = req.body;

        if (!userId || !username) {
            return res.status(400).json({
                success: false,
                error: 'userId and username are required'
            });
        }

        const alert = await Alert.findOne({ alertId });
        if (!alert) {
            return res.status(404).json({
                success: false,
                error: 'Alert not found'
            });
        }

        if (alert.status !== 'active') {
            return res.status(400).json({
                success: false,
                error: 'Alert is not in active state'
            });
        }

        await alert.acknowledge(userId, username, notes);

        res.json({
            success: true,
            data: alert
        });
    } catch (error) {
        console.error('Error acknowledging alert:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to acknowledge alert'
        });
    }
});

/**
 * Resolve an alert
 * POST /api/alerts/:alertId/resolve
 */
router.post('/:alertId/resolve', async (req, res) => {
    try {
        const { alertId } = req.params;
        const { userId, username, resolution, notes } = req.body;

        if (!userId || !username || !resolution) {
            return res.status(400).json({
                success: false,
                error: 'userId, username, and resolution are required'
            });
        }

        const alert = await Alert.findOne({ alertId });
        if (!alert) {
            return res.status(404).json({
                success: false,
                error: 'Alert not found'
            });
        }

        if (alert.status === 'resolved') {
            return res.status(400).json({
                success: false,
                error: 'Alert is already resolved'
            });
        }

        await alert.resolve(userId, username, resolution, notes);

        res.json({
            success: true,
            data: alert
        });
    } catch (error) {
        console.error('Error resolving alert:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to resolve alert'
        });
    }
});

/**
 * Escalate an alert
 * POST /api/alerts/:alertId/escalate
 */
router.post('/:alertId/escalate', async (req, res) => {
    try {
        const { alertId } = req.params;
        const { reason } = req.body;

        const alert = await Alert.findOne({ alertId });
        if (!alert) {
            return res.status(404).json({
                success: false,
                error: 'Alert not found'
            });
        }

        if (alert.escalationLevel >= 3) {
            return res.status(400).json({
                success: false,
                error: 'Alert is already at maximum escalation level'
            });
        }

        await alert.escalate(reason);

        // Send escalation notification
        await adminNotificationService.sendAlertNotification(alert);

        res.json({
            success: true,
            data: alert
        });
    } catch (error) {
        console.error('Error escalating alert:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to escalate alert'
        });
    }
});

/**
 * Suppress an alert
 * POST /api/alerts/:alertId/suppress
 */
router.post('/:alertId/suppress', async (req, res) => {
    try {
        const { alertId } = req.params;
        const { durationMinutes = 60, reason } = req.body;

        const alert = await Alert.findOne({ alertId });
        if (!alert) {
            return res.status(404).json({
                success: false,
                error: 'Alert not found'
            });
        }

        await alert.suppress(durationMinutes, reason);

        res.json({
            success: true,
            data: alert
        });
    } catch (error) {
        console.error('Error suppressing alert:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to suppress alert'
        });
    }
});

/**
 * Get alert metrics
 * GET /api/alerts/metrics
 */
router.get('/metrics/summary', async (req, res) => {
    try {
        const { timeRangeHours = 24 } = req.query;
        const metrics = await Alert.getAlertMetrics(parseInt(timeRangeHours));

        res.json({
            success: true,
            data: {
                timeRange: `${timeRangeHours} hours`,
                metrics: metrics
            }
        });
    } catch (error) {
        console.error('Error getting alert metrics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get alert metrics'
        });
    }
});

/**
 * Get alerts by type
 * GET /api/alerts/type/:type
 */
router.get('/type/:type', async (req, res) => {
    try {
        const { type } = req.params;
        const { timeRangeHours = 24 } = req.query;

        const alerts = await Alert.getAlertsByType(type, parseInt(timeRangeHours));

        res.json({
            success: true,
            data: alerts
        });
    } catch (error) {
        console.error('Error getting alerts by type:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get alerts by type'
        });
    }
});

/**
 * Get notification statistics
 * GET /api/alerts/notifications/stats
 */
router.get('/notifications/stats', async (req, res) => {
    try {
        const { timeRangeHours = 24 } = req.query;
        const stats = await adminNotificationService.getNotificationStats(parseInt(timeRangeHours));

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error getting notification stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get notification stats'
        });
    }
});

/**
 * Test alert notification
 * POST /api/alerts/test-notification
 */
router.post('/test-notification', async (req, res) => {
    try {
        const { severity = 'info', title = 'Test Alert', description = 'This is a test alert notification' } = req.body;

        const testAlert = {
            alertId: `TEST-${Date.now()}`,
            type: 'system_degradation',
            severity,
            title,
            description,
            source: 'manual_test',
            affectedServices: ['test'],
            context: { testMode: true },
            createdAt: new Date(),
            escalationLevel: 1,
            addNotification: async () => { } // Mock method
        };

        await adminNotificationService.sendAlertNotification(testAlert);

        res.json({
            success: true,
            message: 'Test notification sent successfully'
        });
    } catch (error) {
        console.error('Error sending test notification:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send test notification'
        });
    }
});

/**
 * Create manual alert
 * POST /api/alerts/manual
 */
router.post('/manual', async (req, res) => {
    try {
        const {
            type,
            severity,
            title,
            description,
            affectedServices = [],
            context = {}
        } = req.body;

        if (!type || !severity || !title || !description) {
            return res.status(400).json({
                success: false,
                error: 'type, severity, title, and description are required'
            });
        }

        const alert = await alertManager.createAlert({
            type,
            severity,
            title,
            description,
            source: 'manual',
            affectedServices,
            context: { ...context, manuallyCreated: true }
        });

        // Send notification for manual alerts
        await adminNotificationService.sendAlertNotification(alert);

        res.json({
            success: true,
            data: alert
        });
    } catch (error) {
        console.error('Error creating manual alert:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create manual alert'
        });
    }
});

/**
 * Force alert check (for testing)
 * POST /api/alerts/force-check
 */
router.post('/force-check', async (req, res) => {
    try {
        // Trigger manual alert checks
        await alertManager.checkDeliveryMetrics();
        await alertManager.checkServiceHealth();
        await alertManager.autoResolveAlerts();

        res.json({
            success: true,
            message: 'Alert checks completed'
        });
    } catch (error) {
        console.error('Error forcing alert check:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to force alert check'
        });
    }
});

export default router;