import { Router } from "express";
import { Conversation } from "../models/Conversation.js";
import { z } from "zod";
const router = Router();
const createSchema = z.object({ participants: z.array(z.string()).min(2) });
const messageSchema = z.object({ text: z.string().min(1) });
// List conversations
router.get("/", (async (req, res) => {
    try {
        const userId = req.headers["x-user-id"];
        if (!userId)
            return res.status(401).json({ error: "Unauthorized" });
        const convs = await Conversation.find({ participants: userId })
            .populate("participants", "name avatar")
            .sort({ updatedAt: -1 })
            .lean();
        res.json(convs);
    }
    catch (err) {
        res.status(503).json({ error: "Database connection failed" });
    }
}));
// Create conversation
router.post("/", (async (req, res) => {
    try {
        const userId = req.headers["x-user-id"];
        if (!userId)
            return res.status(401).json({ error: "Unauthorized" });
        const data = createSchema.parse(req.body);
        const participants = [userId, ...data.participants];
        // Check if conversation already exists
        let conv = await Conversation.findOne({ participants: { $all: participants } });
        if (conv)
            return res.json(conv);
        conv = new Conversation({ participants, messages: [], unreadCount: new Map() });
        await conv.save();
        await conv.populate("participants", "name avatar");
        res.status(201).json(conv);
    }
    catch (err) {
        res.status(503).json({ error: "Database connection failed" });
    }
}));
// Get conversation messages
router.get("/:id", (async (req, res) => {
    try {
        const conv = await Conversation.findById(req.params.id)
            .populate("participants", "name avatar")
            .populate("messages.sender", "name avatar");
        if (!conv)
            return res.status(404).json({ error: "Not found" });
        res.json(conv);
    }
    catch (err) {
        res.status(503).json({ error: "Database connection failed" });
    }
}));
// Send message
router.post("/:id/messages", (async (req, res) => {
    try {
        const userId = req.headers["x-user-id"];
        if (!userId)
            return res.status(401).json({ error: "Unauthorized" });
        const data = messageSchema.parse(req.body);
        const conv = await Conversation.findByIdAndUpdate(req.params.id, {
            $push: { messages: { sender: userId, text: data.text, read: false } },
            lastMessage: { sender: userId, text: data.text, read: false },
        }, { new: true });
        if (!conv)
            return res.status(404).json({ error: "Not found" });
        res.status(201).json(conv);
    }
    catch (err) {
        res.status(503).json({ error: "Database connection failed" });
    }
}));
export default router;
