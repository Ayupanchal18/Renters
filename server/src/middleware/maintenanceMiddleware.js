import jwt from "jsonwebtoken";
import { User } from "../../models/User.js";
import { SystemSettings } from "../../models/SystemSettings.js";

/**
 * Middleware to check if maintenance mode is enabled.
 * Allows all /api/admin/* routes, auth APIs, and logged-in Admins complete access.
 * Blocks public non-admin API requests with 503 Service Unavailable when maintenance is ON.
 */
export async function checkMaintenanceMode(req, res, next) {
    try {
        const isEnabled = await SystemSettings.getSetting("maintenance_mode_enabled", false);
        if (!isEnabled) {
            return next();
        }

        const originalUrl = req.originalUrl || req.url || "";
        const path = req.path || "";

        // 1. ALWAYS ALLOW ALL ADMIN API ROUTES, AUTH, MAINTENANCE STATUS & PING!
        if (
            originalUrl.startsWith("/api/admin") ||
            originalUrl.startsWith("/api/auth") ||
            originalUrl.startsWith("/api/maintenance") ||
            originalUrl === "/api/ping" ||
            path.startsWith("/admin") ||
            path.startsWith("/auth") ||
            path.startsWith("/maintenance")
        ) {
            return next();
        }

        // 2. Extract user & role from JWT token or req.user
        let isAdmin = req.user && req.user.role === "admin";

        if (!isAdmin && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
            try {
                const token = req.headers.authorization.split(" ")[1];
                
                // First try verifying with secret
                const secret = process.env.JWT_SECRET;
                let decoded = null;
                if (secret) {
                    try {
                        decoded = jwt.verify(token, secret);
                    } catch (e) {
                        decoded = jwt.decode(token);
                    }
                } else {
                    decoded = jwt.decode(token);
                }

                if (decoded && (decoded.role === "admin" || decoded.role === "super_admin")) {
                    isAdmin = true;
                } else if (decoded && (decoded.sub || decoded.id || decoded.userId)) {
                    const userId = decoded.sub || decoded.id || decoded.userId;
                    const u = await User.findById(userId).select("role").lean();
                    if (u && (u.role === "admin" || u.role === "super_admin")) {
                        isAdmin = true;
                    }
                }
            } catch (err) {
                // Token parse error
            }
        }

        // 3. ALLOW LOGGED-IN ADMINS COMPLETELY!
        if (isAdmin) {
            return next();
        }

        // 4. Check allowed IP bypasses
        const allowedIPs = await SystemSettings.getSetting("maintenance_mode_allowed_ips", []);
        const clientIP = req.ip || req.headers["x-forwarded-for"] || "";

        if (Array.isArray(allowedIPs) && allowedIPs.includes(clientIP)) {
            return next();
        }

        const message = await SystemSettings.getSetting("maintenance_mode_message", "The system is currently undergoing scheduled maintenance.");
        const estimatedEndTime = await SystemSettings.getSetting("maintenance_mode_end_time", null);

        return res.status(503).json({
            success: false,
            maintenance: true,
            error: "MAINTENANCE_MODE",
            message,
            estimatedEndTime
        });
    } catch (error) {
        console.error("Maintenance middleware error:", error);
        next();
    }
}
