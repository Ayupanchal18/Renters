import { Router } from "express";
import { z } from "zod";
import { User } from "../models/User.js";
const router = Router();
const updateSchema = z.object({ name: z.string().optional(), avatar: z.string().optional(), bio: z.string().optional() });
router.get("/me", (async (req, res) => {
    // mock auth: in production use middleware to set req.user
    const userId = req.headers["x-user-id"];
    if (!userId)
        return res.status(401).json({ error: "Unauthorized (provide x-user-id header for dev)" });
    const user = await User.findById(userId).lean();
    if (!user)
        return res.status(404).json({ error: "Not found" });
    res.json(user);
}));
router.patch("/me", (async (req, res) => {
    const userId = req.headers["x-user-id"];
    if (!userId)
        return res.status(401).json({ error: "Unauthorized (provide x-user-id header for dev)" });
    const data = updateSchema.parse(req.body);
    const user = await User.findByIdAndUpdate(userId, data, { new: true }).lean();
    res.json(user);
}));
export default router;
