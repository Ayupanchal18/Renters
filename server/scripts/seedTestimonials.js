import mongoose from 'mongoose';
import { Testimonial } from '../models/Testimonial.js';

// Use the same connection as the app
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://ayupanchal00_db_user:ONbRmnaxW2jWfHPG@venturevault.cnnhrcb.mongodb.net/';

const testimonialsData = [
    {
        name: 'Rahul Sharma',
        role: 'Software Engineer',
        location: 'Mumbai, Maharashtra',
        content: 'Found my dream apartment in just 2 days! The search filters were incredibly accurate. Finally living in a place I actually love.',
        rating: 5,
        image: 'https://ui-avatars.com/api/?name=Rahul+Sharma&background=6366f1&color=fff&size=100',
        isActive: true,
        order: 1
    },
    {
        name: 'Priya Patel',
        role: 'Property Owner',
        location: 'Bangalore, Karnataka',
        content: 'Rented my flat in just 1 week! The platform is amazing for landlords. Great tenant quality and super easy management.',
        rating: 5,
        image: 'https://ui-avatars.com/api/?name=Priya+Patel&background=ec4899&color=fff&size=100',
        isActive: true,
        order: 2
    },
    {
        name: 'Arjun Mehta',
        role: 'Graduate Student',
        location: 'Delhi, NCR',
        content: 'The roommate matching feature is incredible! Found amazing flatmates and saved thousands on rent every month.',
        rating: 5,
        image: 'https://ui-avatars.com/api/?name=Arjun+Mehta&background=10b981&color=fff&size=100',
        isActive: true,
        order: 3
    }
];

async function seedTestimonials() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI, { dbName: 'yourdbname' });
        console.log('Connected to MongoDB');

        // Clear existing testimonials
        await Testimonial.deleteMany({});
        console.log('Cleared existing testimonials');

        // Insert new testimonials
        const result = await Testimonial.insertMany(testimonialsData);
        console.log(`Seeded ${result.length} testimonials successfully`);

        // List all testimonials
        const testimonials = await Testimonial.find().sort({ order: 1 });
        console.log('\nSeeded testimonials:');
        testimonials.forEach(t => console.log(`  - ${t.name} (${t.role})`));

    } catch (error) {
        console.error('Error seeding testimonials:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
}

seedTestimonials();
