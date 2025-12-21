import mongoose from "mongoose";
import { connectDB } from "./db.js";
import { ServiceConfiguration } from "../../models/ServiceConfiguration.js";
import { DeliveryAttempt } from "../../models/DeliveryAttempt.js";
import { OTP } from "../../models/OTP.js";

/**
 * Initialize database with proper indexes and default configurations
 * This should be run during application startup
 */
export async function initializeDatabase() {
    try {
        console.log('🔧 Initializing database...');

        // Ensure database connection
        await connectDB();

        // Initialize default service configurations
        await ServiceConfiguration.initializeDefaultConfigurations();

        // Ensure all indexes are created
        await ensureIndexes();

        // Verify database health
        await verifyDatabaseHealth();

        console.log('✅ Database initialization completed successfully');
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        throw error;
    }
}

/**
 * Ensure all required indexes are created for optimal query performance
 */
async function ensureIndexes() {
    console.log('📊 Creating database indexes...');

    try {
        // Let Mongoose handle the indexes defined in schemas
        // This ensures compatibility and avoids conflicts
        await OTP.ensureIndexes();
        await DeliveryAttempt.ensureIndexes();
        await ServiceConfiguration.ensureIndexes();

        console.log('✅ Database indexes created successfully');
    } catch (error) {
        console.error('❌ Error creating indexes:', error);
        // Don't throw the error if it's just an index conflict
        if (error.code === 85) {
            console.log('⚠️ Index conflict detected, but continuing with existing indexes');
        } else {
            throw error;
        }
    }
}

/**
 * Verify database health and connectivity
 */
async function verifyDatabaseHealth() {
    console.log('🏥 Verifying database health...');

    try {
        // Test basic connectivity
        const adminDb = mongoose.connection.db.admin();
        const result = await adminDb.ping();

        if (result.ok !== 1) {
            throw new Error('Database ping failed');
        }

        // Verify collections exist
        const collections = await mongoose.connection.db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);

        const requiredCollections = ['otps', 'deliveryattempts', 'serviceconfigurations'];
        const missingCollections = requiredCollections.filter(name => !collectionNames.includes(name));

        if (missingCollections.length > 0) {
            console.warn('⚠️ Missing collections will be created on first use:', missingCollections);
        }

        // Test basic operations
        const serviceCount = await ServiceConfiguration.countDocuments();
        console.log(`📊 Found ${serviceCount} service configurations`);

        console.log('✅ Database health verification completed');
    } catch (error) {
        console.error('❌ Database health verification failed:', error);
        throw error;
    }
}

/**
 * SAFE: Clean up only expired OTPs and very old delivery attempts
 * This can be run periodically as a maintenance task
 */
export async function performDatabaseMaintenance() {
    console.log('🧹 Performing SAFE database maintenance...');

    try {
        // SAFE: Clean up expired OTPs that somehow weren't auto-deleted
        const expiredOTPs = await OTP.deleteMany({
            expiresAt: { $lt: new Date() },
            verified: false
        });

        // DISABLED: Delivery attempt cleanup is disabled for data safety
        console.log('⚠️ Delivery attempt cleanup is DISABLED for data safety');

        console.log(`✅ Safe maintenance completed: ${expiredOTPs.deletedCount} expired OTPs removed`);
        console.log('⚠️ Other cleanup operations are disabled for data safety');
    } catch (error) {
        console.error('❌ Database maintenance failed:', error);
        throw error;
    }
}

/**
 * Get comprehensive database statistics
 */
export async function getDatabaseStats() {
    try {
        const stats = {
            collections: {},
            indexes: {},
            health: {}
        };

        // Collection statistics
        stats.collections.otps = await OTP.countDocuments();
        stats.collections.deliveryAttempts = await DeliveryAttempt.countDocuments();
        stats.collections.serviceConfigurations = await ServiceConfiguration.countDocuments();

        // Index statistics
        const otpIndexes = await OTP.collection.getIndexes();
        const deliveryIndexes = await DeliveryAttempt.collection.getIndexes();
        const configIndexes = await ServiceConfiguration.collection.getIndexes();

        stats.indexes.otps = Object.keys(otpIndexes).length;
        stats.indexes.deliveryAttempts = Object.keys(deliveryIndexes).length;
        stats.indexes.serviceConfigurations = Object.keys(configIndexes).length;

        // Health statistics
        stats.health.connectionState = mongoose.connection.readyState;
        stats.health.dbName = mongoose.connection.name;
        stats.health.host = mongoose.connection.host;
        stats.health.port = mongoose.connection.port;

        return stats;
    } catch (error) {
        console.error('❌ Error getting database stats:', error);
        throw error;
    }
}