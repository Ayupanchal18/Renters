import mongoose from 'mongoose';
import { Amenity } from '../models/Amenity.js';

// Connect to the correct database
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/yourdbname';

const amenitiesData = [
    // Basic amenities
    { name: 'WiFi', category: 'basic', order: 1 },
    { name: 'AC', category: 'basic', order: 2 },
    { name: 'Bed', category: 'basic', order: 3 },
    { name: 'Wardrobe', category: 'basic', order: 4 },
    { name: 'TV', category: 'basic', order: 5 },
    { name: 'Geyser', category: 'basic', order: 6 },

    // Comfort amenities
    { name: 'Washing Machine', category: 'comfort', order: 1 },
    { name: 'Meals', category: 'comfort', order: 2 },
    { name: 'Laundry', category: 'comfort', order: 3 },
    { name: 'Housekeeping', category: 'comfort', order: 4 },
    { name: 'Servant Room', category: 'comfort', order: 5 },
    { name: 'Study Room', category: 'comfort', order: 6 },
    { name: 'Common Room', category: 'comfort', order: 7 },
    { name: 'Terrace', category: 'comfort', order: 8 },

    // Security amenities
    { name: 'CCTV', category: 'security', order: 1 },
    { name: 'Security', category: 'security', order: 2 },
    { name: 'Intercom', category: 'security', order: 3 },

    // Recreation amenities
    { name: 'Gym', category: 'recreation', order: 1 },
    { name: 'Swimming Pool', category: 'recreation', order: 2 },
    { name: 'Garden', category: 'recreation', order: 3 },
    { name: 'Playground', category: 'recreation', order: 4 },
    { name: 'Club House', category: 'recreation', order: 5 },

    // Utility amenities
    { name: 'Power Backup', category: 'utility', order: 1 },
    { name: 'RO Water', category: 'utility', order: 2 },
    { name: 'Lift', category: 'utility', order: 3 },
    { name: 'Parking', category: 'utility', order: 4 },
    { name: 'Washroom', category: 'utility', order: 5 },
    { name: 'Conference Room', category: 'utility', order: 6 },
    { name: 'Pantry', category: 'utility', order: 7 },
    { name: 'Reception', category: 'utility', order: 8 },
];

async function seedAmenities() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI, { dbName: 'yourdbname' });
        console.log('Connected to MongoDB');

        // Clear existing amenities
        await Amenity.deleteMany({});
        console.log('Cleared existing amenities');

        // Insert new amenities
        const result = await Amenity.insertMany(amenitiesData);
        console.log(`Seeded ${result.length} amenities successfully`);

        // List all amenities
        const amenities = await Amenity.find().sort({ category: 1, order: 1 });
        console.log('\nSeeded amenities:');
        amenities.forEach(a => console.log(`  - ${a.name} (${a.category})`));

    } catch (error) {
        console.error('Error seeding amenities:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
}

seedAmenities();
