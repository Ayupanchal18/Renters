/**
 * Fix properties that have local image paths instead of CDN URLs
 * Run with: node scripts/fix-local-paths.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

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
    default: [
        'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80',
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
        'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&q=80',
    ]
};

function getImagesForType(propertyType) {
    const type = (propertyType || '').toLowerCase();
    if (type.includes('house') || type.includes('villa') || type.includes('duplex')) return PLACEHOLDER_IMAGES.house;
    if (type.includes('apartment') || type.includes('flat') || type.includes('bhk')) return PLACEHOLDER_IMAGES.apartment;
    if (type.includes('room')) return PLACEHOLDER_IMAGES.room;
    return PLACEHOLDER_IMAGES.default;
}

async function fixLocalPaths() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected!\n');

        const db = mongoose.connection.db;

        // Find all properties
        const allProps = await db.collection('properties').find({}).toArray();
        console.log(`Total properties: ${allProps.length}`);

        // Filter properties with local paths (not starting with https)
        const propsWithLocalPaths = allProps.filter(p => {
            if (!p.photos || p.photos.length === 0) return false;
            return p.photos.some(photo => !photo.startsWith('https://'));
        });

        console.log(`Properties with local paths: ${propsWithLocalPaths.length}\n`);

        let updated = 0;
        for (const prop of propsWithLocalPaths) {
            const images = getImagesForType(prop.propertyType);

            await db.collection('properties').updateOne(
                { _id: prop._id },
                { $set: { photos: images } }
            );

            console.log(`✓ Fixed: ${prop.listingNumber || prop._id} (${prop.propertyType || 'unknown'})`);
            updated++;
        }

        console.log(`\n✅ Done! Fixed ${updated} properties.`);

        await mongoose.disconnect();

    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

fixLocalPaths();
