/**
 * Seed script to populate property categories in the database
 * Run with: node server/scripts/seedCategories.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Category } from '../models/Category.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || process.env.DATABASE_URL;

const CATEGORIES = [
    {
        name: "Room",
        slug: "room",
        description: "Single or shared rooms",
        icon: "Home",
        order: 1,
        isActive: true
    },
    {
        name: "Flat / Apartment",
        slug: "flat",
        description: "1BHK, 2BHK, 3BHK flats",
        icon: "Building2",
        order: 2,
        isActive: true
    },
    {
        name: "House",
        slug: "house",
        description: "Independent house or villa",
        icon: "Home",
        order: 3,
        isActive: true
    },
    {
        name: "PG (Paying Guest)",
        slug: "pg",
        description: "Paying guest accommodation",
        icon: "Users",
        order: 4,
        isActive: true
    },
    {
        name: "Hostel",
        slug: "hostel",
        description: "Hostel rooms and beds",
        icon: "Hotel",
        order: 5,
        isActive: true
    },
    {
        name: "Commercial",
        slug: "commercial",
        description: "Shop, Office, Warehouse",
        icon: "ShoppingCart",
        order: 6,
        isActive: true
    }
];

async function seedCategories() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI, {
            dbName: "yourdbname"
        });
        console.log('Connected to MongoDB');

        // Check existing categories
        const existingCount = await Category.countDocuments();
        console.log(`Found ${existingCount} existing categories`);

        if (existingCount > 0) {
            console.log('Categories already exist. Updating...');

            for (const cat of CATEGORIES) {
                await Category.findOneAndUpdate(
                    { slug: cat.slug },
                    cat,
                    { upsert: true, new: true }
                );
                console.log(`  - Upserted: ${cat.name}`);
            }
        } else {
            console.log('Seeding categories...');
            await Category.insertMany(CATEGORIES);
            console.log(`Successfully seeded ${CATEGORIES.length} categories`);
        }

        const finalCount = await Category.countDocuments();
        console.log(`Total categories: ${finalCount}`);

        await mongoose.disconnect();
        console.log('Done!');
    } catch (error) {
        console.error('Error seeding categories:', error);
        process.exit(1);
    }
}

seedCategories();
