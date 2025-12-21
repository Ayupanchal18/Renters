import mongoose from "mongoose";
import { Category } from "../server/models/Category.js";
import { Amenity } from "../server/models/Amenity.js";

const mongoUri = process.env.MONGODB_URI || "mongodb+srv://ayupanchal00_db_user:ONbRmnaxW2jWfHPG@venturevault.cnnhrcb.mongodb.net/";

const defaultCategories = [
    { name: "Room", slug: "room", description: "Single or shared rooms for rent", order: 1, icon: "bed" },
    { name: "Flat", slug: "flat", description: "Apartments and flats for rent", order: 2, icon: "building" },
    { name: "House", slug: "house", description: "Independent houses for rent or sale", order: 3, icon: "home" },
    { name: "PG", slug: "pg", description: "Paying guest accommodations", order: 4, icon: "users" },
    { name: "Hostel", slug: "hostel", description: "Hostel accommodations", order: 5, icon: "building-2" },
    { name: "Commercial", slug: "commercial", description: "Commercial properties for rent or sale", order: 6, icon: "store" }
];

const defaultAmenities = [
    // Basic amenities
    { name: "WiFi", category: "basic", order: 1, icon: "wifi" },
    { name: "Electricity", category: "basic", order: 2, icon: "zap" },
    { name: "Water Supply", category: "basic", order: 3, icon: "droplet" },
    { name: "Attached Bathroom", category: "basic", order: 4, icon: "bath" },
    { name: "Kitchen", category: "basic", order: 5, icon: "utensils" },
    { name: "Furnished", category: "basic", order: 6, icon: "sofa" },

    // Comfort amenities
    { name: "Air Conditioning", category: "comfort", order: 1, icon: "wind" },
    { name: "Geyser", category: "comfort", order: 2, icon: "thermometer" },
    { name: "TV", category: "comfort", order: 3, icon: "tv" },
    { name: "Washing Machine", category: "comfort", order: 4, icon: "shirt" },
    { name: "Refrigerator", category: "comfort", order: 5, icon: "refrigerator" },
    { name: "Balcony", category: "comfort", order: 6, icon: "door-open" },

    // Security amenities
    { name: "CCTV", category: "security", order: 1, icon: "camera" },
    { name: "Security Guard", category: "security", order: 2, icon: "shield" },
    { name: "Gated Community", category: "security", order: 3, icon: "lock" },
    { name: "Fire Safety", category: "security", order: 4, icon: "flame" },

    // Recreation amenities
    { name: "Gym", category: "recreation", order: 1, icon: "dumbbell" },
    { name: "Swimming Pool", category: "recreation", order: 2, icon: "waves" },
    { name: "Garden", category: "recreation", order: 3, icon: "trees" },
    { name: "Play Area", category: "recreation", order: 4, icon: "gamepad-2" },
    { name: "Club House", category: "recreation", order: 5, icon: "building" },

    // Utility amenities
    { name: "Parking", category: "utility", order: 1, icon: "car" },
    { name: "Power Backup", category: "utility", order: 2, icon: "battery-charging" },
    { name: "Lift", category: "utility", order: 3, icon: "arrow-up-down" },
    { name: "Intercom", category: "utility", order: 4, icon: "phone" },
    { name: "Laundry", category: "utility", order: 5, icon: "shirt" },
    { name: "Housekeeping", category: "utility", order: 6, icon: "sparkles" }
];

async function seedCategories() {
    try {
        await mongoose.connect(mongoUri);
        console.log("Connected to MongoDB");

        // Seed categories
        console.log("\n📁 Seeding categories...");
        let categoriesCreated = 0;
        let categoriesSkipped = 0;

        for (const cat of defaultCategories) {
            const existing = await Category.findOne({ slug: cat.slug });
            if (existing) {
                console.log(`  ⏭️  Category "${cat.name}" already exists`);
                categoriesSkipped++;
            } else {
                await Category.create(cat);
                console.log(`  ✅ Created category: ${cat.name}`);
                categoriesCreated++;
            }
        }

        // Seed amenities
        console.log("\n✨ Seeding amenities...");
        let amenitiesCreated = 0;
        let amenitiesSkipped = 0;

        for (const amenity of defaultAmenities) {
            const existing = await Amenity.findOne({ name: amenity.name });
            if (existing) {
                console.log(`  ⏭️  Amenity "${amenity.name}" already exists`);
                amenitiesSkipped++;
            } else {
                await Amenity.create(amenity);
                console.log(`  ✅ Created amenity: ${amenity.name}`);
                amenitiesCreated++;
            }
        }

        console.log("\n📊 Summary:");
        console.log(`  Categories: ${categoriesCreated} created, ${categoriesSkipped} skipped`);
        console.log(`  Amenities: ${amenitiesCreated} created, ${amenitiesSkipped} skipped`);
        console.log("\n✅ Seed completed successfully!");

        await mongoose.disconnect();
    } catch (err) {
        console.error("Seed error:", err);
        process.exit(1);
    }
}

seedCategories();
