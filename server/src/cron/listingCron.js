/**
 * Listing Lifecycle Cron Job
 * 
 * This module provides functions to run listing lifecycle tasks.
 * It can be integrated with node-cron, or called manually from an admin endpoint.
 * 
 * Usage with node-cron (if you add it as a dependency):
 * ```
 * import cron from 'node-cron';
 * import { startLifecycleCron } from './server/src/cron/listingCron.js';
 * startLifecycleCron();
 * ```
 * 
 * Or call manually via admin API:
 * POST /api/admin/lifecycle/run
 */

import listingLifecycleService from "../services/listingLifecycleService.js";

// Track last run times
let lastRunTimes = {
    processExpired: null,
    sendWarnings: null
};

/**
 * Run all lifecycle tasks
 * @returns {Object} Results from all tasks
 */
export async function runLifecycleTasks() {
    console.log("[Cron] Running listing lifecycle tasks...");
    const startTime = Date.now();

    const results = {
        timestamp: new Date().toISOString(),
        tasks: {}
    };

    // Process expired listings
    try {
        results.tasks.processExpired = await listingLifecycleService.processExpiredListings();
        lastRunTimes.processExpired = new Date();
    } catch (error) {
        results.tasks.processExpired = { error: error.message };
    }

    // Send expiration warnings
    try {
        results.tasks.sendWarnings = await listingLifecycleService.sendExpirationWarnings();
        lastRunTimes.sendWarnings = new Date();
    } catch (error) {
        results.tasks.sendWarnings = { error: error.message };
    }

    results.durationMs = Date.now() - startTime;
    console.log(`[Cron] Lifecycle tasks completed in ${results.durationMs}ms`);

    return results;
}

/**
 * Get the status of the cron job
 * @returns {Object} Cron status
 */
export function getCronStatus() {
    return {
        lastRunTimes,
        config: {
            listingDurationDays: listingLifecycleService.LISTING_DURATION_DAYS,
            warningDaysBeforeExpiry: listingLifecycleService.WARNING_DAYS_BEFORE_EXPIRY
        }
    };
}

/**
 * Start the cron scheduler (requires node-cron)
 * Call this from your server startup if you have node-cron installed
 */
export async function startLifecycleCron() {
    // Check if node-cron is available
    try {
        const cron = await import('node-cron');

        // Run daily at midnight
        cron.schedule('0 0 * * *', async () => {
            console.log("[Cron] Scheduled lifecycle run triggered");
            await runLifecycleTasks();
        });

        console.log("[Cron] Listing lifecycle cron job scheduled (daily at midnight)");
        return true;
    } catch (error) {
        console.log("[Cron] node-cron not available, lifecycle tasks must be run manually");
        console.log("[Cron] Install with: npm install node-cron");
        return false;
    }
}

export default {
    runLifecycleTasks,
    getCronStatus,
    startLifecycleCron
};
