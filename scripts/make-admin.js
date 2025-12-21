/**
 * Script to upgrade an existing user to admin role
 * 
 * Usage: node scripts/make-admin.js <email>
 * Example: node scripts/make-admin.js myemail@example.com
 */

import 'dotenv/config';
import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/renters';

async function makeAdmin() {
    const email = process.argv[2];

    if (!email) {
        console.log('Usage: node scripts/make-admin.js <email>');
        console.log('Example: node scripts/make-admin.js myemail@example.com');
        process.exit(1);
    }

    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('Connected!\n');

        // Get the users collection directly
        const db = mongoose.connection.db;
        const usersCollection = db.collection('users');

        // Find the user
        const user = await usersCollection.findOne({ email: email.toLowerCase() });

        if (!user) {
            console.log(`❌ User with email "${email}" not found`);
            console.log('\nAvailable users:');
            const allUsers = await usersCollection.find({}, { projection: { email: 1, name: 1, role: 1 } }).limit(10).toArray();
            allUsers.forEach(u => {
                console.log(`   - ${u.email} (${u.name}) - Role: ${u.role || 'user'}`);
            });
            process.exit(1);
        }

        if (user.role === 'admin') {
            console.log(`✅ User "${user.name}" (${user.email}) is already an admin!`);
        } else {
            // Update user to admin
            await usersCollection.updateOne(
                { _id: user._id },
                {
                    $set: {
                        role: 'admin',
                        isActive: true,
                        isBlocked: false
                    }
                }
            );

            console.log(`✅ User "${user.name}" (${user.email}) has been upgraded to admin!`);
            console.log('\n⚠️  IMPORTANT: You need to LOG OUT and LOG IN again for the changes to take effect.');
        }

        console.log('\n📍 Admin Panel URL: http://localhost:8080/admin');
        console.log('💡 After logging in, click on your profile icon to see the "Admin Panel" button');

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
}

makeAdmin();
