/**
 * Seed Test Transactions Script
 * Creates transaction entries spread over 90 days for analytics verification
 * 
 * Usage: node server/scripts/seedTransactions.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import { Transaction } from "../models/Transaction.js";
import { User } from "../models/User.js";
import { Property } from "../models/Property.js";

dotenv.config();

const txnTypes = ['subscription', 'listing_fee', 'featured_boost', 'refund'];
const txnStatuses = ['completed', 'completed', 'completed', 'completed', 'pending', 'failed', 'refunded']; // weighted
const gateways = ['razorpay', 'stripe', 'manual'];

function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

async function seedTransactions() {
    console.log("============================================================");
    console.log("       Transactions Seed Script");
    console.log("============================================================\n");

    try {
        const mongoUri = process.env.MONGO_URI;
        await mongoose.connect(mongoUri);
        console.log("✅ Connected to MongoDB\n");

        // Clear existing transactions first to keep clean records
        console.log("Cleaning existing transactions...");
        await Transaction.deleteMany({});
        console.log("✅ Transaction history cleared.");

        // Find users to associate with
        const users = await User.find({ isDeleted: { $ne: true } }).limit(10).lean();
        if (users.length === 0) {
            console.warn("⚠️ No users found in database. Please register/seed users first.");
            await mongoose.disconnect();
            return;
        }

        // Find properties to associate listing fees and featured boosts
        const properties = await Property.find({ isDeleted: { $ne: true } }).limit(20).lean();

        const transactionsToInsert = [];
        const now = new Date();

        console.log("Generating 150 historical transactions spread over 90 days...");

        for (let i = 0; i < 150; i++) {
            const user = getRandomElement(users);
            const property = properties.length > 0 ? getRandomElement(properties) : null;
            const type = getRandomElement(txnTypes);
            const status = getRandomElement(txnStatuses);
            const gateway = getRandomElement(gateways);

            // Determine amount based on type
            let amount = 999; // default listing fee
            if (type === 'subscription') {
                amount = getRandomElement([1999, 2999, 4999]);
            } else if (type === 'featured_boost') {
                amount = getRandomElement([499, 799, 1499]);
            } else if (type === 'refund') {
                amount = getRandomElement([499, 999, 1999]);
            }

            // Generate a date within the last 90 days
            const daysAgo = Math.floor(Math.random() * 90);
            const hoursAgo = Math.floor(Math.random() * 24);
            const minsAgo = Math.floor(Math.random() * 60);
            const txnDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000) - (hoursAgo * 60 * 60 * 1000) - (minsAgo * 60 * 1000));

            const gatewayTxnId = `pay_${Math.random().toString(36).substring(2, 10).toUpperCase()}_${i}`;

            transactionsToInsert.push({
                userId: user._id,
                propertyId: (type === 'listing_fee' || type === 'featured_boost') && property ? property._id : null,
                type,
                amount,
                currency: 'INR',
                status: type === 'refund' ? 'refunded' : status,
                gateway,
                gatewayTxnId,
                description: `Payment for ${type.replace('_', ' ')} ${property ? `on property: ${property.title}` : ''}`,
                createdAt: txnDate,
                updatedAt: txnDate
            });
        }

        // Insert into database
        console.log(`Inserting ${transactionsToInsert.length} transactions...`);
        const inserted = await Transaction.insertMany(transactionsToInsert);
        console.log(`✅ Success! Seeded ${inserted.length} transactions.`);
        
        console.log("\n✅ TRANSACTION SEED COMPLETE");

    } catch (error) {
        console.error("❌ Error seeding transactions:", error);
    } finally {
        await mongoose.disconnect();
        console.log("\nDisconnected from MongoDB");
    }
}

seedTransactions();
