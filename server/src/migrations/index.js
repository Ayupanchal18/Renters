/**
 * Migrations Index
 * Central registry for all database migrations
 * 
 * Add new migrations to the migrations array in version order.
 * Each migration must have:
 * - version: Unique string identifier (use format: "YYYYMMDD_NNN")
 * - name: Human-readable description
 * - up: Async function to apply the migration
 * - down: Async function to rollback the migration
 */

import { migrationRunner } from './migrationRunner.js';

/**
 * Example migration template:
 * 
 * {
 *   version: '20260109_001',
 *   name: 'Add index to users collection',
 *   up: async (db) => {
 *     // Apply migration
 *     await db.collection('users').createIndex({ email: 1 });
 *   },
 *   down: async (db) => {
 *     // Rollback migration
 *     await db.collection('users').dropIndex('email_1');
 *   }
 * }
 */

// Register all migrations
const migrations = [
    // Add migrations here in chronological order
    // Example:
    // {
    //   version: '20260109_001',
    //   name: 'Initial migration',
    //   up: async (db) => { /* migration code */ },
    //   down: async (db) => { /* rollback code */ }
    // }
];

// Register migrations with the runner
migrationRunner.register(migrations);

export { migrationRunner, migrations };
