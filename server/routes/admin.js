import { Router } from "express";
import { Property } from "../models/Property.js";
import { User } from "../models/User.js";
import { requireAdmin } from "../src/middleware/adminAuth.js";

const router = Router();

// List properties for moderation (legacy endpoint)
router.get("/listings", requireAdmin, (async (req, res) => {
    const status = String(req.query.status || "active");
    const properties = await Property.find({ status }).populate("owner", "name email").lean();
    res.json(properties);
}));

// Approve / Feature property (legacy endpoint)
router.patch("/listings/:id", requireAdmin, (async (req, res) => {
    const { featured, status } = req.body;
    const prop = await Property.findByIdAndUpdate(req.params.id, { featured, status }, { new: true }).lean();
    if (!prop)
        return res.status(404).json({ error: "Not found" });
    res.json(prop);
}));

// DISABLED: Property deletion is disabled for data safety
router.delete("/listings/:id", requireAdmin, (async (req, res) => {
    console.error('❌ Property deletion is DISABLED for data safety');
    res.status(403).json({
        success: false,
        error: "OPERATION_DISABLED",
        message: "Property deletion is disabled to prevent accidental data loss"
    });
}));

// NOTE: /users endpoints are now handled by adminUsers.js
// These legacy endpoints are kept for backward compatibility but redirect to new routes

export default router;
