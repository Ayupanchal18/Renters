import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import http from "http";
import propertiesRouter from "./routes/properties.js";
import { createAuditMiddleware } from "./src/middleware/auditLogger.js";
import apiErrorHandler from "./src/middleware/errorHandler.js";
import {
    addRequestId,
    securityHeaders,
    enforceHttps,
    errorHandler,
    createRateLimiter
} from "./src/middleware/security.js";
import { createRequestLogger } from "./src/middleware/requestLogger.js";
import { createCacheHeadersMiddleware } from "./src/middleware/cacheHeaders.js";
import { setupSwagger } from "./src/docs/swagger.js";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import {
    adminWriteLimit,
    bulkLimit,
    passwordLimit,
    exportLimit
} from "./src/middleware/rateLimiter.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const debugFile = path.join(__dirname, "../debug.log");
fs.appendFileSync(debugFile, `[INDEX.JS] Loading at ${new Date().toISOString()}\n`);


export default async function createServer(devMode = false) {

    const app = express();
    
    // DEBUG: Log all incoming requests to check mobile connectivity
    app.use((req, res, next) => {
        console.log(`[SERVER DEBUG] ${req.method} ${req.url} - Origin: ${req.get('origin') || 'none'} - IP: ${req.ip}`);
        next();
    });

    // Create http server for both dev and production to support Socket.IO
    const httpServer = http.createServer(app);

    // HTTPS enforcement in production
    if (process.env.NODE_ENV === 'production') {
        app.use(enforceHttps);
    }

    // Trust proxy for proper IP detection behind reverse proxies
    app.set('trust proxy', 1);

    // CORS configuration
    const isDevelopment = devMode || process.env.NODE_ENV === 'development';
    const defaultDevOrigins = [
        'http://localhost:8080',
        'http://localhost:3000',
        'http://localhost:5173',
        'http://127.0.0.1:8080',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5173'
    ];

    const allowedOrigins = process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
        : defaultDevOrigins;

    app.use(cors({
        origin: (origin, callback) => {
            // Allow requests with no origin (same-origin, mobile apps, curl, Postman, etc.)
            if (!origin) {
                return callback(null, true);
            }

            // In development, allow all localhost origins
            if (isDevelopment && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
                return callback(null, true);
            }

            // In development, allow local network IPs (for testing on other devices over WiFi)
            if (isDevelopment) {
                // Match private IP ranges: 192.168.x.x, 10.x.x.x, 172.16.x.x - 172.31.x.x
                const localNetworkPattern = /^https?:\/\/(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3})(:\d+)?$/;
                if (localNetworkPattern.test(origin)) {
                    return callback(null, true);
                }
            }

            // Allow Railway deployment origins (production)
            if (origin.includes('.railway.app')) {
                return callback(null, true);
            }

            // Allow Netlify deployment origins
            if (origin.includes('.netlify.app')) {
                return callback(null, true);
            }

            // Allow Vercel deployment origins
            if (origin.includes('.vercel.app')) {
                return callback(null, true);
            }

            // Check if origin is in allowed list or wildcard is set
            if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
                return callback(null, true);
            }

            console.warn(`CORS blocked origin: ${origin}. Allowed: ${allowedOrigins.join(', ') || 'none'}`);
            callback(new Error('Not allowed by CORS'));
        },
        credentials: true, // Allow cookies
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
        exposedHeaders: ['X-Request-ID'],
        maxAge: 86400 // Cache preflight for 24 hours
    }));

    // Cookie parser for httpOnly cookies (refresh tokens)
    app.use(cookieParser());

    // Body parsing with size limits
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Serve uploaded files (property images, etc.)
    app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
    // Also serve from root uploads folder
    app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

    // Security middleware
    app.use(addRequestId);
    app.use(securityHeaders);

    // MongoDB Query sanitization to prevent NoSQL injection
    app.use((req, res, next) => {
        const sanitizeFn = mongoSanitize.sanitize || ((v) => v);
        ['body', 'params', 'headers', 'query'].forEach((key) => {
            if (req[key] && typeof req[key] === 'object') {
                try {
                    sanitizeFn(req[key], { replaceWith: '_' });
                } catch (e) {
                    // Fail-silent to prevent any server crash
                }
            }
        });
        next();
    });

    // Helmet security headers (without conflicting with our existing CSP)
    app.use(helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
    }));

    // Request logging middleware (after addRequestId so we have request IDs)
    app.use(createRequestLogger({
        logRequestStart: process.env.LOG_REQUEST_START !== 'false',
        slowRequestThreshold: parseInt(process.env.SLOW_REQUEST_THRESHOLD_MS, 10) || 1000,
        excludePaths: ['/api/ping', '/health', '/favicon.ico']
    }));

    // Cache headers middleware for GET endpoints (Requirements: 4.4)
    app.use(createCacheHeadersMiddleware({
        enabled: process.env.ENABLE_CACHE_HEADERS !== 'false',
        excludePaths: ['/api/ping', '/health']
    }));

    // Rate limiting ONLY for auth endpoints (login, register, OTP)
    // This prevents brute force attacks while allowing normal browsing
    const authRateLimiter = createRateLimiter({
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 10, // 10 attempts per 15 minutes
        message: "Too many authentication attempts, please try again later"
    });
    
    // Apply password limit to sensitive auth routes
    app.use('/api/auth/login', passwordLimit);
    app.use('/api/auth/register', passwordLimit);
    
    // Apply fallback auth rate limiter to sending OTP
    app.use('/api/verification/send-otp', authRateLimiter);

    // Apply bulk rate limit to bulk operations
    app.use('/api/admin/users/bulk/status', bulkLimit);
    app.use('/api/admin/users/bulk', bulkLimit);
    app.use('/api/admin/properties/bulk/status', bulkLimit);
    app.use('/api/admin/reviews/bulk/approve', bulkLimit);
    app.use('/api/admin/reviews/bulk/reject', bulkLimit);

    // Apply export limit to bulk export endpoints
    app.use('/api/admin/users/bulk/export', exportLimit);
    app.use('/api/admin/properties/bulk/export', exportLimit);

    // Apply general admin write action rate limiter (60 actions/min)
    app.use('/api/admin', (req, res, next) => {
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
            // Skip bulk and export paths since they are limited by bulkLimit and exportLimit
            if (req.path.includes('/bulk') || req.path.includes('/export')) {
                return next();
            }
            return adminWriteLimit(req, res, next);
        }
        next();
    });

    // Security audit logging middleware
    app.use(createAuditMiddleware({
        logAllRequests: process.env.AUDIT_LOG_ALL_REQUESTS === 'true',
        sensitiveRoutes: [
            '/api/users/change-password',
            '/api/users/update-phone',
            '/api/users/delete-account',
            '/api/verification/send-otp',
            '/api/verification/verify-otp',
            '/api/auth/login',
            '/api/auth/register',
            '/api/auth/refresh',
            '/api/auth/logout',
            '/api/privacy/export',
            '/api/privacy/delete-account',
            '/api/privacy/consent',
            '/api/privacy/settings'
        ]
    }));

    // Basic route
    app.get("/api/ping", (_req, res) => {
        res.json({ message: process.env.PING_MESSAGE ?? "ping" });
    });

    // Setup Swagger API documentation (Requirements: 5.1, 5.5)
    setupSwagger(app);

    // Public config endpoint for client-side OAuth configuration
    // Only exposes non-sensitive public client IDs
    app.get("/api/config/public", (_req, res) => {
        res.json({
            googleClientId: process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || null,
            googleAndroidClientId: process.env.GOOGLE_ANDROID_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || null,
            googleIosClientId: process.env.GOOGLE_IOS_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || null,
            facebookAppId: process.env.FACEBOOK_APP_ID || process.env.VITE_FACEBOOK_APP_ID || null,
        });
    });

    // -------------------------
    //   CONNECT DATABASE
    // -------------------------
    try {
        const { connectDB } = await import(
            `file://${path.join(__dirname, "src/config/db.js")}`
        );
        await connectDB();
        console.log("🟢 Database connected successfully in Express (Vite Middleware)");

        // Initialize database with indexes and default configurations
        const { initializeDatabase } = await import(
            `file://${path.join(__dirname, "src/config/dbInit.js")}`
        );
        await initializeDatabase();
    } catch (err) {
        console.warn("DB connection/initialization failed:", err);
    }

    // -------------------------
    //   REGISTER ROUTES
    // -------------------------
    const safeImport = async (relativePath) =>
        import(`file://${path.join(__dirname, relativePath)}`);

    try {
        app.use("/api/auth", (await safeImport("routes/auth.js")).default);
        app.use("/api/auth", (await safeImport("routes/socialAuth.js")).default);
        app.use("/api/verification", (await safeImport("routes/verification.js")).default);
        app.use("/api/properties/rent", (await safeImport("routes/rentProperties.js")).default);
        app.use("/api/properties/buy", (await safeImport("routes/buyProperties.js")).default);
        app.use("/api/properties", (await safeImport("routes/properties.js")).default);
        app.use("/api/bookings", (await safeImport("routes/bookings.js")).default);
        app.use("/api/users", (await safeImport("routes/users.js")).default);
        app.use("/api/wishlist", (await safeImport("routes/wishlist.js")).default);
        app.use("/api/conversations", (await safeImport("routes/conversations.js")).default);
        app.use("/api/messages", (await safeImport("routes/messages.js")).default);
        app.use("/api/notifications", (await safeImport("routes/notifications.js")).default);
        app.use("/api/search", (await safeImport("routes/search.js")).default);
        app.use("/api/categories", (await safeImport("routes/publicCategories.js")).default);
        app.use("/api/locations", (await safeImport("routes/publicLocations.js")).default);
        app.use("/api/testimonials", (await safeImport("routes/publicTestimonials.js")).default);

        // -------------------------
        //   ADMIN ROUTES
        //   All admin routes are protected by requireAdmin middleware
        // -------------------------
        app.use("/api/admin", (await safeImport("routes/admin.js")).default);
        app.use("/api/admin/users", (await safeImport("routes/adminUsers.js")).default);
        app.use("/api/admin/properties", (await safeImport("routes/adminProperties.js")).default);
        app.use("/api/admin/dashboard", (await safeImport("routes/adminDashboard.js")).default);
        app.use("/api/admin/locations", (await safeImport("routes/adminLocations.js")).default);
        app.use("/api/admin/categories", (await safeImport("routes/adminCategories.js")).default);
        app.use("/api/admin/content", (await safeImport("routes/adminContent.js")).default);
        app.use("/api/admin/notifications", (await safeImport("routes/adminNotifications.js")).default);
        app.use("/api/admin/reviews", (await safeImport("routes/adminReviews.js")).default);
        app.use("/api/admin/settings", (await safeImport("routes/adminSettings.js")).default);
        app.use("/api/admin/reports", (await safeImport("routes/adminReports.js")).default);
        app.use("/api/admin/audit-logs", (await safeImport("routes/adminAuditLogs.js")).default);
        app.use("/api/admin/messages", (await safeImport("routes/adminMessages.js")).default);
        app.use("/api/admin/testimonials", (await safeImport("routes/adminTestimonials.js")).default);
        app.use("/api/admin/verifications", (await safeImport("routes/adminVerifications.js")).default);
        app.use("/api/admin/search", (await safeImport("routes/adminSearch.js")).default);
        app.use("/api/admin/roles", (await safeImport("routes/adminRoles.js")).default);
        app.use("/api/admin/notification-center", (await safeImport("routes/adminNotificationCenter.js")).default);
        app.use("/api/admin/media", (await safeImport("routes/adminMedia.js")).default);
        app.use("/api/admin/analytics", (await safeImport("routes/adminAnalytics.js")).default);
        app.use("/api/admin/vault", (await safeImport("routes/adminVault.js")).default);

        app.use("/api/upload", (await safeImport("routes/upload.js")).default);
        app.use("/api/vault", (await safeImport("routes/vault.js")).default);
        app.use("/api/leases", (await safeImport("routes/leases.js")).default);
        app.use("/api/audit", (await safeImport("routes/audit.js")).default);
        app.use("/api/privacy", (await safeImport("routes/privacy.js")).default);
        app.use("/api/delivery-preferences", (await safeImport("routes/deliveryPreferences.js")).default);
        app.use("/api/delivery-metrics", (await safeImport("routes/deliveryMetrics.js")).default);

        app.use("/api/user-diagnostics", (await safeImport("routes/userDiagnostics.js")).default);
        app.use("/api/alerts", (await safeImport("routes/alertRoutes.js")).default);
        app.use("/api/nearby", (await safeImport("routes/nearby.js")).default);
        app.use("/api/geocode", (await safeImport("routes/geocode.js")).default);
        app.use("/api/price-trends", (await safeImport("routes/priceTrendsRoutes.js")).default);
        // app.use("/api/properties", propertiesRouter); // Removed redundant registration

        // SEO Routes - sitemap.xml for search engine crawlers
        app.use("/sitemap.xml", (await safeImport("routes/sitemap.js")).default);

    } catch (err) {
        console.warn("Failed to load routes:", err);
    }

    // -------------------------
    //   INITIALIZE SOCKET.IO
    // -------------------------
    try {
        const { setupSocket } = await import("./socket.js");
        setupSocket(httpServer);
        console.log("✅ Socket.IO server initialized");
    } catch (err) {
        console.warn("Socket.IO initialization failed:", err);
    }

    // -------------------------
    //   START CMS SCHEDULER
    // -------------------------
    try {
        const { startPublishScheduler } = await import("./src/jobs/publishScheduler.js");
        startPublishScheduler();
    } catch (err) {
        console.warn("CMS scheduler initialization failed:", err);
    }

    // In development mode, don't add catch-all error handlers
    // Let Vite handle non-API routes
    // Note: In production, static files and catch-all are handled in start.js
    // so we only add error handler here, not notFoundHandler
    // Centralized API error handler (always format API errors as JSON)
    app.use("/api", apiErrorHandler);

    if (!devMode) {
        app.use(errorHandler);
    }

    // Return app for dev mode, or object with app and httpServer for production
    return devMode ? app : { app, httpServer };
}
