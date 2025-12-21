import { Router } from "express";
import { z } from "zod";
import { connectDB } from "../src/config/db.js";
import {
    getUserAuditTrail,
    getSecurityStatistics,
    checkSuspiciousActivity,
    cleanupOldAuditLogs
} from "../src/utils/auditUtils.js";

const router = Router();

// Validation schemas
const auditQuerySchema = z.object({
    limit: z.coerce.number().min(1).max(100).default(50),
    skip: z.coerce.number().min(0).default(0),
    action: z.string().optional(),
    success: z.coerce.boolean().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional()
});

const statsQuerySchema = z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional()
});

const suspiciousActivitySchema = z.object({
    timeWindow: z.coerce.number().min(60000).max(24 * 60 * 60 * 1000).default(60 * 60 * 1000), // 1 hour default
    failureThreshold: z.coerce.number().min(1).max(20).default(5)
});

const cleanupSchema = z.object({
    retentionDays: z.coerce.number().min(30).max(2555).default(365) // 30 days to 7 years
});

// Middleware to check if user is admin (simplified for development)
const requireAdmin = (req, res, next) => {
    const userRole = req.headers["x-user-role"];
    if (userRole !== 'admin') {
        return res.status(403).json({
            success: false,
            error: "Forbidden",
            message: "Admin access required"
        });
    }
    next();
};

// Get user's own audit trail
router.get("/my-logs", async (req, res) => {
    try {
        await connectDB();

        const userId = req.headers["x-user-id"];
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: "Unauthorized",
                message: "Authentication required"
            });
        }

        const query = auditQuerySchema.parse(req.query);

        const auditLogs = await getUserAuditTrail(userId, {
            limit: query.limit,
            skip: query.skip,
            action: query.action,
            success: query.success,
            startDate: query.startDate,
            endDate: query.endDate
        });

        res.json({
            success: true,
            data: auditLogs,
            pagination: {
                limit: query.limit,
                skip: query.skip,
                total: auditLogs.length
            }
        });

    } catch (error) {
        console.error("Get user audit logs error:", error);

        if (error.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                error: "Invalid query parameters",
                details: error.errors
            });
        }

        res.status(500).json({
            success: false,
            error: "Internal server error",
            message: "Failed to retrieve audit logs"
        });
    }
});

// Get user's security activity summary
router.get("/my-security-summary", async (req, res) => {
    try {
        await connectDB();

        const userId = req.headers["x-user-id"];
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: "Unauthorized",
                message: "Authentication required"
            });
        }

        // Get recent activity (last 30 days)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const recentLogs = await getUserAuditTrail(userId, {
            limit: 100,
            startDate: thirtyDaysAgo.toISOString()
        });

        // Analyze activity patterns
        const summary = {
            totalActivities: recentLogs.length,
            successfulActivities: recentLogs.filter(log => log.success).length,
            failedActivities: recentLogs.filter(log => !log.success).length,
            activityByType: {},
            recentIpAddresses: [...new Set(recentLogs.map(log => log.ipAddress))],
            lastActivity: recentLogs[0]?.createdAt || null
        };

        // Group by action type
        recentLogs.forEach(log => {
            if (!summary.activityByType[log.action]) {
                summary.activityByType[log.action] = { total: 0, successful: 0, failed: 0 };
            }
            summary.activityByType[log.action].total++;
            if (log.success) {
                summary.activityByType[log.action].successful++;
            } else {
                summary.activityByType[log.action].failed++;
            }
        });

        res.json({
            success: true,
            data: summary,
            period: {
                startDate: thirtyDaysAgo.toISOString(),
                endDate: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error("Get security summary error:", error);

        res.status(500).json({
            success: false,
            error: "Internal server error",
            message: "Failed to retrieve security summary"
        });
    }
});

// Check for suspicious activity (user can check their own account)
router.get("/check-suspicious-activity", async (req, res) => {
    try {
        await connectDB();

        const userId = req.headers["x-user-id"];
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: "Unauthorized",
                message: "Authentication required"
            });
        }

        const query = suspiciousActivitySchema.parse(req.query);

        const suspiciousActivity = await checkSuspiciousActivity(userId, {
            timeWindow: query.timeWindow,
            failureThreshold: query.failureThreshold
        });

        res.json({
            success: true,
            data: suspiciousActivity
        });

    } catch (error) {
        console.error("Check suspicious activity error:", error);

        if (error.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                error: "Invalid query parameters",
                details: error.errors
            });
        }

        res.status(500).json({
            success: false,
            error: "Internal server error",
            message: "Failed to check suspicious activity"
        });
    }
});

// Admin endpoints
// Get audit logs for any user (admin only)
router.get("/admin/user-logs/:userId", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const { userId } = req.params;
        const query = auditQuerySchema.parse(req.query);

        const auditLogs = await getUserAuditTrail(userId, {
            limit: query.limit,
            skip: query.skip,
            action: query.action,
            success: query.success,
            startDate: query.startDate,
            endDate: query.endDate
        });

        res.json({
            success: true,
            data: auditLogs,
            userId,
            pagination: {
                limit: query.limit,
                skip: query.skip,
                total: auditLogs.length
            }
        });

    } catch (error) {
        console.error("Get admin audit logs error:", error);

        if (error.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                error: "Invalid query parameters",
                details: error.errors
            });
        }

        res.status(500).json({
            success: false,
            error: "Internal server error",
            message: "Failed to retrieve audit logs"
        });
    }
});

// Get system-wide security statistics (admin only)
router.get("/admin/security-stats", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const query = statsQuerySchema.parse(req.query);

        const stats = await getSecurityStatistics({
            startDate: query.startDate ? new Date(query.startDate) : undefined,
            endDate: query.endDate ? new Date(query.endDate) : undefined
        });

        res.json({
            success: true,
            data: stats,
            period: {
                startDate: query.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                endDate: query.endDate || new Date().toISOString()
            }
        });

    } catch (error) {
        console.error("Get security stats error:", error);

        if (error.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                error: "Invalid query parameters",
                details: error.errors
            });
        }

        res.status(500).json({
            success: false,
            error: "Internal server error",
            message: "Failed to retrieve security statistics"
        });
    }
});

// Check suspicious activity for any user (admin only)
router.get("/admin/suspicious-activity/:userId", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const { userId } = req.params;
        const query = suspiciousActivitySchema.parse(req.query);

        const suspiciousActivity = await checkSuspiciousActivity(userId, {
            timeWindow: query.timeWindow,
            failureThreshold: query.failureThreshold
        });

        res.json({
            success: true,
            data: suspiciousActivity,
            userId
        });

    } catch (error) {
        console.error("Check admin suspicious activity error:", error);

        if (error.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                error: "Invalid query parameters",
                details: error.errors
            });
        }

        res.status(500).json({
            success: false,
            error: "Internal server error",
            message: "Failed to check suspicious activity"
        });
    }
});

// Cleanup old audit logs (admin only)
router.post("/admin/cleanup-logs", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const { retentionDays } = cleanupSchema.parse(req.body);

        const result = await cleanupOldAuditLogs(retentionDays);

        res.json({
            success: result.success,
            data: result,
            message: result.success
                ? `Cleaned up ${result.deletedCount} old audit log entries`
                : "Failed to cleanup audit logs"
        });

    } catch (error) {
        console.error("Cleanup audit logs error:", error);

        if (error.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                error: "Invalid request data",
                details: error.errors
            });
        }

        res.status(500).json({
            success: false,
            error: "Internal server error",
            message: "Failed to cleanup audit logs"
        });
    }
});

export default router;