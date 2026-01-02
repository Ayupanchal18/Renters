import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = process.env.DB_NAME;

async function testConnection() {
    console.log("🔍 Testing database connection...\n");

    if (!MONGO_URI) {
        console.error("❌ MONGO_URI is not set in .env file");
        process.exit(1);
    }

    console.log("📡 MONGO_URI:", MONGO_URI);
    console.log("📡 DB_NAME from env:", DB_NAME);
    console.log("📡 Connecting to MongoDB...");

    try {
        await mongoose.connect(MONGO_URI, {
            dbName: "yourdbname",
            serverSelectionTimeoutMS: 8000,
        });

        const actualDbName = mongoose.connection.db.databaseName;
        console.log("✅ Database connected successfully!");
        console.log(`📁 Connected to database: ${actualDbName}\n`);

        // List all collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log("📂 Collections in database:", collections.map(c => c.name).join(", ") || "none");

        // Get the Property collection
        const Property = mongoose.connection.collection("properties");

        // Count total properties
        const totalCount = await Property.countDocuments();
        console.log(`📊 Total properties in database: ${totalCount}`);

        // Count by listing type
        const rentCount = await Property.countDocuments({ listingType: "rent" });
        const buyCount = await Property.countDocuments({ listingType: "buy" });
        console.log(`   - Rent listings: ${rentCount}`);
        console.log(`   - Buy listings: ${buyCount}`);

        // Count active properties
        const activeCount = await Property.countDocuments({ status: "active", isDeleted: false });
        console.log(`   - Active properties: ${activeCount}`);

        // Show sample property if exists
        if (totalCount > 0) {
            const sample = await Property.findOne();
            console.log("\n📋 Sample property:");
            console.log(`   Title: ${sample.title}`);
            console.log(`   City: ${sample.city}`);
            console.log(`   Category: ${sample.category}`);
            console.log(`   Listing Type: ${sample.listingType}`);
            console.log(`   Status: ${sample.status}`);
        }

        console.log("\n✅ Database test completed successfully!");

    } catch (error) {
        console.error("❌ Database connection failed:", error.message);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
}

testConnection();
