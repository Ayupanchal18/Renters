import { Router } from "express";
import { z } from "zod";
import { DeliveryPreferences } from "../models/DeliveryPreferences.js";
import { User } from "../models/User.js";
import { connectDB } from "../src/config/db.js";
import { logVerificationEvent } from "../src/utils/auditUtils.js";

const router = Router();

/* ---------------------- SCHEMAS ---------------------- */
const updatePreferencesSchema = z.object({
    preferredMethod: z.enum(['sms', 'email', 'auto']).optional(),
    preferredService: z.enum(['phone-email', 'twilio', 'smtp', 'auto']).optional(),
    allowFallback: z.boolean().optional(),
    fallbackOrder: z.array(z.object({
        service: z.enum(['phone-email', 'twilio', 'smtp']),
        method: z.enum(['sms', 'email']),
        priority: z.number().min(1)
    })).optional(),
    notificationSettings: z.object({
        deliveryConfirmation: z.boolean().optional(),
        failureAlerts: z.boolean().optional(),
        retryNotifications: z.boolean().optional(),
        estimatedDeliveryTime: z.boolean().optional()
    }).optional(),
    deliveryWindow: z.object({
        enabled: z.boolean().optional(),
        startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(), // HH:MM format
        endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(), // HH:MM format
        timezone: z.string().optional()
    }).optional(),
    rateLimiting: z.object({
        maxAttemptsPerHour: z.number().min(1).max(100).optional(),
        maxAttemptsPerDay: z.number().min(1).max(1000).optional(),
        cooldownMinutes: z.number().min(1).max(60).optional()
    }).optional(),
    accessibility: z.object({
        largeText: z.boolean().optional(),
        highContrast: z.boolean().optional(),
        screenReader: z.boolean().optional()
    }).optional()
});

const testDeliverySchema = z.object({
    method: z.enum(['sms', 'email']),
    contact: z.string().min(1)
});

/* ---------------------- MIDDLEWARE ---------------------- */
const requireAuth = (req, res, next) => {
    const userId = req.headers["x-user-id"];
    if (!userId) {
        return res.status(401).json({
            success: false,
            error: "Unauthorized",
            message: "Authentication required"
        });
    }
    req.userId = userId;
    next();
};

/* ---------------------- GET USER DELIVERY PREFERENCES ---------------------- */
router.get("/", requireAuth, async (req, res) => {
    try {
        await connectDB();

        // Get or create preferences for the user
        const preferences = await DeliveryPreferences.getOrCreate(req.userId);

        res.json({
            success: true,
            preferences: {
                userId: preferences.userId,
                preferredMethod: preferences.preferredMethod,
                preferredService: preferences.preferredService,
                allowFallback: preferences.allowFallback,
                fallbackOrder: preferences.fallbackOrder,
                notificationSettings: preferences.notificationSettings,
                deliveryWindow: preferences.deliveryWindow,
                rateLimiting: preferences.rateLimiting,
                accessibility: preferences.accessibility,
                createdAt: preferences.createdAt,
                updatedAt: preferences.updatedAt
            }
        });

    } catch (error) {
        console.error("Get delivery preferences error:", error);

        res.status(500).json({
            success: false,
            error: "Internal server error",
            message: "Failed to retrieve delivery preferences"
        });
    }
});

/* ---------------------- UPDATE USER DELIVERY PREFERENCES ---------------------- */
router.put("/", requireAuth, async (req, res) => {
    try {
        await connectDB();

        const data = updatePreferencesSchema.parse(req.body);

        // Validate delivery window times if provided
        if (data.deliveryWindow?.startTime && data.deliveryWindow?.endTime) {
            const startTime = data.deliveryWindow.startTime.replace(':', '');
            const endTime = data.deliveryWindow.endTime.replace(':', '');

            if (startTime >= endTime) {
                return res.status(400).json({
                    success: false,
                    error: "Invalid delivery window",
                    message: "Start time must be before end time"
                });
            }
        }

        // Validate fallback order if provided
        if (data.fallbackOrder) {
            const priorities = data.fallbackOrder.map(f => f.priority);
            const uniquePriorities = new Set(priorities);

            if (priorities.length !== uniquePriorities.size) {
                return res.status(400).json({
                    success: false,
                    error: "Invalid fallback order",
                    message: "Fallback priorities must be unique"
                });
            }
        }

        // Update preferences
        const preferences = await DeliveryPreferences.updatePreferences(req.userId, data);

        // Log the preference update
        await logVerificationEvent(req.userId, 'preferences', 'preferences_updated', true, {
            updatedFields: Object.keys(data),
            preferredMethod: preferences.preferredMethod,
            preferredService: preferences.preferredService,
            allowFallback: preferences.allowFallback
        }, req);

        res.json({
            success: true,
            message: "Delivery preferences updated successfully",
            preferences: {
                userId: preferences.userId,
                preferredMethod: preferences.preferredMethod,
                preferredService: preferences.preferredService,
                allowFallback: preferences.allowFallback,
                fallbackOrder: preferences.fallbackOrder,
                notificationSettings: preferences.notificationSettings,
                deliveryWindow: preferences.deliveryWindow,
                rateLimiting: preferences.rateLimiting,
                accessibility: preferences.accessibility,
                updatedAt: preferences.updatedAt
            }
        });

    } catch (error) {
        console.error("Update delivery preferences error:", error);

        // Log failed update attempt
        await logVerificationEvent(req.userId, 'preferences', 'preferences_update_failed', false, {
            error: error.message
        }, req);

        if (error.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                error: "Validation error",
                message: "Invalid preference data provided",
                details: error.errors
            });
        }

        res.status(500).json({
            success: false,
            error: "Internal server error",
            message: "Failed to update delivery preferences"
        });
    }
});

/* ---------------------- RESET PREFERENCES TO DEFAULTS ---------------------- */
router.post("/reset", requireAuth, async (req, res) => {
    try {
        await connectDB();

        // DISABLED: Deletion operations are disabled for data safety
        console.error('❌ Delivery preferences reset is DISABLED for data safety');
        return res.status(403).json({
            success: false,
            error: "OPERATION_DISABLED",
            message: "Delivery preferences reset is disabled to prevent accidental data loss. Please update preferences manually instead."
        });

        // Create new default preferences
        const preferences = await DeliveryPreferences.getOrCreate(req.userId);

        // Log the reset
        await logVerificationEvent(req.userId, 'preferences', 'preferences_reset', true, {
            resetToDefaults: true
        }, req);

        res.json({
            success: true,
            message: "Delivery preferences reset to defaults",
            preferences: {
                userId: preferences.userId,
                preferredMethod: preferences.preferredMethod,
                preferredService: preferences.preferredService,
                allowFallback: preferences.allowFallback,
                fallbackOrder: preferences.fallbackOrder,
                notificationSettings: preferences.notificationSettings,
                deliveryWindow: preferences.deliveryWindow,
                rateLimiting: preferences.rateLimiting,
                accessibility: preferences.accessibility,
                createdAt: preferences.createdAt,
                updatedAt: preferences.updatedAt
            }
        });

    } catch (error) {
        console.error("Reset delivery preferences error:", error);

        res.status(500).json({
            success: false,
            error: "Internal server error",
            message: "Failed to reset delivery preferences"
        });
    }
});

/* ---------------------- GET DELIVERY PLAN ---------------------- */
router.get("/delivery-plan", requireAuth, async (req, res) => {
    try {
        await connectDB();

        const preferences = await DeliveryPreferences.getOrCreate(req.userId);

        // Mock available services for now - this would come from service configuration in real implementation
        const availableServices = [
            {
                serviceName: 'phone-email',
                capabilities: ['sms', 'email'],
                priority: 1,
                status: 'healthy'
            },
            {
                serviceName: 'twilio',
                capabilities: ['sms'],
                priority: 2,
                status: 'healthy'
            },
            {
                serviceName: 'smtp',
                capabilities: ['email'],
                priority: 3,
                status: 'healthy'
            }
        ];

        const deliveryPlan = preferences.getDeliveryPlan(availableServices);

        res.json({
            success: true,
            deliveryPlan,
            availableServices,
            withinDeliveryWindow: preferences.isWithinDeliveryWindow()
        });

    } catch (error) {
        console.error("Get delivery plan error:", error);

        res.status(500).json({
            success: false,
            error: "Internal server error",
            message: "Failed to generate delivery plan"
        });
    }
});

/* ---------------------- CHECK RATE LIMITS ---------------------- */
router.get("/rate-limit-status", requireAuth, async (req, res) => {
    try {
        await connectDB();

        const preferences = await DeliveryPreferences.getOrCreate(req.userId);
        const rateLimitStatus = await preferences.checkRateLimit();

        res.json({
            success: true,
            rateLimitStatus
        });

    } catch (error) {
        console.error("Check rate limit error:", error);

        res.status(500).json({
            success: false,
            error: "Internal server error",
            message: "Failed to check rate limit status"
        });
    }
});

/* ---------------------- TEST DELIVERY PREFERENCES ---------------------- */
router.post("/test-delivery", requireAuth, async (req, res) => {
    try {
        await connectDB();

        const data = testDeliverySchema.parse(req.body);
        const { method, contact } = data;

        // Verify user owns the contact
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: "User not found",
                message: "User account not found"
            });
        }

        const userContact = method === 'email' ? user.email : user.phone;
        if (userContact !== contact) {
            return res.status(403).json({
                success: false,
                error: "Contact mismatch",
                message: `The provided ${method} does not match your account`
            });
        }

        // Get user preferences
        const preferences = await DeliveryPreferences.getOrCreate(req.userId);

        // Check rate limits
        const rateLimitStatus = await preferences.checkRateLimit();
        if (!rateLimitStatus.withinHourlyLimit || !rateLimitStatus.withinDailyLimit) {
            return res.status(429).json({
                success: false,
                error: "Rate limit exceeded",
                message: "Too many delivery attempts. Please try again later.",
                rateLimitStatus
            });
        }

        // Check delivery window
        if (!preferences.isWithinDeliveryWindow()) {
            return res.status(400).json({
                success: false,
                error: "Outside delivery window",
                message: "Test delivery is outside your configured delivery window"
            });
        }

        // For now, simulate a test delivery
        // In the full implementation, this would use the enhanced OTP manager
        const testResult = {
            success: true,
            method,
            contact: method === 'email' ? contact : 'hidden',
            timestamp: new Date().toISOString(),
            estimatedDelivery: new Date(Date.now() + 30000).toISOString(), // 30 seconds
            testMessage: `Test ${method} delivery to verify your preferences`
        };

        // Log the test delivery
        await logVerificationEvent(req.userId, method, 'test_delivery', true, {
            method,
            contact: method === 'email' ? contact : 'hidden',
            preferences: {
                preferredMethod: preferences.preferredMethod,
                preferredService: preferences.preferredService,
                allowFallback: preferences.allowFallback
            }
        }, req);

        res.json({
            success: true,
            message: "Test delivery initiated successfully",
            testResult
        });

    } catch (error) {
        console.error("Test delivery error:", error);

        if (error.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                error: "Validation error",
                message: "Invalid test delivery data provided",
                details: error.errors
            });
        }

        res.status(500).json({
            success: false,
            error: "Internal server error",
            message: "Failed to initiate test delivery"
        });
    }
});

/* ---------------------- GET PREFERENCE STATISTICS (ADMIN) ---------------------- */
router.get("/stats", requireAuth, async (req, res) => {
    try {
        await connectDB();

        // This endpoint could be restricted to admin users in a real implementation
        const stats = await DeliveryPreferences.getPreferenceStats();

        res.json({
            success: true,
            stats: stats[0] || {
                totalUsers: 0,
                smsPreferred: 0,
                emailPreferred: 0,
                autoPreferred: 0,
                phoneEmailServicePreferred: 0,
                fallbackEnabled: 0
            }
        });

    } catch (error) {
        console.error("Get preference stats error:", error);

        res.status(500).json({
            success: false,
            error: "Internal server error",
            message: "Failed to retrieve preference statistics"
        });
    }
});

export default router;