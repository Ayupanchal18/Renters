import { Router } from "express";
import { Property } from "../models/Property.js";
import { User } from "../models/User.js";
const router = Router();
// Middleware to check admin role
const isAdmin = (req, res, next) => {
    const role = req.headers["x-user-role"];
    if (role !== "admin")
        return res.status(403).json({ error: "Forbidden" });
    next();
};
// List properties for moderation
router.get("/listings", isAdmin, (async (req, res) => {
    const status = String(req.query.status || "active");
    const properties = await Property.find({ status }).populate("owner", "name email").lean();
    res.json(properties);
}));
// Approve / Feature property
router.patch("/listings/:id", isAdmin, (async (req, res) => {
    const { featured, status } = req.body;
    const prop = await Property.findByIdAndUpdate(req.params.id, { featured, status }, { new: true }).lean();
    if (!prop)
        return res.status(404).json({ error: "Not found" });
    res.json(prop);
}));
// Remove property
router.delete("/listings/:id", isAdmin, (async (req, res) => {
    await Property.findByIdAndDelete(req.params.id);
    res.json({ success: true });
}));
// List users for moderation
router.get("/users", isAdmin, (async (req, res) => {
    const users = await User.find().select("-passwordHash").lean();
    res.json(users);
}));
// Block / Unblock user
router.patch("/users/:id", isAdmin, (async (req, res) => {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select("-passwordHash").lean();
    if (!user)
        return res.status(404).json({ error: "Not found" });
    res.json(user);
}));
export default router;
