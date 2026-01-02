import { Router } from "express";
import { z } from "zod";
import { connectDB } from "../src/config/db.js";
import { requireAdmin } from "../src/middleware/adminAuth.js";
import { filterAuditLogs, getAuditStats, VALID_ACTIONS, VALID_RESOURCE_TYPES } from "../src/services/adminAuditService.js";
import { User } from "../models/User.js";

const router = Router();

/**
 * Admin Audit Logs Routes
 */

/* ---------------------- VALIDATION SCHEMAS ---------------------- */

const auditLogsQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sortBy: z.enum(['timestamp', 'action', 'resourceType']).default('timestamp'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    adminId: z.string().optional(),
    action: z.string().optional(),
    resourceType: z.string().optional(),
    resourceId: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    search: z.string().optional()
});

/* ---------------------- ROUTES ---------------------- */

/**
 * GET /api/admin/audit-logs
 * Get paginated audit logs with filters
 */
router.get("/", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        // Validate query parameters
        const queryResult = auditLogsQuerySchema.safeParse(req.query);
        if (!queryResult.success) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "Invalid query parameters",
                details: queryResult.error.errors
            });
        }

        const { page, limit, sortBy, sortOrder, adminId, action, resourceType, resourceId, startDate, endDate } = queryResult.data;

        // Build filters
        const filters = {};
        if (adminId) filters.adminId = adminId;
        if (action) filters.action = action;
        if (resourceType) filters.resourceType = resourceType;
        if (resourceId) filters.resourceId = resourceId;
        if (startDate) filters.startDate = startDate;
        if (endDate) filters.endDate = endDate;

        // Get filtered audit logs
        const result = await filterAuditLogs(filters, {
            page,
            limit,
            sortBy,
            sortOrder,
            populate: true
        });

        res.json(result);

    } catch (error) {
        console.error('Error fetching audit logs:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to retrieve audit logs"
        });
    }
});

/**
 * GET /api/admin/audit-logs/stats
 * Get audit log statistics
 */
router.get("/stats", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const { startDate, endDate } = req.query;

        const result = await getAuditStats({
            startDate: startDate || undefined,
            endDate: endDate || undefined
        });

        res.json(result);

    } catch (error) {
        console.error('Error fetching audit stats:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to retrieve audit statistics"
        });
    }
});

/**
 * GET /api/admin/audit-logs/filters
 * Get available filter options (actions, resource types, admins)
 */
router.get("/filters", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        // Get list of admin users for filter dropdown
        const admins = await User.find({ role: 'admin', isDeleted: { $ne: true } })
            .select('_id name email')
            .lean();

        res.json({
            success: true,
            data: {
                actions: VALID_ACTIONS,
                resourceTypes: VALID_RESOURCE_TYPES,
                admins: admins.map(admin => ({
                    id: admin._id,
                    name: admin.name,
                    email: admin.email
                }))
            }
        });

    } catch (error) {
        console.error('Error fetching filter options:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to retrieve filter options"
        });
    }
});

export default router;
