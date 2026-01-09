/**
 * Migration Runner
 * Handles database migration execution, rollback, and status tracking
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */

import { Migration } from '../../models/Migration.js';
import logger from '../services/loggerService.js';
import crypto from 'crypto';

/**
 * Migration interface definition:
 * {
 *   version: string,      // Unique version identifier
 *   name: string,         // Human-readable name
 *   up: async (db) => {}, // Forward migration function
 *   down: async (db) => {} // Rollback migration function
 * }
 */

/**
 * Calculate checksum for migration content
 * @param {Object} migration - Migration object
 * @returns {string} - MD5 checksum
 */
function calculateChecksum(migration) {
    const content = `${migration.version}:${migration.name}:${migration.up.toString()}:${migration.down.toString()}`;
    return crypto.createHash('md5').update(content).digest('hex');
}

/**
 * MigrationRunner class
 * Manages database migrations with idempotence and rollback support
 */
class MigrationRunner {
    constructor() {
        this.migrations = [];
    }

    /**
     * Register migrations to be managed by the runner
     * @param {Array} migrations - Array of migration objects
     */
    register(migrations) {
        // Sort migrations by version
        this.migrations = [...migrations].sort((a, b) =>
            a.version.localeCompare(b.version)
        );
        logger.info('Migrations registered', {
            count: this.migrations.length,
            versions: this.migrations.map(m => m.version)
        });
    }

    /**
     * Get list of pending migrations (not yet applied)
     * @returns {Promise<Array>} - Array of pending migration objects
     */
    async getPending() {
        const applied = await Migration.find({ status: 'applied' })
            .select('version')
            .lean();

        const appliedVersions = new Set(applied.map(m => m.version));

        return this.migrations.filter(m => !appliedVersions.has(m.version));
    }

    /**
     * Run all pending migrations
     * @param {Object} db - Mongoose connection or database reference
     * @returns {Promise<Array>} - Array of migration results
     */
    async runPending(db = null) {
        const pending = await this.getPending();

        if (pending.length === 0) {
            logger.info('No pending migrations to run');
            return [];
        }

        const pendingVersions = pending.map(m => m.version);
        logger.info('Running pending migrations', {
            count: pending.length,
            versions: pendingVersions
        });

        const batchStartTime = Date.now();
        const results = [];

        for (const migration of pending) {
            const result = await this.runOne(migration, db);
            results.push(result);

            // Stop on failure
            if (result.status === 'failed') {
                logger.error('Migration failed, stopping execution', {
                    version: migration.version,
                    name: migration.name
                });
                break;
            }
        }

        // Log batch summary
        const batchDuration = Date.now() - batchStartTime;
        const applied = results.filter(r => r.status === 'applied').length;
        const skipped = results.filter(r => r.status === 'skipped').length;
        const failed = results.filter(r => r.status === 'failed').length;

        logger.info('Migration batch completed', {
            totalDuration: `${batchDuration}ms`,
            applied,
            skipped,
            failed,
            total: results.length
        });

        return results;
    }

    /**
     * Run a single migration
     * @param {Object} migration - Migration object
     * @param {Object} db - Database reference
     * @returns {Promise<Object>} - Migration result
     */
    async runOne(migration, db = null) {
        const { version, name, up } = migration;
        const checksum = calculateChecksum(migration);

        // Check if already applied (idempotence)
        const existing = await Migration.findOne({ version, status: 'applied' });
        if (existing) {
            logger.info('Migration already applied, skipping', { version, name });
            return {
                version,
                name,
                status: 'skipped',
                message: 'Already applied'
            };
        }

        logger.info('Starting migration', { version, name });
        const startTime = Date.now();

        try {
            // Execute the up migration
            await up(db);

            const executionTime = Date.now() - startTime;

            // Record successful migration
            await Migration.create({
                version,
                name,
                status: 'applied',
                executionTime,
                checksum,
                appliedAt: new Date()
            });

            logger.info('Migration completed successfully', {
                version,
                name,
                executionTime: `${executionTime}ms`
            });

            return {
                version,
                name,
                status: 'applied',
                executionTime
            };
        } catch (error) {
            const executionTime = Date.now() - startTime;

            // Record failed migration
            await Migration.create({
                version,
                name,
                status: 'failed',
                executionTime,
                checksum,
                error: error.message,
                appliedAt: new Date()
            });

            logger.error('Migration failed', {
                version,
                name,
                executionTime: `${executionTime}ms`,
                error: error.message
            }, error);

            return {
                version,
                name,
                status: 'failed',
                executionTime,
                error: error.message
            };
        }
    }

    /**
     * Rollback a specific migration by version
     * @param {string} version - Migration version to rollback
     * @param {Object} db - Database reference
     * @returns {Promise<Object>} - Rollback result
     */
    async rollback(version, db = null) {
        // Find the migration definition
        const migration = this.migrations.find(m => m.version === version);
        if (!migration) {
            throw new Error(`Migration version ${version} not found in registered migrations`);
        }

        // Check if migration was applied
        const record = await Migration.findOne({ version, status: 'applied' });
        if (!record) {
            logger.warn('Migration not applied or already rolled back', { version });
            return {
                version,
                name: migration.name,
                status: 'skipped',
                message: 'Not applied or already rolled back'
            };
        }

        logger.info('Starting rollback', { version, name: migration.name });
        const startTime = Date.now();

        try {
            // Execute the down migration
            await migration.down(db);

            const executionTime = Date.now() - startTime;

            // Update migration record
            await Migration.findOneAndUpdate(
                { version },
                {
                    status: 'rolled_back',
                    updatedAt: new Date()
                }
            );

            logger.info('Rollback completed successfully', {
                version,
                name: migration.name,
                executionTime: `${executionTime}ms`
            });

            return {
                version,
                name: migration.name,
                status: 'rolled_back',
                executionTime
            };
        } catch (error) {
            const executionTime = Date.now() - startTime;

            logger.error('Rollback failed', {
                version,
                name: migration.name,
                executionTime: `${executionTime}ms`,
                error: error.message
            }, error);

            return {
                version,
                name: migration.name,
                status: 'failed',
                executionTime,
                error: error.message
            };
        }
    }

    /**
     * Rollback the last N applied migrations
     * @param {number} count - Number of migrations to rollback (default: 1)
     * @param {Object} db - Database reference
     * @returns {Promise<Array>} - Array of rollback results
     */
    async rollbackLast(count = 1, db = null) {
        const applied = await Migration.find({ status: 'applied' })
            .sort({ appliedAt: -1 })
            .limit(count)
            .lean();

        if (applied.length === 0) {
            logger.info('No migrations to rollback');
            return [];
        }

        const versionsToRollback = applied.map(r => r.version);
        logger.info('Rolling back migrations', {
            count: applied.length,
            versions: versionsToRollback
        });

        const batchStartTime = Date.now();
        const results = [];

        for (const record of applied) {
            const result = await this.rollback(record.version, db);
            results.push(result);

            // Stop on failure
            if (result.status === 'failed') {
                logger.error('Rollback failed, stopping execution', {
                    version: record.version
                });
                break;
            }
        }

        // Log batch summary
        const batchDuration = Date.now() - batchStartTime;
        const rolledBack = results.filter(r => r.status === 'rolled_back').length;
        const skipped = results.filter(r => r.status === 'skipped').length;
        const failed = results.filter(r => r.status === 'failed').length;

        logger.info('Rollback batch completed', {
            totalDuration: `${batchDuration}ms`,
            rolledBack,
            skipped,
            failed,
            total: results.length
        });

        return results;
    }

    /**
     * Get status of all migrations
     * @returns {Promise<Array>} - Array of migration status objects
     */
    async getStatus() {
        const records = await Migration.find()
            .sort({ version: 1 })
            .lean();

        const recordMap = new Map(records.map(r => [r.version, r]));

        return this.migrations.map(migration => {
            const record = recordMap.get(migration.version);
            return {
                version: migration.version,
                name: migration.name,
                status: record?.status || 'pending',
                appliedAt: record?.appliedAt || null,
                executionTime: record?.executionTime || null,
                error: record?.error || null
            };
        });
    }

    /**
     * Check if a specific migration has been applied
     * @param {string} version - Migration version
     * @returns {Promise<boolean>} - True if applied
     */
    async isApplied(version) {
        const record = await Migration.findOne({ version, status: 'applied' });
        return !!record;
    }

    /**
     * Reset migration tracking (for testing purposes only)
     * WARNING: This does not undo database changes, only clears tracking records
     * @returns {Promise<void>}
     */
    async reset() {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('Cannot reset migrations in production');
        }

        logger.warn('Resetting migration tracking records');
        await Migration.deleteMany({});
    }
}

// Export singleton instance
export const migrationRunner = new MigrationRunner();

// Export class for testing
export { MigrationRunner };
