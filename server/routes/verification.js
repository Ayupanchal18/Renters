import { Router } from "express";
import { z } from "zod";
import { User } from "../models/User.js";
import otpService from "../src/services/otpService.js";
import notificationService from "../src/services/notificationService.js";
import enhancedOTPManager from "../src/services/enhancedOTPManager.js";
import { DeliveryPreferences } from "../models/DeliveryPreferences.js";
import { connectDB } from "../src/config/db.js";
import { logVerificationEvent } from "../src/utils/auditUtils.js";
import { authenticateToken } from "../src/middleware/security.js";

const router = Router();

/* ---------------------- SCHEMAS ---------------------- */
const sendOTPSchema = z.object({
    type: z.enum(["email", "phone"]),
    contact: z.string().min(1)
});

const verifyOTPSchema = z.object({
    type: z.enum(["email", "phone"]),
    contact: z.string().min(1),
    otp: z.string().length(6)
});

/* ---------------------- RATE LIMITING MIDDLEWARE ---------------------- */
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS_PER_WINDOW = 5;

const rateLimitMiddleware = (req, res, next) => {
    const userId = req.headers["x-user-id"];
    const ip = req.ip || req.connection.remoteAddress;
    const key = userId || ip;

    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW;

    if (!rateLimitMap.has(key)) {
        rateLimitMap.set(key, []);
    }

    const requests = rateLimitMap.get(key);

    // Remove old requests outside the window
    const validRequests = requests.filter(timestamp => timestamp > windowStart);
    rateLimitMap.set(key, validRequests);

    if (validRequests.length >= MAX_REQUESTS_PER_WINDOW) {
        return res.status(429).json({
            success: false,
            error: "Rate limit exceeded",
            message: `Too many requests. Please wait ${Math.ceil(RATE_LIMIT_WINDOW / 60000)} minutes before trying again.`,
            retryAfter: Math.ceil((validRequests[0] + RATE_LIMIT_WINDOW - now) / 1000)
        });
    }

    // Add current request
    validRequests.push(now);
    rateLimitMap.set(key, validRequests);

    next();
};

/* ---------------------- HELPER FUNCTIONS ---------------------- */
// Note: Security event logging is now handled by auditUtils

const validateContact = (type, contact) => {
    if (type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(contact);
    } else if (type === 'phone') {
        // Basic phone validation - adjust regex as needed for your requirements
        const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
        return phoneRegex.test(contact);
    }
    return false;
};

/* ---------------------- SEND OTP ENDPOINT ---------------------- */
router.post("/send-otp", authenticateToken, rateLimitMiddleware, async (req, res) => {
    try {
        await connectDB();

        // Use authenticated user from JWT token
        const userId = req.user._id;

        const data = sendOTPSchema.parse(req.body);
        const { type, contact } = data;

        // Validate contact format
        if (!validateContact(type, contact)) {
            await logVerificationEvent(userId, type, 'otp_send_attempt', false, {
                reason: 'invalid_contact_format',
                contact: type === 'email' ? contact : 'hidden'
            }, req);

            return res.status(400).json({
                success: false,
                error: "Invalid contact format",
                message: `Please provide a valid ${type === 'email' ? 'email address' : 'phone number'}`
            });
        }

        // Find user and verify they own this contact
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: "User not found",
                message: "User account not found"
            });
        }

        // Verify the contact belongs to the user
        const userContact = type === 'email' ? user.email : user.phone;
        if (userContact !== contact) {
            await logVerificationEvent(userId, type, 'otp_send_attempt', false, {
                reason: 'contact_mismatch',
                providedContact: type === 'email' ? contact : 'hidden'
            }, req);

            return res.status(403).json({
                success: false,
                error: "Contact mismatch",
                message: `The provided ${type} does not match your account`
            });
        }

        // Check if already verified
        const isVerified = type === 'email' ? user.emailVerified : user.phoneVerified;
        if (isVerified) {
            return res.status(400).json({
                success: false,
                error: "Already verified",
                message: `Your ${type} is already verified`
            });
        }

        // Use enhanced OTP manager for delivery with user preferences
        const deliveryResult = await enhancedOTPManager.generateAndSend(userId, type, contact);

        if (!deliveryResult.success) {
            await logVerificationEvent(userId, type, 'otp_send_failed', false, {
                contact: type === 'email' ? contact : 'hidden',
                error: deliveryResult.error,
                deliveryId: deliveryResult.deliveryId
            }, req);

            return res.status(400).json({
                success: false,
                error: "OTP delivery failed",
                message: deliveryResult.error,
                deliveryId: deliveryResult.deliveryId
            });
        }

        // Log successful OTP generation and delivery
        await logVerificationEvent(userId, type, 'otp_sent', true, {
            contact: type === 'email' ? contact : 'hidden',
            expiresAt: deliveryResult.expiresAt,
            deliveryId: deliveryResult.deliveryId,
            serviceName: deliveryResult.serviceName,
            deliveryMethod: deliveryResult.deliveryMethod,
            estimatedDelivery: deliveryResult.estimatedDelivery
        }, req);

        // Return success response
        res.json({
            success: true,
            message: `OTP sent to your ${type} via ${deliveryResult.serviceName}`,
            deliveryId: deliveryResult.deliveryId,
            expiresAt: deliveryResult.expiresAt.toISOString(),
            serviceName: deliveryResult.serviceName,
            deliveryMethod: deliveryResult.deliveryMethod,
            estimatedDelivery: deliveryResult.estimatedDelivery,
            // Include OTP in development mode for testing
            ...(process.env.NODE_ENV === 'development' && { otp: deliveryResult.attempts[0]?.otp })
        });

    } catch (error) {
        console.error("Send OTP error:", error);

        const userId = req.headers["x-user-id"];
        if (userId) {
            await logVerificationEvent(userId, req.body?.type || 'unknown', 'otp_send_failed', false, {
                error: error.message
            }, req);
        }

        if (error.code === 'RATE_LIMIT_EXCEEDED') {
            return res.status(429).json({
                success: false,
                error: "Rate limit exceeded",
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            error: "Internal server error",
            message: "Failed to send OTP. Please try again later."
        });
    }
});

/* ---------------------- VERIFY OTP ENDPOINT ---------------------- */
router.post("/verify-otp", authenticateToken, rateLimitMiddleware, async (req, res) => {
    try {
        await connectDB();

        // Use authenticated user from JWT token
        const userId = req.user._id;

        const data = verifyOTPSchema.parse(req.body);
        const { type, contact, otp } = data;

        // Validate contact format
        if (!validateContact(type, contact)) {
            await logVerificationEvent(userId, type, 'verification_attempt', false, {
                reason: 'invalid_contact_format',
                contact: type === 'email' ? contact : 'hidden'
            }, req);

            return res.status(400).json({
                success: false,
                error: "Invalid contact format",
                message: `Please provide a valid ${type === 'email' ? 'email address' : 'phone number'}`
            });
        }

        // Find user and verify they own this contact
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: "User not found",
                message: "User account not found"
            });
        }

        // Verify the contact belongs to the user
        // Verify the contact belongs to the user
        const userContact = type === 'email' ? user.email : user.phone;
        if (userContact !== contact) {
            await logVerificationEvent(userId, type, 'verification_attempt', false, {
                reason: 'contact_mismatch',
                providedContact: type === 'email' ? contact : 'hidden'
            }, req);

            return res.status(403).json({
                success: false,
                error: "Contact mismatch",
                message: `The provided ${type} does not match your account`
            });
        }

        // Validate OTP
        const result = await otpService.validateOTP(userId, type, contact, otp);

        // Log verification attempt
        await logVerificationEvent(userId, type, 'verification', result.success, {
            contact: type === 'email' ? contact : 'hidden',
            verified: result.verified || false
        }, req);

        if (result.success) {
            res.json({
                success: true,
                message: result.message,
                verified: result.verified
            });
        } else {
            res.status(400).json({
                success: false,
                error: "Verification failed",
                message: result.message
            });
        }

    } catch (error) {
        console.error("Verify OTP error:", error);

        const userId = req.headers["x-user-id"];
        if (userId) {
            await logVerificationEvent(userId, req.body?.type || 'unknown', 'verification_failed', false, {
                error: error.message
            }, req);
        }

        res.status(500).json({
            success: false,
            error: "Internal server error",
            message: "Failed to verify OTP. Please try again later."
        });
    }
});

/* ---------------------- GET SERVICE STATUS ENDPOINT ---------------------- */
router.get("/service-status", async (req, res) => {
    try {
        const status = notificationService.getServiceStatus();

        res.json({
            success: true,
            services: status
        });

    } catch (error) {
        console.error("Get service status error:", error);

        res.status(500).json({
            success: false,
            error: "Internal server error",
            message: "Failed to get service status"
        });
    }
});

/* ---------------------- GET VERIFICATION STATUS ENDPOINT ---------------------- */
router.get("/status", authenticateToken, async (req, res) => {
    try {
        await connectDB();

        // Use authenticated user from JWT token instead of x-user-id header
        const userId = req.user._id;

        const user = await User.findById(userId).select('emailVerified phoneVerified emailVerifiedAt phoneVerifiedAt email phone');
        if (!user) {
            return res.status(404).json({
                success: false,
                error: "User not found",
                message: "User account not found"
            });
        }

        res.json({
            success: true,
            verification: {
                email: {
                    verified: user.emailVerified || false,
                    verifiedAt: user.emailVerifiedAt || null,
                    contact: user.email || null
                },
                phone: {
                    verified: user.phoneVerified || false,
                    verifiedAt: user.phoneVerifiedAt || null,
                    contact: user.phone || null
                }
            }
        });

    } catch (error) {
        console.error("Get verification status error:", error);

        res.status(500).json({
            success: false,
            error: "Internal server error",
            message: "Failed to get verification status"
        });
    }
});

/* ---------------------- GET DELIVERY STATUS ENDPOINT ---------------------- */
router.get("/delivery-status/:deliveryId", authenticateToken, async (req, res) => {
    try {
        await connectDB();

        // Use authenticated user from JWT token
        const userId = req.user._id;

        const { deliveryId } = req.params;
        const deliveryStatus = await enhancedOTPManager.getDeliveryStatus(userId, deliveryId);

        if (!deliveryStatus.found) {
            return res.status(404).json({
                success: false,
                error: "Delivery not found",
                message: "Delivery ID not found or does not belong to this user"
            });
        }

        res.json({
            success: true,
            deliveryStatus
        });

    } catch (error) {
        console.error("Get delivery status error:", error);

        res.status(500).json({
            success: false,
            error: "Internal server error",
            message: "Failed to get delivery status"
        });
    }
});

/* ---------------------- RETRY OTP DELIVERY ENDPOINT ---------------------- */
router.post("/retry-delivery", authenticateToken, async (req, res) => {
    try {
        await connectDB();

        // Use authenticated user from JWT token
        const userId = req.user._id;

        const { deliveryId, method } = req.body;

        if (!deliveryId) {
            return res.status(400).json({
                success: false,
                error: "Missing delivery ID",
                message: "Delivery ID is required for retry"
            });
        }

        const retryResult = await enhancedOTPManager.retryDelivery(deliveryId, method);

        if (!retryResult.success) {
            await logVerificationEvent(userId, method || 'unknown', 'retry_failed', false, {
                deliveryId,
                error: retryResult.error
            }, req);

            return res.status(400).json({
                success: false,
                error: "Retry failed",
                message: retryResult.error
            });
        }

        // Log successful retry
        await logVerificationEvent(userId, retryResult.attempt.method, 'retry_successful', true, {
            deliveryId,
            serviceName: retryResult.attempt.serviceName,
            method: retryResult.attempt.method,
            estimatedDelivery: retryResult.attempt.estimatedDelivery
        }, req);

        res.json({
            success: true,
            message: "OTP delivery retry initiated successfully",
            attempt: retryResult.attempt
        });

    } catch (error) {
        console.error("Retry delivery error:", error);

        res.status(500).json({
            success: false,
            error: "Internal server error",
            message: "Failed to retry OTP delivery"
        });
    }
});

/* ---------------------- GET DELIVERY HISTORY ENDPOINT ---------------------- */
router.get("/delivery-history", authenticateToken, async (req, res) => {
    try {
        await connectDB();

        // Use authenticated user from JWT token
        const userId = req.user._id;

        const limit = parseInt(req.query.limit) || 10;
        const hours = parseInt(req.query.hours) || 24;

        const historyResult = await enhancedOTPManager.getUserDeliveryHistory(userId, limit, hours);

        if (!historyResult.success) {
            return res.status(500).json({
                success: false,
                error: "Failed to retrieve history",
                message: historyResult.error
            });
        }

        res.json({
            success: true,
            history: historyResult.history,
            stats: historyResult.stats
        });

    } catch (error) {
        console.error("Get delivery history error:", error);

        res.status(500).json({
            success: false,
            error: "Internal server error",
            message: "Failed to get delivery history"
        });
    }
});

export default router;