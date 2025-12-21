import emailService from './emailService.js';
import smsService from './smsService.js';
import phoneEmailService from './phoneEmailService.js';
import enhancedOTPManager from './enhancedOTPManager.js';
import { NotificationPreferences } from '../../models/NotificationPreferences.js';
import { NotificationDelivery } from '../../models/NotificationDelivery.js';
import { User } from '../../models/User.js';

/**
 * Enhanced Notification Service that orchestrates email and SMS communications
 * Provides a unified interface for sending various types of notifications
 * Includes user preferences, delivery tracking, and security event notifications
 */
class NotificationService {
    constructor() {
        this.emailService = emailService;
        this.smsService = smsService;
        this.phoneEmailService = phoneEmailService;
        this.enhancedOTPManager = enhancedOTPManager;
    }

    /**
     * Send OTP verification via email
     * @param {string} email - Recipient email address
     * @param {string} otp - OTP code
     * @param {string} userName - User's name
     * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
     */
    async sendEmailOTP(email, otp, userName = 'User') {
        try {
            const result = await this.emailService.sendOTPEmail(email, otp, userName);

            if (result.success) {
                console.log(`Email OTP sent successfully to ${email}${result.testMode ? ' (test mode)' : ''}`);
            } else {
                console.error(`Failed to send email OTP to ${email}:`, result.error);
            }

            return result;
        } catch (error) {
            console.error('Error in sendEmailOTP:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Send OTP verification via SMS
     * @param {string} phoneNumber - Recipient phone number
     * @param {string} otp - OTP code
     * @param {string} userName - User's name
     * @returns {Promise<{success: boolean, messageSid?: string, error?: string}>}
     */
    async sendSMSOTP(phoneNumber, otp, userName = 'User') {
        try {
            const result = await this.smsService.sendOTPSMS(phoneNumber, otp, userName);

            if (result.success) {
                console.log(`SMS OTP sent successfully to ${phoneNumber}${result.testMode ? ' (test mode)' : ''}`);
            } else {
                console.error(`Failed to send SMS OTP to ${phoneNumber}:`, result.error);
            }

            return result;
        } catch (error) {
            console.error('Error in sendSMSOTP:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Send password change notification via email
     * @param {string} email - Recipient email address
     * @param {string} userName - User's name
     * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
     */
    async sendPasswordChangeNotification(email, userName = 'User') {
        try {
            const result = await this.emailService.sendPasswordChangeNotification(email, userName);

            if (result.success) {
                console.log(`Password change notification sent to ${email}${result.testMode ? ' (test mode)' : ''}`);
            } else {
                console.error(`Failed to send password change notification to ${email}:`, result.error);
            }

            return result;
        } catch (error) {
            console.error('Error in sendPasswordChangeNotification:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Send phone update notification via SMS
     * @param {string} phoneNumber - Recipient phone number
     * @param {string} userName - User's name
     * @returns {Promise<{success: boolean, messageSid?: string, error?: string}>}
     */
    async sendPhoneUpdateNotification(phoneNumber, userName = 'User') {
        try {
            const result = await this.smsService.sendPhoneUpdateNotification(phoneNumber, userName);

            if (result.success) {
                console.log(`Phone update notification sent to ${phoneNumber}${result.testMode ? ' (test mode)' : ''}`);
            } else {
                console.error(`Failed to send phone update notification to ${phoneNumber}:`, result.error);
            }

            return result;
        } catch (error) {
            console.error('Error in sendPhoneUpdateNotification:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Send account deletion confirmation via email
     * @param {string} email - Recipient email address
     * @param {string} userName - User's name
     * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
     */
    async sendAccountDeletionConfirmation(email, userName = 'User') {
        try {
            const result = await this.emailService.sendAccountDeletionConfirmation(email, userName);

            if (result.success) {
                console.log(`Account deletion confirmation sent to ${email}${result.testMode ? ' (test mode)' : ''}`);
            } else {
                console.error(`Failed to send account deletion confirmation to ${email}:`, result.error);
            }

            return result;
        } catch (error) {
            console.error('Error in sendAccountDeletionConfirmation:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Send OTP based on verification type (Enhanced with Phone.email integration)
     * @param {string} type - 'email' or 'phone'
     * @param {string} contact - Email address or phone number
     * @param {string} otp - OTP code
     * @param {string} userName - User's name
     * @returns {Promise<{success: boolean, messageId?: string, messageSid?: string, error?: string}>}
     */
    async sendOTP(type, contact, otp, userName = 'User') {
        try {
            // Try Phone.email service first (primary service)
            const method = type === 'phone' ? 'sms' : 'email';

            if (this.phoneEmailService.isReady()) {
                console.log(`Attempting OTP delivery via Phone.email (${method})`);
                const result = await this.phoneEmailService.sendOTP(method, contact, otp, userName);

                if (result.success) {
                    console.log(`Phone.email ${method} delivery successful`);
                    return {
                        success: true,
                        messageId: result.messageId,
                        estimatedDelivery: result.estimatedDelivery,
                        service: 'phone-email'
                    };
                } else {
                    console.warn(`Phone.email ${method} delivery failed, falling back to legacy services:`, result.error);
                }
            }

            // Fallback to legacy services
            if (type === 'email') {
                console.log('Falling back to SMTP email service');
                const result = await this.sendEmailOTP(contact, otp, userName);
                return {
                    ...result,
                    service: 'smtp'
                };
            } else if (type === 'phone') {
                console.log('Falling back to Twilio SMS service');
                const result = await this.sendSMSOTP(contact, otp, userName);
                return {
                    ...result,
                    service: 'twilio'
                };
            } else {
                return {
                    success: false,
                    error: 'Invalid verification type. Must be "email" or "phone".'
                };
            }
        } catch (error) {
            console.error('Error in sendOTP:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Send security notification based on type and contact method
     * @param {string} type - 'password_change' or 'phone_update'
     * @param {string} contact - Email address or phone number
     * @param {string} userName - User's name
     * @returns {Promise<{success: boolean, messageId?: string, messageSid?: string, error?: string}>}
     */
    async sendSecurityNotification(type, contact, userName = 'User') {
        try {
            switch (type) {
                case 'password_change':
                    return await this.sendPasswordChangeNotification(contact, userName);
                case 'phone_update':
                    return await this.sendPhoneUpdateNotification(contact, userName);
                default:
                    return {
                        success: false,
                        error: 'Invalid notification type'
                    };
            }
        } catch (error) {
            console.error('Error in sendSecurityNotification:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get service status for all OTP delivery services
     * @returns {object} Combined service status
     */
    getServiceStatus() {
        return {
            'phone-email': this.phoneEmailService.getStatus(),
            email: this.emailService.getStatus(),
            sms: this.smsService.getStatus(),
            ready: {
                'phone-email': this.phoneEmailService.isReady(),
                email: this.emailService.isReady(),
                sms: this.smsService.isReady()
            },
            primary: {
                service: 'phone-email',
                ready: this.phoneEmailService.isReady()
            }
        };
    }

    /**
     * Test both email and SMS services
     * @param {string} email - Test email address
     * @param {string} phoneNumber - Test phone number
     * @returns {Promise<{email: object, sms: object}>}
     */
    async testServices(email, phoneNumber) {
        const results = {
            email: null,
            sms: null
        };

        try {
            // Test email service
            if (email) {
                results.email = await this.emailService.sendOTPEmail(email, '123456', 'Test User');
            }

            // Test SMS service
            if (phoneNumber) {
                results.sms = await this.smsService.sendTestSMS(phoneNumber);
            }

        } catch (error) {
            console.error('Error testing services:', error);
        }

        return results;
    }

    /**
     * Send security event notification based on user preferences
     * @param {string} userId - User ID
     * @param {string} eventType - Type of security event
     * @param {object} context - Additional context for the notification
     * @returns {Promise<{success: boolean, deliveries: array, errors: array}>}
     */
    async sendSecurityEventNotification(userId, eventType, context = {}) {
        try {
            // Get user and preferences
            const user = await User.findById(userId);
            if (!user) {
                return {
                    success: false,
                    error: 'User not found'
                };
            }

            const preferences = await NotificationPreferences.getOrCreate(userId);
            const deliveries = [];
            const errors = [];

            // Check if notifications are enabled for this event type
            const eventPrefs = preferences.securityEvents[eventType];
            if (!eventPrefs) {
                return {
                    success: false,
                    error: `Unknown security event type: ${eventType}`
                };
            }

            // Send email notification if enabled
            if (eventPrefs.email && preferences.globalSettings.emailEnabled && user.email) {
                try {
                    const emailResult = await this.sendSecurityEventEmail(
                        user.email,
                        eventType,
                        user.name,
                        context
                    );

                    // Track delivery
                    const deliveryRecord = await NotificationDelivery.trackDelivery({
                        userId,
                        type: eventType,
                        deliveryMethod: 'email',
                        recipient: user.email,
                        status: emailResult.success ? 'sent' : 'failed',
                        externalId: emailResult.messageId,
                        subject: this.getSecurityEventSubject(eventType),
                        template: `security_${eventType}`,
                        context,
                        error: emailResult.success ? null : {
                            message: emailResult.error,
                            code: 'EMAIL_SEND_FAILED'
                        }
                    });

                    deliveries.push({
                        method: 'email',
                        success: emailResult.success,
                        deliveryId: deliveryRecord._id,
                        externalId: emailResult.messageId
                    });

                    if (!emailResult.success) {
                        errors.push(`Email delivery failed: ${emailResult.error}`);
                    }
                } catch (error) {
                    errors.push(`Email notification error: ${error.message}`);
                }
            }

            // Send SMS notification if enabled
            if (eventPrefs.sms && preferences.globalSettings.smsEnabled && user.phone) {
                try {
                    const smsResult = await this.sendSecurityEventSMS(
                        user.phone,
                        eventType,
                        user.name,
                        context
                    );

                    // Track delivery
                    const deliveryRecord = await NotificationDelivery.trackDelivery({
                        userId,
                        type: eventType,
                        deliveryMethod: 'sms',
                        recipient: user.phone,
                        status: smsResult.success ? 'sent' : 'failed',
                        externalId: smsResult.messageSid,
                        template: `security_${eventType}_sms`,
                        context,
                        error: smsResult.success ? null : {
                            message: smsResult.error,
                            code: 'SMS_SEND_FAILED'
                        }
                    });

                    deliveries.push({
                        method: 'sms',
                        success: smsResult.success,
                        deliveryId: deliveryRecord._id,
                        externalId: smsResult.messageSid
                    });

                    if (!smsResult.success) {
                        errors.push(`SMS delivery failed: ${smsResult.error}`);
                    }
                } catch (error) {
                    errors.push(`SMS notification error: ${error.message}`);
                }
            }

            return {
                success: deliveries.length > 0 && deliveries.some(d => d.success),
                deliveries,
                errors: errors.length > 0 ? errors : undefined
            };

        } catch (error) {
            console.error('Error in sendSecurityEventNotification:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Send security event email notification
     * @param {string} email - Recipient email
     * @param {string} eventType - Type of security event
     * @param {string} userName - User's name
     * @param {object} context - Additional context
     * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
     */
    async sendSecurityEventEmail(email, eventType, userName, context = {}) {
        try {
            switch (eventType) {
                case 'passwordChange':
                    return await this.emailService.sendPasswordChangeNotification(email, userName);

                case 'phoneUpdate':
                    return await this.emailService.sendPhoneUpdateNotification(email, userName, context.newPhone);

                case 'accountDeletion':
                    return await this.emailService.sendAccountDeletionConfirmation(email, userName);

                case 'loginFromNewDevice':
                    return await this.emailService.sendNewDeviceLoginNotification(email, userName, context);

                case 'failedLoginAttempts':
                    return await this.emailService.sendFailedLoginNotification(email, userName, context);

                default:
                    return {
                        success: false,
                        error: `Unknown email template for event type: ${eventType}`
                    };
            }
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Send security event SMS notification
     * @param {string} phone - Recipient phone number
     * @param {string} eventType - Type of security event
     * @param {string} userName - User's name
     * @param {object} context - Additional context
     * @returns {Promise<{success: boolean, messageSid?: string, error?: string}>}
     */
    async sendSecurityEventSMS(phone, eventType, userName, context = {}) {
        try {
            switch (eventType) {
                case 'passwordChange':
                    return await this.smsService.sendPasswordChangeNotification(phone, userName);

                case 'phoneUpdate':
                    return await this.smsService.sendPhoneUpdateNotification(phone, userName);

                case 'accountDeletion':
                    return await this.smsService.sendAccountDeletionNotification(phone, userName);

                case 'loginFromNewDevice':
                    return await this.smsService.sendNewDeviceLoginNotification(phone, userName, context);

                case 'failedLoginAttempts':
                    return await this.smsService.sendFailedLoginNotification(phone, userName, context);

                default:
                    return {
                        success: false,
                        error: `Unknown SMS template for event type: ${eventType}`
                    };
            }
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get subject line for security event emails
     * @param {string} eventType - Type of security event
     * @returns {string} Email subject
     */
    getSecurityEventSubject(eventType) {
        const subjects = {
            passwordChange: 'Password Changed - Security Notification',
            phoneUpdate: 'Phone Number Updated - Security Notification',
            accountDeletion: 'Account Deleted - Confirmation',
            loginFromNewDevice: 'New Device Login - Security Alert',
            failedLoginAttempts: 'Failed Login Attempts - Security Alert'
        };

        return subjects[eventType] || 'Security Notification';
    }

    /**
     * Get user notification preferences
     * @param {string} userId - User ID
     * @returns {Promise<object>} User preferences
     */
    async getUserPreferences(userId) {
        try {
            return await NotificationPreferences.getOrCreate(userId);
        } catch (error) {
            console.error('Error getting user preferences:', error);
            throw error;
        }
    }

    /**
     * Update user notification preferences
     * @param {string} userId - User ID
     * @param {object} preferences - New preferences
     * @returns {Promise<object>} Updated preferences
     */
    async updateUserPreferences(userId, preferences) {
        try {
            const existingPrefs = await NotificationPreferences.getOrCreate(userId);

            // Deep merge preferences
            const updatedPrefs = this.mergePreferences(existingPrefs.toObject(), preferences);

            return await NotificationPreferences.findOneAndUpdate(
                { userId },
                updatedPrefs,
                { new: true, upsert: true }
            );
        } catch (error) {
            console.error('Error updating user preferences:', error);
            throw error;
        }
    }

    /**
     * Deep merge notification preferences
     * @param {object} existing - Existing preferences
     * @param {object} updates - Updates to apply
     * @returns {object} Merged preferences
     */
    mergePreferences(existing, updates) {
        const merged = { ...existing };

        for (const [key, value] of Object.entries(updates)) {
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                merged[key] = this.mergePreferences(merged[key] || {}, value);
            } else {
                merged[key] = value;
            }
        }

        return merged;
    }

    /**
     * Get delivery statistics for a user
     * @param {string} userId - User ID
     * @param {number} days - Number of days to look back
     * @returns {Promise<object>} Delivery statistics
     */
    async getDeliveryStats(userId, days = 30) {
        try {
            return await NotificationDelivery.getDeliveryStats(userId, days);
        } catch (error) {
            console.error('Error getting delivery stats:', error);
            throw error;
        }
    }

    /**
     * Retry failed deliveries
     * @returns {Promise<{processed: number, successful: number, failed: number}>}
     */
    async retryFailedDeliveries() {
        try {
            const failedDeliveries = await NotificationDelivery.getFailedDeliveries();
            let processed = 0;
            let successful = 0;
            let failed = 0;

            for (const delivery of failedDeliveries) {
                processed++;

                try {
                    let result;

                    if (delivery.deliveryMethod === 'email') {
                        result = await this.sendSecurityEventEmail(
                            delivery.recipient,
                            delivery.type,
                            'User', // We don't have user name in delivery record
                            delivery.context
                        );
                    } else if (delivery.deliveryMethod === 'sms') {
                        result = await this.sendSecurityEventSMS(
                            delivery.recipient,
                            delivery.type,
                            'User',
                            delivery.context
                        );
                    }

                    if (result && result.success) {
                        successful++;
                        await NotificationDelivery.findByIdAndUpdate(delivery._id, {
                            status: 'sent',
                            sentAt: new Date(),
                            externalId: result.messageId || result.messageSid,
                            attempts: delivery.attempts + 1
                        });
                    } else {
                        failed++;
                        const nextRetryAt = new Date();
                        nextRetryAt.setMinutes(nextRetryAt.getMinutes() + (delivery.attempts + 1) * 15);

                        await NotificationDelivery.findByIdAndUpdate(delivery._id, {
                            attempts: delivery.attempts + 1,
                            nextRetryAt: delivery.attempts + 1 < delivery.maxRetries ? nextRetryAt : null,
                            error: {
                                message: result?.error || 'Unknown error',
                                code: 'RETRY_FAILED'
                            }
                        });
                    }
                } catch (error) {
                    failed++;
                    console.error(`Error retrying delivery ${delivery._id}:`, error);
                }
            }

            return { processed, successful, failed };
        } catch (error) {
            console.error('Error in retryFailedDeliveries:', error);
            throw error;
        }
    }

    /**
     * Validate service configurations
     * @returns {Promise<{email: object, sms: object}>}
     */
    async validateConfigurations() {
        const results = {
            email: { configured: this.emailService.isReady() },
            sms: null
        };

        try {
            // Validate SMS service credentials
            results.sms = await this.smsService.validateCredentials();
        } catch (error) {
            results.sms = {
                success: false,
                error: error.message
            };
        }

        return results;
    }
}

// Create and export a singleton instance
const notificationService = new NotificationService();
export default notificationService;