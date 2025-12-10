import { Router } from "express";
import { z } from "zod";
import { User } from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { connectDB } from "../src/config/db.js";
const router = Router();
/* ---------------------- SCHEMAS ---------------------- */
const registerSchema = z.object({
    name: z.string().min(2),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    userType: z.enum(["buyer", "seller", "agent"]).optional(),
    password: z.string().min(6),
});
const loginSchema = z.object({
    email: z.string().email().optional(),
    phone: z.string().optional(),
    password: z.string().min(1),
});
/* ---------------------- HELPERS ---------------------- */
const jwtSecret = process.env.JWT_SECRET || "change-me-in-env";
const safeUser = (u) => ({
    // id: u._id,
    id: u._id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    address: u.address,
    userType: u.userType,
    role: u.role,
    avatar: u.avatar,
});
/* ---------------------- REGISTER ROUTE ---------------------- */
router.post("/register", (async (req, res) => {
    try {
        // Must connect before queries (Builder.io serverless)
        await connectDB();
        const data = registerSchema.parse(req.body);
        // Check existing email
        const existing = data.email ? await User.findOne({ email: data.email }) : null;
        if (existing) {
            return res
                .status(409)
                .json({ error: "Email already registered" });
        }
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(data.password, salt);
        // Create user
        const user = new User({
            name: data.name,
            email: data.email,
            phone: data.phone,
            address: data.address,
            userType: data.userType,
            passwordHash,
        });
        await user.save();
        // Generate token
        const token = jwt.sign({ sub: user._id, role: user.role }, jwtSecret, { expiresIn: "7d" });
        res.status(201).json({
            user: safeUser(user),
            token,
        });
    }
    catch (err) {
        console.error("REGISTER ERROR ->", err);
        if (err.message?.includes("buffering timed out")) {
            return res.status(503).json({
                error: "Database connection failed. Make sure MONGO_URI is correct in Builder.io.",
            });
        }
        res.status(400).json({ error: err.message });
    }
}));
/* ---------------------- LOGIN ROUTE ---------------------- */
router.post("/login", (async (req, res) => {
    try {
        // Must connect before queries
        await connectDB();
        const data = loginSchema.parse(req.body);
        // Find user by email or phone
        const user = data.email
            ? await User.findOne({ email: data.email })
            : data.phone
                ? await User.findOne({ phone: data.phone })
                : null;
        if (!user) {
            return res
                .status(404)
                .json({ error: "User not found" });
        }
        // Compare password
        const match = await bcrypt.compare(data.password, user.passwordHash);
        if (!match) {
            return res
                .status(401)
                .json({ error: "Invalid credentials" });
        }
        // Generate token
        const token = jwt.sign({ sub: user._id, role: user.role }, jwtSecret, { expiresIn: "7d" });
        res.json({
            user: safeUser(user),
            token,
        });
    }
    catch (err) {
        console.error("LOGIN ERROR ->", err);
        if (err.message?.includes("buffering timed out")) {
            return res.status(503).json({
                error: "Database connection failed. Make sure MONGO_URI is correct in Builder.io.",
            });
        }
        res.status(400).json({ error: err.message });
    }
}));
/* ---------------------- EXPORT ROUTER ---------------------- */
export default router;
