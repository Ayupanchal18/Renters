import { Router } from "express";
import { z } from "zod";
import { Notification } from "../models/Notification.js";
import { NotificationTemplate } from "../models/NotificationTemplate.js";
import { NotificationLog } from "../models/NotificationLog.js";
import { User } from "../models/User.js";
import { connectDB } from "../src/config/db.js";
import { requireAdmin } from "../src/middleware/adminAuth.js";
import { createAuditLog } from "../src/services/adminAuditService.js";

const router = Router();

/**
 * Admin Notification Management Routes
 */

/* ---------------------- VALIDATION SCHEMAS ---------------------- */

const sendNotificationSchema = z.object({
    userIds: z.array(z.string()).min(1, "At least one user ID is required"),
    subject: z.string().min(1, "Subject is required"),
    message: z.string().min(1, "Message is required"),
    channel: z.enum(['email', 'sms', 'push', 'in-app']).default('in-app'),
    templateId: z.string().optional()
});

const broadcastSchema = z.object({
    subject: z.string().min(1, "Subject is required"),
    message: z.string().min(1, "Message is required"),
    channel: z.enum(['email', 'sms', 'push', 'in-app']),
    targetRoles: z.array(z.enum(['user', 'seller', 'admin', 'owner', 'agent'])).optional(),
    templateId: z.string().optional()
});

const templateCreateSchema = z.object({
    name: z.string().min(1, "Name is required"),
    slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
    subject: z.string().min(1, "Subject is required"),
    body: z.string().min(1, "Body is required"),
    channels: z.object({
        email: z.boolean().default(true),
        sms: z.boolean().default(false),
        push: z.boolean().default(false)
    }).optional(),
    variables: z.array(z.object({
        name: z.string(),
        description: z.string().optional(),
        required: z.boolean().default(false),
        defaultValue: z.string().optional()
    })).optional(),
    category: z.enum(['system', 'marketing', 'transactional', 'security', 'custom']).default('custom'),
    isActive: z.boolean().default(true)
});

const templateUpdateSchema = templateCreateSchema.partial();

const logsQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    type: z.enum(['individual', 'broadcast', 'targeted']).optional(),
    channel: z.enum(['email', 'sms', 'push', 'in-app']).optional(),
    status: z.enum(['draft', 'scheduled', 'sending', 'completed', 'failed', 'cancelled']).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    sortBy: z.string().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc')
});


/* ---------------------- HELPER FUNCTIONS ---------------------- */

/**
 * Replace template variables with actual values
 */
const replaceTemplateVariables = (text, variables = {}) => {
    let result = text;
    for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        result = result.replace(regex, value || '');
    }
    return result;
};

/**
 * Send in-app notification to a user
 */
const sendInAppNotification = async (userId, subject, message) => {
    const notification = new Notification({
        recipient: userId,
        type: 'message',
        title: subject,
        message: message,
        read: false
    });
    await notification.save();
    return { success: true, notificationId: notification._id };
};

/* ---------------------- ROUTES ---------------------- */

/**
 * POST /api/admin/notifications/send
 * Send notification to specified users
 */
router.post("/send", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const bodyResult = sendNotificationSchema.safeParse(req.body);
        if (!bodyResult.success) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "Invalid notification data",
                details: bodyResult.error.errors
            });
        }

        const { userIds, subject, message, channel, templateId } = bodyResult.data;

        // Verify users exist
        const users = await User.find({
            _id: { $in: userIds },
            isDeleted: { $ne: true }
        }).select('_id name email phone').lean();

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: "No valid users found"
            });
        }

        // Create notification log
        const notificationLog = new NotificationLog({
            subject,
            message,
            channel,
            type: 'individual',
            templateId: templateId || null,
            targetCriteria: { userIds },
            sentBy: req.user._id,
            totalRecipients: users.length,
            status: 'sending',
            recipients: users.map(u => ({
                userId: u._id,
                email: u.email,
                phone: u.phone,
                status: 'pending'
            }))
        });

        await notificationLog.save();

        // Send notifications based on channel
        let sentCount = 0;
        let failedCount = 0;

        for (let i = 0; i < users.length; i++) {
            const user = users[i];
            let result = { success: false };

            try {
                switch (channel) {
                    case 'in-app':
                        result = await sendInAppNotification(user._id, subject, message);
                        break;
                    case 'email':
                        if (user.email) {
                            // Create in-app notification and log email attempt
                            result = await sendInAppNotification(user._id, subject, message);
                            console.log(`[ADMIN EMAIL] Would send to ${user.email}: ${subject}`);
                        }
                        break;
                    case 'sms':
                        if (user.phone) {
                            // Create in-app notification and log SMS attempt
                            result = await sendInAppNotification(user._id, subject, message);
                            console.log(`[ADMIN SMS] Would send to ${user.phone}: ${message}`);
                        }
                        break;
                    case 'push':
                        // Push notifications would require additional setup
                        result = { success: false, error: 'Push notifications not implemented' };
                        break;
                }

                if (result.success) {
                    sentCount++;
                    notificationLog.recipients[i].status = 'sent';
                    notificationLog.recipients[i].sentAt = new Date();
                } else {
                    failedCount++;
                    notificationLog.recipients[i].status = 'failed';
                    notificationLog.recipients[i].failedAt = new Date();
                    notificationLog.recipients[i].error = result.error || 'Unknown error';
                }
            } catch (error) {
                failedCount++;
                notificationLog.recipients[i].status = 'failed';
                notificationLog.recipients[i].failedAt = new Date();
                notificationLog.recipients[i].error = error.message;
            }
        }

        // Update notification log
        notificationLog.sentCount = sentCount;
        notificationLog.failedCount = failedCount;
        notificationLog.status = failedCount === users.length ? 'failed' : 'completed';
        notificationLog.completedAt = new Date();
        await notificationLog.save();

        // Create audit log
        await createAuditLog({
            adminId: req.user._id,
            action: 'CREATE',
            resourceType: 'notification',
            resourceId: notificationLog._id,
            changes: { type: 'individual', channel, recipientCount: users.length },
            req
        });

        res.status(201).json({
            success: true,
            data: {
                logId: notificationLog._id,
                totalRecipients: users.length,
                sentCount,
                failedCount,
                status: notificationLog.status
            },
            message: `Notification sent to ${sentCount} of ${users.length} users`
        });

    } catch (error) {
        console.error('Error sending notification:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to send notification"
        });
    }
});


/**
 * POST /api/admin/notifications/broadcast
 * Broadcast message to all users or filtered by role
 */
router.post("/broadcast", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const bodyResult = broadcastSchema.safeParse(req.body);
        if (!bodyResult.success) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "Invalid broadcast data",
                details: bodyResult.error.errors
            });
        }

        const { subject, message, channel, targetRoles, templateId } = bodyResult.data;

        // Build user query
        const userQuery = { isDeleted: { $ne: true }, isActive: true };
        if (targetRoles && targetRoles.length > 0) {
            userQuery.role = { $in: targetRoles };
        }

        // Get target users
        const users = await User.find(userQuery)
            .select('_id name email phone')
            .lean();

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: "No users found matching criteria"
            });
        }

        // Create notification log
        const notificationLog = new NotificationLog({
            subject,
            message,
            channel,
            type: 'broadcast',
            templateId: templateId || null,
            targetCriteria: { roles: targetRoles || ['all'] },
            sentBy: req.user._id,
            totalRecipients: users.length,
            status: 'sending',
            recipients: users.map(u => ({
                userId: u._id,
                email: u.email,
                phone: u.phone,
                status: 'pending'
            }))
        });

        await notificationLog.save();

        // Send notifications (in batches for large broadcasts)
        let sentCount = 0;
        let failedCount = 0;
        const batchSize = 50;

        for (let i = 0; i < users.length; i += batchSize) {
            const batch = users.slice(i, i + batchSize);

            await Promise.all(batch.map(async (user, batchIndex) => {
                const index = i + batchIndex;
                let result = { success: false };

                try {
                    switch (channel) {
                        case 'in-app':
                            result = await sendInAppNotification(user._id, subject, message);
                            break;
                        case 'email':
                            if (user.email) {
                                // Create in-app notification and log email attempt
                                result = await sendInAppNotification(user._id, subject, message);
                                console.log(`[ADMIN EMAIL] Would send to ${user.email}: ${subject}`);
                            }
                            break;
                        case 'sms':
                            if (user.phone) {
                                // Create in-app notification and log SMS attempt
                                result = await sendInAppNotification(user._id, subject, message);
                                console.log(`[ADMIN SMS] Would send to ${user.phone}: ${message}`);
                            }
                            break;
                        case 'push':
                            result = { success: false, error: 'Push notifications not implemented' };
                            break;
                    }

                    if (result.success) {
                        sentCount++;
                        notificationLog.recipients[index].status = 'sent';
                        notificationLog.recipients[index].sentAt = new Date();
                    } else {
                        failedCount++;
                        notificationLog.recipients[index].status = 'failed';
                        notificationLog.recipients[index].failedAt = new Date();
                        notificationLog.recipients[index].error = result.error || 'Unknown error';
                    }
                } catch (error) {
                    failedCount++;
                    notificationLog.recipients[index].status = 'failed';
                    notificationLog.recipients[index].failedAt = new Date();
                    notificationLog.recipients[index].error = error.message;
                }
            }));
        }

        // Update notification log
        notificationLog.sentCount = sentCount;
        notificationLog.failedCount = failedCount;
        notificationLog.status = failedCount === users.length ? 'failed' : 'completed';
        notificationLog.completedAt = new Date();
        await notificationLog.save();

        // Create audit log
        await createAuditLog({
            adminId: req.user._id,
            action: 'CREATE',
            resourceType: 'notification',
            resourceId: notificationLog._id,
            changes: { type: 'broadcast', channel, targetRoles, recipientCount: users.length },
            req
        });

        res.status(201).json({
            success: true,
            data: {
                logId: notificationLog._id,
                totalRecipients: users.length,
                sentCount,
                failedCount,
                status: notificationLog.status
            },
            message: `Broadcast sent to ${sentCount} of ${users.length} users`
        });

    } catch (error) {
        console.error('Error broadcasting notification:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to broadcast notification"
        });
    }
});


/* ---------------------- TEMPLATE ROUTES ---------------------- */

/**
 * GET /api/admin/notifications/templates
 * List all notification templates
 */
router.get("/templates", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const { category, isActive, search } = req.query;
        const query = {};

        if (category) {
            query.category = category;
        }

        if (isActive !== undefined) {
            query.isActive = isActive === 'true';
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { subject: { $regex: search, $options: 'i' } }
            ];
        }

        const templates = await NotificationTemplate.find(query)
            .populate('createdBy', 'name email')
            .populate('updatedBy', 'name email')
            .sort({ category: 1, name: 1 })
            .lean();

        res.json({
            success: true,
            data: { templates }
        });

    } catch (error) {
        console.error('Error listing templates:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to retrieve templates"
        });
    }
});

/**
 * POST /api/admin/notifications/templates
 * Create a new notification template
 */
router.post("/templates", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const bodyResult = templateCreateSchema.safeParse(req.body);
        if (!bodyResult.success) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "Invalid template data",
                details: bodyResult.error.errors
            });
        }

        // Check for duplicate slug
        const existing = await NotificationTemplate.findOne({ slug: bodyResult.data.slug });
        if (existing) {
            return res.status(409).json({
                success: false,
                error: "CONFLICT",
                message: "A template with this slug already exists"
            });
        }

        const template = new NotificationTemplate({
            ...bodyResult.data,
            createdBy: req.user._id,
            updatedBy: req.user._id
        });

        await template.save();

        // Create audit log
        await createAuditLog({
            adminId: req.user._id,
            action: 'CREATE',
            resourceType: 'notification',
            resourceId: template._id,
            changes: { templateName: template.name, category: template.category },
            req
        });

        res.status(201).json({
            success: true,
            data: template.toObject(),
            message: "Template created successfully"
        });

    } catch (error) {
        console.error('Error creating template:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to create template"
        });
    }
});

/**
 * GET /api/admin/notifications/templates/:id
 * Get a specific template
 */
router.get("/templates/:id", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const template = await NotificationTemplate.findById(req.params.id)
            .populate('createdBy', 'name email')
            .populate('updatedBy', 'name email')
            .lean();

        if (!template) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: "Template not found"
            });
        }

        res.json({ success: true, data: template });

    } catch (error) {
        console.error('Error getting template:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to retrieve template"
        });
    }
});

/**
 * PUT /api/admin/notifications/templates/:id
 * Update a notification template
 */
router.put("/templates/:id", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const bodyResult = templateUpdateSchema.safeParse(req.body);
        if (!bodyResult.success) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "Invalid template data",
                details: bodyResult.error.errors
            });
        }

        const currentTemplate = await NotificationTemplate.findById(req.params.id).lean();
        if (!currentTemplate) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: "Template not found"
            });
        }

        // Check slug uniqueness if being changed
        if (bodyResult.data.slug && bodyResult.data.slug !== currentTemplate.slug) {
            const existing = await NotificationTemplate.findOne({
                slug: bodyResult.data.slug,
                _id: { $ne: req.params.id }
            });
            if (existing) {
                return res.status(409).json({
                    success: false,
                    error: "CONFLICT",
                    message: "A template with this slug already exists"
                });
            }
        }

        const updatedTemplate = await NotificationTemplate.findByIdAndUpdate(
            req.params.id,
            { ...bodyResult.data, updatedBy: req.user._id },
            { new: true }
        ).lean();

        // Create audit log
        await createAuditLog({
            adminId: req.user._id,
            action: 'UPDATE',
            resourceType: 'notification',
            resourceId: req.params.id,
            changes: bodyResult.data,
            previousValues: { name: currentTemplate.name, slug: currentTemplate.slug },
            req
        });

        res.json({
            success: true,
            data: updatedTemplate,
            message: "Template updated successfully"
        });

    } catch (error) {
        console.error('Error updating template:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to update template"
        });
    }
});

/**
 * DELETE /api/admin/notifications/templates/:id
 * Delete a notification template
 */
router.delete("/templates/:id", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const template = await NotificationTemplate.findById(req.params.id).lean();
        if (!template) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: "Template not found"
            });
        }

        // DISABLED: Notification template deletion is disabled for data safety
        console.error('❌ Notification template deletion is DISABLED for data safety');
        return res.status(403).json({
            success: false,
            error: "OPERATION_DISABLED",
            message: "Notification template deletion is disabled to prevent accidental data loss"
        });

        // Create audit log
        await createAuditLog({
            adminId: req.user._id,
            action: 'DELETE',
            resourceType: 'notification',
            resourceId: req.params.id,
            previousValues: { name: template.name, slug: template.slug },
            req
        });

        res.json({ success: true, message: "Template deleted successfully" });

    } catch (error) {
        console.error('Error deleting template:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to delete template"
        });
    }
});


/* ---------------------- DELIVERY LOGS ROUTES ---------------------- */

/**
 * GET /api/admin/notifications/logs
 * View delivery logs with message status and timestamps
 */
router.get("/logs", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const queryResult = logsQuerySchema.safeParse(req.query);
        if (!queryResult.success) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "Invalid query parameters",
                details: queryResult.error.errors
            });
        }

        const { page, limit, type, channel, status, startDate, endDate, sortBy, sortOrder } = queryResult.data;

        // Build query
        const query = {};

        if (type) {
            query.type = type;
        }

        if (channel) {
            query.channel = channel;
        }

        if (status) {
            query.status = status;
        }

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) {
                query.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.createdAt.$lte = end;
            }
        }

        const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
        const skip = (page - 1) * limit;

        const [logs, total] = await Promise.all([
            NotificationLog.find(query)
                .populate('sentBy', 'name email')
                .populate('templateId', 'name slug')
                .select('-recipients') // Exclude recipients array for list view
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean(),
            NotificationLog.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: {
                logs,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        console.error('Error listing notification logs:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to retrieve notification logs"
        });
    }
});

/**
 * GET /api/admin/notifications/logs/:id
 * Get detailed notification log with recipients
 */
router.get("/logs/:id", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const log = await NotificationLog.findById(req.params.id)
            .populate('sentBy', 'name email')
            .populate('templateId', 'name slug')
            .populate('recipients.userId', 'name email phone')
            .lean();

        if (!log) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: "Notification log not found"
            });
        }

        res.json({ success: true, data: log });

    } catch (error) {
        console.error('Error getting notification log:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to retrieve notification log"
        });
    }
});

/**
 * GET /api/admin/notifications/stats
 * Get notification statistics
 */
router.get("/stats", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const { days = 30 } = req.query;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days, 10));

        const stats = await NotificationLog.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: null,
                    totalNotifications: { $sum: 1 },
                    totalRecipients: { $sum: '$totalRecipients' },
                    totalSent: { $sum: '$sentCount' },
                    totalFailed: { $sum: '$failedCount' },
                    byChannel: {
                        $push: {
                            channel: '$channel',
                            count: 1
                        }
                    },
                    byType: {
                        $push: {
                            type: '$type',
                            count: 1
                        }
                    }
                }
            }
        ]);

        // Get channel breakdown
        const channelStats = await NotificationLog.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            { $group: { _id: '$channel', count: { $sum: 1 }, sent: { $sum: '$sentCount' } } }
        ]);

        // Get type breakdown
        const typeStats = await NotificationLog.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            { $group: { _id: '$type', count: { $sum: 1 }, sent: { $sum: '$sentCount' } } }
        ]);

        res.json({
            success: true,
            data: {
                summary: stats[0] || {
                    totalNotifications: 0,
                    totalRecipients: 0,
                    totalSent: 0,
                    totalFailed: 0
                },
                byChannel: channelStats.reduce((acc, item) => {
                    acc[item._id] = { count: item.count, sent: item.sent };
                    return acc;
                }, {}),
                byType: typeStats.reduce((acc, item) => {
                    acc[item._id] = { count: item.count, sent: item.sent };
                    return acc;
                }, {}),
                period: { days: parseInt(days, 10), startDate }
            }
        });

    } catch (error) {
        console.error('Error getting notification stats:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to retrieve notification statistics"
        });
    }
});

export default router;
