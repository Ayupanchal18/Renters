import { Router } from "express";
import { z } from "zod";
import { NotificationPreferences } from "../models/NotificationPreferences.js";
import { NotificationDelivery } from "../models/NotificationDelivery.js";
import notificationService from "../src/services/notificationService.js";
import messageNotificationService from "../src/services/messageNotificationService.js";
import { connectDB } from "../src/config/db.js";
import {
    authenticateToken,
    validateInput,
    errorHandler,
    sendSuccess
} from "../src/middleware/security.js";

const router = Router();

// =====================================================
// VALIDATION SCHEMAS FOR NOTIFICATIONS
// =====================================================

const notificationsPaginationSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    unreadOnly: z.enum(['true', 'false']).optional().transform(val => val === 'true')
});

// =====================================================
// NOTIFICATION LIST AND COUNT ROUTES
// =====================================================

/**
 * GET /
 * Get user's notifications with pagination
 * Supports unreadOnly query param to filter for unread notifications
 */
router.get("/",
    authenticateToken,
    validateInput({ query: notificationsPaginationSchema }),
    async (req, res) => {
        try {
            await connectDB();

            const userId = req.user._id.toString();
            const { page, limit, unreadOnly } = req.query;

            const result = await messageNotificationService.getUserNotifications(
                userId,
                page || 1,
                limit || 20,
                unreadOnly || false
            );

            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    error: result.code,
                    message: result.error
                });
            }

            sendSuccess(res, {
                notifications: result.notifications,
                pagination: result.pagination
            }, "Notifications retrieved successfully");
        } catch (error) {
            console.error('Get notifications error:', error);
            res.status(500).json({
                success: false,
                error: "INTERNAL_ERROR",
                message: "Failed to retrieve notifications"
            });
        }
    }
);

/**
 * GET /unread-count
 * Get the count of unread notifications for the authenticated user
 */
router.get("/unread-count",
    authenticateToken,
    async (req, res) => {
        try {
            await connectDB();

            const userId = req.user._id.toString();

            const result = await messageNotificationService.getUnreadNotificationCount(userId);

            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    error: result.code,
                    message: result.error
                });
            }

            sendSuccess(res, {
                count: result.count
            }, "Unread notification count retrieved successfully");
        } catch (error) {
            console.error('Get unread notification count error:', error);
            res.status(500).json({
                success: false,
                error: "INTERNAL_ERROR",
                message: "Failed to retrieve unread notification count"
            });
        }
    }
);

/**
 * POST /:id/read
 * Mark a single notification as read
 */
router.post("/:id/read",
    authenticateToken,
    async (req, res) => {
        try {
            await connectDB();

            const notificationId = req.params.id;
            const userId = req.user._id.toString();

            // Validate notification ID format
            if (!/^[0-9a-fA-F]{24}$/.test(notificationId)) {
                return res.status(400).json({
                    success: false,
                    error: "INVALID_ID",
                    message: "Invalid notification ID format"
                });
            }

            const result = await messageNotificationService.markNotificationAsRead(
                notificationId,
                userId
            );

            if (!result.success) {
                const statusCode = result.code === 'NOTIFICATION_NOT_FOUND' ? 404 : 500;
                return res.status(statusCode).json({
                    success: false,
                    error: result.code,
                    message: result.error
                });
            }

            sendSuccess(res, {
                notification: result.notification,
                alreadyRead: result.alreadyRead || false
            }, result.alreadyRead ? "Notification was already read" : "Notification marked as read");
        } catch (error) {
            console.error('Mark notification as read error:', error);
            res.status(500).json({
                success: false,
                error: "INTERNAL_ERROR",
                message: "Failed to mark notification as read"
            });
        }
    }
);

/**
 * POST /read-all
 * Mark all notifications as read for the authenticated user
 */
router.post("/read-all",
    authenticateToken,
    async (req, res) => {
        try {
            await connectDB();

            const userId = req.user._id.toString();

            const result = await messageNotificationService.markAllAsRead(userId);

            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    error: result.code,
                    message: result.error
                });
            }

            sendSuccess(res, {
                modifiedCount: result.modifiedCount
            }, `${result.modifiedCount} notification(s) marked as read`);
        } catch (error) {
            console.error('Mark all notifications as read error:', error);
            res.status(500).json({
                success: false,
                error: "INTERNAL_ERROR",
                message: "Failed to mark all notifications as read"
            });
        }
    }
);

// Validation schemas
const updatePreferencesSchema = z.object({
    securityEvents: z.object({
        passwordChange: z.object({
            email: z.boolean().optional(),
            sms: z.boolean().optional(),
        }).optional(),
        phoneUpdate: z.object({
            email: z.boolean().optional(),
            sms: z.boolean().optional(),
        }).optional(),
        accountDeletion: z.object({
            email: z.boolean().optional(),
            sms: z.boolean().optional(),
        }).optional(),
        loginFromNewDevice: z.object({
            email: z.boolean().optional(),
            sms: z.boolean().optional(),
        }).optional(),
        failedLoginAttempts: z.object({
            email: z.boolean().optional(),
            sms: z.boolean().optional(),
        }).optional(),
    }).optional(),
    general: z.object({
        propertyUpdates: z.object({
            email: z.boolean().optional(),
            sms: z.boolean().optional(),
        }).optional(),
        messages: z.object({
            email: z.boolean().optional(),
            sms: z.boolean().optional(),
        }).optional(),
        marketing: z.object({
            email: z.boolean().optional(),
            sms: z.boolean().optional(),
        }).optional(),
    }).optional(),
    globalSettings: z.object({
        emailEnabled: z.boolean().optional(),
        smsEnabled: z.boolean().optional(),
        quietHours: z.object({
            enabled: z.boolean().optional(),
            startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
            endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
            timezone: z.string().optional(),
        }).optional(),
    }).optional(),
});

const testNotificationSchema = z.object({
    type: z.enum(['password_change', 'phone_update', 'account_deletion', 'login_new_device', 'failed_login_attempts']),
    context: z.object({}).optional()
});

// Get user notification preferences
router.get("/preferences", authenticateToken, async (req, res) => {
    try {
        await connectDB();

        const preferences = await notificationService.getUserPreferences(req.user._id);

        sendSuccess(res, preferences, "Notification preferences retrieved successfully");
    } catch (error) {
        console.error('Get notification preferences error:', error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
            message: "Failed to retrieve notification preferences"
        });
    }
});

// Update user notification preferences
router.patch("/preferences",
    authenticateToken,
    validateInput({ body: updatePreferencesSchema }),
    async (req, res) => {
        try {
            await connectDB();

            const updatedPreferences = await notificationService.updateUserPreferences(
                req.user._id,
                req.body
            );

            sendSuccess(res, updatedPreferences, "Notification preferences updated successfully");
        } catch (error) {
            console.error('Update notification preferences error:', error);
            res.status(500).json({
                success: false,
                error: "Internal server error",
                message: "Failed to update notification preferences"
            });
        }
    }
);

// Get notification delivery history
router.get("/delivery-history", authenticateToken, async (req, res) => {
    try {
        await connectDB();

        const { page = 1, limit = 20, type, status, method } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Build query
        const query = { userId: req.user._id };
        if (type) query.type = type;
        if (status) query.status = status;
        if (method) query.deliveryMethod = method;

        const [deliveries, total] = await Promise.all([
            NotificationDelivery.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            NotificationDelivery.countDocuments(query)
        ]);

        sendSuccess(res, {
            deliveries,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        }, "Delivery history retrieved successfully");
    } catch (error) {
        console.error('Get delivery history error:', error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
            message: "Failed to retrieve delivery history"
        });
    }
});

// Get notification delivery statistics
router.get("/delivery-stats", authenticateToken, async (req, res) => {
    try {
        await connectDB();

        const { days = 30 } = req.query;
        const stats = await notificationService.getDeliveryStats(req.user._id, parseInt(days));

        sendSuccess(res, { stats, period: `${days} days` }, "Delivery statistics retrieved successfully");
    } catch (error) {
        console.error('Get delivery stats error:', error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
            message: "Failed to retrieve delivery statistics"
        });
    }
});

// Test notification (for development/testing purposes)
router.post("/test",
    authenticateToken,
    validateInput({ body: testNotificationSchema }),
    async (req, res) => {
        try {
            await connectDB();

            const { type, context = {} } = req.body;

            // Add test context to distinguish from real notifications
            const testContext = {
                ...context,
                isTest: true,
                timestamp: new Date().toISOString()
            };

            const result = await notificationService.sendSecurityEventNotification(
                req.user._id,
                type,
                testContext
            );

            if (result.success) {
                sendSuccess(res, result, "Test notification sent successfully");
            } else {
                res.status(400).json({
                    success: false,
                    error: result.error || "Failed to send test notification",
                    message: "Test notification failed"
                });
            }
        } catch (error) {
            console.error('Test notification error:', error);
            res.status(500).json({
                success: false,
                error: "Internal server error",
                message: "Failed to send test notification"
            });
        }
    }
);

// Get notification service status
router.get("/service-status", authenticateToken, async (req, res) => {
    try {
        const status = notificationService.getServiceStatus();
        sendSuccess(res, status, "Service status retrieved successfully");
    } catch (error) {
        console.error('Get service status error:', error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
            message: "Failed to retrieve service status"
        });
    }
});

// Reset preferences to default
router.post("/preferences/reset", authenticateToken, async (req, res) => {
    try {
        await connectDB();

        // DISABLED: Deletion operations are disabled for data safety
        console.error('❌ Notification preferences reset is DISABLED for data safety');
        return res.status(403).json({
            success: false,
            error: "OPERATION_DISABLED",
            message: "Notification preferences reset is disabled to prevent accidental data loss. Please update preferences manually instead."
        });

        // Create new default preferences
        const defaultPreferences = await NotificationPreferences.createDefault(req.user._id);

        sendSuccess(res, defaultPreferences, "Notification preferences reset to default");
    } catch (error) {
        console.error('Reset preferences error:', error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
            message: "Failed to reset notification preferences"
        });
    }
});

export default router;