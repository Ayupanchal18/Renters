/**
 * Seed 150 More Properties Script
 * Creates 75 rent and 75 buy properties with varied data for stress testing
 * 
 * Usage: node server/scripts/seedMoreProperties.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import { Property } from "../models/Property.js";
import { User } from "../models/User.js";

dotenv.config();

const cities = [
    "Delhi", "Mumbai", "Bangalore", "Chennai", "Hyderabad", "Pune", "Kolkata", "Ahmedabad",
    "Jaipur", "Surat", "Lucknow", "Kanpur", "Nagpur", "Indore", "Thane", "Bhopal",
    "Visakhapatnam", "Patna", "Vadodara", "Ghaziabad", "Ludhiana", "Agra", "Nashik",
    "Faridabad", "Meerut", "Rajkot", "Varanasi", "Chandigarh", "Guwahati", "Coimbatore",
    "Mysore", "Kochi", "Noida", "Gurugram", "Trivandrum"
];

const categories = ["room", "flat", "house", "pg", "hostel", "commercial"];
const furnishings = ["unfurnished", "semi", "fully"];
const ownerTypes = ["owner", "agent", "builder"];
const preferredTenants = ["family", "bachelor", "any"];
const possessionStatuses = ["ready", "under_construction", "resale"];
const facingDirections = ["North", "South", "East", "West", "North-East", "North-West", "South-East", "South-West"];
const parkingOptions = ["None", "Bike", "Car", "Both"];
const propertyAges = ["New", "1-3 years", "3-5 years", "5-10 years", "10+ years"];

const propertyTypesByCategory = {
    room: ["Single Room", "Double Room", "Triple Room", "Master Bedroom", "Studio Room"],
    flat: ["1 BHK", "2 BHK", "3 BHK", "4 BHK", "5 BHK", "Studio", "Penthouse"],
    house: ["Independent House", "Villa", "Duplex", "Row House", "Bungalow", "Farmhouse"],
    pg: ["Single Sharing", "Double Sharing", "Triple Sharing", "Four Sharing"],
    hostel: ["Boys Hostel", "Girls Hostel", "Co-ed Hostel", "Working Professional Hostel"],
    commercial: ["Office Space", "Shop", "Showroom", "Warehouse", "Godown", "Co-working Space", "Restaurant Space"]
};

const amenitiesList = [
    "WiFi", "AC", "Parking", "Power Backup", "Lift", "Security", "CCTV",
    "Gym", "Swimming Pool", "Garden", "Clubhouse", "Play Area",
    "Water Supply 24x7", "Gas Pipeline", "Intercom", "Fire Safety",
    "Visitor Parking", "Servant Room", "Rain Water Harvesting", "Solar Panels",
    "Jogging Track", "Tennis Court", "Basketball Court", "Meditation Room"
];

const cityCoords = {
    Delhi: { lat: 28.6139, lng: 77.2090 },
    Mumbai: { lat: 19.0760, lng: 72.8777 },
    Bangalore: { lat: 12.9716, lng: 77.5946 },
    Chennai: { lat: 13.0827, lng: 80.2707 },
    Hyderabad: { lat: 17.3850, lng: 78.4867 },
    Pune: { lat: 18.5204, lng: 73.8567 },
    Kolkata: { lat: 22.5726, lng: 88.3639 },
    Ahmedabad: { lat: 23.0225, lng: 72.5714 },
    Jaipur: { lat: 26.9124, lng: 75.7873 },
    Surat: { lat: 21.1702, lng: 72.8311 },
    Lucknow: { lat: 26.8467, lng: 80.9462 },
    Kanpur: { lat: 26.4499, lng: 80.3319 },
    Nagpur: { lat: 21.1458, lng: 79.0882 },
    Indore: { lat: 22.7196, lng: 75.8577 },
    Thane: { lat: 19.2183, lng: 72.9781 },
    Bhopal: { lat: 23.2599, lng: 77.4126 },
    Visakhapatnam: { lat: 17.6868, lng: 83.2185 },
    Patna: { lat: 25.5941, lng: 85.1376 },
    Vadodara: { lat: 22.3072, lng: 73.1812 },
    Ghaziabad: { lat: 28.6692, lng: 77.4538 },
    Ludhiana: { lat: 30.9010, lng: 75.8573 },
    Agra: { lat: 27.1767, lng: 78.0081 },
    Nashik: { lat: 19.9975, lng: 73.7898 },
    Faridabad: { lat: 28.4089, lng: 77.3178 },
    Meerut: { lat: 28.9845, lng: 77.7064 },
    Rajkot: { lat: 22.3039, lng: 70.8022 },
    Varanasi: { lat: 25.3176, lng: 82.9739 },
    Chandigarh: { lat: 30.7333, lng: 76.7794 },
    Guwahati: { lat: 26.1445, lng: 91.7362 },
    Coimbatore: { lat: 11.0168, lng: 76.9558 },
    Mysore: { lat: 12.2958, lng: 76.6394 },
    Kochi: { lat: 9.9312, lng: 76.2673 },
    Noida: { lat: 28.5355, lng: 77.3910 },
    Gurugram: { lat: 28.4595, lng: 77.0266 },
    Trivandrum: { lat: 8.5241, lng: 76.9366 }
};


const localities = [
    "Sector 1", "Sector 5", "Sector 12", "Sector 18", "Sector 22", "Sector 45", "Sector 62",
    "Main Road", "Ring Road", "Highway", "Market Area", "Station Road", "Mall Road",
    "Civil Lines", "Model Town", "Green Park", "Defence Colony", "Laxmi Nagar",
    "Ashok Vihar", "Pitampura", "Rohini", "Dwarka", "Vasant Kunj", "Saket",
    "Andheri", "Bandra", "Powai", "Malad", "Goregaon", "Worli", "Juhu",
    "Koramangala", "Whitefield", "HSR Layout", "Indiranagar", "Electronic City",
    "T Nagar", "Anna Nagar", "Velachery", "Adyar", "OMR", "Porur",
    "Gachibowli", "Madhapur", "Kondapur", "Banjara Hills", "Jubilee Hills",
    "Kothrud", "Hinjewadi", "Wakad", "Baner", "Viman Nagar", "Hadapsar",
    "Salt Lake", "New Town", "Park Street", "Ballygunge", "Alipore",
    "Satellite", "Prahlad Nagar", "SG Highway", "Vastrapur", "Bodakdev"
];

const titles = {
    room: ["Spacious Room", "Cozy Room", "Well-Ventilated Room", "Bright Room", "Modern Room", "Airy Room", "Premium Room"],
    flat: ["Luxury Apartment", "Modern Flat", "Spacious Apartment", "Premium Flat", "Elegant Apartment", "Designer Flat", "Sea View Apartment"],
    house: ["Beautiful House", "Elegant Villa", "Spacious Bungalow", "Modern Duplex", "Premium House", "Garden Villa", "Corner House"],
    pg: ["Comfortable PG", "Premium PG", "Budget PG", "Luxury PG", "Student PG", "Working Professional PG", "Girls PG"],
    hostel: ["Safe Hostel", "Premium Hostel", "Budget Hostel", "Modern Hostel", "Student Hostel", "AC Hostel", "Deluxe Hostel"],
    commercial: ["Prime Office", "Corner Shop", "Spacious Showroom", "Modern Warehouse", "Commercial Space", "IT Office", "Retail Space"]
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
    const count = Math.floor(Math.random() * 10) + 4;
    const shuffled = [...amenitiesList].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

function getRandomCoordinates(city) {
    const base = cityCoords[city] || cityCoords.Delhi;
    return {
        lat: base.lat + (Math.random() - 0.5) * 0.15,
        lng: base.lng + (Math.random() - 0.5) * 0.15
    };
}

function generateRentProperty(index, ownerId) {
    const category = categories[index % categories.length];
    const city = getRandomElement(cities);
    const coords = getRandomCoordinates(city);
    const propertyType = getRandomElement(propertyTypesByCategory[category]);
    const furnishing = getRandomElement(furnishings);
    const locality = getRandomElement(localities);
    const title = `${getRandomElement(titles[category])} in ${locality}, ${city}`;

    const baseRent = {
        room: [2500, 12000],
        flat: [8000, 80000],
        house: [15000, 150000],
        pg: [4000, 20000],
        hostel: [3000, 15000],
        commercial: [10000, 200000]
    };

    const [minRent, maxRent] = baseRent[category];
    const monthlyRent = Math.floor(Math.random() * (maxRent - minRent) + minRent);
    const builtUpArea = Math.floor(Math.random() * 3000) + 200;

    return {
        listingType: "rent",
        listingNumber: generateListingNumber('rent', index + 100),
        slug: generateSlug(title, index + 100),
        category,
        title,
        propertyType,
        description: `Beautiful ${propertyType.toLowerCase()} available for rent in ${locality}, ${city}. ${furnishing === 'fully' ? 'Fully furnished with modern amenities.' : furnishing === 'semi' ? 'Semi-furnished with essential amenities.' : 'Unfurnished, ready to customize as per your needs.'} Prime location with excellent connectivity.`,
        furnishing,
        availableFrom: new Date(Date.now() + Math.random() * 60 * 24 * 60 * 60 * 1000),
        city,
        address: `${Math.floor(Math.random() * 999) + 1}, ${locality}, ${city}`,
        mapLocation: `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`,
        monthlyRent,
        securityDeposit: monthlyRent * (Math.floor(Math.random() * 4) + 1),
        maintenanceCharge: Math.floor(Math.random() * 5000),
        rentNegotiable: Math.random() > 0.4,
        preferredTenants: getRandomElement(preferredTenants),
        leaseDuration: getRandomElement(["6 months", "11 months", "1 year", "2 years", "3 years"]),
        roomType: category === 'room' ? getRandomElement(["single", "double"]) : "",
        bathroomType: getRandomElement(["attached", "common"]),
        kitchenAvailable: Math.random() > 0.25,
        builtUpArea,
        carpetArea: Math.floor(builtUpArea * 0.85),
        bedrooms: category === 'flat' || category === 'house' ? Math.floor(Math.random() * 5) + 1 : null,
        bathrooms: Math.floor(Math.random() * 4) + 1,
        balconies: Math.floor(Math.random() * 4),
        floorNumber: Math.floor(Math.random() * 30),
        totalFloors: Math.floor(Math.random() * 35) + 1,
        facingDirection: getRandomElement(facingDirections),
        parking: getRandomElement(parkingOptions),
        propertyAge: getRandomElement(propertyAges),
        amenities: getRandomAmenities(),
        photos: [],
        ownerId,
        ownerName: `Property Owner ${index + 100}`,
        ownerPhone: `99${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
        ownerEmail: `owner${index + 100}@renters.in`,
        ownerType: getRandomElement(ownerTypes),
        status: "active",
        views: Math.floor(Math.random() * 1000),
        favoritesCount: Math.floor(Math.random() * 100),
        featured: Math.random() > 0.85,
        location: { type: "Point", coordinates: [coords.lng, coords.lat] }
    };
}


function generateBuyProperty(index, ownerId) {
    const category = categories[index % categories.length];
    const city = getRandomElement(cities);
    const coords = getRandomCoordinates(city);
    const propertyType = getRandomElement(propertyTypesByCategory[category]);
    const furnishing = getRandomElement(furnishings);
    const possessionStatus = getRandomElement(possessionStatuses);
    const locality = getRandomElement(localities);
    const title = `${getRandomElement(titles[category])} for Sale in ${locality}, ${city}`;

    const basePrice = {
        room: [400000, 3000000],
        flat: [1500000, 50000000],
        house: [3000000, 100000000],
        pg: [2000000, 25000000],
        hostel: [4000000, 40000000],
        commercial: [3000000, 200000000]
    };

    const [minPrice, maxPrice] = basePrice[category];
    const sellingPrice = Math.floor(Math.random() * (maxPrice - minPrice) + minPrice);
    const builtUpArea = Math.floor(Math.random() * 5000) + 400;

    return {
        listingType: "buy",
        listingNumber: generateListingNumber('buy', index + 100),
        slug: generateSlug(title, index + 100),
        category,
        title,
        propertyType,
        description: `Premium ${propertyType.toLowerCase()} available for sale in ${locality}, ${city}. ${possessionStatus === 'ready' ? 'Ready to move in immediately.' : possessionStatus === 'under_construction' ? 'Under construction with expected completion soon.' : 'Resale property in excellent condition.'} ${furnishing === 'fully' ? 'Comes fully furnished.' : furnishing === 'semi' ? 'Semi-furnished with basic fittings.' : 'Unfurnished property.'} Excellent investment opportunity in prime location.`,
        furnishing,
        availableFrom: new Date(Date.now() + Math.random() * 180 * 24 * 60 * 60 * 1000),
        city,
        address: `${Math.floor(Math.random() * 999) + 1}, ${locality}, ${city}`,
        mapLocation: `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`,
        sellingPrice,
        pricePerSqft: Math.floor(sellingPrice / builtUpArea),
        possessionStatus,
        bookingAmount: Math.floor(sellingPrice * 0.1),
        loanAvailable: Math.random() > 0.15,
        roomType: category === 'room' ? getRandomElement(["single", "double"]) : "",
        bathroomType: getRandomElement(["attached", "common"]),
        kitchenAvailable: Math.random() > 0.15,
        builtUpArea,
        carpetArea: Math.floor(builtUpArea * 0.82),
        bedrooms: category === 'flat' || category === 'house' ? Math.floor(Math.random() * 5) + 1 : null,
        bathrooms: Math.floor(Math.random() * 4) + 1,
        balconies: Math.floor(Math.random() * 4),
        floorNumber: Math.floor(Math.random() * 30),
        totalFloors: Math.floor(Math.random() * 35) + 1,
        facingDirection: getRandomElement(facingDirections),
        parking: getRandomElement(parkingOptions),
        propertyAge: getRandomElement(propertyAges),
        amenities: getRandomAmenities(),
        photos: [],
        ownerId,
        ownerName: `Property Seller ${index + 100}`,
        ownerPhone: `98${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
        ownerEmail: `seller${index + 100}@renters.in`,
        ownerType: getRandomElement(ownerTypes),
        status: "active",
        views: Math.floor(Math.random() * 1000),
        favoritesCount: Math.floor(Math.random() * 100),
        featured: Math.random() > 0.85,
        location: { type: "Point", coordinates: [coords.lng, coords.lat] }
    };
}

async function seedMoreProperties() {
    console.log("============================================================");
    console.log("       Seed 150 More Properties Script");
    console.log("============================================================\n");

    try {
        const mongoUri = process.env.MONGO_URI;
        await mongoose.connect(mongoUri, { dbName: 'yourdbname' });
        console.log("✅ Connected to MongoDB\n");

        // Find an existing user to be the owner
        let testUser = await User.findOne({ role: "user" });
        if (!testUser) {
            testUser = await User.findOne();
        }

        if (!testUser) {
            testUser = await User.create({
                name: "Bulk Property Owner",
                email: "bulkowner@renters.in",
                phone: "9888888888",
                passwordHash: "$2b$10$dummyhashforseeding123456789",
                role: "user",
                userType: "seller",
                verified: true,
                emailVerified: true,
                isActive: true
            });
            console.log("✅ Created test user: Bulk Property Owner\n");
        } else {
            console.log(`✅ Using existing user: ${testUser.name || testUser.email}\n`);
        }

        const ownerId = testUser._id;
        const rentProperties = [];
        const buyProperties = [];

        // Generate 75 rent properties
        console.log("Generating 75 rent properties...");
        for (let i = 0; i < 75; i++) {
            rentProperties.push(generateRentProperty(i, ownerId));
        }

        // Generate 75 buy properties
        console.log("Generating 75 buy properties...\n");
        for (let i = 0; i < 75; i++) {
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
        console.log(`✅ Total NEW properties: ${insertedRent.length + insertedBuy.length}`);

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

        // Show city distribution
        console.log("\n🏙️ City Distribution (sample):");
        const cityCount = {};
        [...insertedRent, ...insertedBuy].forEach(p => { cityCount[p.city] = (cityCount[p.city] || 0) + 1; });
        Object.entries(cityCount).slice(0, 10).forEach(([city, count]) => console.log(`  - ${city}: ${count}`));

        // Get total count
        const totalCount = await Property.countDocuments();
        console.log(`\n📈 Total properties in database: ${totalCount}`);

        console.log("\n✅ SEED COMPLETE - 150 properties added!");

    } catch (error) {
        console.error("❌ Error seeding properties:", error);
    } finally {
        await mongoose.disconnect();
        console.log("\nDisconnected from MongoDB");
    }
}

seedMoreProperties();
