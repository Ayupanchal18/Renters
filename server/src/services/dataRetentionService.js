import cron from 'node-cron';
import dataCleanupService from './dataCleanupService.js';
import { SecurityAuditLog } from '../../models/SecurityAuditLog.js';
import { NotificationDelivery } from '../../models/NotificationDelivery.js';
import { OTP } from '../../models/OTP.js';
import { User } from '../../models/User.js';
import { connectDB } from '../config/db.js';

/**
 * Data Retention Service - DISABLED FOR DATA SAFETY
 * Most automated data cleanup operations have been disabled to prevent accidental data loss
 * Only safe operations like expired OTP cleanup are allowed
 */
class DataRetentionService {
    constructor() {
        this.isRunning = false;
        this.scheduledJobs = new Map();

        console.warn('⚠️ DataRetentionService: Most deletion operations are DISABLED for data safety');

        // Default retention policies (in days) - most are disabled
        this.retentionPolicies = {
            otpRecords: parseInt(process.env.OTP_RETENTION_DAYS) || 1, // Only safe operation
            // DISABLED: auditLogs: parseInt(process.env.AUDIT_LOG_RETENTION_DAYS) || 365,
            // DISABLED: notificationDeliveries: parseInt(process.env.NOTIFICATION_RETENTION_DAYS) || 90,
            // DISABLED: deletedUsers: parseInt(process.env.DELETED_USER_RETENTION_DAYS) || 30,
            // DISABLED: inactiveUsers: parseInt(process.env.INACTIVE_USER_RETENTION_DAYS) || 1095,
            // DISABLED: failedLoginAttempts: parseInt(process.env.FAILED_LOGIN_RETENTION_DAYS) || 30,
            // DISABLED: sessionLogs: parseInt(process.env.SESSION_LOG_RETENTION_DAYS) || 180
        };

        this.schedules = {
            // Daily cleanup at 2 AM
            daily: '0 2 * * *',
            // Weekly cleanup on Sunday at 3 AM
            weekly: '0 3 * * 0',
            // Monthly cleanup on 1st at 4 AM
            monthly: '0 4 1 * *'
        };
    }

    /**
     * Start the data retention service
     */
    start() {
        if (this.isRunning) {
            console.log('Data retention service is already running');
            return;
        }

        console.log('Starting data retention service...');

        try {
            // Schedule daily cleanup
            this.scheduledJobs.set('daily', cron.schedule(this.schedules.daily, async () => {
                console.log('Running daily data retention cleanup...');
                await this.runDailyCleanup();
            }, {
                scheduled: false,
                timezone: process.env.TZ || 'UTC'
            }));

            // Schedule weekly cleanup
            this.scheduledJobs.set('weekly', cron.schedule(this.schedules.weekly, async () => {
                console.log('Running weekly data retention cleanup...');
                await this.runWeeklyCleanup();
            }, {
                scheduled: false,
                timezone: process.env.TZ || 'UTC'
            }));

            // Schedule monthly cleanup
            this.scheduledJobs.set('monthly', cron.schedule(this.schedules.monthly, async () => {
                console.log('Running monthly data retention cleanup...');
                await this.runMonthlyCleanup();
            }, {
                scheduled: false,
                timezone: process.env.TZ || 'UTC'
            }));

            // Start all scheduled jobs
            this.scheduledJobs.forEach((job, name) => {
                job.start();
                console.log(`Scheduled ${name} data retention job`);
            });

            this.isRunning = true;
            console.log('Data retention service started successfully');

        } catch (error) {
            console.error('Failed to start data retention service:', error);
            this.stop();
        }
    }

    /**
     * Stop the data retention service
     */
    stop() {
        console.log('Stopping data retention service...');

        this.scheduledJobs.forEach((job, name) => {
            job.stop();
            job.destroy();
            console.log(`Stopped ${name} data retention job`);
        });

        this.scheduledJobs.clear();
        this.isRunning = false;
        console.log('Data retention service stopped');
    }

    /**
     * Run daily cleanup tasks - ONLY SAFE OPERATIONS
     */
    async runDailyCleanup() {
        const startTime = Date.now();
        const results = {
            expiredOTPs: 0,
            disabledOperations: [],
            errors: []
        };

        try {
            await connectDB();

            // SAFE: Clean up expired OTP records
            try {
                const otpCutoff = new Date();
                otpCutoff.setDate(otpCutoff.getDate() - this.retentionPolicies.otpRecords);

                const expiredOTPs = await OTP.deleteMany({
                    $or: [
                        { expiresAt: { $lt: new Date() } },
                        { createdAt: { $lt: otpCutoff } }
                    ]
                });
                results.expiredOTPs = expiredOTPs.deletedCount;
            } catch (error) {
                results.errors.push(`OTP cleanup error: ${error.message}`);
            }

            // DISABLED: Failed login attempts cleanup is disabled for data safety
            results.disabledOperations.push('failed login attempts cleanup');

            const duration = Date.now() - startTime;
            console.log(`Daily cleanup completed in ${duration}ms:`, results);

        } catch (error) {
            console.error('Daily cleanup failed:', error);
            results.errors.push(`Daily cleanup error: ${error.message}`);
        }

        return results;
    }

    /**
     * DISABLED: Weekly cleanup tasks are disabled for data safety
     */
    async runWeeklyCleanup() {
        const startTime = Date.now();
        const results = {
            disabledOperations: [
                'notification deliveries cleanup',
                'session logs cleanup'
            ],
            errors: []
        };

        console.log('⚠️ Weekly cleanup operations are DISABLED for data safety');

        const duration = Date.now() - startTime;
        console.log(`Weekly cleanup completed in ${duration}ms:`, results);

        return results;
    }

    /**
     * DISABLED: Monthly cleanup tasks are disabled for data safety
     */
    async runMonthlyCleanup() {
        const startTime = Date.now();
        const results = {
            disabledOperations: [
                'audit logs cleanup',
                'deleted users cleanup',
                'inactive users cleanup'
            ],
            errors: []
        };

        console.log('⚠️ Monthly cleanup operations are DISABLED for data safety');

        const duration = Date.now() - startTime;
        console.log(`Monthly cleanup completed in ${duration}ms:`, results);

        return results;
    }

    /**
     * Run manual cleanup with custom retention policies
     * @param {object} customPolicies - Custom retention policies
     * @returns {Promise<object>} Cleanup results
     */
    async runManualCleanup(customPolicies = {}) {
        const policies = { ...this.retentionPolicies, ...customPolicies };

        console.log('Running manual cleanup with policies:', policies);

        const results = await dataCleanupService.cleanupExpiredData(policies);

        console.log('Manual cleanup completed:', results);

        return results;
    }

    /**
     * Get retention policy statistics
     * @returns {Promise<object>} Statistics about data eligible for cleanup
     */
    async getRetentionStatistics() {
        try {
            await connectDB();

            const now = new Date();
            const stats = {};

            // Calculate cutoff dates
            const cutoffs = {};
            Object.entries(this.retentionPolicies).forEach(([key, days]) => {
                cutoffs[key] = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
            });

            // Count records eligible for cleanup
            stats.eligibleForCleanup = {
                auditLogs: await SecurityAuditLog.countDocuments({
                    createdAt: { $lt: cutoffs.auditLogs }
                }),
                otpRecords: await OTP.countDocuments({
                    $or: [
                        { expiresAt: { $lt: now } },
                        { createdAt: { $lt: cutoffs.otpRecords } }
                    ]
                }),
                notificationDeliveries: await NotificationDelivery.countDocuments({
                    createdAt: { $lt: cutoffs.notificationDeliveries },
                    status: { $in: ['delivered', 'failed', 'bounced'] }
                }),
                deletedUsers: await User.countDocuments({
                    isDeleted: true,
                    deletedAt: { $lt: cutoffs.deletedUsers }
                }),
                inactiveUsers: await User.countDocuments({
                    'privacySettings.dataRetention.autoDeleteInactive': true,
                    lastLoginAt: { $lt: cutoffs.inactiveUsers },
                    isDeleted: { $ne: true }
                })
            };

            // Calculate total records
            stats.totalRecords = {
                auditLogs: await SecurityAuditLog.countDocuments(),
                otpRecords: await OTP.countDocuments(),
                notificationDeliveries: await NotificationDelivery.countDocuments(),
                users: await User.countDocuments({ isDeleted: { $ne: true } }),
                deletedUsers: await User.countDocuments({ isDeleted: true })
            };

            // Calculate retention percentages
            stats.retentionPercentages = {};
            Object.keys(stats.eligibleForCleanup).forEach(key => {
                const eligible = stats.eligibleForCleanup[key];
                const total = stats.totalRecords[key] || stats.totalRecords.users;
                stats.retentionPercentages[key] = total > 0 ? ((eligible / total) * 100).toFixed(2) : 0;
            });

            stats.policies = this.retentionPolicies;
            stats.generatedAt = now.toISOString();

            return stats;

        } catch (error) {
            console.error('Error getting retention statistics:', error);
            throw error;
        }
    }

    /**
     * Update retention policies
     * @param {object} newPolicies - New retention policies
     */
    updateRetentionPolicies(newPolicies) {
        this.retentionPolicies = { ...this.retentionPolicies, ...newPolicies };
        console.log('Updated retention policies:', this.retentionPolicies);
    }

    /**
     * Get service status
     * @returns {object} Service status
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            scheduledJobs: Array.from(this.scheduledJobs.keys()),
            retentionPolicies: this.retentionPolicies,
            schedules: this.schedules
        };
    }

    /**
     * Validate retention policies
     * @param {object} policies - Policies to validate
     * @returns {object} Validation result
     */
    validateRetentionPolicies(policies) {
        const errors = [];
        const validKeys = Object.keys(this.retentionPolicies);

        Object.entries(policies).forEach(([key, value]) => {
            if (!validKeys.includes(key)) {
                errors.push(`Invalid policy key: ${key}`);
            }

            if (typeof value !== 'number' || value < 1 || value > 3650) {
                errors.push(`Invalid retention period for ${key}: must be between 1 and 3650 days`);
            }
        });

        return {
            valid: errors.length === 0,
            errors
        };
    }
}

// Create and export singleton instance
const dataRetentionService = new DataRetentionService();

// Auto-start in production
if (process.env.NODE_ENV === 'production' && process.env.ENABLE_DATA_RETENTION !== 'false') {
    dataRetentionService.start();
}

export default dataRetentionService;