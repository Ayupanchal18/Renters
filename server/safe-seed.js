import mongoose from "mongoose";
import { User } from "./models/User.js";
import { Property } from "./models/Property.js";
import bcrypt from "bcryptjs";

const mongoUri = process.env.MONGODB_URI || "mongodb+srv://ayupanchal00_db_user:ONbRmnaxW2jWfHPG@venturevault.cnnhrcb.mongodb.net/";

async function safeSeed() {
    try {
        await mongoose.connect(mongoUri, {
            dbName: "yourdbname"
        });
        console.log("Connected to MongoDB");

        // 🔒 SAFE MODE: Only add data, NEVER delete existing data
        console.log("🔒 SAFE MODE: Checking existing data before creating...");

        const existingUsers = await User.countDocuments();
        const existingProperties = await Property.countDocuments();

        console.log(`Found ${existingUsers} users and ${existingProperties} properties in database`);
        console.log("✅ SAFE MODE: Will only add missing test users, never delete existing data");

        // Only create test users if they don't already exist
        const testUsers = [
            { email: "seller@example.com", name: "John Seller", role: "seller" },
            { email: "buyer@example.com", name: "Jane Buyer", role: "user" },
            { email: "admin@example.com", name: "Admin User", role: "admin" }
        ];

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash("password123", salt);

        for (const testUser of testUsers) {
            const existingUser = await User.findOne({ email: testUser.email });
            if (!existingUser) {
                const newUser = await User.create({
                    name: testUser.name,
                    email: testUser.email,
                    phone: testUser.email === "seller@example.com" ? "+1234567890" :
                        testUser.email === "buyer@example.com" ? "+0987654321" : "+1111111111",
                    passwordHash,
                    role: testUser.role,
                    verified: true,
                });
                console.log(`✅ Created test user: ${testUser.name} (${testUser.email})`);
            } else {
                console.log(`✅ Test user already exists: ${testUser.name} (${testUser.email})`);
            }
        }

        console.log("\n✅ Safe seed completed successfully!");
        console.log("✅ No existing data was deleted or modified");
        console.log(`✅ Current database contains ${existingUsers} users and ${existingProperties} properties`);
        console.log("\nTest Credentials (if created):");
        console.log("Seller - Email: seller@example.com, Password: password123");
        console.log("Buyer - Email: buyer@example.com, Password: password123");
        console.log("Admin - Email: admin@example.com, Password: password123");

        await mongoose.disconnect();
    } catch (err) {
        console.error("Seed error:", err);
        process.exit(1);
    }
}

safeSeed();