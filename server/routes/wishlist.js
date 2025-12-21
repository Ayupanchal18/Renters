import { Router } from "express";
import { Wishlist } from "../models/Wishlist.js";
import { Property } from "../models/Property.js";
const router = Router();
// Get user's wishlist
router.get("/", (async (req, res) => {
    try {
        const userId = req.headers["x-user-id"];
        if (!userId)
            return res.status(401).json({ error: "Unauthorized" });
        const items = await Wishlist.find({ user: userId }).populate("property").lean();
        res.json(items);
    }
    catch (err) {
        res.status(503).json({ error: "Database connection failed" });
    }
}));
// Add to wishlist
router.post("/:propertyId", (async (req, res) => {
    try {
        const userId = req.headers["x-user-id"];
        if (!userId)
            return res.status(401).json({ error: "Unauthorized" });
        const { propertyId } = req.params;
        const existing = await Wishlist.findOne({ user: userId, property: propertyId });
        if (existing)
            return res.status(409).json({ error: "Already in wishlist" });
        const item = new Wishlist({ user: userId, property: propertyId });
        await item.save();
        // Increment property favorites count
        await Property.findByIdAndUpdate(propertyId, { $inc: { favoritesCount: 1 } });
        res.status(201).json(item);
    }
    catch (err) {
        res.status(503).json({ error: "Database connection failed" });
    }
}));
// DISABLED: Wishlist deletion is disabled for data safety
router.delete("/:propertyId", (async (req, res) => {
    console.error('❌ Wishlist deletion is DISABLED for data safety');
    res.status(403).json({
        error: "OPERATION_DISABLED",
        message: "Wishlist deletion is disabled to prevent accidental data loss"
    });
}));
export default router;
