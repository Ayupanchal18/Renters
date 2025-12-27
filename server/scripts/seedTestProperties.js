/**
 * Seed Test Properties Script
 * Creates 25 rent and 25 buy properties with varied data for testing
 * 
 * Usage: node server/scripts/seedTestProperties.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import { Property } from "../models/Property.js";
import { User } from "../models/User.js";

dotenv.config();

const cities = ["Delhi", "Mumbai", "Bangalore", "Chennai", "Hyderabad", "Pune", "Kolkata", "Ahmedabad"];
const categories = ["room", "flat", "house", "pg", "hostel", "commercial"];
const furnishings = ["unfurnished", "semi", "fully"];
const ownerTypes = ["owner", "agent", "builder"];
const preferredTenants = ["family", "bachelor", "any"];
const possessionStatuses = ["ready", "under_construction", "resale"];
const facingDirections = ["North", "South", "East", "West", "North-East", "North-West", "South-East", "South-West"];
const parkingOptions = ["None", "Bike", "Car", "Both"];
const propertyAges = ["New", "1-3 years", "3-5 years", "5-10 years", "10+ years"];

const propertyTypesByCategory = {
    room: ["Single Room", "Double Room", "Triple Room"],
    flat: ["1 BHK", "2 BHK", "3 BHK", "4 BHK", "Studio"],
    house: ["Independent House", "Villa", "Duplex", "Row House"],
    pg: ["Single Sharing", "Double Sharing", "Triple Sharing"],
    hostel: ["Boys Hostel", "Girls Hostel", "Co-ed Hostel"],
    commercial: ["Office Space", "Shop", "Showroom", "Warehouse", "Godown"]
};

const amenitiesList = [
    "WiFi", "AC", "Parking", "Power Backup", "Lift", "Security", "CCTV",
    "Gym", "Swimming Pool", "Garden", "Clubhouse", "Play Area",
    "Water Supply 24x7", "Gas Pipeline", "Intercom", "Fire Safety",
    "Visitor Parking", "Servant Room", "Rain Water Harvesting"
];

const addresses = {
    Delhi: ["Connaught Place", "Karol Bagh", "Dwarka Sector 12", "Rohini Sector 7", "Saket", "Vasant Kunj", "Lajpat Nagar", "Greater Kailash"],
    Mumbai: ["Andheri West", "Bandra East", "Powai", "Malad West", "Goregaon", "Thane", "Navi Mumbai", "Worli"],
    Bangalore: ["Koramangala", "Whitefield", "HSR Layout", "Indiranagar", "Electronic City", "Marathahalli", "JP Nagar", "Jayanagar"],
    Chennai: ["T Nagar", "Anna Nagar", "Velachery", "Adyar", "OMR", "Porur", "Tambaram", "Guindy"],
    Hyderabad: ["Gachibowli", "Madhapur", "Kondapur", "Banjara Hills", "Jubilee Hills", "Kukatpally", "Miyapur", "Secunderabad"],
    Pune: ["Kothrud", "Hinjewadi", "Wakad", "Baner", "Viman Nagar", "Hadapsar", "Magarpatta", "Koregaon Park"],
    Kolkata: ["Salt Lake", "New Town", "Park Street", "Ballygunge", "Alipore", "Howrah", "Dum Dum", "Behala"],
    Ahmedabad: ["Satellite", "Prahlad Nagar", "SG Highway", "Vastrapur", "Bodakdev", "Navrangpura", "Maninagar", "Chandkheda"]
};

const titles = {
    room: ["Spacious Room", "Cozy Room", "Well-Ventilated Room", "Bright Room", "Modern Room"],
    flat: ["Luxury Apartment", "Modern Flat", "Spacious Apartment", "Premium Flat", "Elegant Apartment"],
    house: ["Beautiful House", "Elegant Villa", "Spacious Bungalow", "Modern Duplex", "Premium House"],
    pg: ["Comfortable PG", "Premium PG", "Budget PG", "Luxury PG", "Student PG"],
    hostel: ["Safe Hostel", "Premium Hostel", "Budget Hostel", "Modern Hostel", "Student Hostel"],
    commercial: ["Prime Office", "Corner Shop", "Spacious Showroom", "Modern Warehouse", "Commercial Space"]
};

function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateListingNumber(type, index) {
    const prefix = type === 'rent' ? 'RNT' : 'BUY';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}-${index}`;
}

function generateSlug(title, index) {
    return title.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50) + `-${Date.now()}-${index}`;
}

function getRandomAmenities() {
    const count = Math.floor(Math.random() * 8) + 3;
    const shuffled = [...amenitiesList].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

function getRandomCoordinates(city) {
    const cityCoords = {
        Delhi: { lat: 28.6139, lng: 77.2090 },
        Mumbai: { lat: 19.0760, lng: 72.8777 },
        Bangalore: { lat: 12.9716, lng: 77.5946 },
        Chennai: { lat: 13.0827, lng: 80.2707 },
        Hyderabad: { lat: 17.3850, lng: 78.4867 },
        Pune: { lat: 18.5204, lng: 73.8567 },
        Kolkata: { lat: 22.5726, lng: 88.3639 },
        Ahmedabad: { lat: 23.0225, lng: 72.5714 }
    };
    const base = cityCoords[city] || cityCoords.Delhi;
    return {
        lat: base.lat + (Math.random() - 0.5) * 0.1,
        lng: base.lng + (Math.random() - 0.5) * 0.1
    };
}

function generateRentProperty(index, ownerId) {
    const category = categories[index % categories.length];
    const city = getRandomElement(cities);
    const coords = getRandomCoordinates(city);
    const propertyType = getRandomElement(propertyTypesByCategory[category]);
    const furnishing = getRandomElement(furnishings);
    const title = `${getRandomElement(titles[category])} in ${city} - ${propertyType}`;

    const baseRent = {
        room: [3000, 8000],
        flat: [10000, 50000],
        house: [20000, 100000],
        pg: [5000, 15000],
        hostel: [4000, 12000],
        commercial: [15000, 80000]
    };

    const [minRent, maxRent] = baseRent[category];
    const monthlyRent = Math.floor(Math.random() * (maxRent - minRent) + minRent);

    return {
        listingType: "rent",
        listingNumber: generateListingNumber('rent', index),
        slug: generateSlug(title, index),
        category,
        title,
        propertyType,
        description: `Beautiful ${propertyType.toLowerCase()} available for rent in ${city}. ${furnishing === 'fully' ? 'Fully furnished with all amenities.' : furnishing === 'semi' ? 'Semi-furnished with basic amenities.' : 'Unfurnished, ready to customize.'} Great location with easy access to public transport.`,
        furnishing,
        availableFrom: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000),
        city,
        address: `${Math.floor(Math.random() * 500) + 1}, ${getRandomElement(addresses[city])}, ${city}`,
        mapLocation: `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`,
        monthlyRent,
        securityDeposit: monthlyRent * (Math.floor(Math.random() * 3) + 1),
        maintenanceCharge: Math.floor(Math.random() * 3000),
        rentNegotiable: Math.random() > 0.5,
        preferredTenants: getRandomElement(preferredTenants),
        leaseDuration: getRandomElement(["6 months", "11 months", "1 year", "2 years"]),
        roomType: category === 'room' ? getRandomElement(["single", "double"]) : "",
        bathroomType: getRandomElement(["attached", "common"]),
        kitchenAvailable: Math.random() > 0.3,
        builtUpArea: Math.floor(Math.random() * 2000) + 300,
        carpetArea: Math.floor(Math.random() * 1500) + 250,
        bedrooms: category === 'flat' || category === 'house' ? Math.floor(Math.random() * 4) + 1 : null,
        bathrooms: Math.floor(Math.random() * 3) + 1,
        balconies: Math.floor(Math.random() * 3),
        floorNumber: Math.floor(Math.random() * 20),
        totalFloors: Math.floor(Math.random() * 25) + 1,
        facingDirection: getRandomElement(facingDirections),
        parking: getRandomElement(parkingOptions),
        propertyAge: getRandomElement(propertyAges),
        amenities: getRandomAmenities(),
        photos: [],
        ownerId,
        ownerName: `Owner ${index + 1}`,
        ownerPhone: `99${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
        ownerEmail: `owner${index + 1}@example.com`,
        ownerType: getRandomElement(ownerTypes),
        status: "active",
        views: Math.floor(Math.random() * 500),
        favoritesCount: Math.floor(Math.random() * 50),
        featured: Math.random() > 0.8,
        location: {
            type: "Point",
            coordinates: [coords.lng, coords.lat]
        }
    };
}

function generateBuyProperty(index, ownerId) {
    const category = categories[index % categories.length];
    const city = getRandomElement(cities);
    const coords = getRandomCoordinates(city);
    const propertyType = getRandomElement(propertyTypesByCategory[category]);
    const furnishing = getRandomElement(furnishings);
    const possessionStatus = getRandomElement(possessionStatuses);
    const title = `${getRandomElement(titles[category])} for Sale in ${city} - ${propertyType}`;

    const basePrice = {
        room: [500000, 2000000],
        flat: [2000000, 20000000],
        house: [5000000, 50000000],
        pg: [3000000, 15000000],
        hostel: [5000000, 25000000],
        commercial: [5000000, 100000000]
    };

    const [minPrice, maxPrice] = basePrice[category];
    const sellingPrice = Math.floor(Math.random() * (maxPrice - minPrice) + minPrice);
    const builtUpArea = Math.floor(Math.random() * 3000) + 500;

    return {
        listingType: "buy",
        listingNumber: generateListingNumber('buy', index),
        slug: generateSlug(title, index),
        category,
        title,
        propertyType,
        description: `Premium ${propertyType.toLowerCase()} available for sale in ${city}. ${possessionStatus === 'ready' ? 'Ready to move in.' : possessionStatus === 'under_construction' ? 'Under construction with expected completion soon.' : 'Resale property in excellent condition.'} ${furnishing === 'fully' ? 'Fully furnished.' : furnishing === 'semi' ? 'Semi-furnished.' : 'Unfurnished.'} Great investment opportunity.`,
        furnishing,
        availableFrom: new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000),
        city,
        address: `${Math.floor(Math.random() * 500) + 1}, ${getRandomElement(addresses[city])}, ${city}`,
        mapLocation: `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`,
        sellingPrice,
        pricePerSqft: Math.floor(sellingPrice / builtUpArea),
        possessionStatus,
        bookingAmount: Math.floor(sellingPrice * 0.1),
        loanAvailable: Math.random() > 0.2,
        roomType: category === 'room' ? getRandomElement(["single", "double"]) : "",
        bathroomType: getRandomElement(["attached", "common"]),
        kitchenAvailable: Math.random() > 0.2,
        builtUpArea,
        carpetArea: Math.floor(builtUpArea * 0.8),
        bedrooms: category === 'flat' || category === 'house' ? Math.floor(Math.random() * 4) + 1 : null,
        bathrooms: Math.floor(Math.random() * 3) + 1,
        balconies: Math.floor(Math.random() * 3),
        floorNumber: Math.floor(Math.random() * 20),
        totalFloors: Math.floor(Math.random() * 25) + 1,
        facingDirection: getRandomElement(facingDirections),
        parking: getRandomElement(parkingOptions),
        propertyAge: getRandomElement(propertyAges),
        amenities: getRandomAmenities(),
        photos: [],
        ownerId,
        ownerName: `Seller ${index + 1}`,
        ownerPhone: `98${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
        ownerEmail: `seller${index + 1}@example.com`,
        ownerType: getRandomElement(ownerTypes),
        status: "active",
        views: Math.floor(Math.random() * 500),
        favoritesCount: Math.floor(Math.random() * 50),
        featured: Math.random() > 0.8,
        location: {
            type: "Point",
            coordinates: [coords.lng, coords.lat]
        }
    };
}

async function seedProperties() {
    console.log("============================================================");
    console.log("       Test Properties Seed Script");
    console.log("============================================================\n");

    try {
        const mongoUri = process.env.MONGO_URI;
        await mongoose.connect(mongoUri, { dbName: 'yourdbname' });
        console.log("✅ Connected to MongoDB (yourdbname)\n");

        // Find an existing user to be the owner
        let testUser = await User.findOne({ role: "user" });
        if (!testUser) {
            testUser = await User.findOne(); // Get any user
        }

        if (!testUser) {
            // Create a test user with required fields
            testUser = await User.create({
                name: "Test Property Owner",
                email: "testowner@renters.com",
                phone: "9999999999",
                passwordHash: "$2b$10$dummyhashforseeding123456789",
                role: "user",
                userType: "seller",
                verified: true,
                emailVerified: true,
                isActive: true
            });
            console.log("✅ Created test user: Test Property Owner\n");
        } else {
            console.log(`✅ Using existing user: ${testUser.name || testUser.email}\n`);
        }

        const ownerId = testUser._id;
        const rentProperties = [];
        const buyProperties = [];

        // Generate 25 rent properties
        console.log("Generating 25 rent properties...");
        for (let i = 0; i < 25; i++) {
            rentProperties.push(generateRentProperty(i, ownerId));
        }

        // Generate 25 buy properties
        console.log("Generating 25 buy properties...\n");
        for (let i = 0; i < 25; i++) {
            buyProperties.push(generateBuyProperty(i, ownerId));
        }

        // Insert all properties
        console.log("Inserting properties into database...");
        const insertedRent = await Property.insertMany(rentProperties);
        const insertedBuy = await Property.insertMany(buyProperties);

        console.log("\n============================================================");
        console.log("                    SEED SUMMARY");
        console.log("============================================================");
        console.log(`✅ Rent properties created: ${insertedRent.length}`);
        console.log(`✅ Buy properties created: ${insertedBuy.length}`);
        console.log(`✅ Total properties created: ${insertedRent.length + insertedBuy.length}`);

        // Show category breakdown
        console.log("\n📊 Category Breakdown:");
        const rentByCategory = {};
        const buyByCategory = {};
        insertedRent.forEach(p => { rentByCategory[p.category] = (rentByCategory[p.category] || 0) + 1; });
        insertedBuy.forEach(p => { buyByCategory[p.category] = (buyByCategory[p.category] || 0) + 1; });

        console.log("\nRent Properties:");
        Object.entries(rentByCategory).forEach(([cat, count]) => console.log(`  - ${cat}: ${count}`));

        console.log("\nBuy Properties:");
        Object.entries(buyByCategory).forEach(([cat, count]) => console.log(`  - ${cat}: ${count}`));

        console.log("\n✅ SEED COMPLETE");

    } catch (error) {
        console.error("❌ Error seeding properties:", error);
    } finally {
        await mongoose.disconnect();
        console.log("\nDisconnected from MongoDB");
    }
}

seedProperties();
