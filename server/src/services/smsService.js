import * as twilioModule from 'twilio';

// Handle both ESM and CommonJS imports
const twilio = twilioModule.default || twilioModule;

/**
 * SMS Service for sending OTP codes via Twilio
 * Supports Twilio configuration via environment variables
 */
class SMSService {
    constructor() {
        this.client = null;
        this.isConfigured = false;
        this.fromNumber = null;
        this.initializeClient();
    }

    /**
     * Initialize the Twilio client based on environment configuration
     */
    initializeClient() {
        // Always mark as configured (will use test mode if Twilio fails)
        this.isConfigured = true;
        this.testMode = true;

        try {
            const accountSid = process.env.TWILIO_ACCOUNT_SID;
            const authToken = process.env.TWILIO_AUTH_TOKEN;
            this.fromNumber = process.env.TWILIO_PHONE_NUMBER;

            // Check if Twilio configuration is provided
            if (!accountSid || !authToken || !this.fromNumber) {
                console.log('SMS service initialized in TEST MODE (no Twilio config)');
                return;
            }

            this.client = twilio(accountSid, authToken);
            this.testMode = false;

            console.log('SMS service is ready to send messages via Twilio');

        } catch (error) {
            console.error('Failed to initialize Twilio, using test mode:', error.message);
            // Stay in test mode
        }
    }

    /**
     * Send OTP verification SMS
     * @param {string} phoneNumber - Recipient phone number (E.164 format)
     * @param {string} otp - OTP code to send
     * @param {string} userName - User's name for personalization
     * @returns {Promise<{success: boolean, messageSid?: string, error?: string}>}
     */
    async sendOTPSMS(phoneNumber, otp, userName = 'User') {
        try {
            // Normalize phone number to E.164 format
            const normalizedPhone = this.normalizePhoneNumber(phoneNumber);

            if (!this.isValidPhoneNumber(normalizedPhone)) {
                return {
                    success: false,
                    error: 'Invalid phone number format'
                };
            }

            if (this.testMode || !this.client) {
                // In development/test mode, log the OTP instead of sending
                console.log(`\n========================================`);
                console.log(`[SMS SERVICE - TEST MODE]`);
                console.log(`To: ${normalizedPhone}`);
                console.log(`OTP Code: ${otp}`);
                console.log(`========================================\n`);
                return {
                    success: true,
                    messageSid: 'test-mode-' + Date.now(),
                    testMode: true
                };
            }

            const messageBody = this.generateOTPMessage(otp, userName);

            const message = await this.client.messages.create({
                body: messageBody,
                from: this.fromNumber,
                to: normalizedPhone
            });

            return {
                success: true,
                messageSid: message.sid
            };

        } catch (error) {
            console.error('Failed to send OTP SMS:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Send phone number update notification SMS
     * @param {string} phoneNumber - Recipient phone number (E.164 format)
     * @param {string} userName - User's name for personalization
     * @returns {Promise<{success: boolean, messageSid?: string, error?: string}>}
     */
    async sendPhoneUpdateNotification(phoneNumber, userName = 'User') {
        try {
            const normalizedPhone = this.normalizePhoneNumber(phoneNumber);

            if (!this.isValidPhoneNumber(normalizedPhone)) {
                return {
                    success: false,
                    error: 'Invalid phone number format'
                };
            }

            if (!this.isConfigured) {
                console.log(`[SMS SERVICE - TEST MODE] Phone update notification for ${normalizedPhone}`);
                return {
                    success: true,
                    messageSid: 'test-mode-' + Date.now(),
                    testMode: true
                };
            }

            const messageBody = this.generatePhoneUpdateMessage(userName);

            const message = await this.client.messages.create({
                body: messageBody,
                from: this.fromNumber,
                to: normalizedPhone
            });

            return {
                success: true,
                messageSid: message.sid
            };

        } catch (error) {
            console.error('Failed to send phone update notification:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Normalize phone number to E.164 format
     * @param {string} phoneNumber - Input phone number
     * @returns {string} Normalized phone number
     */
    normalizePhoneNumber(phoneNumber) {
        // Handle null/undefined input
        if (!phoneNumber) {
            return '';
        }

        // Remove all non-digit characters except +
        let normalized = phoneNumber.replace(/[^\d+]/g, '');

        // If it doesn't start with +, assume it's a US number and add +1
        if (!normalized.startsWith('+')) {
            // If it's 10 digits, assume US number
            if (normalized.length === 10) {
                normalized = '+1' + normalized;
            }
            // If it's 11 digits and starts with 1, assume US number
            else if (normalized.length === 11 && normalized.startsWith('1')) {
                normalized = '+' + normalized;
            }
            // Otherwise, add + if not present
            else if (normalized.length > 0) {
                normalized = '+' + normalized;
            }
        }

        return normalized;
    }

    /**
     * Validate phone number format (basic E.164 validation)
     * @param {string} phoneNumber - Phone number to validate
     * @returns {boolean} Validation result
     */
    isValidPhoneNumber(phoneNumber) {
        // Basic E.164 format validation: +[1-15 digits]
        const e164Regex = /^\+[1-9]\d{1,14}$/;
        return e164Regex.test(phoneNumber);
    }

    /**
     * Generate OTP SMS message
     * @param {string} otp - OTP code
     * @param {string} userName - User's name
     * @returns {string} SMS message content
     */
    generateOTPMessage(otp, userName) {
        return `Hello ${userName}! Your verification code is: ${otp}. This code expires in 10 minutes. Do not share this code with anyone. - Property Rental Platform`;
    }

    /**
     * Send password change notification SMS
     * @param {string} phoneNumber - Recipient phone number (E.164 format)
     * @param {string} userName - User's name for personalization
     * @returns {Promise<{success: boolean, messageSid?: string, error?: string}>}
     */
    async sendPasswordChangeNotification(phoneNumber, userName = 'User') {
        try {
            const normalizedPhone = this.normalizePhoneNumber(phoneNumber);

            if (!this.isValidPhoneNumber(normalizedPhone)) {
                return {
                    success: false,
                    error: 'Invalid phone number format'
                };
            }

            if (!this.isConfigured) {
                console.log(`[SMS SERVICE - TEST MODE] Password change notification for ${normalizedPhone}`);
                return {
                    success: true,
                    messageSid: 'test-mode-' + Date.now(),
                    testMode: true
                };
            }

            const messageBody = this.generatePasswordChangeMessage(userName);

            const message = await this.client.messages.create({
                body: messageBody,
                from: this.fromNumber,
                to: normalizedPhone
            });

            return {
                success: true,
                messageSid: message.sid
            };

        } catch (error) {
            console.error('Failed to send password change notification:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Send account deletion notification SMS
     * @param {string} phoneNumber - Recipient phone number (E.164 format)
     * @param {string} userName - User's name for personalization
     * @returns {Promise<{success: boolean, messageSid?: string, error?: string}>}
     */
    async sendAccountDeletionNotification(phoneNumber, userName = 'User') {
        try {
            const normalizedPhone = this.normalizePhoneNumber(phoneNumber);

            if (!this.isValidPhoneNumber(normalizedPhone)) {
                return {
                    success: false,
                    error: 'Invalid phone number format'
                };
            }

            if (!this.isConfigured) {
                console.log(`[SMS SERVICE - TEST MODE] Account deletion notification for ${normalizedPhone}`);
                return {
                    success: true,
                    messageSid: 'test-mode-' + Date.now(),
                    testMode: true
                };
            }

            const messageBody = this.generateAccountDeletionMessage(userName);

            const message = await this.client.messages.create({
                body: messageBody,
                from: this.fromNumber,
                to: normalizedPhone
            });

            return {
                success: true,
                messageSid: message.sid
            };

        } catch (error) {
            console.error('Failed to send account deletion notification:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Send new device login notification SMS
     * @param {string} phoneNumber - Recipient phone number (E.164 format)
     * @param {string} userName - User's name for personalization
     * @param {object} context - Login context
     * @returns {Promise<{success: boolean, messageSid?: string, error?: string}>}
     */
    async sendNewDeviceLoginNotification(phoneNumber, userName = 'User', context = {}) {
        try {
            const normalizedPhone = this.normalizePhoneNumber(phoneNumber);

            if (!this.isValidPhoneNumber(normalizedPhone)) {
                return {
                    success: false,
                    error: 'Invalid phone number format'
                };
            }

            if (!this.isConfigured) {
                console.log(`[SMS SERVICE - TEST MODE] New device login notification for ${normalizedPhone}`);
                return {
                    success: true,
                    messageSid: 'test-mode-' + Date.now(),
                    testMode: true
                };
            }

            const messageBody = this.generateNewDeviceLoginMessage(userName, context);

            const message = await this.client.messages.create({
                body: messageBody,
                from: this.fromNumber,
                to: normalizedPhone
            });

            return {
                success: true,
                messageSid: message.sid
            };

        } catch (error) {
            console.error('Failed to send new device login notification:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Send failed login attempts notification SMS
     * @param {string} phoneNumber - Recipient phone number (E.164 format)
     * @param {string} userName - User's name for personalization
     * @param {object} context - Failed login context
     * @returns {Promise<{success: boolean, messageSid?: string, error?: string}>}
     */
    async sendFailedLoginNotification(phoneNumber, userName = 'User', context = {}) {
        try {
            const normalizedPhone = this.normalizePhoneNumber(phoneNumber);

            if (!this.isValidPhoneNumber(normalizedPhone)) {
                return {
                    success: false,
                    error: 'Invalid phone number format'
                };
            }

            if (!this.isConfigured) {
                console.log(`[SMS SERVICE - TEST MODE] Failed login notification for ${normalizedPhone}`);
                return {
                    success: true,
                    messageSid: 'test-mode-' + Date.now(),
                    testMode: true
                };
            }

            const messageBody = this.generateFailedLoginMessage(userName, context);

            const message = await this.client.messages.create({
                body: messageBody,
                from: this.fromNumber,
                to: normalizedPhone
            });

            return {
                success: true,
                messageSid: message.sid
            };

        } catch (error) {
            console.error('Failed to send failed login notification:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Generate password change notification message
     * @param {string} userName - User's name
     * @returns {string} SMS message content
     */
    generatePasswordChangeMessage(userName) {
        return `Hello ${userName}! Your password has been successfully changed on your Property Rental Platform account. If you didn't make this change, please contact support immediately.`;
    }

    /**
     * Generate phone update notification message
     * @param {string} userName - User's name
     * @returns {string} SMS message content
     */
    generatePhoneUpdateMessage(userName) {
        return `Hello ${userName}! Your phone number has been successfully updated on your Property Rental Platform account. If you didn't make this change, please contact support immediately.`;
    }

    /**
     * Generate account deletion notification message
     * @param {string} userName - User's name
     * @returns {string} SMS message content
     */
    generateAccountDeletionMessage(userName) {
        return `Hello ${userName}! Your Property Rental Platform account has been permanently deleted. If you didn't request this, please contact support immediately.`;
    }

    /**
     * Generate new device login notification message
     * @param {string} userName - User's name
     * @param {object} context - Login context
     * @returns {string} SMS message content
     */
    generateNewDeviceLoginMessage(userName, context) {
        const { location, timestamp } = context;
        const timeStr = timestamp ? new Date(timestamp).toLocaleString() : new Date().toLocaleString();
        const locationStr = location ? ` from ${location}` : '';

        return `Security Alert: New login detected on your Property Rental Platform account${locationStr} at ${timeStr}. If this wasn't you, change your password immediately.`;
    }

    /**
     * Generate failed login attempts notification message
     * @param {string} userName - User's name
     * @param {object} context - Failed login context
     * @returns {string} SMS message content
     */
    generateFailedLoginMessage(userName, context) {
        const { attempts } = context;
        const attemptsStr = attempts ? `${attempts} failed` : 'Multiple failed';

        return `Security Alert: ${attemptsStr} login attempts detected on your Property Rental Platform account. If this wasn't you, secure your account immediately.`;
    }

    /**
     * Send a test SMS to verify configuration
     * @param {string} phoneNumber - Test phone number
     * @returns {Promise<{success: boolean, messageSid?: string, error?: string}>}
     */
    async sendTestSMS(phoneNumber) {
        try {
            const normalizedPhone = this.normalizePhoneNumber(phoneNumber);

            if (!this.isValidPhoneNumber(normalizedPhone)) {
                return {
                    success: false,
                    error: 'Invalid phone number format'
                };
            }

            if (!this.isConfigured) {
                console.log(`[SMS SERVICE - TEST MODE] Test SMS for ${normalizedPhone}`);
                return {
                    success: true,
                    messageSid: 'test-mode-' + Date.now(),
                    testMode: true
                };
            }

            const message = await this.client.messages.create({
                body: 'Test message from Property Rental Platform SMS service. Configuration is working correctly!',
                from: this.fromNumber,
                to: normalizedPhone
            });

            return {
                success: true,
                messageSid: message.sid
            };

        } catch (error) {
            console.error('Failed to send test SMS:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get SMS delivery status
     * @param {string} messageSid - Twilio message SID
     * @returns {Promise<{success: boolean, status?: string, error?: string}>}
     */
    async getMessageStatus(messageSid) {
        try {
            if (!this.isConfigured) {
                return {
                    success: true,
                    status: 'test-mode',
                    testMode: true
                };
            }

            const message = await this.client.messages(messageSid).fetch();

            return {
                success: true,
                status: message.status,
                errorCode: message.errorCode,
                errorMessage: message.errorMessage
            };

        } catch (error) {
            console.error('Failed to get message status:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Check if SMS service is properly configured
     * @returns {boolean} Configuration status
     */
    isReady() {
        return this.isConfigured;
    }

    /**
     * Get service status information
     * @returns {object} Service status details
     */
    getStatus() {
        return {
            configured: this.isConfigured,
            accountSid: process.env.TWILIO_ACCOUNT_SID ? 'configured' : 'not configured',
            authToken: process.env.TWILIO_AUTH_TOKEN ? 'configured' : 'not configured',
            fromNumber: this.fromNumber || 'not configured'
        };
    }

    /**
     * Validate Twilio credentials
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async validateCredentials() {
        try {
            if (!this.isConfigured) {
                return {
                    success: false,
                    error: 'SMS service not configured'
                };
            }

            // Try to fetch account information to validate credentials
            const account = await this.client.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();

            return {
                success: true,
                accountStatus: account.status,
                accountName: account.friendlyName
            };

        } catch (error) {
            console.error('Failed to validate Twilio credentials:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Send admin alert SMS
     * @param {string} phoneNumber - Admin phone number
     * @param {string} message - Alert message
     * @returns {Promise<{success: boolean, messageSid?: string, error?: string}>}
     */
    async sendAdminAlert(phoneNumber, message) {
        try {
            if (!this.isConfigured) {
                console.log(`[TEST MODE] Admin Alert SMS to ${phoneNumber}: ${message}`);
                return {
                    success: true,
                    messageSid: `test_${Date.now()}`,
                    testMode: true
                };
            }

            const messageOptions = {
                body: message,
                from: this.fromNumber,
                to: phoneNumber
            };

            const twilioMessage = await this.client.messages.create(messageOptions);

            console.log(`Admin alert SMS sent to ${phoneNumber}: ${twilioMessage.sid}`);
            return {
                success: true,
                messageSid: twilioMessage.sid
            };

        } catch (error) {
            console.error(`Failed to send admin alert SMS to ${phoneNumber}:`, error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// Create and export a singleton instance
const smsService = new SMSService();
export default smsService;