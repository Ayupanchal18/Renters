/**
 * Seed script to populate initial locations (cities) in the database
 * Run with: node server/scripts/seedLocations.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Location } from '../models/Location.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || process.env.DATABASE_URL;

const INDIAN_CITIES = [
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
    "Thane",
    "Bhopal",
    "Visakhapatnam",
    "Patna",
    "Vadodara",
    "Ghaziabad",
    "Ludhiana",
    "Agra",
    "Nashik",
    "Faridabad",
    "Meerut",
    "Rajkot",
    "Varanasi",
    "Srinagar",
    "Aurangabad",
    "Dhanbad",
    "Amritsar",
    "Navi Mumbai",
    "Allahabad",
    "Ranchi",
    "Howrah",
    "Coimbatore",
    "Jabalpur",
    "Gwalior",
    "Vijayawada",
    "Jodhpur",
    "Madurai",
    "Raipur",
    "Kota",
    "Chandigarh",
    "Guwahati",
    "Solapur",
    "Hubli",
    "Mysore",
    "Tiruchirappalli",
    "Bareilly"
];

async function seedLocations() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI, {
            dbName: "yourdbname"  // Use the same database as the app
        });
        console.log('Connected to MongoDB');

        // Check existing cities
        const existingCount = await Location.countDocuments({ type: 'city' });
        console.log(`Found ${existingCount} existing cities`);

        if (existingCount > 0) {
            console.log('Cities already exist. Skipping seed.');
            console.log('If you want to re-seed, delete existing locations first.');
            await mongoose.disconnect();
            return;
        }

        console.log('Seeding cities...');

        const cities = INDIAN_CITIES.map(name => ({
            name,
            type: 'city',
            isVisible: true,
            propertyCount: 0
        }));

        const result = await Location.insertMany(cities);
        console.log(`Successfully seeded ${result.length} cities`);

        await mongoose.disconnect();
        console.log('Done!');
    } catch (error) {
        console.error('Error seeding locations:', error);
        process.exit(1);
    }
}

seedLocations();
