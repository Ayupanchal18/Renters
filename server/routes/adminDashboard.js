import { Router } from "express";
import { z } from "zod";
import { User } from "../models/User.js";
import { Property } from "../models/Property.js";
import { AuditLog } from "../models/AuditLog.js";
import { connectDB } from "../src/config/db.js";
import { requireAdmin } from "../src/middleware/adminAuth.js";

const router = Router();

/**
 * Admin Dashboard Statistics Routes
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */

/* ---------------------- VALIDATION SCHEMAS ---------------------- */

const activityQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    action: z.string().optional(),
    resourceType: z.string().optional()
});

const chartsQuerySchema = z.object({
    period: z.enum(['7d', '30d', '90d', '1y']).default('30d'),
    type: z.enum(['users', 'properties', 'activity', 'all']).default('all')
});

/* ---------------------- HELPER FUNCTIONS ---------------------- */

/**
 * Get date range based on period string
 */
const getDateRange = (period) => {
    const now = new Date();
    const startDate = new Date();

    switch (period) {
        case '7d':
            startDate.setDate(now.getDate() - 7);
            break;
        case '30d':
            startDate.setDate(now.getDate() - 30);
            break;
        case '90d':
            startDate.setDate(now.getDate() - 90);
            break;
        case '1y':
            startDate.setFullYear(now.getFullYear() - 1);
            break;
        default:
            startDate.setDate(now.getDate() - 30);
    }

    return { startDate, endDate: now };
};

/**
 * Get start of current month
 */
const getStartOfMonth = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
};

/* ---------------------- ROUTES ---------------------- */

/**
 * GET /api/admin/dashboard/stats
 * Get overview statistics for the admin dashboard
 * 
 * Requirements: 2.1 - Display total counts for users, owners, agents, and properties
 * Requirements: 2.2 - Show active versus inactive listing counts
 * Requirements: 2.3 - Display property distribution by city, category, and price range
 */
router.get("/stats", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const startOfMonth = getStartOfMonth();

        // Execute all aggregation queries in parallel for performance
        const [
            userCountsByRole,
            totalUsers,
            newUsersThisMonth,
            propertyCountsByStatus,
            propertyCountsByCategory,
            propertyCountsByCity,
            propertyCountsByListingType,
            totalProperties,
            priceRangeDistribution
        ] = await Promise.all([
            // User counts by role
            User.aggregate([
                { $match: { isDeleted: { $ne: true } } },
                { $group: { _id: "$role", count: { $sum: 1 } } }
            ]),

            // Total users
            User.countDocuments({ isDeleted: { $ne: true } }),

            // New users this month
            User.countDocuments({
                isDeleted: { $ne: true },
                createdAt: { $gte: startOfMonth }
            }),

            // Property counts by status
            Property.aggregate([
                { $match: { isDeleted: { $ne: true } } },
                { $group: { _id: "$status", count: { $sum: 1 } } }
            ]),

            // Property counts by category
            Property.aggregate([
                { $match: { isDeleted: { $ne: true } } },
                { $group: { _id: "$category", count: { $sum: 1 } } }
            ]),

            // Property counts by city (top 10)
            Property.aggregate([
                { $match: { isDeleted: { $ne: true } } },
                { $group: { _id: "$city", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 }
            ]),

            // Property counts by listingType (rent vs buy)
            Property.aggregate([
                { $match: { isDeleted: { $ne: true } } },
                { $group: { _id: "$listingType", count: { $sum: 1 } } }
            ]),

            // Total properties
            Property.countDocuments({ isDeleted: { $ne: true } }),

            // Price range distribution
            Property.aggregate([
                { $match: { isDeleted: { $ne: true } } },
                {
                    $bucket: {
                        groupBy: "$monthlyRent",
                        boundaries: [0, 5000, 10000, 20000, 50000, 100000, Infinity],
                        default: "100000+",
                        output: { count: { $sum: 1 } }
                    }
                }
            ])
        ]);

        // Transform user counts by role into object
        const byRole = {
            user: 0,
            seller: 0,
            admin: 0,
            owner: 0,
            agent: 0
        };
        userCountsByRole.forEach(item => {
            if (item._id && byRole.hasOwnProperty(item._id)) {
                byRole[item._id] = item.count;
            }
        });

        // Transform property counts by status into object
        const byStatus = {
            active: 0,
            inactive: 0,
            blocked: 0,
            rented: 0,
            sold: 0,
            expired: 0
        };
        propertyCountsByStatus.forEach(item => {
            if (item._id && byStatus.hasOwnProperty(item._id)) {
                byStatus[item._id] = item.count;
            }
        });

        // Transform property counts by category into object
        const byCategory = {};
        propertyCountsByCategory.forEach(item => {
            if (item._id) {
                byCategory[item._id] = item.count;
            }
        });

        // Transform property counts by city into object
        const byCity = {};
        propertyCountsByCity.forEach(item => {
            if (item._id) {
                byCity[item._id] = item.count;
            }
        });

        // Transform price range distribution
        const priceRangeLabels = {
            0: "0-5K",
            5000: "5K-10K",
            10000: "10K-20K",
            20000: "20K-50K",
            50000: "50K-100K",
            "100000+": "100K+"
        };
        const byPriceRange = {};
        priceRangeDistribution.forEach(item => {
            const label = priceRangeLabels[item._id] || item._id;
            byPriceRange[label] = item.count;
        });

        // Transform property counts by listingType into object
        const byListingType = {
            rent: 0,
            buy: 0
        };
        propertyCountsByListingType.forEach(item => {
            if (item._id && byListingType.hasOwnProperty(item._id)) {
                byListingType[item._id] = item.count;
            }
        });

        res.json({
            success: true,
            data: {
                users: {
                    total: totalUsers,
                    byRole,
                    newThisMonth: newUsersThisMonth
                },
                properties: {
                    total: totalProperties,
                    active: byStatus.active,
                    inactive: byStatus.inactive + byStatus.blocked,
                    pending: byStatus.blocked,
                    byStatus,
                    byCategory,
                    byCity,
                    byPriceRange,
                    byListingType
                }
            }
        });

    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to retrieve dashboard statistics"
        });
    }
});

/**
 * GET /api/admin/dashboard/activity
 * Get recent activity logs for the dashboard
 * 
 * Requirements: 2.4 - Show recent activity logs with timestamps
 */
router.get("/activity", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        // Validate query parameters
        const queryResult = activityQuerySchema.safeParse(req.query);
        if (!queryResult.success) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "Invalid query parameters",
                details: queryResult.error.errors
            });
        }

        const { page, limit, action, resourceType } = queryResult.data;

        // Build query
        const query = {};
        if (action) {
            query.action = action;
        }
        if (resourceType) {
            query.resourceType = resourceType;
        }

        // Calculate skip
        const skip = (page - 1) * limit;

        // Execute query with pagination
        const [activities, total] = await Promise.all([
            AuditLog.find(query)
                .populate('adminId', 'name email role')
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            AuditLog.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: {
                activities,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        console.error('Error fetching activity logs:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to retrieve activity logs"
        });
    }
});

/**
 * GET /api/admin/dashboard/charts
 * Get chart data for dashboard visualizations
 * 
 * Requirements: 2.1, 2.2, 2.3 - Provide data for dashboard charts
 */
router.get("/charts", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        // Validate query parameters
        const queryResult = chartsQuerySchema.safeParse(req.query);
        if (!queryResult.success) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "Invalid query parameters",
                details: queryResult.error.errors
            });
        }

        const { period, type } = queryResult.data;
        const { startDate, endDate } = getDateRange(period);

        const chartData = {};

        // User registration trend
        if (type === 'all' || type === 'users') {
            const userTrend = await User.aggregate([
                {
                    $match: {
                        isDeleted: { $ne: true },
                        createdAt: { $gte: startDate, $lte: endDate }
                    }
                },
                {
                    $group: {
                        _id: {
                            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
                        },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]);

            chartData.userRegistrations = userTrend.map(item => ({
                date: item._id,
                count: item.count
            }));
        }

        // Property listing trend
        if (type === 'all' || type === 'properties') {
            const propertyTrend = await Property.aggregate([
                {
                    $match: {
                        isDeleted: { $ne: true },
                        createdAt: { $gte: startDate, $lte: endDate }
                    }
                },
                {
                    $group: {
                        _id: {
                            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
                        },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]);

            chartData.propertyListings = propertyTrend.map(item => ({
                date: item._id,
                count: item.count
            }));
        }

        // Activity trend
        if (type === 'all' || type === 'activity') {
            const activityTrend = await AuditLog.aggregate([
                {
                    $match: {
                        timestamp: { $gte: startDate, $lte: endDate }
                    }
                },
                {
                    $group: {
                        _id: {
                            date: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
                            action: "$action"
                        },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { "_id.date": 1 } }
            ]);

            // Group by date with action breakdown
            const activityByDate = {};
            activityTrend.forEach(item => {
                const date = item._id.date;
                if (!activityByDate[date]) {
                    activityByDate[date] = { date, total: 0, actions: {} };
                }
                activityByDate[date].total += item.count;
                activityByDate[date].actions[item._id.action] = item.count;
            });

            chartData.activityTrend = Object.values(activityByDate);
        }

        res.json({
            success: true,
            data: {
                period,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                charts: chartData
            }
        });

    } catch (error) {
        console.error('Error fetching chart data:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to retrieve chart data"
        });
    }
});

export default router;
