import "dotenv/config";
import express from "express";
import cors from "cors";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import propertiesRouter from "./routes/properties.js";
import { createAuditMiddleware } from "./src/middleware/auditLogger.js";
import {
    addRequestId,
    securityHeaders,
    errorHandler,
    notFoundHandler
} from "./src/middleware/security.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function createServer(devMode = false) {
    const app = express();

    // Create http server for both dev and production to support Socket.IO
    const httpServer = http.createServer(app);

    // Middleware
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Serve uploaded files (property images, etc.)
    app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
    // Also serve from root uploads folder
    app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

    // Security middleware
    app.use(addRequestId);
    app.use(securityHeaders);

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

    // -------------------------
    //   CONNECT DATABASE
    // -------------------------
    try {
        const { connectDB } = await import(
            `file://${path.join(__dirname, "src/config/db.js")}`
        );
        await connectDB();

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
        app.use("/api/verification", (await safeImport("routes/verification.js")).default);
        app.use("/api/properties", (await safeImport("routes/properties.js")).default);
        app.use("/api/users", (await safeImport("routes/users.js")).default);
        app.use("/api/wishlist", (await safeImport("routes/wishlist.js")).default);
        app.use("/api/conversations", (await safeImport("routes/conversations.js")).default);
        app.use("/api/messages", (await safeImport("routes/messages.js")).default);
        app.use("/api/notifications", (await safeImport("routes/notifications.js")).default);
        app.use("/api/search", (await safeImport("routes/search.js")).default);
        app.use("/api/categories", (await safeImport("routes/publicCategories.js")).default);

        // -------------------------
        //   ADMIN ROUTES
        //   All admin routes are protected by requireAdmin middleware
        //   Requirements: 1.2, 1.5 - Verify admin role and validate permissions
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

        app.use("/api/upload", (await safeImport("routes/upload.js")).default);
        app.use("/api/audit", (await safeImport("routes/audit.js")).default);
        app.use("/api/privacy", (await safeImport("routes/privacy.js")).default);
        app.use("/api/delivery-preferences", (await safeImport("routes/deliveryPreferences.js")).default);
        app.use("/api/delivery-metrics", (await safeImport("routes/deliveryMetrics.js")).default);
        app.use("/api/configuration-testing", (await safeImport("routes/configurationTesting.js")).default);
        app.use("/api/user-diagnostics", (await safeImport("routes/userDiagnostics.js")).default);
        app.use("/api/alerts", (await safeImport("routes/alertRoutes.js")).default);
        app.use("/api/nearby", (await safeImport("routes/nearby.js")).default);
        app.use("/api/properties", propertiesRouter);

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

    // In development mode, don't add catch-all error handlers
    // Let Vite handle non-API routes
    // Note: In production, static files and catch-all are handled in start.js
    // so we only add error handler here, not notFoundHandler
    if (!devMode) {
        app.use(errorHandler);
    }

    // Return app for dev mode, or object with app and httpServer for production
    return devMode ? app : { app, httpServer };
}
