/**
 * Script to add placeholder images to properties that don't have any
 * Uses Picsum (Lorem Picsum) for free, reliable placeholder images
 * 
 * Run with: node scripts/add-placeholder-images.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Property schema (simplified for this script)
const propertySchema = new mongoose.Schema({
    photos: [String],
    propertyType: String,
    title: String,
    listingNumber: String
}, { strict: false });

const Property = mongoose.model('Property', propertySchema);

// Picsum placeholder images - high quality, free, no API key needed
// Using specific IDs for consistent, nice-looking property images
const PLACEHOLDER_IMAGES = {
    house: [
        'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
    ],
    apartment: [
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
    ],
    room: [
        'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80',
        'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800&q=80',
        'https://images.unsplash.com/photo-1598928506311-c55ez361a33?w=800&q=80',
    ],
    flat: [
        'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80',
        'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80',
        'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=800&q=80',
    ],
    default: [
        'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80',
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
        'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&q=80',
    ]
};

function getImagesForPropertyType(propertyType) {
    const type = (propertyType || '').toLowerCase();

    if (type.includes('house')) return PLACEHOLDER_IMAGES.house;
    if (type.includes('apartment')) return PLACEHOLDER_IMAGES.apartment;
    if (type.includes('room')) return PLACEHOLDER_IMAGES.room;
    if (type.includes('flat')) return PLACEHOLDER_IMAGES.flat;

    return PLACEHOLDER_IMAGES.default;
}

async function addPlaceholderImages() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected!\n');

        // Find properties with no photos or empty photos array
        const propertiesWithoutImages = await Property.find({
            $or: [
                { photos: { $exists: false } },
                { photos: { $size: 0 } },
                { photos: null }
            ]
        });

        console.log(`Found ${propertiesWithoutImages.length} properties without images\n`);

        if (propertiesWithoutImages.length === 0) {
            console.log('All properties have images!');
            await mongoose.disconnect();
            return;
        }

        let updated = 0;
        for (const property of propertiesWithoutImages) {
            const images = getImagesForPropertyType(property.propertyType);

            await Property.updateOne(
                { _id: property._id },
                { $set: { photos: images } }
            );

            console.log(`✓ Updated: ${property.listingNumber || property._id} (${property.propertyType || 'unknown type'})`);
            updated++;
        }

        console.log(`\n✅ Done! Updated ${updated} properties with placeholder images.`);

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');

    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

addPlaceholderImages();
