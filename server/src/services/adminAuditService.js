import { AuditLog } from "../../models/AuditLog.js";
import { connectDB } from "../config/db.js";

/**
 * Admin Audit Service
 * Handles audit log creation and retrieval for admin actions
 * 
 * Requirements: 11.1, 11.2, 11.3
 * - 11.1: Create audit log entry for any admin CRUD operation
 * - 11.2: Display logs with admin identity, action, timestamp, and affected resource
 * - 11.3: Support filtering by admin, action type, and date range
 */

/* ---------------------- CONSTANTS ---------------------- */

export const VALID_ACTIONS = [
    'CREATE', 'UPDATE', 'DELETE', 'BLOCK', 'UNBLOCK',
    'ACTIVATE', 'DEACTIVATE', 'ROLE_CHANGE', 'PASSWORD_RESET',
    'LOGIN', 'LOGOUT', 'APPROVE', 'REJECT', 'EXPORT', 'VIEW'
];

export const VALID_RESOURCE_TYPES = [
    'user', 'property', 'location', 'category',
    'content', 'review', 'notification', 'settings', 'report', 'conversation'
];

/* ---------------------- HELPER FUNCTIONS ---------------------- */

/**
 * Validate action type
 * @param {string} action - Action to validate
 * @returns {boolean} - True if valid
 */
const isValidAction = (action) => {
    return VALID_ACTIONS.includes(action);
};

/**
 * Validate resource type
 * @param {string} resourceType - Resource type to validate
 * @returns {boolean} - True if valid
 */
const isValidResourceType = (resourceType) => {
    return VALID_RESOURCE_TYPES.includes(resourceType);
};

/**
 * Extract client info from request
 * @param {Object} req - Express request object
 * @returns {Object} - Client info (ipAddress, userAgent)
 */
const extractClientInfo = (req) => {
    if (!req) {
        return { ipAddress: null, userAgent: null };
    }

    const ipAddress = req.ip ||
        req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
        req.connection?.remoteAddress ||
        null;

    const userAgent = req.headers['user-agent'] || null;

    return { ipAddress, userAgent };
};

/* ---------------------- CORE FUNCTIONS ---------------------- */

/**
 * Create an audit log entry
 * 
 * Requirements: 11.1 - Create audit log entry with action details
 * 
 * @param {Object} params - Audit log parameters
 * @param {string} params.adminId - ID of the admin performing the action
 * @param {string} params.action - Action type (CREATE, UPDATE, DELETE, etc.)
 * @param {string} params.resourceType - Type of resource (user, property, etc.)
 * @param {string} [params.resourceId] - ID of the affected resource
 * @param {Object} [params.changes] - New values after the action
 * @param {Object} [params.previousValues] - Values before the action
 * @param {Object} [params.metadata] - Additional metadata
 * @param {Object} [params.req] - Express request object for client info
 * @returns {Promise<Object>} - Created audit log entry
 */
export const createAuditLog = async ({
    adminId,
    action,
    resourceType,
    resourceId = null,
    changes = null,
    previousValues = null,
    metadata = null,
    req = null
}) => {
    // Validate required fields
    if (!adminId) {
        throw new Error('adminId is required for audit log');
    }

    if (!action) {
        throw new Error('action is required for audit log');
    }

    if (!resourceType) {
        throw new Error('resourceType is required for audit log');
    }

    // Validate action type
    if (!isValidAction(action)) {
        throw new Error(`Invalid action type: ${action}. Valid actions: ${VALID_ACTIONS.join(', ')}`);
    }

    // Validate resource type
    if (!isValidResourceType(resourceType)) {
        throw new Error(`Invalid resource type: ${resourceType}. Valid types: ${VALID_RESOURCE_TYPES.join(', ')}`);
    }

    // Extract client info from request
    const { ipAddress, userAgent } = extractClientInfo(req);

    try {
        await connectDB();

        const auditLog = new AuditLog({
            adminId,
            action,
            resourceType,
            resourceId,
            changes,
            previousValues,
            ipAddress,
            userAgent,
            metadata,
            timestamp: new Date()
        });

        await auditLog.save();

        return auditLog.toObject();
    } catch (error) {
        console.error('Error creating audit log:', error);
        throw error;
    }
};


/**
 * Get audit logs with pagination
 * 
 * Requirements: 11.2 - Display logs with admin identity, action, timestamp, and affected resource
 * 
 * @param {Object} options - Query options
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.limit=20] - Items per page
 * @param {string} [options.sortBy='timestamp'] - Field to sort by
 * @param {string} [options.sortOrder='desc'] - Sort order (asc/desc)
 * @param {boolean} [options.populate=true] - Whether to populate admin details
 * @returns {Promise<Object>} - Paginated audit logs
 */
export const getAuditLogs = async ({
    page = 1,
    limit = 20,
    sortBy = 'timestamp',
    sortOrder = 'desc',
    populate = true
} = {}) => {
    try {
        await connectDB();

        // Ensure valid pagination values
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
        const skip = (pageNum - 1) * limitNum;

        // Build sort object
        const sortDirection = sortOrder === 'asc' ? 1 : -1;
        const sort = { [sortBy]: sortDirection };

        // Build query
        let query = AuditLog.find();

        // Populate admin details if requested
        if (populate) {
            query = query.populate('adminId', 'name email role');
        }

        // Execute query with pagination
        const [logs, total] = await Promise.all([
            query
                .sort(sort)
                .skip(skip)
                .limit(limitNum)
                .lean(),
            AuditLog.countDocuments()
        ]);

        return {
            success: true,
            data: {
                logs,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    totalPages: Math.ceil(total / limitNum)
                }
            }
        };
    } catch (error) {
        console.error('Error getting audit logs:', error);
        throw error;
    }
};

/**
 * Filter audit logs with various criteria
 * 
 * Requirements: 11.3 - Support filtering by admin, action type, and date range
 * 
 * @param {Object} filters - Filter criteria
 * @param {string} [filters.adminId] - Filter by admin ID
 * @param {string|string[]} [filters.action] - Filter by action type(s)
 * @param {string|string[]} [filters.resourceType] - Filter by resource type(s)
 * @param {string} [filters.resourceId] - Filter by specific resource ID
 * @param {Date|string} [filters.startDate] - Filter by start date (inclusive)
 * @param {Date|string} [filters.endDate] - Filter by end date (inclusive)
 * @param {string} [filters.search] - Search in changes and metadata
 * @param {Object} options - Query options
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.limit=20] - Items per page
 * @param {string} [options.sortBy='timestamp'] - Field to sort by
 * @param {string} [options.sortOrder='desc'] - Sort order (asc/desc)
 * @param {boolean} [options.populate=true] - Whether to populate admin details
 * @returns {Promise<Object>} - Filtered and paginated audit logs
 */
export const filterAuditLogs = async (filters = {}, options = {}) => {
    try {
        await connectDB();

        const {
            adminId,
            action,
            resourceType,
            resourceId,
            startDate,
            endDate
            // search - reserved for future text search implementation
        } = filters;

        const {
            page = 1,
            limit = 20,
            sortBy = 'timestamp',
            sortOrder = 'desc',
            populate = true
        } = options;

        // Build filter query
        const query = {};

        // Filter by admin ID
        if (adminId) {
            query.adminId = adminId;
        }

        // Filter by action type(s)
        if (action) {
            if (Array.isArray(action)) {
                query.action = { $in: action };
            } else {
                query.action = action;
            }
        }

        // Filter by resource type(s)
        if (resourceType) {
            if (Array.isArray(resourceType)) {
                query.resourceType = { $in: resourceType };
            } else {
                query.resourceType = resourceType;
            }
        }

        // Filter by specific resource ID
        if (resourceId) {
            query.resourceId = resourceId;
        }

        // Filter by date range (Requirements 11.3)
        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) {
                query.timestamp.$gte = new Date(startDate);
            }
            if (endDate) {
                // Set end date to end of day for inclusive filtering
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.timestamp.$lte = end;
            }
        }

        // Ensure valid pagination values
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
        const skip = (pageNum - 1) * limitNum;

        // Build sort object
        const sortDirection = sortOrder === 'asc' ? 1 : -1;
        const sort = { [sortBy]: sortDirection };

        // Build query
        let dbQuery = AuditLog.find(query);

        // Populate admin details if requested
        if (populate) {
            dbQuery = dbQuery.populate('adminId', 'name email role');
        }

        // Execute query with pagination
        const [logs, total] = await Promise.all([
            dbQuery
                .sort(sort)
                .skip(skip)
                .limit(limitNum)
                .lean(),
            AuditLog.countDocuments(query)
        ]);

        return {
            success: true,
            data: {
                logs,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    totalPages: Math.ceil(total / limitNum)
                }
            },
            filters: {
                adminId,
                action,
                resourceType,
                resourceId,
                startDate,
                endDate
            }
        };
    } catch (error) {
        console.error('Error filtering audit logs:', error);
        throw error;
    }
};


/**
 * Get audit log by ID
 * 
 * @param {string} logId - Audit log ID
 * @param {boolean} [populate=true] - Whether to populate admin details
 * @returns {Promise<Object|null>} - Audit log entry or null
 */
export const getAuditLogById = async (logId, populate = true) => {
    try {
        await connectDB();

        let query = AuditLog.findById(logId);

        if (populate) {
            query = query.populate('adminId', 'name email role');
        }

        const log = await query.lean();

        return log;
    } catch (error) {
        console.error('Error getting audit log by ID:', error);
        throw error;
    }
};

/**
 * Get audit logs for a specific resource
 * 
 * @param {string} resourceType - Type of resource
 * @param {string} resourceId - ID of the resource
 * @param {Object} options - Query options
 * @returns {Promise<Object>} - Audit logs for the resource
 */
export const getResourceAuditHistory = async (resourceType, resourceId, options = {}) => {
    return filterAuditLogs(
        { resourceType, resourceId },
        { ...options, sortBy: 'timestamp', sortOrder: 'desc' }
    );
};

/**
 * Get audit logs for a specific admin
 * 
 * @param {string} adminId - Admin user ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} - Audit logs for the admin
 */
export const getAdminAuditHistory = async (adminId, options = {}) => {
    return filterAuditLogs(
        { adminId },
        { ...options, sortBy: 'timestamp', sortOrder: 'desc' }
    );
};

/**
 * Get recent activity logs
 * 
 * @param {number} [limit=10] - Number of recent logs to retrieve
 * @returns {Promise<Array>} - Recent audit logs
 */
export const getRecentActivity = async (limit = 10) => {
    try {
        await connectDB();

        const logs = await AuditLog.find()
            .populate('adminId', 'name email role')
            .sort({ timestamp: -1 })
            .limit(limit)
            .lean();

        return logs;
    } catch (error) {
        console.error('Error getting recent activity:', error);
        throw error;
    }
};

/**
 * Get audit log statistics
 * 
 * @param {Object} options - Options for statistics
 * @param {Date|string} [options.startDate] - Start date for statistics
 * @param {Date|string} [options.endDate] - End date for statistics
 * @returns {Promise<Object>} - Audit log statistics
 */
export const getAuditStats = async ({ startDate, endDate } = {}) => {
    try {
        await connectDB();

        const matchStage = {};

        if (startDate || endDate) {
            matchStage.timestamp = {};
            if (startDate) {
                matchStage.timestamp.$gte = new Date(startDate);
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                matchStage.timestamp.$lte = end;
            }
        }

        const pipeline = [
            ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
            {
                $facet: {
                    byAction: [
                        { $group: { _id: '$action', count: { $sum: 1 } } },
                        { $sort: { count: -1 } }
                    ],
                    byResourceType: [
                        { $group: { _id: '$resourceType', count: { $sum: 1 } } },
                        { $sort: { count: -1 } }
                    ],
                    byAdmin: [
                        { $group: { _id: '$adminId', count: { $sum: 1 } } },
                        { $sort: { count: -1 } },
                        { $limit: 10 }
                    ],
                    total: [
                        { $count: 'count' }
                    ]
                }
            }
        ];

        const [result] = await AuditLog.aggregate(pipeline);

        return {
            success: true,
            data: {
                total: result.total[0]?.count || 0,
                byAction: result.byAction.reduce((acc, item) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {}),
                byResourceType: result.byResourceType.reduce((acc, item) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {}),
                topAdmins: result.byAdmin
            }
        };
    } catch (error) {
        console.error('Error getting audit stats:', error);
        throw error;
    }
};

/* ---------------------- MIDDLEWARE HELPER ---------------------- */

/**
 * Create audit log middleware for automatic logging
 * 
 * Requirements: 11.1 - Automatic audit log creation for admin actions
 * 
 * @param {string} action - Action type
 * @param {string} resourceType - Resource type
 * @param {Function} [getResourceId] - Function to extract resource ID from request
 * @param {Function} [getChanges] - Function to extract changes from request
 * @returns {Function} - Express middleware function
 */
export const auditLogMiddleware = (action, resourceType, getResourceId = null, getChanges = null) => {
    return async (req, res, next) => {
        // Store original json method
        const originalJson = res.json.bind(res);

        // Override json method to capture response
        res.json = async function (data) {
            // Only log successful operations
            if (data && data.success !== false && req.user) {
                try {
                    const resourceId = getResourceId ? getResourceId(req, data) : req.params.id;
                    const changes = getChanges ? getChanges(req, data) : req.body;

                    await createAuditLog({
                        adminId: req.user._id,
                        action,
                        resourceType,
                        resourceId,
                        changes,
                        req
                    });
                } catch (error) {
                    console.error('Error in audit log middleware:', error);
                    // Don't fail the request if audit logging fails
                }
            }

            return originalJson(data);
        };

        next();
    };
};

/* ---------------------- EXPORTS ---------------------- */

export default {
    createAuditLog,
    getAuditLogs,
    filterAuditLogs,
    getAuditLogById,
    getResourceAuditHistory,
    getAdminAuditHistory,
    getRecentActivity,
    getAuditStats,
    auditLogMiddleware,
    VALID_ACTIONS,
    VALID_RESOURCE_TYPES
};
