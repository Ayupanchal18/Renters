import { Router } from "express";
import { z } from "zod";
import { User } from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { connectDB } from "../src/config/db.js";
import { logAuthEvent } from "../src/utils/auditUtils.js";

const router = Router();

/* ---------------------- SECURITY CONFIGURATION ---------------------- */
const BCRYPT_SALT_ROUNDS = 12; // Increased from 10 for better security
const ACCESS_TOKEN_EXPIRY = "15m"; // Short-lived access token
const REFRESH_TOKEN_EXPIRY = "7d"; // Longer-lived refresh token

// SECURITY: JWT_SECRET must be set in environment
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || jwtSecret === "change-me-in-env" || jwtSecret.length < 32) {
    console.error("❌ CRITICAL: JWT_SECRET is not properly configured!");
    console.error("Please set a strong JWT_SECRET (min 32 characters) in your .env file");
}

/* ---------------------- RATE LIMITING ---------------------- */
const loginAttempts = new Map();
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

const checkLoginRateLimit = (identifier) => {
    const now = Date.now();
    const attempts = loginAttempts.get(identifier);

    if (!attempts) return { allowed: true };

    // Clean up old attempts
    const recentAttempts = attempts.filter(time => now - time < LOGIN_LOCKOUT_TIME);
    loginAttempts.set(identifier, recentAttempts);

    if (recentAttempts.length >= MAX_LOGIN_ATTEMPTS) {
        const oldestAttempt = recentAttempts[0];
        const timeRemaining = Math.ceil((LOGIN_LOCKOUT_TIME - (now - oldestAttempt)) / 1000);
        return { allowed: false, retryAfter: timeRemaining };
    }

    return { allowed: true };
};

const recordLoginAttempt = (identifier) => {
    const attempts = loginAttempts.get(identifier) || [];
    attempts.push(Date.now());
    loginAttempts.set(identifier, attempts);
};

const clearLoginAttempts = (identifier) => {
    loginAttempts.delete(identifier);
};

/* ---------------------- SCHEMAS ---------------------- */
const registerSchema = z.object({
    name: z.string().min(2).max(100),
    email: z.string().email().transform(val => val.toLowerCase().trim()), // Normalize email
    phone: z.string().optional(),
    address: z.string().max(500).optional(),
    userType: z.enum(["buyer", "seller", "agent"]).optional(),
    password: z.string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/\d/, "Password must contain at least one number"),
    // Consent fields - required for GDPR compliance
    acceptTerms: z.boolean().refine(val => val === true, {
        message: "You must accept the Terms of Service"
    }),
    acceptPrivacyPolicy: z.boolean().refine(val => val === true, {
        message: "You must accept the Privacy Policy"
    }),
});

const loginSchema = z.object({
    email: z.string().email().optional().transform(val => val?.toLowerCase().trim()),
    phone: z.string().optional(),
    password: z.string().min(1),
});
/* ---------------------- HELPERS ---------------------- */
const safeUser = (u) => ({
    id: u._id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    address: u.address,
    userType: u.userType,
    role: u.role,
    avatar: u.avatar,
    emailVerified: u.emailVerified,
    phoneVerified: u.phoneVerified,
    emailVerifiedAt: u.emailVerifiedAt,
    phoneVerifiedAt: u.phoneVerifiedAt,
    createdAt: u.createdAt,
    // Privacy compliance info
    privacyPolicyAcceptedAt: u.privacyPolicyAcceptedAt,
    termsAcceptedAt: u.termsAcceptedAt,
});

/**
 * Generate access and refresh tokens
 * Access token: Short-lived, used for API requests
 * Refresh token: Long-lived, used to get new access tokens
 */
const generateTokens = (user) => {
    const accessToken = jwt.sign(
        { sub: user._id, role: user.role, type: 'access' },
        jwtSecret,
        { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    const refreshToken = jwt.sign(
        { sub: user._id, type: 'refresh' },
        jwtSecret,
        { expiresIn: REFRESH_TOKEN_EXPIRY }
    );

    return { accessToken, refreshToken };
};

/* ---------------------- REGISTER ROUTE ---------------------- */
router.post("/register", (async (req, res) => {
    try {
        await connectDB();

        // Validate input with consent requirements
        const data = registerSchema.parse(req.body);

        // Check existing email (normalized)
        const existing = await User.findOne({ email: data.email });
        if (existing) {
            return res.status(409).json({
                success: false,
                error: "Email already registered"
            });
        }

        // Hash password with strong salt rounds
        const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
        const passwordHash = await bcrypt.hash(data.password, salt);

        // Create user with consent tracking
        const user = new User({
            name: data.name,
            email: data.email,
            phone: data.phone,
            address: data.address,
            userType: data.userType,
            passwordHash,
            // GDPR compliance: Record consent
            termsAcceptedAt: new Date(),
            termsVersion: "1.0",
            privacyPolicyAcceptedAt: new Date(),
            privacyPolicyVersion: "1.0",
            consentGivenAt: new Date(),
            // Initialize password history
            passwordHistory: [{ hash: passwordHash, createdAt: new Date() }],
            lastPasswordChange: new Date(),
        });

        await user.save();

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user);

        // Log successful registration (without sensitive data)
        if (typeof logAuthEvent === 'function') {
            await logAuthEvent(user._id, 'register', true, { userType: data.userType }, req);
        }

        // Set refresh token as httpOnly cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(201).json({
            success: true,
            user: safeUser(user),
            token: accessToken,
        });
    }
    catch (err) {
        console.error("REGISTER ERROR ->", err.name, err.message);

        // Handle Zod validation errors
        if (err.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                error: "Validation failed",
                details: err.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
            });
        }

        if (err.message?.includes("buffering timed out")) {
            return res.status(503).json({
                success: false,
                error: "Database connection failed. Please try again later.",
            });
        }

        res.status(400).json({ success: false, error: err.message });
    }
}));
/* ---------------------- LOGIN ROUTE ---------------------- */
router.post("/login", (async (req, res) => {
    try {
        await connectDB();
        const data = loginSchema.parse(req.body);

        // Rate limiting check
        const identifier = data.email || data.phone || req.ip;
        const rateLimit = checkLoginRateLimit(identifier);

        if (!rateLimit.allowed) {
            if (typeof logAuthEvent === 'function') {
                await logAuthEvent(null, 'login_rate_limited', false, { identifier: data.email ? 'email' : 'phone' }, req);
            }
            return res.status(429).json({
                success: false,
                error: "Too many login attempts",
                message: `Please try again in ${rateLimit.retryAfter} seconds`,
                retryAfter: rateLimit.retryAfter
            });
        }

        // Find user by email or phone
        const user = data.email
            ? await User.findOne({ email: data.email, isDeleted: { $ne: true } })
            : data.phone
                ? await User.findOne({ phone: data.phone, isDeleted: { $ne: true } })
                : null;

        if (!user) {
            recordLoginAttempt(identifier);
            // Use generic error to prevent user enumeration
            return res.status(401).json({
                success: false,
                error: "Invalid credentials"
            });
        }

        // Check if user is blocked
        if (user.isBlocked) {
            if (typeof logAuthEvent === 'function') {
                await logAuthEvent(user._id, 'login_blocked', false, { reason: user.blockedReason }, req);
            }
            return res.status(403).json({
                success: false,
                error: "Account suspended",
                message: "Your account has been suspended. Please contact support."
            });
        }

        // Check if user is active
        if (user.isActive === false) {
            return res.status(403).json({
                success: false,
                error: "Account inactive",
                message: "Your account is inactive. Please contact support."
            });
        }

        // Compare password
        const match = await bcrypt.compare(data.password, user.passwordHash);
        if (!match) {
            recordLoginAttempt(identifier);
            if (typeof logAuthEvent === 'function') {
                await logAuthEvent(user._id, 'login_failed', false, { reason: 'invalid_password' }, req);
            }
            return res.status(401).json({
                success: false,
                error: "Invalid credentials"
            });
        }

        // Clear rate limit on successful login
        clearLoginAttempts(identifier);

        // Update last login timestamp
        user.lastLoginAt = new Date();
        user.lastActivityAt = new Date();
        await user.save();

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user);

        // Log successful login
        if (typeof logAuthEvent === 'function') {
            await logAuthEvent(user._id, 'login_success', true, {}, req);
        }

        // Set refresh token as httpOnly cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.json({
            success: true,
            user: safeUser(user),
            token: accessToken,
            // Include flag if password change is required
            mustChangePassword: user.mustChangePassword || false,
        });
    }
    catch (err) {
        console.error("LOGIN ERROR ->", err.name, err.message);

        if (err.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                error: "Validation failed",
                details: err.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
            });
        }

        if (err.message?.includes("buffering timed out")) {
            return res.status(503).json({
                success: false,
                error: "Database connection failed. Please try again later.",
            });
        }

        res.status(400).json({ success: false, error: err.message });
    }
}));

/* ---------------------- REFRESH TOKEN ROUTE ---------------------- */
router.post("/refresh", (async (req, res) => {
    try {
        const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                error: "Refresh token required"
            });
        }

        // Verify refresh token
        const decoded = jwt.verify(refreshToken, jwtSecret);

        if (decoded.type !== 'refresh') {
            return res.status(401).json({
                success: false,
                error: "Invalid token type"
            });
        }

        await connectDB();
        const user = await User.findById(decoded.sub);

        if (!user || user.isDeleted || user.isBlocked) {
            return res.status(401).json({
                success: false,
                error: "User not found or inactive"
            });
        }

        // Generate new tokens
        const tokens = generateTokens(user);

        // Set new refresh token
        res.cookie('refreshToken', tokens.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.json({
            success: true,
            token: tokens.accessToken
        });
    }
    catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: "Refresh token expired",
                message: "Please login again"
            });
        }

        res.status(401).json({
            success: false,
            error: "Invalid refresh token"
        });
    }
}));

/* ---------------------- LOGOUT ROUTE ---------------------- */
router.post("/logout", (async (req, res) => {
    try {
        // Clear refresh token cookie
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });

        res.json({
            success: true,
            message: "Logged out successfully"
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            error: "Logout failed"
        });
    }
}));
/* ---------------------- EXPORT ROUTER ---------------------- */
export default router;
