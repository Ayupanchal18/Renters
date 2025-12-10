const mongoose = require("mongoose");
const { User } = require("./models/User");
const { Property } = require("./models/Property");
const bcrypt = require("bcryptjs");

const mongoUri = "mongodb+srv://ayupanchal00_db_user:ONbRmnaxW2jWfHPG@venturevault.cnnhrcb.mongodb.net/";

async function seed() {
    try {
        await mongoose.connect(mongoUri);
        console.log("Connected to MongoDB");

        // Clear existing data
        await User.deleteMany({});
        await Property.deleteMany({});
        console.log("Cleared existing data");

        // Create test users
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash("password123", salt);

        const user1 = await User.create({
            name: "John Seller",
            email: "seller@example.com",
            phone: "+1234567890",
            passwordHash,
            role: "seller",
            verified: true,
        });

        const user2 = await User.create({
            name: "Jane Buyer",
            email: "buyer@example.com",
            phone: "+0987654321",
            passwordHash,
            role: "user",
            verified: true,
        });

        const admin = await User.create({
            name: "Admin User",
            email: "admin@example.com",
            phone: "+1111111111",
            passwordHash,
            role: "admin",
            verified: true,
        });

        console.log("✅ Users created:", [user1._id, user2._id, admin._id]);

        // Create test properties
        const properties = await Property.insertMany([
            {
                title: "Modern Downtown Apartment",
                description: "A bright modern apartment in the heart of the city with stunning views.",
                price: 450000,
                priceLabel: "$450,000",
                type: "Apartment",
                status: "active",
                address: {
                    line: "221B Baker Street",
                    city: "New York",
                    state: "NY",
                    zip: "10001",
                    lat: 40.7128,
                    lng: -74.006,
                },
                beds: 3,
                baths: 2,
                sqft: 1800,
                images: [
                    "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&h=800&fit=crop",
                ],
                owner: user1._id,
                views: 12,
                featured: true,
            },
            {
                title: "Luxury Suburban Villa",
                description: "Spacious villa with private garden and pool in exclusive neighborhood.",
                price: 3200,
                priceLabel: "$3,200/mo",
                type: "House",
                status: "active",
                address: {
                    line: "742 Evergreen Terrace",
                    city: "Los Angeles",
                    state: "CA",
                    zip: "90001",
                    lat: 34.0522,
                    lng: -118.2437,
                },
                beds: 4,
                baths: 3,
                sqft: 2500,
                images: [
                    "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200&h=800&fit=crop",
                ],
                owner: user1._id,
                views: 8,
                featured: false,
            },
            {
                title: "Cozy Studio Loft",
                description: "Compact and stylish loft in an up-and-coming neighborhood.",
                price: 2800,
                priceLabel: "$2,800/mo",
                type: "Studio",
                status: "active",
                address: {
                    line: "88 Mission Street",
                    city: "San Francisco",
                    state: "CA",
                    zip: "94103",
                    lat: 37.7749,
                    lng: -122.4194,
                },
                beds: 1,
                baths: 1,
                sqft: 650,
                images: [
                    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&h=800&fit=crop",
                ],
                owner: user1._id,
                views: 45,
                featured: false,
            },
            {
                title: "Premium Commercial Space",
                description: "Modern commercial space perfect for offices or retail.",
                price: 5000,
                priceLabel: "$5,000/mo",
                type: "Commercial",
                status: "active",
                address: {
                    line: "500 Market Street",
                    city: "San Francisco",
                    state: "CA",
                    zip: "94103",
                    lat: 37.7899,
                    lng: -122.3981,
                },
                beds: 0,
                baths: 2,
                sqft: 3500,
                images: [
                    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&h=800&fit=crop",
                ],
                owner: user1._id,
                views: 34,
                featured: true,
            },
            {
                title: "Beachfront Condo",
                description: "Beautiful condo with ocean views and beach access.",
                price: 2500,
                priceLabel: "$2,500/mo",
                type: "Condo",
                status: "active",
                address: {
                    line: "100 Beach Avenue",
                    city: "Miami",
                    state: "FL",
                    zip: "33139",
                    lat: 25.7617,
                    lng: -80.2742,
                },
                beds: 2,
                baths: 2,
                sqft: 1200,
                images: [
                    "https://images.unsplash.com/photo-1512917774080-9b2ca78f7cf0?w=1200&h=800&fit=crop",
                ],
                owner: user1._id,
                views: 67,
                featured: true,
            },
            {
                title: "Charming Victorian House",
                description: "Historic Victorian house with original hardwood floors.",
                price: 385000,
                priceLabel: "$385,000",
                type: "House",
                status: "active",
                address: {
                    line: "123 Oak Street",
                    city: "Chicago",
                    state: "IL",
                    zip: "60601",
                    lat: 41.8781,
                    lng: -87.6298,
                },
                beds: 5,
                baths: 3,
                sqft: 2800,
                images: [
                    "https://images.unsplash.com/photo-1572120471610-ded80a56c976?w=1200&h=800&fit=crop",
                ],
                owner: user1._id,
                views: 23,
                featured: false,
            },
            {
                title: "Modern High-Rise Condo",
                description: "Sleek condo in high-rise building with amenities.",
                price: 650000,
                priceLabel: "$650,000",
                type: "Condo",
                status: "active",
                address: {
                    line: "400 Park Avenue",
                    city: "New York",
                    state: "NY",
                    zip: "10022",
                    lat: 40.7671,
                    lng: -73.9776,
                },
                beds: 2,
                baths: 2,
                sqft: 1100,
                images: [
                    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&h=800&fit=crop",
                ],
                owner: user1._id,
                views: 91,
                featured: true,
            },
            {
                title: "Spacious Family Home",
                description: "Ideal family home in quiet residential area.",
                price: 520000,
                priceLabel: "$520,000",
                type: "House",
                status: "active",
                address: {
                    line: "789 Maple Drive",
                    city: "Los Angeles",
                    state: "CA",
                    zip: "90210",
                    lat: 34.0821,
                    lng: -118.3936,
                },
                beds: 5,
                baths: 3,
                sqft: 3200,
                images: [
                    "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&h=800&fit=crop",
                ],
                owner: user1._id,
                views: 78,
                featured: false,
            },
            {
                title: "Garden Apartment",
                description: "Lovely garden apartment with outdoor space.",
                price: 3500,
                priceLabel: "$3,500/mo",
                type: "Apartment",
                status: "active",
                address: {
                    line: "456 Grove Street",
                    city: "Chicago",
                    state: "IL",
                    zip: "60610",
                    lat: 41.8974,
                    lng: -87.6278,
                },
                beds: 2,
                baths: 1,
                sqft: 950,
                images: [
                    "https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=1200&h=800&fit=crop",
                ],
                owner: user1._id,
                views: 44,
                featured: false,
            },
            {
                title: "Downtown Studio",
                description: "Perfect starter apartment in downtown core.",
                price: 1800,
                priceLabel: "$1,800/mo",
                type: "Studio",
                status: "active",
                address: {
                    line: "999 Main Street",
                    city: "Boston",
                    state: "MA",
                    zip: "02108",
                    lat: 42.3601,
                    lng: -71.0589,
                },
                beds: 0,
                baths: 1,
                sqft: 400,
                images: [
                    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&h=800&fit=crop",
                ],
                owner: user1._id,
                views: 156,
                featured: false,
            },
            {
                title: "Luxury Penthouse",
                description: "Exclusive penthouse with rooftop terrace and city views.",
                price: 2200000,
                priceLabel: "$2,200,000",
                type: "Apartment",
                status: "active",
                address: {
                    line: "1 Central Park West",
                    city: "New York",
                    state: "NY",
                    zip: "10023",
                    lat: 40.7733,
                    lng: -73.9823,
                },
                beds: 4,
                baths: 4,
                sqft: 4500,
                images: [
                    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&h=800&fit=crop",
                ],
                owner: user1._id,
                views: 289,
                featured: true,
            },
        ]);

        console.log("✅ Properties created:", properties.map((p) => p._id));

        console.log("\n✅ Seed completed successfully!");
        console.log("\nTest Credentials:");
        console.log("Seller - Email: seller@example.com, Password: password123");
        console.log("Buyer - Email: buyer@example.com, Password: password123");
        console.log("Admin - Email: admin@example.com, Password: password123");

        await mongoose.disconnect();
    } catch (err) {
        console.error("Seed error:", err);
        process.exit(1);
    }
}

seed();
