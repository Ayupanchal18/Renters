import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { connectDB } from "../src/config/db.js";

const createAdmin = async () => {
    try {
        console.log("🚀 Starting Admin Creation Script...");
        
        // Connect to Database
        await connectDB();
        
        const email = process.env.ADMIN_EMAIL || "admin@renters.com";
        const password = process.env.ADMIN_PASSWORD || "Admin@123456";
        const name = "System Administrator";

        console.log(`🔍 Checking if user exists: ${email}`);
        const existing = await User.findOne({ email: email.toLowerCase() });
        
        if (existing) {
            console.log("✨ User already exists. Elevating to Admin role...");
            existing.role = "admin";
            existing.isActive = true;
            existing.isBlocked = false;
            await existing.save();
            console.log("✅ User updated to Admin successfully.");
        } else {
            console.log("📝 Creating new Admin user...");
            const salt = await bcrypt.genSalt(12);
            const passwordHash = await bcrypt.hash(password, salt);

            const admin = new User({
                name,
                email: email.toLowerCase(),
                passwordHash,
                role: "admin",
                userType: "agent",
                emailVerified: true,
                isActive: true,
                isBlocked: false,
                termsAcceptedAt: new Date(),
                privacyPolicyAcceptedAt: new Date(),
                consentGivenAt: new Date()
            });

            await admin.save();
            console.log("✅ Admin user created successfully!");
            console.log(`📧 Email: ${email}`);
            console.log(`🔑 Password: ${password}`);
        }
        
        console.log("👋 Done!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error creating admin:", error);
        process.exit(1);
    }
};

createAdmin();
