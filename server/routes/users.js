import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import otpService from "../src/services/otpService.js";
import { connectDB } from "../src/config/db.js";
import {
    logPasswordEvent,
    logAccountEvent,
    logDataAccessEvent
} from "../src/utils/auditUtils.js";
import {
    authenticateToken,
    validateInput,
    commonSchemas,
    errorHandler,
    sendSuccess
} from "../src/middleware/security.js";
import {
    validatePasswordStrength as validatePassword,
    checkPasswordHistory,
    addToPasswordHistory
} from '../src/services/passwordValidationService.js';
import notificationService from '../src/services/notificationService.js';
import fcmService from '../src/services/fcmService.js';

const router = Router();

// Validation schemas
const updateProfileSchema = z.object({
    name: z.string().min(1).optional(),
    avatar: z.string().optional(),
    bio: z.string().optional(),
    address: z.string().optional()
});

const changePasswordSchema = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(1) // Basic validation, detailed validation done separately
});

const updatePhoneSchema = z.object({
    currentPassword: z.string().min(1),
    newPhone: z.string().regex(/^\+?[\d\s\-\(\)]+$/, "Invalid phone number format"),
    otp: z.string().length(6, "OTP must be 6 digits")
});

const deleteAccountSchema = z.object({
    password: z.string().optional(), // Optional for OAuth users
    confirmation: z.literal("DELETE_MY_ACCOUNT")
});

// Note: Security event logging is now handled by auditUtils

// Get user profile
router.get("/me", authenticateToken, async (req, res) => {
    try {
        await connectDB();

        const user = await User.findById(req.user._id).lean();
        if (!user) {
            return res.status(404).json({
                success: false,
                error: "User not found",
                message: "User account not found"
            });
        }

        // Remove sensitive fields
        const { passwordHash, ...safeUser } = user;
        sendSuccess(res, safeUser, "User profile retrieved successfully");
    } catch (error) {
        console.error('Get user profile error:', error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
            message: "Failed to retrieve user profile"
        });
    }
});

// Update user profile
router.patch("/me",
    authenticateToken,
    validateInput({ body: commonSchemas.userProfileUpdate }),
    async (req, res) => {
        try {
            await connectDB();

            const user = await User.findByIdAndUpdate(req.user._id, req.body, { new: true }).lean();

            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: "User not found",
                    message: "User account not found"
                });
            }

            // Remove sensitive fields
            const { passwordHash, ...safeUser } = user;
            sendSuccess(res, safeUser, "Profile updated successfully");
        } catch (error) {
            console.error('Update profile error:', error);
            res.status(500).json({
                success: false,
                error: "Internal server error",
                message: "Failed to update profile"
            });
        }
    }
);

// Update privacy/notification settings
router.patch("/me/privacy", authenticateToken, async (req, res) => {
    try {
        await connectDB();
        const { pushNotifications } = req.body;
        
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ error: "User not found" });

        const previousPushSetting = user.privacySettings?.communications?.pushNotifications;
        
        // Update the setting
        if (!user.privacySettings) user.privacySettings = {};
        if (!user.privacySettings.communications) user.privacySettings.communications = {};
        
        if (typeof pushNotifications === 'boolean') {
            user.privacySettings.communications.pushNotifications = pushNotifications;
            await user.save();

            // Handle FCM topic subscription/unsubscription
            if (user.fcmTokens && user.fcmTokens.length > 0) {
                if (pushNotifications && !previousPushSetting) {
                    await fcmService.subscribeToTopic(user.fcmTokens, 'property_alerts');
                } else if (!pushNotifications && previousPushSetting) {
                    await fcmService.unsubscribeFromTopic(user.fcmTokens, 'property_alerts');
                }
            }
        }

        const { passwordHash, ...safeUser } = user.toObject();
        sendSuccess(res, safeUser, "Privacy settings updated");
    } catch (error) {
        console.error('Update privacy error:', error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Register FCM token
router.post("/fcm-token", authenticateToken, async (req, res) => {
    try {
        await connectDB();
        const { token, deviceType } = req.body;
        if (!token) return res.status(400).json({ error: "Token is required" });

        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ error: "User not found" });

        // Initialize fcmTokens if it doesn't exist
        if (!user.fcmTokens) user.fcmTokens = [];

        // Check if token already exists
        const tokenIndex = user.fcmTokens.findIndex(t => t.token === token);

        if (tokenIndex > -1) {
            // Update existing token metadata
            user.fcmTokens[tokenIndex].lastUsedAt = new Date();
            if (deviceType) user.fcmTokens[tokenIndex].deviceType = deviceType;
        } else {
            // Add new token
            user.fcmTokens.push({
                token,
                deviceType: deviceType || "other",
                lastUsedAt: new Date()
            });
        }

        await user.save();

        // Auto-subscribe if preferences allow
        const pushEnabled = user.privacySettings?.communications?.pushNotifications !== false;
        if (pushEnabled) {
            await fcmService.subscribeToTopic(token, 'property_alerts');
        }

        res.json({ success: true, message: "FCM token registered" });
    } catch (error) {
        console.error('Register FCM token error:', error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Unregister FCM token
router.delete("/fcm-token/:token", authenticateToken, async (req, res) => {
    try {
        await connectDB();
        const { token } = req.params;
        const { unsubscribe } = req.query; // Check if we should also unsubscribe from topics
        
        if (!token) return res.status(400).json({ error: "Token is required" });

        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ error: "User not found" });

        // Remove token from user record
        if (user.fcmTokens) {
            user.fcmTokens = user.fcmTokens.filter(t => t.token !== token);
            await user.save();
        }

        // Unsubscribe from main topics only if explicitly requested
        if (unsubscribe === 'true') {
            await fcmService.unsubscribeFromTopic(token, 'property_alerts');
        }

        res.json({ success: true, message: "FCM token unregistered" });
    } catch (error) {
        console.error('Unregister FCM token error:', error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Change password
router.post("/change-password",
    authenticateToken,
    validateInput({ body: changePasswordSchema }),
    async (req, res) => {
        try {
            await connectDB();

            const { currentPassword, newPassword } = req.body;

            // Get user with password hash
            const user = await User.findById(req.user._id);
            if (!user) {
                await logPasswordEvent(req.user._id, 'change', false, { reason: 'user_not_found' }, req);
                return res.status(404).json({
                    success: false,
                    error: "User not found",
                    message: "User account not found"
                });
            }

            // Verify current password
            const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
            if (!isCurrentPasswordValid) {
                await logPasswordEvent(req.user._id, 'change', false, { reason: 'invalid_current_password' }, req);
                return res.status(401).json({ error: "Current password is incorrect" });
            }

            // Validate new password strength with enhanced validation
            const passwordValidation = validatePassword(newPassword, {
                name: user.name,
                email: user.email
            });

            if (!passwordValidation.isValid) {
                await logPasswordEvent(req.user._id, 'change', false, {
                    reason: 'weak_password',
                    errors: passwordValidation.errors,
                    warnings: passwordValidation.warnings
                }, req);
                return res.status(400).json({
                    error: "Password does not meet security requirements",
                    requirements: passwordValidation.errors,
                    warnings: passwordValidation.warnings,
                    score: passwordValidation.score,
                    strength: passwordValidation.strength
                });
            }

            // Check if new password is different from current
            const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash);
            if (isSamePassword) {
                await logPasswordEvent(req.user._id, 'change', false, { reason: 'same_password' }, req);
                return res.status(400).json({ error: "New password must be different from current password" });
            }

            // Check password history to prevent reuse
            const passwordHistory = user.passwordHistory || [];
            const isPasswordReused = await checkPasswordHistory(newPassword, passwordHistory, 5);
            if (isPasswordReused) {
                await logPasswordEvent(req.user._id, 'change', false, { reason: 'password_reused' }, req);
                return res.status(400).json({
                    error: "Cannot reuse a recent password. Please choose a different password."
                });
            }

            // Hash new password
            const saltRounds = 12;
            const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

            // Add current password to history before updating
            const updatedPasswordHistory = addToPasswordHistory(passwordHistory, user.passwordHash, 10);

            // Update password, timestamp, and history
            await User.findByIdAndUpdate(req.user._id, {
                passwordHash: newPasswordHash,
                lastPasswordChange: new Date(),
                passwordHistory: updatedPasswordHistory
            });

            await logPasswordEvent(req.user._id, 'change', true, {}, req);

            // Send security event notification
            try {
                await notificationService.sendSecurityEventNotification(
                    req.user._id,
                    'passwordChange',
                    {
                        timestamp: new Date().toISOString(),
                        ipAddress: req.ip,
                        userAgent: req.get('User-Agent')
                    }
                );
            } catch (notificationError) {
                console.error('Failed to send password change notification:', notificationError);
                // Don't fail the password change if notification fails
            }

            res.json({
                success: true,
                message: "Password changed successfully"
            });

        } catch (error) {
            console.error('Change password error:', error);
            if (error.name === 'ZodError') {
                return res.status(400).json({ error: "Invalid input data", details: error.errors });
            }
            res.status(500).json({ error: "Internal server error" });
        }
    });

// Update phone number with OTP verification
router.post("/update-phone", async (req, res) => {
    try {
        await connectDB();

        const userId = req.headers["x-user-id"];
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized (provide x-user-id header for dev)" });
        }

        const { currentPassword, newPhone, otp } = updatePhoneSchema.parse(req.body);

        // Get user with password hash
        const user = await User.findById(userId);
        if (!user) {
            await logAccountEvent(userId, 'phone_update', false, { reason: 'user_not_found' }, req);
            return res.status(404).json({ error: "User not found" });
        }

        // Verify current password
        const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isPasswordValid) {
            await logAccountEvent(userId, 'phone_update', false, { reason: 'invalid_password' }, req);
            return res.status(401).json({ error: "Current password is incorrect" });
        }

        // Validate OTP for the new phone number
        const otpValidation = await otpService.validateOTP(userId, 'phone', newPhone, otp);
        if (!otpValidation.success) {
            await logAccountEvent(userId, 'phone_update', false, { reason: 'invalid_otp', message: otpValidation.message }, req);
            return res.status(400).json({ error: otpValidation.message });
        }

        // Update phone number (OTP validation already marked phone as verified)
        const updatedUser = await User.findByIdAndUpdate(userId, {
            phone: newPhone
        }, { new: true }).lean();

        await logAccountEvent(userId, 'phone_update', true, { newPhone }, req);

        // Send security event notification
        try {
            await notificationService.sendSecurityEventNotification(
                userId,
                'phoneUpdate',
                {
                    newPhone,
                    timestamp: new Date().toISOString(),
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent')
                }
            );
        } catch (notificationError) {
            console.error('Failed to send phone update notification:', notificationError);
            // Don't fail the phone update if notification fails
        }

        // Remove sensitive fields
        const { passwordHash, ...safeUser } = updatedUser;
        res.json({
            success: true,
            message: "Phone number updated successfully",
            user: safeUser
        });

    } catch (error) {
        console.error('Update phone error:', error);
        if (error.name === 'ZodError') {
            return res.status(400).json({ error: "Invalid input data", details: error.errors });
        }
        res.status(500).json({ error: "Internal server error" });
    }
});

// Delete account
router.delete("/delete-account", async (req, res) => {
    try {
        await connectDB();

        const userId = req.headers["x-user-id"];
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized (provide x-user-id header for dev)" });
        }

        const { password, confirmation } = deleteAccountSchema.parse(req.body);

        // Get user with password hash
        const user = await User.findById(userId);
        if (!user) {
            await logAccountEvent(userId, 'deletion', false, { reason: 'user_not_found' }, req);
            return res.status(404).json({ error: "User not found" });
        }

        // Check if user is OAuth user (no password required)
        const isOAuthUser = user.authProvider && user.authProvider !== 'local';

        if (isOAuthUser) {
            // OAuth users don't need password verification
            // The confirmation text is sufficient
        } else {
            // Local users must provide password
            if (!password) {
                return res.status(400).json({ error: "Password is required for local accounts" });
            }

            // Verify password
            const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
            if (!isPasswordValid) {
                await logAccountEvent(userId, 'deletion', false, { reason: 'invalid_password' }, req);
                return res.status(401).json({ error: "Password is incorrect" });
            }
        }

        // Log successful deletion attempt before removing data
        await logAccountEvent(userId, 'deletion', true, { email: user.email, phone: user.phone }, req);

        // Send security event notification before deleting data
        try {
            await notificationService.sendSecurityEventNotification(
                userId,
                'accountDeletion',
                {
                    timestamp: new Date().toISOString(),
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent')
                }
            );
        } catch (notificationError) {
            console.error('Failed to send account deletion notification:', notificationError);
            // Don't fail the account deletion if notification fails
        }

        // Use the comprehensive data cleanup service
        const dataCleanupService = (await import("../src/services/dataCleanupService.js")).default;

        const deletionResult = await dataCleanupService.performAccountDeletion(
            userId,
            {
                preserveAuditLogs: true, // Keep audit logs for compliance
                softDelete: false, // Hard delete for this endpoint
                anonymizeData: false
            }
        );

        if (!deletionResult.success) {
            await logAccountEvent(userId, 'deletion', false, {
                reason: 'cleanup_service_failed',
                error: deletionResult.error
            }, req);
            return res.status(500).json({
                error: "Account deletion failed",
                details: deletionResult.error
            });
        }

        res.json({
            success: true,
            message: "Account deleted successfully"
        });

    } catch (error) {
        console.error('Delete account error:', error);
        if (error.name === 'ZodError') {
            return res.status(400).json({ error: "Invalid input data", details: error.errors });
        }
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
