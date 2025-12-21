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
 * GDPR-compliant Data Export Service
 * Provides comprehensive data export functionality for user data portability
 */
class DataExportService {
    constructor() {
        this.exportFormats = ['json', 'csv'];
        this.maxExportSize = 100 * 1024 * 1024; // 100MB limit
    }

    /**
     * Export all user data in GDPR-compliant format
     * @param {string} userId - User ID
     * @param {object} options - Export options
     * @returns {Promise<{success: boolean, data: object, metadata: object, errors: array}>}
     */
    async exportUserData(userId, options = {}) {
        const {
            format = 'json',
            includeDeleted = false,
            includeSensitive = false,
            sections = null // null means all sections
        } = options;

        const exportData = {};
        const metadata = {
            exportDate: new Date().toISOString(),
            userId,
            format,
            version: '1.0',
            sections: [],
            recordCounts: {}
        };
        const errors = [];

        try {
            await connectDB();

            // Define available sections
            const availableSections = [
                'profile',
                'properties',
                'conversations',
                'wishlist',
                'favorites',
                'notifications',
                'security',
                'preferences'
            ];

            const sectionsToExport = sections || availableSections;

            // Export user profile data
            if (sectionsToExport.includes('profile')) {
                try {
                    const profileData = await this.exportProfileData(userId, { includeSensitive });
                    exportData.profile = profileData;
                    metadata.sections.push('profile');
                    metadata.recordCounts.profile = 1;
                } catch (error) {
                    errors.push(`Profile export error: ${error.message}`);
                }
            }

            // Export properties data
            if (sectionsToExport.includes('properties')) {
                try {
                    const propertiesData = await this.exportPropertiesData(userId, { includeDeleted });
                    exportData.properties = propertiesData;
                    metadata.sections.push('properties');
                    metadata.recordCounts.properties = propertiesData.length;
                } catch (error) {
                    errors.push(`Properties export error: ${error.message}`);
                }
            }

            // Export conversations data
            if (sectionsToExport.includes('conversations')) {
                try {
                    const conversationsData = await this.exportConversationsData(userId);
                    exportData.conversations = conversationsData;
                    metadata.sections.push('conversations');
                    metadata.recordCounts.conversations = conversationsData.length;
                } catch (error) {
                    errors.push(`Conversations export error: ${error.message}`);
                }
            }

            // Export wishlist data
            if (sectionsToExport.includes('wishlist')) {
                try {
                    const wishlistData = await this.exportWishlistData(userId);
                    exportData.wishlist = wishlistData;
                    metadata.sections.push('wishlist');
                    metadata.recordCounts.wishlist = wishlistData.length;
                } catch (error) {
                    errors.push(`Wishlist export error: ${error.message}`);
                }
            }

            // Export favorites data
            if (sectionsToExport.includes('favorites')) {
                try {
                    const favoritesData = await this.exportFavoritesData(userId);
                    exportData.favorites = favoritesData;
                    metadata.sections.push('favorites');
                    metadata.recordCounts.favorites = favoritesData.length;
                } catch (error) {
                    errors.push(`Favorites export error: ${error.message}`);
                }
            }

            // Export notification data
            if (sectionsToExport.includes('notifications')) {
                try {
                    const notificationsData = await this.exportNotificationData(userId);
                    exportData.notifications = notificationsData;
                    metadata.sections.push('notifications');
                    metadata.recordCounts.notifications = notificationsData.deliveries?.length || 0;
                } catch (error) {
                    errors.push(`Notifications export error: ${error.message}`);
                }
            }

            // Export security data
            if (sectionsToExport.includes('security')) {
                try {
                    const securityData = await this.exportSecurityData(userId, { includeSensitive });
                    exportData.security = securityData;
                    metadata.sections.push('security');
                    metadata.recordCounts.security = securityData.auditLogs?.length || 0;
                } catch (error) {
                    errors.push(`Security export error: ${error.message}`);
                }
            }

            // Export preferences data
            if (sectionsToExport.includes('preferences')) {
                try {
                    const preferencesData = await this.exportPreferencesData(userId);
                    exportData.preferences = preferencesData;
                    metadata.sections.push('preferences');
                    metadata.recordCounts.preferences = 1;
                } catch (error) {
                    errors.push(`Preferences export error: ${error.message}`);
                }
            }

            // Calculate export size
            const exportSize = JSON.stringify(exportData).length;
            metadata.sizeBytes = exportSize;
            metadata.sizeHuman = this.formatBytes(exportSize);

            // Check size limit
            if (exportSize > this.maxExportSize) {
                return {
                    success: false,
                    error: `Export size (${metadata.sizeHuman}) exceeds maximum allowed size (${this.formatBytes(this.maxExportSize)})`,
                    metadata
                };
            }

            return {
                success: true,
                data: exportData,
                metadata,
                errors: errors.length > 0 ? errors : undefined
            };

        } catch (error) {
            console.error('Data export error:', error);
            return {
                success: false,
                error: error.message,
                metadata,
                errors
            };
        }
    }

    /**
     * Export user profile data
     * @param {string} userId - User ID
     * @param {object} options - Export options
     * @returns {Promise<object>} Profile data
     */
    async exportProfileData(userId, options = {}) {
        const { includeSensitive = false } = options;

        const user = await User.findById(userId).lean();
        if (!user) {
            throw new Error('User not found');
        }

        // Remove sensitive fields unless explicitly requested
        const profileData = {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            address: user.address,
            userType: user.userType,
            role: user.role,
            avatar: user.avatar,
            verified: user.verified,
            emailVerified: user.emailVerified,
            phoneVerified: user.phoneVerified,
            emailVerifiedAt: user.emailVerifiedAt,
            phoneVerifiedAt: user.phoneVerifiedAt,
            lastLoginAt: user.lastLoginAt,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };

        if (includeSensitive) {
            profileData.lastPasswordChange = user.lastPasswordChange;
            profileData.passwordHistoryCount = user.passwordHistory?.length || 0;
        }

        return profileData;
    }

    /**
     * Export user properties data
     * @param {string} userId - User ID
     * @param {object} options - Export options
     * @returns {Promise<array>} Properties data
     */
    async exportPropertiesData(userId, options = {}) {
        const { includeDeleted = false } = options;

        const query = { ownerId: userId };
        if (!includeDeleted) {
            query.isDeleted = { $ne: true };
        }

        const properties = await Property.find(query).lean();

        return properties.map(property => ({
            id: property._id,
            listingNumber: property.listingNumber,
            slug: property.slug,
            category: property.category,
            title: property.title,
            propertyType: property.propertyType,
            description: property.description,
            furnishing: property.furnishing,
            availableFrom: property.availableFrom,
            city: property.city,
            address: property.address,
            monthlyRent: property.monthlyRent,
            securityDeposit: property.securityDeposit,
            maintenanceCharge: property.maintenanceCharge,
            negotiable: property.negotiable,
            amenities: property.amenities,
            photos: property.photos,
            status: property.status,
            isDeleted: property.isDeleted,
            views: property.views,
            favoritesCount: property.favoritesCount,
            featured: property.featured,
            createdAt: property.createdAt,
            updatedAt: property.updatedAt
        }));
    }

    /**
     * Export user conversations data
     * @param {string} userId - User ID
     * @returns {Promise<array>} Conversations data
     */
    async exportConversationsData(userId) {
        const conversations = await Conversation.find({
            participants: userId
        }).populate('participants', 'name email').lean();

        return conversations.map(conversation => ({
            id: conversation._id,
            participants: conversation.participants.map(p => ({
                id: p._id,
                name: p.name,
                email: p.email
            })),
            messages: conversation.messages.map(message => ({
                id: message._id,
                sender: message.sender,
                text: message.text,
                attachments: message.attachments,
                read: message.read,
                createdAt: message.createdAt,
                updatedAt: message.updatedAt
            })),
            lastMessage: conversation.lastMessage ? {
                sender: conversation.lastMessage.sender,
                text: conversation.lastMessage.text,
                createdAt: conversation.lastMessage.createdAt
            } : null,
            createdAt: conversation.createdAt,
            updatedAt: conversation.updatedAt
        }));
    }

    /**
     * Export user wishlist data
     * @param {string} userId - User ID
     * @returns {Promise<array>} Wishlist data
     */
    async exportWishlistData(userId) {
        const wishlistItems = await Wishlist.find({ user: userId })
            .populate('property', 'title city monthlyRent photos')
            .lean();

        return wishlistItems.map(item => ({
            id: item._id,
            property: {
                id: item.property._id,
                title: item.property.title,
                city: item.property.city,
                monthlyRent: item.property.monthlyRent,
                photos: item.property.photos
            },
            addedAt: item.createdAt
        }));
    }

    /**
     * Export user favorites data
     * @param {string} userId - User ID
     * @returns {Promise<array>} Favorites data
     */
    async exportFavoritesData(userId) {
        const favorites = await Favorite.find({ userId })
            .populate('propertyId', 'title city monthlyRent photos')
            .lean();

        return favorites.map(favorite => ({
            id: favorite._id,
            property: {
                id: favorite.propertyId._id,
                title: favorite.propertyId.title,
                city: favorite.propertyId.city,
                monthlyRent: favorite.propertyId.monthlyRent,
                photos: favorite.propertyId.photos
            },
            addedAt: favorite.createdAt
        }));
    }

    /**
     * Export user notification data
     * @param {string} userId - User ID
     * @returns {Promise<object>} Notification data
     */
    async exportNotificationData(userId) {
        const preferences = await NotificationPreferences.findOne({ userId }).lean();
        const deliveries = await NotificationDelivery.find({ userId }).lean();

        return {
            preferences: preferences ? {
                securityEvents: preferences.securityEvents,
                general: preferences.general,
                globalSettings: preferences.globalSettings,
                updatedAt: preferences.updatedAt
            } : null,
            deliveries: deliveries.map(delivery => ({
                id: delivery._id,
                type: delivery.type,
                deliveryMethod: delivery.deliveryMethod,
                recipient: delivery.recipient,
                status: delivery.status,
                sentAt: delivery.sentAt,
                deliveredAt: delivery.deliveredAt,
                subject: delivery.subject,
                template: delivery.template,
                createdAt: delivery.createdAt
            }))
        };
    }

    /**
     * Export user security data
     * @param {string} userId - User ID
     * @param {object} options - Export options
     * @returns {Promise<object>} Security data
     */
    async exportSecurityData(userId, options = {}) {
        const { includeSensitive = false } = options;

        const auditLogs = await SecurityAuditLog.find({ userId }).lean();
        const otpRecords = await OTP.find({ userId }).lean();

        const securityData = {
            auditLogs: auditLogs.map(log => ({
                id: log._id,
                action: log.action,
                success: log.success,
                createdAt: log.createdAt
            })),
            otpRecords: otpRecords.map(otp => ({
                id: otp._id,
                type: otp.type,
                contact: otp.contact,
                verified: otp.verified,
                attempts: otp.attempts,
                expiresAt: otp.expiresAt,
                createdAt: otp.createdAt
            }))
        };

        if (includeSensitive) {
            // Include IP addresses and user agents in audit logs
            securityData.auditLogs = auditLogs.map(log => ({
                id: log._id,
                action: log.action,
                ipAddress: log.ipAddress,
                userAgent: log.userAgent,
                success: log.success,
                details: log.details,
                createdAt: log.createdAt
            }));
        }

        return securityData;
    }

    /**
     * Export user preferences data
     * @param {string} userId - User ID
     * @returns {Promise<object>} Preferences data
     */
    async exportPreferencesData(userId) {
        const preferences = await NotificationPreferences.findOne({ userId }).lean();

        if (!preferences) {
            return null;
        }

        return {
            id: preferences._id,
            securityEvents: preferences.securityEvents,
            general: preferences.general,
            globalSettings: preferences.globalSettings,
            createdAt: preferences.createdAt,
            updatedAt: preferences.updatedAt
        };
    }

    /**
     * Generate data export summary
     * @param {string} userId - User ID
     * @returns {Promise<object>} Export summary
     */
    async generateExportSummary(userId) {
        try {
            await connectDB();

            const summary = {
                userId,
                generatedAt: new Date().toISOString(),
                sections: {}
            };

            // Count records in each section
            summary.sections.profile = await User.countDocuments({ _id: userId });
            summary.sections.properties = await Property.countDocuments({
                ownerId: userId,
                isDeleted: { $ne: true }
            });
            summary.sections.conversations = await Conversation.countDocuments({
                participants: userId
            });
            summary.sections.wishlist = await Wishlist.countDocuments({ user: userId });
            summary.sections.favorites = await Favorite.countDocuments({ userId });
            summary.sections.auditLogs = await SecurityAuditLog.countDocuments({ userId });
            summary.sections.otpRecords = await OTP.countDocuments({ userId });
            summary.sections.notificationDeliveries = await NotificationDelivery.countDocuments({ userId });
            summary.sections.notificationPreferences = await NotificationPreferences.countDocuments({ userId });

            // Calculate total records
            summary.totalRecords = Object.values(summary.sections).reduce((sum, count) => sum + count, 0);

            // Estimate export size (rough calculation)
            summary.estimatedSizeBytes = summary.totalRecords * 1024; // Rough estimate: 1KB per record
            summary.estimatedSizeHuman = this.formatBytes(summary.estimatedSizeBytes);

            return summary;

        } catch (error) {
            console.error('Error generating export summary:', error);
            throw error;
        }
    }

    /**
     * Convert export data to CSV format
     * @param {object} data - Export data
     * @param {string} section - Section to convert
     * @returns {string} CSV data
     */
    convertToCSV(data, section) {
        const sectionData = data[section];
        if (!sectionData || !Array.isArray(sectionData) || sectionData.length === 0) {
            return '';
        }

        // Get headers from first object
        const headers = Object.keys(sectionData[0]);
        const csvHeaders = headers.join(',');

        // Convert data rows
        const csvRows = sectionData.map(row => {
            return headers.map(header => {
                const value = row[header];
                // Handle nested objects and arrays
                if (typeof value === 'object' && value !== null) {
                    return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
                }
                // Escape quotes in strings
                if (typeof value === 'string') {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value || '';
            }).join(',');
        });

        return [csvHeaders, ...csvRows].join('\n');
    }

    /**
     * Format bytes to human readable format
     * @param {number} bytes - Bytes
     * @returns {string} Formatted size
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Validate export request
     * @param {string} userId - User ID
     * @param {object} options - Export options
     * @returns {Promise<{valid: boolean, errors: array}>}
     */
    async validateExportRequest(userId, options = {}) {
        const errors = [];

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            errors.push('User not found');
        }

        // Validate format
        if (options.format && !this.exportFormats.includes(options.format)) {
            errors.push(`Invalid format. Supported formats: ${this.exportFormats.join(', ')}`);
        }

        // Validate sections
        if (options.sections) {
            const validSections = [
                'profile', 'properties', 'conversations', 'wishlist',
                'favorites', 'notifications', 'security', 'preferences'
            ];
            const invalidSections = options.sections.filter(s => !validSections.includes(s));
            if (invalidSections.length > 0) {
                errors.push(`Invalid sections: ${invalidSections.join(', ')}`);
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }
}

// Create and export singleton instance
const dataExportService = new DataExportService();
export default dataExportService;