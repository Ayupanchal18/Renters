/**
 * Migration Script: Assign listingType to existing properties
 * 
 * This script migrates existing properties that don't have a listingType field.
 * 
 * Migration Logic (per Requirements 10.1, 10.2, 10.3, 10.4):
 * - Properties with monthlyRent > 0 → listingType = "rent"
 * - Properties with sellingPrice > 0 but no monthlyRent → listingType = "buy"
 * - Properties with neither → listingType = "rent" (default)
 * - Properties with both rent and buy fields → listingType = "rent" (flagged for review)
 * 
 * Run with: node server/scripts/migrateListingTypes.js
 * 
 * Options:
 *   --dry-run    Preview changes without modifying the database
 *   --verbose    Show detailed logging for each property
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Property } from '../models/Property.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || process.env.DATABASE_URL ||
    "mongodb+srv://ayupanchal00_db_user:ONbRmnaxW2jWfHPG@venturevault.cnnhrcb.mongodb.net/";

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isVerbose = args.includes('--verbose');

// Migration statistics
const stats = {
    total: 0,
    migrated: {
        rent: 0,
        buy: 0
    },
    skipped: 0,
    flaggedForReview: [],
    errors: []
};

// Audit log entries
const auditLog = [];

/**
 * Determines the listing type for a property based on its fields
 * @param {Object} property - The property document
 * @returns {{ listingType: string, reason: string, flagged: boolean }}
 */
function determineListingType(property) {
    const hasMonthlyRent = property.monthlyRent && property.monthlyRent > 0;
    const hasSellingPrice = property.sellingPrice && property.sellingPrice > 0;

    // Case 1: Has both rent and buy fields - flag for manual review, default to rent
    if (hasMonthlyRent && hasSellingPrice) {
        return {
            listingType: 'rent',
            reason: 'Has both monthlyRent and sellingPrice - defaulting to rent, flagged for review',
            flagged: true
        };
    }

    // Case 2: Has sellingPrice but no monthlyRent - assign as buy (Requirement 10.4)
    if (hasSellingPrice && !hasMonthlyRent) {
        return {
            listingType: 'buy',
            reason: 'Has sellingPrice without monthlyRent',
            flagged: false
        };
    }

    // Case 3: Has monthlyRent - assign as rent
    if (hasMonthlyRent) {
        return {
            listingType: 'rent',
            reason: 'Has monthlyRent field',
            flagged: false
        };
    }

    // Case 4: Has neither price field - default to rent (Requirement 10.1)
    return {
        listingType: 'rent',
        reason: 'No price fields found - defaulting to rent',
        flagged: true
    };
}

/**
 * Creates an audit log entry for a migrated property
 * @param {Object} property - The property document
 * @param {string} listingType - The assigned listing type
 * @param {string} reason - The reason for the assignment
 * @param {boolean} flagged - Whether the property was flagged for review
 */
function logMigration(property, listingType, reason, flagged) {
    const entry = {
        timestamp: new Date().toISOString(),
        propertyId: property._id.toString(),
        listingNumber: property.listingNumber || 'N/A',
        slug: property.slug || 'N/A',
        title: property.title,
        assignedListingType: listingType,
        reason: reason,
        flaggedForReview: flagged,
        originalData: {
            monthlyRent: property.monthlyRent || null,
            sellingPrice: property.sellingPrice || null,
            securityDeposit: property.securityDeposit || null,
            pricePerSqft: property.pricePerSqft || null
        }
    };

    auditLog.push(entry);

    if (isVerbose) {
        console.log(`  [${listingType.toUpperCase()}] ${property.title}`);
        console.log(`    ID: ${property._id}`);
        console.log(`    Reason: ${reason}`);
        if (flagged) {
            console.log(`    ⚠️  FLAGGED FOR REVIEW`);
        }
    }
}

/**
 * Main migration function
 */
async function migrateListingTypes() {
    console.log('='.repeat(60));
    console.log('Property Listing Type Migration Script');
    console.log('='.repeat(60));

    if (isDryRun) {
        console.log('\n🔍 DRY RUN MODE - No changes will be made to the database\n');
    }

    try {
        // Connect to MongoDB
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI, {
            dbName: "yourdbname",
            serverSelectionTimeoutMS: 10000
        });
        console.log('✅ Connected to MongoDB\n');

        // Query properties without listingType field
        // Note: We need to use $or to find properties where listingType doesn't exist or is null
        console.log('Querying properties without listingType...');
        const propertiesToMigrate = await Property.find({
            $or: [
                { listingType: { $exists: false } },
                { listingType: null }
            ]
        }).lean();

        stats.total = propertiesToMigrate.length;
        console.log(`Found ${stats.total} properties to migrate\n`);

        if (stats.total === 0) {
            console.log('✅ No properties need migration. All properties already have listingType assigned.');
            await mongoose.disconnect();
            return;
        }

        console.log('Processing properties...');
        if (isVerbose) {
            console.log('-'.repeat(40));
        }

        // Process each property
        for (const property of propertiesToMigrate) {
            try {
                const { listingType, reason, flagged } = determineListingType(property);

                // Log the migration
                logMigration(property, listingType, reason, flagged);

                // Track flagged properties
                if (flagged) {
                    stats.flaggedForReview.push({
                        id: property._id.toString(),
                        listingNumber: property.listingNumber || 'N/A',
                        title: property.title,
                        reason: reason
                    });
                }

                // Update the property (unless dry run)
                if (!isDryRun) {
                    // Use updateOne with $set to bypass immutable constraint for migration
                    await Property.collection.updateOne(
                        { _id: property._id },
                        { $set: { listingType: listingType } }
                    );
                }

                // Update statistics
                stats.migrated[listingType]++;

            } catch (error) {
                stats.errors.push({
                    propertyId: property._id.toString(),
                    error: error.message
                });
                console.error(`  ❌ Error migrating property ${property._id}: ${error.message}`);
            }
        }

        // Print summary
        console.log('\n' + '='.repeat(60));
        console.log('MIGRATION SUMMARY');
        console.log('='.repeat(60));
        console.log(`Total properties processed: ${stats.total}`);
        console.log(`  - Assigned as RENT: ${stats.migrated.rent}`);
        console.log(`  - Assigned as BUY: ${stats.migrated.buy}`);
        console.log(`  - Errors: ${stats.errors.length}`);
        console.log(`  - Flagged for review: ${stats.flaggedForReview.length}`);

        // Print flagged properties
        if (stats.flaggedForReview.length > 0) {
            console.log('\n⚠️  PROPERTIES FLAGGED FOR MANUAL REVIEW:');
            console.log('-'.repeat(40));
            for (const flagged of stats.flaggedForReview) {
                console.log(`  ID: ${flagged.id}`);
                console.log(`  Listing #: ${flagged.listingNumber}`);
                console.log(`  Title: ${flagged.title}`);
                console.log(`  Reason: ${flagged.reason}`);
                console.log('');
            }
        }

        // Print errors
        if (stats.errors.length > 0) {
            console.log('\n❌ ERRORS:');
            console.log('-'.repeat(40));
            for (const err of stats.errors) {
                console.log(`  Property ${err.propertyId}: ${err.error}`);
            }
        }

        // Save audit log to file
        const auditFileName = `migration-audit-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
        const fs = await import('fs');
        fs.writeFileSync(
            `server/scripts/${auditFileName}`,
            JSON.stringify({
                migrationDate: new Date().toISOString(),
                isDryRun: isDryRun,
                statistics: stats,
                auditLog: auditLog
            }, null, 2)
        );
        console.log(`\n📝 Audit log saved to: server/scripts/${auditFileName}`);

        if (isDryRun) {
            console.log('\n🔍 DRY RUN COMPLETE - No changes were made to the database');
            console.log('   Run without --dry-run to apply changes');
        } else {
            console.log('\n✅ MIGRATION COMPLETE');
        }

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');

    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run the migration
migrateListingTypes();
