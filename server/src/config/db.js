import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const debugFile = path.join(__dirname, "../../../debug.log");
import { setupQueryProfiling } from "../middleware/queryProfiler.js";

/**
 * Database Configuration
 * SECURITY: MongoDB URI must be provided via environment variable
 * Never hardcode database credentials in source code
 */

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error("❌ CRITICAL: MONGO_URI environment variable is not set!");
    console.error("Please set MONGO_URI in your .env file");
}

let hasLoggedConnection = false;
let hasSetupProfiling = false;

export async function connectDB() {
    // Validate MONGO_URI is set
    if (!MONGO_URI) {
        throw new Error("MONGO_URI environment variable is required. Please configure it in your .env file.");
    }

    // Avoid duplicate connections
    if (mongoose.connection.readyState === 1) return;
    if (mongoose.connection.readyState === 2) return;

    try {
        await mongoose.connect(MONGO_URI, {
            dbName: process.env.DB_NAME || "renters",
            serverSelectionTimeoutMS: 8000,
        });

        if (!hasLoggedConnection) {
            const msg = `✅ MongoDB Connected Successfully to database: ${mongoose.connection.name} on host: ${mongoose.connection.host}`;
            console.log(msg);
            fs.appendFileSync(debugFile, msg + "\n");
            hasLoggedConnection = true;
        }

        // Setup query profiling for slow query logging (Requirements: 4.6)
        if (!hasSetupProfiling) {
            setupQueryProfiling();
            hasSetupProfiling = true;
        }
    } catch (error) {
        console.error("❌ MongoDB connection error:", error.message);
        throw new Error("Database connection failed");
    }
}
