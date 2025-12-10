import mongoose from "mongoose";

const MONGO_URI =
    "mongodb+srv://ayupanchal00_db_user:ONbRmnaxW2jWfHPG@venturevault.cnnhrcb.mongodb.net/";

export async function connectDB() {
    console.log("USING HARDCODED MONGO URI");

    // Avoid duplicate connections
    if (mongoose.connection.readyState === 1) return;
    if (mongoose.connection.readyState === 2) return;

    try {
        await mongoose.connect(MONGO_URI, {
            dbName: "yourdbname",
            serverSelectionTimeoutMS: 8000,
        });

        console.log("✅ MongoDB Connected Successfully (Hardcoded URI)");
    } catch (error) {
        console.error("❌ MongoDB connection error:", error.message);
        throw new Error("Database connection failed");
    }
}
