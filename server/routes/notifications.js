import { Router } from "express";
import { Notification } from "../models/Notification.js";
const router = Router();
// Get notifications
router.get("/", (async (req, res) => {
    try {
        const userId = req.headers["x-user-id"];
        if (!userId)
            return res.status(401).json({ error: "Unauthorized" });
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(50, Number(req.query.limit) || 20);
        const skip = (page - 1) * limit;
        const [items, total] = await Promise.all([
            Notification.find({ recipient: userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            Notification.countDocuments({ recipient: userId }),
        ]);
        res.json({ items, total, page, pageSize: limit });
    }
    catch (err) {
        res.status(503).json({ error: "Database connection failed" });
    }
}));
// Mark as read
router.patch("/:id/read", (async (req, res) => {
    try {
        const notif = await Notification.findByIdAndUpdate(req.params.id, { read: true }, { new: true }).lean();
        if (!notif)
            return res.status(404).json({ error: "Not found" });
        res.json(notif);
    }
    catch (err) {
        res.status(503).json({ error: "Database connection failed" });
    }
}));
// Mark all as read
router.patch("/read-all", (async (req, res) => {
    try {
        const userId = req.headers["x-user-id"];
        if (!userId)
            return res.status(401).json({ error: "Unauthorized" });
        await Notification.updateMany({ recipient: userId, read: false }, { read: true });
        res.json({ success: true });
    }
    catch (err) {
        res.status(503).json({ error: "Database connection failed" });
    }
}));
export default router;
