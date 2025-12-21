/**
 * Script to create or update a user to admin role
 * 
 * Usage: node scripts/create-admin.js
 * 
 * This will either:
 * 1. Create a new admin user if none exists
 * 2. Or update an existing user to admin role
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/renters';

// User schema (simplified for this script)
const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    phone: String,
    passwordHash: String,
    role: { type: String, enum: ['user', 'seller', 'admin'], default: 'user' },
    userType: { type: String, default: 'buyer' },
    verified: { type: Boolean, default: true },
    emailVerified: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
    isBlocked: { type: Boolean, default: false },
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

async function createAdmin() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('Connected!\n');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ role: 'admin' });

        if (existingAdmin) {
            console.log('✅ Admin user already exists:');
            console.log(`   Email: ${existingAdmin.email}`);
            console.log(`   Name: ${existingAdmin.name}`);
            console.log('\n   You can login with this account to access /admin');
        } else {
            // Create new admin user
            const adminPassword = 'Admin@123'; // Change this!
            const passwordHash = await bcrypt.hash(adminPassword, 10);

            const admin = await User.create({
                name: 'Admin User',
                email: 'admin@renters.com',
                phone: '+1234567890',
                passwordHash,
                role: 'admin',
                userType: 'buyer',
                verified: true,
                emailVerified: true,
                isActive: true,
                isBlocked: false,
            });

            console.log('✅ Admin user created successfully!');
            console.log('\n   Login credentials:');
            console.log(`   Email: ${admin.email}`);
            console.log(`   Password: ${adminPassword}`);
            console.log('\n   ⚠️  Please change the password after first login!');
        }

        console.log('\n📍 Admin Panel URL: http://localhost:8080/admin');

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
}

createAdmin();
