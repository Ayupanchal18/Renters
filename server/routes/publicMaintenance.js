import { Router } from "express";
import { SystemSettings } from "../models/SystemSettings.js";

const router = Router();

/**
 * GET /api/maintenance/status
 * Returns public maintenance mode status
 */
router.get("/status", async (req, res) => {
    try {
        const enabled = await SystemSettings.getSetting("maintenance_mode_enabled", false);
        const message = await SystemSettings.getSetting("maintenance_mode_message", "The system is currently undergoing scheduled maintenance.");
        const estimatedEndTime = await SystemSettings.getSetting("maintenance_mode_end_time", null);

        res.json({
            success: true,
            data: {
                enabled,
                message,
                estimatedEndTime
            }
        });
    } catch (error) {
        console.error("Get maintenance status error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch maintenance status"
        });
    }
});

export default router;
