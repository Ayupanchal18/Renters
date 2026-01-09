/**
 * Migration Model
 * Tracks database migration status for schema changes
 * 
 * Requirements: 8.1, 8.2, 8.5
 */

import mongoose from "mongoose";
const { Schema } = mongoose;

const MigrationSchema = new Schema(
    {
        // Unique version identifier (e.g., "001", "002", "20260109_001")
        version: {
            type: String,
            required: true,
            unique: true,
            index: true
        },

        // Human-readable migration name
        name: {
            type: String,
            required: true
        },

        // When the migration was applied
        appliedAt: {
            type: Date,
            default: Date.now
        },

        // Migration status
        status: {
            type: String,
            enum: ['applied', 'rolled_back', 'failed'],
            default: 'applied'
        },

        // Execution time in milliseconds
        executionTime: {
            type: Number,
            default: 0
        },

        // Error message if migration failed
        error: {
            type: String,
            default: null
        },

        // Checksum of migration file for integrity verification
        checksum: {
            type: String,
            default: null
        },

        // User or system that ran the migration
        executedBy: {
            type: String,
            default: 'system'
        }
    },
    { timestamps: true }
);

// Index for querying migration status
MigrationSchema.index({ status: 1, appliedAt: -1 });
MigrationSchema.index({ version: 1, status: 1 });

export const Migration =
    mongoose.models.Migration || mongoose.model("Migration", MigrationSchema);
