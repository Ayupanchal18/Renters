import { Router } from "express";
import { authenticateToken } from "../src/middleware/security.js";
import jwt from "jsonwebtoken";

const router = Router();

/**
 * POST /api/drm/token
 * Generate a short-lived DRM authorization token for video streaming & media playback
 */
router.post("/token", authenticateToken, async (req, res) => {
    try {
        const { mediaId, contentId } = req.body;
        const targetId = mediaId || contentId || "media_default";

        // Secret for signing DRM tokens
        const drmSecret = process.env.DRM_JWT_SECRET || process.env.JWT_SECRET || "renters_drm_secret_key_2026";

        // Generate a 1-hour short-lived DRM session token
        const drmToken = jwt.sign(
            {
                userId: req.user._id,
                email: req.user.email,
                role: req.user.role,
                targetId,
                scope: "l3_drm_stream",
            },
            drmSecret,
            { expiresIn: "1h" }
        );

        res.json({
            success: true,
            data: {
                token: drmToken,
                protectionLevel: "Widevine L3 / Encrypted HLS CENC",
                licenseServerUrl: `${req.protocol}://${req.get("host")}/api/drm/license`,
                expiresInSeconds: 3600,
            }
        });
    } catch (error) {
        console.error("[DRM Token Generation Error]:", error);
        res.status(500).json({
            success: false,
            error: "DRM_TOKEN_FAILED",
            message: "Failed to issue DRM playback authorization token."
        });
    }
});

/**
 * POST /api/drm/license
 * License Key Server Handshake (EME key challenge exchange)
 */
router.post("/license", async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                error: "UNAUTHORIZED_DRM_CHALLENGE",
                message: "Missing or invalid DRM authorization token"
            });
        }

        const drmToken = authHeader.split(" ")[1];
        const drmSecret = process.env.DRM_JWT_SECRET || process.env.JWT_SECRET || "renters_drm_secret_key_2026";

        let decoded;
        try {
            decoded = jwt.verify(drmToken, drmSecret);
        } catch (err) {
            return res.status(403).json({
                success: false,
                error: "EXPIRED_DRM_TOKEN",
                message: "DRM playback token has expired or is invalid."
            });
        }

        // Return Widevine / ClearKey key payload session response
        // Mock Widevine L3 ClearKey response structure for standard web player handshakes
        res.set({
            "Content-Type": "application/json",
            "Cache-Control": "no-store, private",
        });

        res.json({
            status: "granted",
            sessionType: "temporary",
            robustness: "SW_SECURE_CRYPTO",
            userId: decoded.userId,
            grantedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error("[DRM License Handshake Error]:", error);
        res.status(500).json({
            success: false,
            error: "LICENSE_DENIED",
            message: "DRM License server handshake failed."
        });
    }
});

export default router;
