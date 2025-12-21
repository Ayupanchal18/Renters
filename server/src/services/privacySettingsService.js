import { User } from '../../models/User.js';
import { NotificationPreferences } from '../../models/NotificationPreferences.js';
import { connectDB } from '../config/db.js';

/**
 * Privacy Settings Service
 * Manages user privacy preferences and data handling settings
 */
class PrivacySettingsService {
    constructor() {
        this.defaultPrivacySettings = {
            dataProcessing: {
                analytics: true,
                marketing: false,
                personalization: true,
                thirdPartySharing: false
            },
            visibility: {
                profilePublic: false,
                showEmail: false,
                showPhone: false,
                showProperties: true
            },
            communications: {
                emailMarketing: false,
                smsMarketing: false,
                pushNotifications: true,
                securityAlerts: true
            },
            dataRetention: {
                keepSearchHistory: true,
                keepViewHistory: true,
                autoDeleteInactive: false,
                inactiveThresholdDays: 365
            }
        };
    }

    /**
     * Get user privacy settings
     * @param {string} userId - User ID
     * @returns {Promise<object>} Privacy settings
     */
    async getPrivacySettings(userId) {
        try {
            await connectDB();

            const user = await User.findById(userId).lean();
            if (!user) {
                throw new Error('User not found');
            }

            // Get existing privacy settings or create default
            const privacySettings = user.privacySettings || this.defaultPrivacySettings;

            // Get notification preferences
            const notificationPrefs = await NotificationPreferences.findOne({ userId }).lean();

            return {
                userId,
                privacy: privacySettings,
                notifications: notificationPrefs ? {
                    securityEvents: notificationPrefs.securityEvents,
                    general: notificationPrefs.general,
                    globalSettings: notificationPrefs.globalSettings
                } : null,
                lastUpdated: user.updatedAt
            };

        } catch (error) {
            console.error('Error getting privacy settings:', error);
            throw error;
        }
    }

    /**
     * Update user privacy settings
     * @param {string} userId - User ID
     * @param {object} settings - Privacy settings to update
     * @returns {Promise<object>} Updated privacy settings
     */
    async updatePrivacySettings(userId, settings) {
        try {
            await connectDB();

            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Merge with existing settings
            const currentSettings = user.privacySettings || this.defaultPrivacySettings;
            const updatedSettings = this.mergeSettings(currentSettings, settings);

            // Validate settings
            const validation = this.validatePrivacySettings(updatedSettings);
            if (!validation.valid) {
                throw new Error(`Invalid privacy settings: ${validation.errors.join(', ')}`);
            }

            // Update user privacy settings
            const updatedUser = await User.findByIdAndUpdate(
                userId,
                {
                    privacySettings: updatedSettings,
                    updatedAt: new Date()
                },
                { new: true }
            ).lean();

            return {
                userId,
                privacy: updatedUser.privacySettings,
                lastUpdated: updatedUser.updatedAt
            };

        } catch (error) {
            console.error('Error updating privacy settings:', error);
            throw error;
        }
    }

    /**
     * Update notification preferences (privacy-related)
     * @param {string} userId - User ID
     * @param {object} preferences - Notification preferences
     * @returns {Promise<object>} Updated preferences
     */
    async updateNotificationPreferences(userId, preferences) {
        try {
            await connectDB();

            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Get or create notification preferences
            let notificationPrefs = await NotificationPreferences.findOne({ userId });
            if (!notificationPrefs) {
                notificationPrefs = await NotificationPreferences.createDefault(userId);
            }

            // Merge preferences
            const updatedPrefs = this.mergeSettings(notificationPrefs.toObject(), preferences);

            // Update notification preferences
            const result = await NotificationPreferences.findOneAndUpdate(
                { userId },
                updatedPrefs,
                { new: true, upsert: true }
            ).lean();

            return result;

        } catch (error) {
            console.error('Error updating notification preferences:', error);
            throw error;
        }
    }

    /**
     * Get privacy compliance status
     * @param {string} userId - User ID
     * @returns {Promise<object>} Compliance status
     */
    async getPrivacyComplianceStatus(userId) {
        try {
            await connectDB();

            const user = await User.findById(userId).lean();
            if (!user) {
                throw new Error('User not found');
            }

            const privacySettings = user.privacySettings || this.defaultPrivacySettings;
            const notificationPrefs = await NotificationPreferences.findOne({ userId }).lean();

            const compliance = {
                userId,
                gdprCompliant: true,
                consentGiven: {
                    dataProcessing: privacySettings.dataProcessing?.analytics || false,
                    marketing: privacySettings.communications?.emailMarketing || false,
                    thirdPartySharing: privacySettings.dataProcessing?.thirdPartySharing || false
                },
                dataMinimization: {
                    profileMinimal: !privacySettings.visibility?.profilePublic,
                    contactInfoHidden: !privacySettings.visibility?.showEmail && !privacySettings.visibility?.showPhone
                },
                rightToBeInformed: {
                    privacyPolicyAccepted: user.privacyPolicyAcceptedAt ? true : false,
                    termsAccepted: user.termsAcceptedAt ? true : false
                },
                rightOfAccess: {
                    dataExportAvailable: true,
                    lastExportRequest: user.lastDataExportRequest || null
                },
                rightToRectification: {
                    profileEditable: true,
                    preferencesEditable: true
                },
                rightToErasure: {
                    accountDeletionAvailable: true,
                    dataRetentionPolicySet: privacySettings.dataRetention?.autoDeleteInactive || false
                },
                rightToPortability: {
                    dataExportFormats: ['json', 'csv'],
                    structuredDataAvailable: true
                },
                rightToObject: {
                    optOutAvailable: true,
                    marketingOptOut: !privacySettings.communications?.emailMarketing
                }
            };

            // Check for any compliance issues
            const issues = [];
            if (!compliance.rightToBeInformed.privacyPolicyAccepted) {
                issues.push('Privacy policy not accepted');
            }
            if (!compliance.rightToBeInformed.termsAccepted) {
                issues.push('Terms of service not accepted');
            }

            compliance.gdprCompliant = issues.length === 0;
            compliance.issues = issues.length > 0 ? issues : undefined;

            return compliance;

        } catch (error) {
            console.error('Error getting privacy compliance status:', error);
            throw error;
        }
    }

    /**
     * Record privacy policy acceptance
     * @param {string} userId - User ID
     * @param {string} version - Privacy policy version
     * @returns {Promise<object>} Updated user
     */
    async recordPrivacyPolicyAcceptance(userId, version = '1.0') {
        try {
            await connectDB();

            const updatedUser = await User.findByIdAndUpdate(
                userId,
                {
                    privacyPolicyAcceptedAt: new Date(),
                    privacyPolicyVersion: version,
                    updatedAt: new Date()
                },
                { new: true }
            ).lean();

            if (!updatedUser) {
                throw new Error('User not found');
            }

            return {
                userId,
                privacyPolicyAcceptedAt: updatedUser.privacyPolicyAcceptedAt,
                privacyPolicyVersion: updatedUser.privacyPolicyVersion
            };

        } catch (error) {
            console.error('Error recording privacy policy acceptance:', error);
            throw error;
        }
    }

    /**
     * Record terms of service acceptance
     * @param {string} userId - User ID
     * @param {string} version - Terms version
     * @returns {Promise<object>} Updated user
     */
    async recordTermsAcceptance(userId, version = '1.0') {
        try {
            await connectDB();

            const updatedUser = await User.findByIdAndUpdate(
                userId,
                {
                    termsAcceptedAt: new Date(),
                    termsVersion: version,
                    updatedAt: new Date()
                },
                { new: true }
            ).lean();

            if (!updatedUser) {
                throw new Error('User not found');
            }

            return {
                userId,
                termsAcceptedAt: updatedUser.termsAcceptedAt,
                termsVersion: updatedUser.termsVersion
            };

        } catch (error) {
            console.error('Error recording terms acceptance:', error);
            throw error;
        }
    }

    /**
     * Get data processing consent status
     * @param {string} userId - User ID
     * @returns {Promise<object>} Consent status
     */
    async getDataProcessingConsent(userId) {
        try {
            await connectDB();

            const user = await User.findById(userId).lean();
            if (!user) {
                throw new Error('User not found');
            }

            const privacySettings = user.privacySettings || this.defaultPrivacySettings;

            return {
                userId,
                consent: {
                    analytics: privacySettings.dataProcessing?.analytics || false,
                    marketing: privacySettings.dataProcessing?.marketing || false,
                    personalization: privacySettings.dataProcessing?.personalization || false,
                    thirdPartySharing: privacySettings.dataProcessing?.thirdPartySharing || false
                },
                consentGivenAt: user.consentGivenAt || null,
                lastUpdated: user.updatedAt
            };

        } catch (error) {
            console.error('Error getting data processing consent:', error);
            throw error;
        }
    }

    /**
     * Update data processing consent
     * @param {string} userId - User ID
     * @param {object} consent - Consent settings
     * @returns {Promise<object>} Updated consent
     */
    async updateDataProcessingConsent(userId, consent) {
        try {
            await connectDB();

            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Update privacy settings with new consent
            const currentSettings = user.privacySettings || this.defaultPrivacySettings;
            const updatedSettings = {
                ...currentSettings,
                dataProcessing: {
                    ...currentSettings.dataProcessing,
                    ...consent
                }
            };

            const updatedUser = await User.findByIdAndUpdate(
                userId,
                {
                    privacySettings: updatedSettings,
                    consentGivenAt: new Date(),
                    updatedAt: new Date()
                },
                { new: true }
            ).lean();

            return {
                userId,
                consent: updatedUser.privacySettings.dataProcessing,
                consentGivenAt: updatedUser.consentGivenAt,
                lastUpdated: updatedUser.updatedAt
            };

        } catch (error) {
            console.error('Error updating data processing consent:', error);
            throw error;
        }
    }

    /**
     * Get privacy dashboard data
     * @param {string} userId - User ID
     * @returns {Promise<object>} Privacy dashboard data
     */
    async getPrivacyDashboard(userId) {
        try {
            const [
                privacySettings,
                complianceStatus,
                consentStatus
            ] = await Promise.all([
                this.getPrivacySettings(userId),
                this.getPrivacyComplianceStatus(userId),
                this.getDataProcessingConsent(userId)
            ]);

            return {
                userId,
                settings: privacySettings,
                compliance: complianceStatus,
                consent: consentStatus,
                generatedAt: new Date().toISOString()
            };

        } catch (error) {
            console.error('Error getting privacy dashboard:', error);
            throw error;
        }
    }

    /**
     * Validate privacy settings
     * @param {object} settings - Privacy settings to validate
     * @returns {object} Validation result
     */
    validatePrivacySettings(settings) {
        const errors = [];

        // Validate data processing settings
        if (settings.dataProcessing) {
            const validBooleanFields = ['analytics', 'marketing', 'personalization', 'thirdPartySharing'];
            for (const field of validBooleanFields) {
                if (settings.dataProcessing[field] !== undefined && typeof settings.dataProcessing[field] !== 'boolean') {
                    errors.push(`dataProcessing.${field} must be a boolean`);
                }
            }
        }

        // Validate visibility settings
        if (settings.visibility) {
            const validBooleanFields = ['profilePublic', 'showEmail', 'showPhone', 'showProperties'];
            for (const field of validBooleanFields) {
                if (settings.visibility[field] !== undefined && typeof settings.visibility[field] !== 'boolean') {
                    errors.push(`visibility.${field} must be a boolean`);
                }
            }
        }

        // Validate communications settings
        if (settings.communications) {
            const validBooleanFields = ['emailMarketing', 'smsMarketing', 'pushNotifications', 'securityAlerts'];
            for (const field of validBooleanFields) {
                if (settings.communications[field] !== undefined && typeof settings.communications[field] !== 'boolean') {
                    errors.push(`communications.${field} must be a boolean`);
                }
            }
        }

        // Validate data retention settings
        if (settings.dataRetention) {
            const validBooleanFields = ['keepSearchHistory', 'keepViewHistory', 'autoDeleteInactive'];
            for (const field of validBooleanFields) {
                if (settings.dataRetention[field] !== undefined && typeof settings.dataRetention[field] !== 'boolean') {
                    errors.push(`dataRetention.${field} must be a boolean`);
                }
            }

            if (settings.dataRetention.inactiveThresholdDays !== undefined) {
                if (typeof settings.dataRetention.inactiveThresholdDays !== 'number' ||
                    settings.dataRetention.inactiveThresholdDays < 30 ||
                    settings.dataRetention.inactiveThresholdDays > 3650) {
                    errors.push('dataRetention.inactiveThresholdDays must be a number between 30 and 3650');
                }
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Deep merge settings objects
     * @param {object} existing - Existing settings
     * @param {object} updates - Updates to apply
     * @returns {object} Merged settings
     */
    mergeSettings(existing, updates) {
        const merged = { ...existing };

        for (const [key, value] of Object.entries(updates)) {
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                merged[key] = this.mergeSettings(merged[key] || {}, value);
            } else {
                merged[key] = value;
            }
        }

        return merged;
    }

    /**
     * Get privacy settings template for new users
     * @returns {object} Default privacy settings
     */
    getDefaultPrivacySettings() {
        return JSON.parse(JSON.stringify(this.defaultPrivacySettings));
    }

    /**
     * Initialize privacy settings for new user
     * @param {string} userId - User ID
     * @returns {Promise<object>} Initialized settings
     */
    async initializePrivacySettings(userId) {
        try {
            await connectDB();

            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Only initialize if not already set
            if (!user.privacySettings) {
                const updatedUser = await User.findByIdAndUpdate(
                    userId,
                    {
                        privacySettings: this.defaultPrivacySettings,
                        updatedAt: new Date()
                    },
                    { new: true }
                ).lean();

                return {
                    userId,
                    privacy: updatedUser.privacySettings,
                    initialized: true
                };
            }

            return {
                userId,
                privacy: user.privacySettings,
                initialized: false
            };

        } catch (error) {
            console.error('Error initializing privacy settings:', error);
            throw error;
        }
    }
}

// Create and export singleton instance
const privacySettingsService = new PrivacySettingsService();
export default privacySettingsService;