import { Router } from "express";
import { z } from "zod";
import { User } from "../models/User.js";
import { Property } from "../models/Property.js";
import { AuditLog } from "../models/AuditLog.js";
import { connectDB } from "../src/config/db.js";
import { requireAdmin } from "../src/middleware/adminAuth.js";
import { createAuditLog } from "../src/services/adminAuditService.js";

const router = Router();

/**
 * Admin Reports & Export Routes
 */

/* ---------------------- VALIDATION SCHEMAS ---------------------- */

const userReportSchema = z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    role: z.enum(['user', 'seller', 'admin', 'owner', 'agent']).optional(),
    status: z.enum(['active', 'inactive', 'blocked']).optional(),
    includeDeleted: z.boolean().default(false),
    fields: z.array(z.string()).optional()
});

const propertyReportSchema = z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    city: z.string().optional(),
    category: z.enum(['room', 'flat', 'house', 'pg', 'hostel', 'commercial']).optional(),
    status: z.enum(['active', 'inactive', 'blocked', 'rented', 'sold', 'expired']).optional(),
    priceMin: z.coerce.number().min(0).optional(),
    priceMax: z.coerce.number().min(0).optional(),
    includeDeleted: z.boolean().default(false),
    fields: z.array(z.string()).optional()
});

const exportQuerySchema = z.object({
    format: z.enum(['csv', 'json']).default('csv')
});

/* ---------------------- HELPER FUNCTIONS ---------------------- */

/**
 * Build date range query
 */
const buildDateRangeQuery = (startDate, endDate, field = 'createdAt') => {
    const query = {};

    if (startDate || endDate) {
        query[field] = {};
        if (startDate) {
            query[field].$gte = new Date(startDate);
        }
        if (endDate) {
            query[field].$lte = new Date(endDate);
        }
    }

    return query;
};

/**
 * Convert data array to CSV format
 */
const convertToCSV = (data, fields = null) => {
    if (!data || data.length === 0) {
        return '';
    }

    // Determine fields to include
    const headers = fields || Object.keys(data[0]);

    // Create CSV header row
    const csvHeaders = headers.map(h => `"${h}"`).join(',');

    // Create CSV data rows
    const csvRows = data.map(row => {
        return headers.map(header => {
            const value = row[header];

            // Handle null/undefined
            if (value === null || value === undefined) {
                return '';
            }

            // Handle dates
            if (value instanceof Date) {
                return `"${value.toISOString()}"`;
            }

            // Handle objects and arrays
            if (typeof value === 'object') {
                return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
            }

            // Handle strings with special characters
            if (typeof value === 'string') {
                // Escape quotes and wrap in quotes
                return `"${value.replace(/"/g, '""')}"`;
            }

            // Handle numbers and booleans
            return value;
        }).join(',');
    });

    return [csvHeaders, ...csvRows].join('\n');
};

/**
 * Format user data for export
 */
const formatUserForExport = (user, fields = null) => {
    const defaultFields = [
        'name', 'email', 'phone', 'role', 'userType',
        'isActive', 'isBlocked', 'verified', 'emailVerified', 'phoneVerified',
        'createdAt', 'lastLoginAt'
    ];

    const fieldsToInclude = fields || defaultFields;
    const formatted = { _id: user._id.toString() };

    fieldsToInclude.forEach(field => {
        if (user[field] !== undefined) {
            if (user[field] instanceof Date) {
                formatted[field] = user[field].toISOString();
            } else {
                formatted[field] = user[field];
            }
        }
    });

    return formatted;
};

/**
 * Format property data for export
 */
const formatPropertyForExport = (property, fields = null) => {
    const defaultFields = [
        'listingNumber', 'title', 'category', 'propertyType', 'city', 'address',
        'monthlyRent', 'securityDeposit', 'status', 'featured',
        'ownerName', 'ownerPhone', 'ownerEmail',
        'views', 'favoritesCount', 'createdAt'
    ];

    const fieldsToInclude = fields || defaultFields;
    const formatted = { _id: property._id.toString() };

    fieldsToInclude.forEach(field => {
        if (property[field] !== undefined) {
            if (property[field] instanceof Date) {
                formatted[field] = property[field].toISOString();
            } else if (Array.isArray(property[field])) {
                formatted[field] = property[field].join('; ');
            } else {
                formatted[field] = property[field];
            }
        }
    });

    return formatted;
};

/* ---------------------- ROUTES ---------------------- */

/**
 * POST /api/admin/reports/users
 * Generate user report based on filters
 */
router.post("/users", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        // Validate request body
        const bodyResult = userReportSchema.safeParse(req.body);
        if (!bodyResult.success) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "Invalid report parameters",
                details: bodyResult.error.errors
            });
        }

        const { startDate, endDate, role, status, includeDeleted, fields } = bodyResult.data;

        // Build query
        const query = {};

        // Date range filter
        if (startDate || endDate) {
            Object.assign(query, buildDateRangeQuery(startDate, endDate, 'createdAt'));
        }

        // Role filter
        if (role) {
            query.role = role;
        }

        // Status filter
        if (status) {
            switch (status) {
                case 'active':
                    query.isActive = true;
                    query.isBlocked = { $ne: true };
                    break;
                case 'inactive':
                    query.isActive = false;
                    break;
                case 'blocked':
                    query.isBlocked = true;
                    break;
            }
        }

        // Include/exclude deleted
        if (!includeDeleted) {
            query.isDeleted = { $ne: true };
        }

        // Execute query
        const users = await User.find(query)
            .select('-passwordHash -passwordHistory')
            .sort({ createdAt: -1 })
            .lean();

        // Format data for export
        const formattedUsers = users.map(user => formatUserForExport(user, fields));

        // Generate summary statistics
        const summary = {
            totalRecords: users.length,
            byRole: {},
            byStatus: {
                active: 0,
                inactive: 0,
                blocked: 0
            },
            dateRange: {
                start: startDate || 'N/A',
                end: endDate || 'N/A'
            }
        };

        users.forEach(user => {
            // Count by role
            summary.byRole[user.role] = (summary.byRole[user.role] || 0) + 1;

            // Count by status
            if (user.isBlocked) {
                summary.byStatus.blocked++;
            } else if (user.isActive) {
                summary.byStatus.active++;
            } else {
                summary.byStatus.inactive++;
            }
        });

        // Create audit log
        await createAuditLog({
            adminId: req.user._id,
            action: 'GENERATE_REPORT',
            resourceType: 'user_report',
            changes: { filters: bodyResult.data, recordCount: users.length },
            req
        });

        res.json({
            success: true,
            data: {
                records: formattedUsers,
                summary,
                generatedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Error generating user report:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to generate user report"
        });
    }
});

/**
 * POST /api/admin/reports/properties
 * Generate property report based on filters
 */
router.post("/properties", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        // Validate request body
        const bodyResult = propertyReportSchema.safeParse(req.body);
        if (!bodyResult.success) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "Invalid report parameters",
                details: bodyResult.error.errors
            });
        }

        const {
            startDate, endDate, city, category, status,
            priceMin, priceMax, includeDeleted, fields
        } = bodyResult.data;

        // Build query
        const query = {};

        // Date range filter
        if (startDate || endDate) {
            Object.assign(query, buildDateRangeQuery(startDate, endDate, 'createdAt'));
        }

        // City filter
        if (city) {
            query.city = { $regex: city, $options: 'i' };
        }

        // Category filter
        if (category) {
            query.category = category;
        }

        // Status filter
        if (status) {
            query.status = status;
        }

        // Price range filter
        if (priceMin !== undefined || priceMax !== undefined) {
            query.monthlyRent = {};
            if (priceMin !== undefined) {
                query.monthlyRent.$gte = priceMin;
            }
            if (priceMax !== undefined) {
                query.monthlyRent.$lte = priceMax;
            }
        }

        // Include/exclude deleted
        if (!includeDeleted) {
            query.isDeleted = { $ne: true };
        }

        // Execute query
        const properties = await Property.find(query)
            .sort({ createdAt: -1 })
            .lean();

        // Format data for export
        const formattedProperties = properties.map(prop => formatPropertyForExport(prop, fields));

        // Generate summary statistics
        const summary = {
            totalRecords: properties.length,
            byCategory: {},
            byStatus: {},
            byCity: {},
            priceStats: {
                min: null,
                max: null,
                avg: null
            },
            dateRange: {
                start: startDate || 'N/A',
                end: endDate || 'N/A'
            }
        };

        let totalPrice = 0;
        properties.forEach(prop => {
            // Count by category
            summary.byCategory[prop.category] = (summary.byCategory[prop.category] || 0) + 1;

            // Count by status
            summary.byStatus[prop.status] = (summary.byStatus[prop.status] || 0) + 1;

            // Count by city
            if (prop.city) {
                summary.byCity[prop.city] = (summary.byCity[prop.city] || 0) + 1;
            }

            // Price statistics
            if (prop.monthlyRent) {
                totalPrice += prop.monthlyRent;
                if (summary.priceStats.min === null || prop.monthlyRent < summary.priceStats.min) {
                    summary.priceStats.min = prop.monthlyRent;
                }
                if (summary.priceStats.max === null || prop.monthlyRent > summary.priceStats.max) {
                    summary.priceStats.max = prop.monthlyRent;
                }
            }
        });

        if (properties.length > 0) {
            summary.priceStats.avg = Math.round(totalPrice / properties.length);
        }

        // Create audit log
        await createAuditLog({
            adminId: req.user._id,
            action: 'GENERATE_REPORT',
            resourceType: 'property_report',
            changes: { filters: bodyResult.data, recordCount: properties.length },
            req
        });

        res.json({
            success: true,
            data: {
                records: formattedProperties,
                summary,
                generatedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Error generating property report:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to generate property report"
        });
    }
});


/**
 * GET /api/admin/reports/users/export
 * Export user report as CSV or JSON
 */
router.get("/users/export", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        // Validate query parameters
        const queryResult = exportQuerySchema.safeParse(req.query);
        if (!queryResult.success) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "Invalid export parameters",
                details: queryResult.error.errors
            });
        }

        const { format } = queryResult.data;

        // Parse filter parameters from query string
        const filters = {
            startDate: req.query.startDate,
            endDate: req.query.endDate,
            role: req.query.role,
            status: req.query.status,
            includeDeleted: req.query.includeDeleted === 'true'
        };

        // Build query
        const query = {};

        if (filters.startDate || filters.endDate) {
            Object.assign(query, buildDateRangeQuery(filters.startDate, filters.endDate, 'createdAt'));
        }

        if (filters.role) {
            query.role = filters.role;
        }

        if (filters.status) {
            switch (filters.status) {
                case 'active':
                    query.isActive = true;
                    query.isBlocked = { $ne: true };
                    break;
                case 'inactive':
                    query.isActive = false;
                    break;
                case 'blocked':
                    query.isBlocked = true;
                    break;
            }
        }

        if (!filters.includeDeleted) {
            query.isDeleted = { $ne: true };
        }

        // Execute query
        const users = await User.find(query)
            .select('-passwordHash -passwordHistory')
            .sort({ createdAt: -1 })
            .lean();

        // Format data for export
        const formattedUsers = users.map(user => formatUserForExport(user));

        // Create audit log
        await createAuditLog({
            adminId: req.user._id,
            action: 'EXPORT_DATA',
            resourceType: 'user_export',
            changes: { format, filters, recordCount: users.length },
            req
        });

        // Generate export based on format
        if (format === 'csv') {
            const csv = convertToCSV(formattedUsers);
            const filename = `users_export_${new Date().toISOString().split('T')[0]}.csv`;

            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            return res.send(csv);
        }

        // JSON format
        const filename = `users_export_${new Date().toISOString().split('T')[0]}.json`;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        return res.json({
            exportedAt: new Date().toISOString(),
            totalRecords: formattedUsers.length,
            data: formattedUsers
        });

    } catch (error) {
        console.error('Error exporting user data:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to export user data"
        });
    }
});

/**
 * GET /api/admin/reports/properties/export
 * Export property report as CSV or JSON
 */
router.get("/properties/export", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        // Validate query parameters
        const queryResult = exportQuerySchema.safeParse(req.query);
        if (!queryResult.success) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "Invalid export parameters",
                details: queryResult.error.errors
            });
        }

        const { format } = queryResult.data;

        // Parse filter parameters from query string
        const filters = {
            startDate: req.query.startDate,
            endDate: req.query.endDate,
            city: req.query.city,
            category: req.query.category,
            status: req.query.status,
            priceMin: req.query.priceMin ? Number(req.query.priceMin) : undefined,
            priceMax: req.query.priceMax ? Number(req.query.priceMax) : undefined,
            includeDeleted: req.query.includeDeleted === 'true'
        };

        // Build query
        const query = {};

        if (filters.startDate || filters.endDate) {
            Object.assign(query, buildDateRangeQuery(filters.startDate, filters.endDate, 'createdAt'));
        }

        if (filters.city) {
            query.city = { $regex: filters.city, $options: 'i' };
        }

        if (filters.category) {
            query.category = filters.category;
        }

        if (filters.status) {
            query.status = filters.status;
        }

        if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
            query.monthlyRent = {};
            if (filters.priceMin !== undefined) {
                query.monthlyRent.$gte = filters.priceMin;
            }
            if (filters.priceMax !== undefined) {
                query.monthlyRent.$lte = filters.priceMax;
            }
        }

        if (!filters.includeDeleted) {
            query.isDeleted = { $ne: true };
        }

        // Execute query
        const properties = await Property.find(query)
            .sort({ createdAt: -1 })
            .lean();

        // Format data for export
        const formattedProperties = properties.map(prop => formatPropertyForExport(prop));

        // Create audit log
        await createAuditLog({
            adminId: req.user._id,
            action: 'EXPORT_DATA',
            resourceType: 'property_export',
            changes: { format, filters, recordCount: properties.length },
            req
        });

        // Generate export based on format
        if (format === 'csv') {
            const csv = convertToCSV(formattedProperties);
            const filename = `properties_export_${new Date().toISOString().split('T')[0]}.csv`;

            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            return res.send(csv);
        }

        // JSON format
        const filename = `properties_export_${new Date().toISOString().split('T')[0]}.json`;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        return res.json({
            exportedAt: new Date().toISOString(),
            totalRecords: formattedProperties.length,
            data: formattedProperties
        });

    } catch (error) {
        console.error('Error exporting property data:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to export property data"
        });
    }
});

/**
 * GET /api/admin/reports/activity/export
 * Export audit log/activity report as CSV or JSON
 */
router.get("/activity/export", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        // Validate query parameters
        const queryResult = exportQuerySchema.safeParse(req.query);
        if (!queryResult.success) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "Invalid export parameters",
                details: queryResult.error.errors
            });
        }

        const { format } = queryResult.data;

        // Parse filter parameters from query string
        const filters = {
            startDate: req.query.startDate,
            endDate: req.query.endDate,
            action: req.query.action,
            resourceType: req.query.resourceType,
            adminId: req.query.adminId
        };

        // Build query
        const query = {};

        if (filters.startDate || filters.endDate) {
            Object.assign(query, buildDateRangeQuery(filters.startDate, filters.endDate, 'timestamp'));
        }

        if (filters.action) {
            query.action = filters.action;
        }

        if (filters.resourceType) {
            query.resourceType = filters.resourceType;
        }

        if (filters.adminId) {
            query.adminId = filters.adminId;
        }

        // Execute query
        const auditLogs = await AuditLog.find(query)
            .populate('adminId', 'name email')
            .sort({ timestamp: -1 })
            .lean();

        // Format data for export
        const formattedLogs = auditLogs.map(log => ({
            _id: log._id.toString(),
            adminName: log.adminId?.name || 'Unknown',
            adminEmail: log.adminId?.email || 'Unknown',
            action: log.action,
            resourceType: log.resourceType,
            resourceId: log.resourceId?.toString() || '',
            ipAddress: log.ipAddress || '',
            userAgent: log.userAgent || '',
            timestamp: log.timestamp?.toISOString() || ''
        }));

        // Create audit log for this export
        await createAuditLog({
            adminId: req.user._id,
            action: 'EXPORT_DATA',
            resourceType: 'activity_export',
            changes: { format, filters, recordCount: auditLogs.length },
            req
        });

        // Generate export based on format
        if (format === 'csv') {
            const csv = convertToCSV(formattedLogs);
            const filename = `activity_export_${new Date().toISOString().split('T')[0]}.csv`;

            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            return res.send(csv);
        }

        // JSON format
        const filename = `activity_export_${new Date().toISOString().split('T')[0]}.json`;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        return res.json({
            exportedAt: new Date().toISOString(),
            totalRecords: formattedLogs.length,
            data: formattedLogs
        });

    } catch (error) {
        console.error('Error exporting activity data:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to export activity data"
        });
    }
});

/**
 * GET /api/admin/reports/summary
 * Get a summary of available reports and export options
 */
router.get("/summary", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        // Get counts for each report type
        const [userCount, propertyCount, auditLogCount] = await Promise.all([
            User.countDocuments({ isDeleted: { $ne: true } }),
            Property.countDocuments({ isDeleted: { $ne: true } }),
            AuditLog.countDocuments({})
        ]);

        res.json({
            success: true,
            data: {
                availableReports: [
                    {
                        type: 'users',
                        name: 'User Report',
                        description: 'Export user data with filters for role, status, and date range',
                        recordCount: userCount,
                        endpoints: {
                            generate: 'POST /api/admin/reports/users',
                            export: 'GET /api/admin/reports/users/export'
                        },
                        filters: ['startDate', 'endDate', 'role', 'status', 'includeDeleted']
                    },
                    {
                        type: 'properties',
                        name: 'Property Report',
                        description: 'Export property data with filters for city, category, status, and price range',
                        recordCount: propertyCount,
                        endpoints: {
                            generate: 'POST /api/admin/reports/properties',
                            export: 'GET /api/admin/reports/properties/export'
                        },
                        filters: ['startDate', 'endDate', 'city', 'category', 'status', 'priceMin', 'priceMax', 'includeDeleted']
                    },
                    {
                        type: 'activity',
                        name: 'Activity Report',
                        description: 'Export audit log data with filters for action type, resource type, and date range',
                        recordCount: auditLogCount,
                        endpoints: {
                            export: 'GET /api/admin/reports/activity/export'
                        },
                        filters: ['startDate', 'endDate', 'action', 'resourceType', 'adminId']
                    }
                ],
                exportFormats: ['csv', 'json'],
                generatedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Error getting report summary:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to get report summary"
        });
    }
});

export default router;
