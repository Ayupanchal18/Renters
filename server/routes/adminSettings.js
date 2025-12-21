import { Router } from "express";
import { z } from "zod";
import { SystemSettings } from "../models/SystemSettings.js";
import { connectDB } from "../src/config/db.js";
import { requireAdmin } from "../src/middleware/adminAuth.js";
import { createAuditLog } from "../src/services/adminAuditService.js";

const router = Router();

/**
 * Admin System Settings Routes
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 * - 9.1: Update app settings and apply configuration changes
 * - 9.2: Toggle features across the application
 * - 9.3: Enable maintenance mode for non-admin users
 * - 9.4: View API keys with masked values and copy functionality
 * - 9.5: Update environment flags without requiring restart
 */

/* ---------------------- VALIDATION SCHEMAS ---------------------- */

const settingsListQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    category: z.enum(['general', 'features', 'maintenance', 'security', 'notifications', 'api']).optional(),
    isPublic: z.enum(['true', 'false']).optional(),
    search: z.string().optional(),
    sortBy: z.string().default('key'),
    sortOrder: z.enum(['asc', 'desc']).default('asc')
});

const settingCreateSchema = z.object({
    key: z.string().min(1, "Key is required").max(100),
    value: z.any(),
    type: z.enum(['string', 'number', 'boolean', 'json']).default('string'),
    description: z.string().optional().default(''),
    isPublic: z.boolean().default(false),
    category: z.enum(['general', 'features', 'maintenance', 'security', 'notifications', 'api']).default('general')
});

const settingUpdateSchema = z.object({
    value: z.any(),
    type: z.enum(['string', 'number', 'boolean', 'json']).optional(),
    description: z.string().optional(),
    isPublic: z.boolean().optional(),
    category: z.enum(['general', 'features', 'maintenance', 'security', 'notifications', 'api']).optional()
});

const bulkUpdateSchema = z.object({
    settings: z.array(z.object({
        key: z.string().min(1),
        value: z.any()
    })).min(1, "At least one setting is required")
});

const featureToggleSchema = z.object({
    enabled: z.boolean()
});

const maintenanceModeSchema = z.object({
    enabled: z.boolean(),
    message: z.string().optional().default("The system is currently under maintenance. Please try again later."),
    estimatedEndTime: z.string().datetime().optional().nullable(),
    allowedIPs: z.array(z.string()).optional().default([])
});

/* ---------------------- HELPER FUNCTIONS ---------------------- */

/**
 * Build search query for settings
 */
const buildSettingsQuery = (category, isPublic, search) => {
    const query = {};

    if (category) {
        query.category = category;
    }

    if (isPublic !== undefined) {
        query.isPublic = isPublic === 'true';
    }

    if (search) {
        query.$or = [
            { key: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
        ];
    }

    return query;
};

/**
 * Mask sensitive values (API keys, secrets)
 */
const maskSensitiveValue = (key, value) => {
    const sensitivePatterns = ['api_key', 'secret', 'password', 'token', 'credential'];
    const isSensitive = sensitivePatterns.some(pattern =>
        key.toLowerCase().includes(pattern)
    );

    if (isSensitive && typeof value === 'string' && value.length > 8) {
        return value.substring(0, 4) + '****' + value.substring(value.length - 4);
    }

    return value;
};

/**
 * Validate setting value against its type
 */
const validateSettingValue = (value, type) => {
    switch (type) {
        case 'string':
            return typeof value === 'string';
        case 'number':
            return typeof value === 'number' && !isNaN(value);
        case 'boolean':
            return typeof value === 'boolean';
        case 'json':
            return typeof value === 'object' && value !== null;
        default:
            return true;
    }
};

/* ---------------------- SETTINGS ROUTES ---------------------- */

/**
 * GET /api/admin/settings
 * List all settings with pagination and filters
 * Requirements: 9.1 - Update app settings
 */
router.get("/", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const queryResult = settingsListQuerySchema.safeParse(req.query);
        if (!queryResult.success) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "Invalid query parameters",
                details: queryResult.error.errors
            });
        }

        const { page, limit, category, isPublic, search, sortBy, sortOrder } = queryResult.data;
        const query = buildSettingsQuery(category, isPublic, search);
        const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
        const skip = (page - 1) * limit;

        const [settings, total] = await Promise.all([
            SystemSettings.find(query)
                .populate('updatedBy', 'name email')
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean(),
            SystemSettings.countDocuments(query)
        ]);

        // Mask sensitive values for display
        const maskedSettings = settings.map(setting => ({
            ...setting,
            displayValue: maskSensitiveValue(setting.key, setting.value)
        }));

        res.json({
            success: true,
            data: {
                settings: maskedSettings,
                pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
            }
        });
    } catch (error) {
        console.error('Error listing settings:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to retrieve settings"
        });
    }
});

/**
 * GET /api/admin/settings/:key
 * Get a specific setting by key
 */
router.get("/:key", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const setting = await SystemSettings.findOne({ key: req.params.key })
            .populate('updatedBy', 'name email')
            .lean();

        if (!setting) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: "Setting not found"
            });
        }

        res.json({
            success: true,
            data: {
                ...setting,
                displayValue: maskSensitiveValue(setting.key, setting.value)
            }
        });
    } catch (error) {
        console.error('Error getting setting:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to retrieve setting"
        });
    }
});


/**
 * POST /api/admin/settings
 * Create a new setting
 * Requirements: 9.1 - Update app settings
 */
router.post("/", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const bodyResult = settingCreateSchema.safeParse(req.body);
        if (!bodyResult.success) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "Invalid setting data",
                details: bodyResult.error.errors
            });
        }

        const { key, value, type, description, isPublic, category } = bodyResult.data;

        // Validate value matches type
        if (!validateSettingValue(value, type)) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: `Value does not match type '${type}'`
            });
        }

        // Check for duplicate key
        const existing = await SystemSettings.findOne({ key });
        if (existing) {
            return res.status(409).json({
                success: false,
                error: "CONFLICT",
                message: "A setting with this key already exists"
            });
        }

        const setting = new SystemSettings({
            key,
            value,
            type,
            description,
            isPublic,
            category,
            updatedBy: req.user._id
        });

        await setting.save();

        await createAuditLog({
            adminId: req.user._id,
            action: 'CREATE',
            resourceType: 'settings',
            resourceId: setting._id,
            changes: { key, type, category, isPublic },
            req
        });

        res.status(201).json({
            success: true,
            data: setting.toObject(),
            message: "Setting created successfully"
        });
    } catch (error) {
        console.error('Error creating setting:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to create setting"
        });
    }
});

/**
 * PUT /api/admin/settings/:key
 * Update a setting by key
 * Requirements: 9.1 - Update app settings and apply configuration changes
 * Requirements: 9.5 - Update environment flags without requiring restart
 */
router.put("/:key", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const bodyResult = settingUpdateSchema.safeParse(req.body);
        if (!bodyResult.success) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "Invalid setting data",
                details: bodyResult.error.errors
            });
        }

        const currentSetting = await SystemSettings.findOne({ key: req.params.key }).lean();
        if (!currentSetting) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: "Setting not found"
            });
        }

        const updateData = { ...bodyResult.data, updatedBy: req.user._id };
        const effectiveType = updateData.type || currentSetting.type;

        // Validate value matches type if value is being updated
        if (updateData.value !== undefined && !validateSettingValue(updateData.value, effectiveType)) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: `Value does not match type '${effectiveType}'`
            });
        }

        const updatedSetting = await SystemSettings.findOneAndUpdate(
            { key: req.params.key },
            updateData,
            { new: true }
        ).lean();

        await createAuditLog({
            adminId: req.user._id,
            action: 'UPDATE',
            resourceType: 'settings',
            resourceId: currentSetting._id,
            changes: updateData,
            previousValues: { value: currentSetting.value, type: currentSetting.type },
            req
        });

        res.json({
            success: true,
            data: updatedSetting,
            message: "Setting updated successfully"
        });
    } catch (error) {
        console.error('Error updating setting:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to update setting"
        });
    }
});

/**
 * PUT /api/admin/settings
 * Bulk update multiple settings
 * Requirements: 9.1 - Update app settings and apply configuration changes
 */
router.put("/", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const bodyResult = bulkUpdateSchema.safeParse(req.body);
        if (!bodyResult.success) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "Invalid settings data",
                details: bodyResult.error.errors
            });
        }

        const { settings } = bodyResult.data;
        const results = [];
        const errors = [];

        for (const { key, value } of settings) {
            try {
                const currentSetting = await SystemSettings.findOne({ key }).lean();

                if (!currentSetting) {
                    errors.push({ key, error: "Setting not found" });
                    continue;
                }

                // Validate value matches type
                if (!validateSettingValue(value, currentSetting.type)) {
                    errors.push({ key, error: `Value does not match type '${currentSetting.type}'` });
                    continue;
                }

                const updatedSetting = await SystemSettings.findOneAndUpdate(
                    { key },
                    { value, updatedBy: req.user._id },
                    { new: true }
                ).lean();

                await createAuditLog({
                    adminId: req.user._id,
                    action: 'UPDATE',
                    resourceType: 'settings',
                    resourceId: currentSetting._id,
                    changes: { value },
                    previousValues: { value: currentSetting.value },
                    req
                });

                results.push(updatedSetting);
            } catch (err) {
                errors.push({ key, error: err.message });
            }
        }

        res.json({
            success: true,
            data: {
                updated: results,
                errors: errors.length > 0 ? errors : undefined
            },
            message: `${results.length} setting(s) updated successfully${errors.length > 0 ? `, ${errors.length} failed` : ''}`
        });
    } catch (error) {
        console.error('Error bulk updating settings:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to update settings"
        });
    }
});

/**
 * DELETE /api/admin/settings/:key
 * Delete a setting by key
 */
router.delete("/:key", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const setting = await SystemSettings.findOne({ key: req.params.key }).lean();
        if (!setting) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: "Setting not found"
            });
        }

        // DISABLED: Settings deletion is disabled for data safety
        console.error('❌ Settings deletion is DISABLED for data safety');
        return res.status(403).json({
            success: false,
            error: "OPERATION_DISABLED",
            message: "Settings deletion is disabled to prevent accidental data loss"
        });

        await createAuditLog({
            adminId: req.user._id,
            action: 'DELETE',
            resourceType: 'settings',
            resourceId: setting._id,
            previousValues: { key: setting.key, value: setting.value, type: setting.type },
            req
        });

        res.json({ success: true, message: "Setting deleted successfully" });
    } catch (error) {
        console.error('Error deleting setting:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to delete setting"
        });
    }
});


/* ---------------------- FEATURE TOGGLE ROUTES ---------------------- */

/**
 * GET /api/admin/settings/features
 * Get all feature flags
 * Requirements: 9.2 - Toggle features across the application
 */
router.get("/features/list", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const features = await SystemSettings.find({ category: 'features' })
            .populate('updatedBy', 'name email')
            .sort({ key: 1 })
            .lean();

        res.json({
            success: true,
            data: { features }
        });
    } catch (error) {
        console.error('Error listing features:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to retrieve features"
        });
    }
});

/**
 * PUT /api/admin/settings/features/:key
 * Toggle a feature flag
 * Requirements: 9.2 - Toggle features across the application
 */
router.put("/features/:key", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const bodyResult = featureToggleSchema.safeParse(req.body);
        if (!bodyResult.success) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "Invalid feature toggle data",
                details: bodyResult.error.errors
            });
        }

        const { enabled } = bodyResult.data;
        const featureKey = `feature_${req.params.key}`;

        // Find or create the feature setting
        let feature = await SystemSettings.findOne({ key: featureKey }).lean();

        if (!feature) {
            // Create new feature flag
            const newFeature = new SystemSettings({
                key: featureKey,
                value: enabled,
                type: 'boolean',
                description: `Feature flag for ${req.params.key}`,
                isPublic: false,
                category: 'features',
                updatedBy: req.user._id
            });

            await newFeature.save();

            await createAuditLog({
                adminId: req.user._id,
                action: 'CREATE',
                resourceType: 'settings',
                resourceId: newFeature._id,
                changes: { key: featureKey, enabled },
                req
            });

            return res.status(201).json({
                success: true,
                data: newFeature.toObject(),
                message: `Feature '${req.params.key}' created and ${enabled ? 'enabled' : 'disabled'}`
            });
        }

        const previousValue = feature.value;

        const updatedFeature = await SystemSettings.findOneAndUpdate(
            { key: featureKey },
            { value: enabled, updatedBy: req.user._id },
            { new: true }
        ).lean();

        await createAuditLog({
            adminId: req.user._id,
            action: 'UPDATE',
            resourceType: 'settings',
            resourceId: feature._id,
            changes: { enabled },
            previousValues: { enabled: previousValue },
            req
        });

        res.json({
            success: true,
            data: updatedFeature,
            message: `Feature '${req.params.key}' ${enabled ? 'enabled' : 'disabled'} successfully`
        });
    } catch (error) {
        console.error('Error toggling feature:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to toggle feature"
        });
    }
});

/* ---------------------- MAINTENANCE MODE ROUTES ---------------------- */

/**
 * GET /api/admin/settings/maintenance
 * Get maintenance mode status
 * Requirements: 9.3 - Enable maintenance mode
 */
router.get("/maintenance/status", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const maintenanceEnabled = await SystemSettings.getSetting('maintenance_mode_enabled', false);
        const maintenanceMessage = await SystemSettings.getSetting('maintenance_mode_message', 'The system is currently under maintenance.');
        const maintenanceEndTime = await SystemSettings.getSetting('maintenance_mode_end_time', null);
        const maintenanceAllowedIPs = await SystemSettings.getSetting('maintenance_mode_allowed_ips', []);

        res.json({
            success: true,
            data: {
                enabled: maintenanceEnabled,
                message: maintenanceMessage,
                estimatedEndTime: maintenanceEndTime,
                allowedIPs: maintenanceAllowedIPs
            }
        });
    } catch (error) {
        console.error('Error getting maintenance status:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to retrieve maintenance status"
        });
    }
});

/**
 * POST /api/admin/settings/maintenance
 * Toggle maintenance mode
 * Requirements: 9.3 - Enable maintenance mode for non-admin users
 */
router.post("/maintenance", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const bodyResult = maintenanceModeSchema.safeParse(req.body);
        if (!bodyResult.success) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "Invalid maintenance mode data",
                details: bodyResult.error.errors
            });
        }

        const { enabled, message, estimatedEndTime, allowedIPs } = bodyResult.data;

        // Get previous state for audit log
        const previousEnabled = await SystemSettings.getSetting('maintenance_mode_enabled', false);

        // Update maintenance mode settings
        await SystemSettings.setSetting('maintenance_mode_enabled', enabled, {
            type: 'boolean',
            description: 'Whether maintenance mode is enabled',
            isPublic: true,
            category: 'maintenance',
            updatedBy: req.user._id
        });

        await SystemSettings.setSetting('maintenance_mode_message', message, {
            type: 'string',
            description: 'Message displayed during maintenance',
            isPublic: true,
            category: 'maintenance',
            updatedBy: req.user._id
        });

        if (estimatedEndTime !== undefined) {
            await SystemSettings.setSetting('maintenance_mode_end_time', estimatedEndTime, {
                type: 'string',
                description: 'Estimated end time for maintenance',
                isPublic: true,
                category: 'maintenance',
                updatedBy: req.user._id
            });
        }

        await SystemSettings.setSetting('maintenance_mode_allowed_ips', allowedIPs, {
            type: 'json',
            description: 'IP addresses allowed during maintenance',
            isPublic: false,
            category: 'maintenance',
            updatedBy: req.user._id
        });

        await createAuditLog({
            adminId: req.user._id,
            action: enabled ? 'ACTIVATE' : 'DEACTIVATE',
            resourceType: 'settings',
            resourceId: null,
            changes: { enabled, message, estimatedEndTime, allowedIPs },
            previousValues: { enabled: previousEnabled },
            metadata: { settingType: 'maintenance_mode' },
            req
        });

        res.json({
            success: true,
            data: {
                enabled,
                message,
                estimatedEndTime,
                allowedIPs
            },
            message: `Maintenance mode ${enabled ? 'enabled' : 'disabled'} successfully`
        });
    } catch (error) {
        console.error('Error toggling maintenance mode:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to toggle maintenance mode"
        });
    }
});


/* ---------------------- API KEYS ROUTES ---------------------- */

/**
 * GET /api/admin/settings/api-keys
 * View API keys with masked values
 * Requirements: 9.4 - View API keys with masked values and copy functionality
 */
router.get("/api-keys/list", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const apiKeys = await SystemSettings.find({ category: 'api' })
            .populate('updatedBy', 'name email')
            .sort({ key: 1 })
            .lean();

        // Mask all API key values for security
        const maskedApiKeys = apiKeys.map(key => ({
            ...key,
            displayValue: maskSensitiveValue(key.key, key.value),
            isMasked: true
        }));

        res.json({
            success: true,
            data: { apiKeys: maskedApiKeys }
        });
    } catch (error) {
        console.error('Error listing API keys:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to retrieve API keys"
        });
    }
});

/**
 * GET /api/admin/settings/api-keys/:key/reveal
 * Reveal full API key value (for copy functionality)
 * Requirements: 9.4 - View API keys with masked values and copy functionality
 */
router.get("/api-keys/:key/reveal", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const apiKey = await SystemSettings.findOne({
            key: req.params.key,
            category: 'api'
        }).lean();

        if (!apiKey) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: "API key not found"
            });
        }

        // Log the reveal action for security audit
        await createAuditLog({
            adminId: req.user._id,
            action: 'UPDATE',
            resourceType: 'settings',
            resourceId: apiKey._id,
            metadata: { action: 'reveal_api_key', key: req.params.key },
            req
        });

        res.json({
            success: true,
            data: {
                key: apiKey.key,
                value: apiKey.value,
                description: apiKey.description
            }
        });
    } catch (error) {
        console.error('Error revealing API key:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to reveal API key"
        });
    }
});

/**
 * POST /api/admin/settings/api-keys
 * Create a new API key setting
 * Requirements: 9.4 - View API keys
 */
router.post("/api-keys", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const bodyResult = settingCreateSchema.safeParse({
            ...req.body,
            category: 'api',
            type: 'string',
            isPublic: false
        });

        if (!bodyResult.success) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: "Invalid API key data",
                details: bodyResult.error.errors
            });
        }

        const { key, value, description } = bodyResult.data;

        // Check for duplicate key
        const existing = await SystemSettings.findOne({ key });
        if (existing) {
            return res.status(409).json({
                success: false,
                error: "CONFLICT",
                message: "An API key with this name already exists"
            });
        }

        const apiKey = new SystemSettings({
            key,
            value,
            type: 'string',
            description: description || `API key for ${key}`,
            isPublic: false,
            category: 'api',
            updatedBy: req.user._id
        });

        await apiKey.save();

        await createAuditLog({
            adminId: req.user._id,
            action: 'CREATE',
            resourceType: 'settings',
            resourceId: apiKey._id,
            changes: { key, category: 'api' },
            req
        });

        res.status(201).json({
            success: true,
            data: {
                ...apiKey.toObject(),
                displayValue: maskSensitiveValue(key, value)
            },
            message: "API key created successfully"
        });
    } catch (error) {
        console.error('Error creating API key:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to create API key"
        });
    }
});

/**
 * PUT /api/admin/settings/api-keys/:key
 * Update an API key
 */
router.put("/api-keys/:key", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const { value, description } = req.body;

        const currentKey = await SystemSettings.findOne({
            key: req.params.key,
            category: 'api'
        }).lean();

        if (!currentKey) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: "API key not found"
            });
        }

        const updateData = { updatedBy: req.user._id };
        if (value !== undefined) updateData.value = value;
        if (description !== undefined) updateData.description = description;

        const updatedKey = await SystemSettings.findOneAndUpdate(
            { key: req.params.key, category: 'api' },
            updateData,
            { new: true }
        ).lean();

        await createAuditLog({
            adminId: req.user._id,
            action: 'UPDATE',
            resourceType: 'settings',
            resourceId: currentKey._id,
            changes: { updated: true },
            previousValues: { hadValue: !!currentKey.value },
            req
        });

        res.json({
            success: true,
            data: {
                ...updatedKey,
                displayValue: maskSensitiveValue(updatedKey.key, updatedKey.value)
            },
            message: "API key updated successfully"
        });
    } catch (error) {
        console.error('Error updating API key:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to update API key"
        });
    }
});

/**
 * DELETE /api/admin/settings/api-keys/:key
 * Delete an API key
 */
router.delete("/api-keys/:key", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const apiKey = await SystemSettings.findOne({
            key: req.params.key,
            category: 'api'
        }).lean();

        if (!apiKey) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: "API key not found"
            });
        }

        // DISABLED: API key deletion is disabled for data safety
        console.error('❌ API key deletion is DISABLED for data safety');
        return res.status(403).json({
            success: false,
            error: "OPERATION_DISABLED",
            message: "API key deletion is disabled to prevent accidental data loss"
        });

        await createAuditLog({
            adminId: req.user._id,
            action: 'DELETE',
            resourceType: 'settings',
            resourceId: apiKey._id,
            previousValues: { key: apiKey.key },
            req
        });

        res.json({ success: true, message: "API key deleted successfully" });
    } catch (error) {
        console.error('Error deleting API key:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to delete API key"
        });
    }
});

/* ---------------------- PUBLIC SETTINGS ROUTE ---------------------- */

/**
 * GET /api/admin/settings/public
 * Get all public settings (can be used by frontend without admin auth)
 */
router.get("/public/list", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const publicSettings = await SystemSettings.getPublicSettings();

        res.json({
            success: true,
            data: { settings: publicSettings }
        });
    } catch (error) {
        console.error('Error getting public settings:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to retrieve public settings"
        });
    }
});

/* ---------------------- SETTINGS BY CATEGORY ---------------------- */

/**
 * GET /api/admin/settings/category/:category
 * Get all settings in a specific category
 */
router.get("/category/:category", requireAdmin, async (req, res) => {
    try {
        await connectDB();

        const validCategories = ['general', 'features', 'maintenance', 'security', 'notifications', 'api'];
        if (!validCategories.includes(req.params.category)) {
            return res.status(400).json({
                success: false,
                error: "VALIDATION_ERROR",
                message: `Invalid category. Valid categories: ${validCategories.join(', ')}`
            });
        }

        const settings = await SystemSettings.find({ category: req.params.category })
            .populate('updatedBy', 'name email')
            .sort({ key: 1 })
            .lean();

        // Mask sensitive values
        const maskedSettings = settings.map(setting => ({
            ...setting,
            displayValue: maskSensitiveValue(setting.key, setting.value)
        }));

        res.json({
            success: true,
            data: {
                category: req.params.category,
                settings: maskedSettings
            }
        });
    } catch (error) {
        console.error('Error getting settings by category:', error);
        res.status(500).json({
            success: false,
            error: "INTERNAL_ERROR",
            message: "Failed to retrieve settings"
        });
    }
});

export default router;
