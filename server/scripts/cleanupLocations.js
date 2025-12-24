/**
 * Cleanup script to keep only top 15 cities
 * Run with: node server/scripts/cleanupLocations.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Location } from '../models/Location.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || process.env.DATABASE_URL;

const TOP_15_CITIES = [
    "Mumbai",
    "Delhi",
    "Bangalore",
    "Hyderabad",
    "Chennai",
    "Kolkata",
    "Pune",
    "Ahmedabad",
    "Jaipur",
    "Surat",
    "Lucknow",
    "Kanpur",
    "Nagpur",
    "Indore",
    "Thane"
];

async function cleanupLocations() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI, {
            dbName: "yourdbname"
        });
        console.log('Connected to MongoDB');

        // Delete all cities not in the top 15 list
        const result = await Location.deleteMany({
            type: 'city',
            name: { $nin: TOP_15_CITIES }
        });

        console.log(`Deleted ${result.deletedCount} cities`);

        const remaining = await Location.countDocuments({ type: 'city' });
        console.log(`Remaining cities: ${remaining}`);

        await mongoose.disconnect();
        console.log('Done!');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

cleanupLocations();
