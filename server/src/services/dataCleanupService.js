import { User } from '../../models/User.js';
import { Property } from '../../models/Property.js';
import { Conversation } from '../../models/Conversation.js';
import { Wishlist } from '../../models/Wishlist.js';
import { Favorite } from '../../models/Favorite.js';
import { OTP } from '../../models/OTP.js';
import { SecurityAuditLog } from '../../models/SecurityAuditLog.js';
import { NotificationPreferences } from '../../models/NotificationPreferences.js';
import { NotificationDelivery } from '../../models/NotificationDelivery.js';
import { connectDB } from '../config/db.js';

/**
 * Data Cleanup Service - DISABLED FOR DATA SAFETY
 * All deletion operations have been disabled to prevent accidental data loss
 * Only safe operations like expired OTP cleanup are allowed
 */
class DataCleanupService {
    constructor() {
        this.cleanupOperations = [];
        console.warn('⚠️ DataCleanupService: All user/property deletion operations are DISABLED for data safety');
    }

    /**
     * DISABLED: Account deletion operations are disabled for data safety
     * @param {string} userId - User ID to delete
     * @param {object} options - Cleanup options
     * @returns {Promise<{success: boolean, error: string}>}
     */
    async performAccountDeletion(userId, options = {}) {
        console.error('❌ Account deletion is DISABLED for data safety');
        return {
            success: false,
            error: 'Account deletion operations are disabled to prevent accidental data loss. Contact system administrator if account deletion is required.',
            deletedRecords: {},
            errors: ['Account deletion disabled for data safety']
        };
    }

    /**
     * DISABLED: Property deletion is disabled for data safety
     */
    async deleteUserProperties(userId, options = {}, session = null) {
        console.error('❌ Property deletion is DISABLED for data safety');
        return { count: 0, errors: ['Property deletion disabled for data safety'] };
    }

    /**
     * DISABLED: Conversation deletion is disabled for data safety
     */
    async deleteUserConversations(userId, options = {}, session = null) {
        console.error('❌ Conversation deletion is DISABLED for data safety');
        return { count: 0, errors: ['Conversation deletion disabled for data safety'] };
    }

    /**
     * DISABLED: Wishlist deletion is disabled for data safety
     */
    async deleteUserWishlist(userId, session = null) {
        console.error('❌ Wishlist deletion is DISABLED for data safety');
        return { count: 0, errors: ['Wishlist deletion disabled for data safety'] };
    }

    /**
     * DISABLED: Favorites deletion is disabled for data safety
     */
    async deleteUserFavorites(userId, session = null) {
        console.error('❌ Favorites deletion is DISABLED for data safety');
        return { count: 0, errors: ['Favorites deletion disabled for data safety'] };
    }

    /**
     * SAFE: Delete only expired OTP records (this is safe as OTPs expire naturally)
     */
    async deleteUserOTPs(userId, session = null) {
        try {
            // Only delete expired OTPs - this is safe
            const result = await OTP.deleteMany({
                userId,
                expiresAt: { $lt: new Date() }
            }, { session });
            return { count: result.deletedCount, errors: [] };
        } catch (error) {
            return { count: 0, errors: [`Expired OTP cleanup error: ${error.message}`] };
        }
    }

    /**
     * DISABLED: Notification preferences deletion is disabled for data safety
     */
    async deleteNotificationPreferences(userId, session = null) {
        console.error('❌ Notification preferences deletion is DISABLED for data safety');
        return { count: 0, errors: ['Notification preferences deletion disabled for data safety'] };
    }

    /**
     * DISABLED: Notification delivery deletion is disabled for data safety
     */
    async deleteNotificationDeliveries(userId, session = null) {
        console.error('❌ Notification delivery deletion is DISABLED for data safety');
        return { count: 0, errors: ['Notification delivery deletion disabled for data safety'] };
    }

    /**
     * DISABLED: Security audit log deletion is disabled for data safety
     */
    async deleteSecurityAuditLogs(userId, session = null) {
        console.error('❌ Security audit log deletion is DISABLED for data safety');
        return { count: 0, errors: ['Security audit log deletion disabled for data safety'] };
    }

    /**
     * DISABLED: Security audit log anonymization is disabled for data safety
     */
    async anonymizeSecurityAuditLogs(userId, session = null) {
        console.error('❌ Security audit log anonymization is DISABLED for data safety');
        return { count: 0, errors: ['Security audit log anonymization disabled for data safety'] };
    }

    /**
     * DISABLED: User account deletion is disabled for data safety
     */
    async deleteUserAccount(userId, options = {}, session = null) {
        console.error('❌ User account deletion is DISABLED for data safety');
        return { count: 0, errors: ['User account deletion disabled for data safety'] };
    }

    /**
     * SAFE: Clean up only expired data that is safe to remove
     * @param {object} retentionPolicies - Retention policies for different data types
     * @returns {Promise<{success: boolean, cleanedRecords: object, errors: array}>}
     */
    async cleanupExpiredData(retentionPolicies = {}) {
        const defaultPolicies = {
            otpRecords: 1, // days - only expired OTPs
            ...retentionPolicies
        };

        const cleanedRecords = {};
        const errors = [];

        try {
            await connectDB();

            // SAFE: Clean up expired OTP records (already handled by TTL index, but manual cleanup for safety)
            const otpCutoff = new Date();
            otpCutoff.setDate(otpCutoff.getDate() - defaultPolicies.otpRecords);

            const expiredOTPs = await OTP.deleteMany({
                expiresAt: { $lt: otpCutoff }
            });
            cleanedRecords.expiredOTPs = expiredOTPs.deletedCount;

            // DISABLED: All other cleanup operations are disabled for data safety
            console.log('⚠️ Most cleanup operations are disabled for data safety');
            cleanedRecords.disabledOperations = [
                'notification deliveries',
                'audit logs',
                'soft-deleted users'
            ];

            return {
                success: true,
                cleanedRecords,
                errors: errors.length > 0 ? errors : undefined
            };

        } catch (error) {
            console.error('Data cleanup error:', error);
            return {
                success: false,
                error: error.message,
                cleanedRecords,
                errors
            };
        }
    }

    /**
     * Get data cleanup statistics
     * @param {string} userId - User ID (optional, for user-specific stats)
     * @returns {Promise<object>} Cleanup statistics
     */
    async getCleanupStatistics(userId = null) {
        try {
            await connectDB();

            const stats = {};

            if (userId) {
                // User-specific statistics
                stats.userProperties = await Property.countDocuments({ ownerId: userId });
                stats.userConversations = await Conversation.countDocuments({ participants: userId });
                stats.userWishlist = await Wishlist.countDocuments({ user: userId });
                stats.userFavorites = await Favorite.countDocuments({ userId });
                stats.userOTPs = await OTP.countDocuments({ userId });
                stats.userAuditLogs = await SecurityAuditLog.countDocuments({ userId });
                stats.userNotificationPrefs = await NotificationPreferences.countDocuments({ userId });
                stats.userNotificationDeliveries = await NotificationDelivery.countDocuments({ userId });
            } else {
                // System-wide statistics
                const now = new Date();
                const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
                const ninetyDaysAgo = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
                const oneYearAgo = new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000));

                stats.expiredOTPs = await OTP.countDocuments({ expiresAt: { $lt: now } });
                stats.oldNotifications = await NotificationDelivery.countDocuments({
                    createdAt: { $lt: ninetyDaysAgo },
                    status: { $in: ['delivered', 'failed', 'bounced'] }
                });
                stats.oldAuditLogs = await SecurityAuditLog.countDocuments({
                    createdAt: { $lt: oneYearAgo }
                });
                stats.softDeletedUsers = await User.countDocuments({
                    isDeleted: true,
                    deletedAt: { $lt: thirtyDaysAgo }
                });
                stats.totalUsers = await User.countDocuments({ isDeleted: { $ne: true } });
                stats.totalProperties = await Property.countDocuments({ isDeleted: { $ne: true } });
            }

            return stats;

        } catch (error) {
            console.error('Error getting cleanup statistics:', error);
            throw error;
        }
    }
}

// Create and export singleton instance
const dataCleanupService = new DataCleanupService();
export default dataCleanupService;