/**
 * Phone.email Service for unified SMS and email OTP delivery
 * Primary service for OTP delivery with built-in fallback capabilities
 */
class PhoneEmailService {
    constructor() {
        this.apiKey = process.env.PHONE_EMAIL_API_KEY;
        this.apiUrl = process.env.PHONE_EMAIL_API_URL || 'https://api.phone.email/v1';
        this.isConfigured = false;
        this.lastValidation = null;
        this.validationStatus = 'pending';
        this.healthStatus = 'unknown';
        this.errorCount = 0;
        this.lastError = null;

        this.initializeService();
    }

    /**
     * Initialize the Phone.email service and validate configuration
     */
    initializeService() {
        try {
            if (!this.apiKey) {
                console.warn('No Phone.email API key found. Service will use test mode.');
                this.isConfigured = false;
                this.validationStatus = 'invalid';
                return;
            }

            this.isConfigured = true;
            this.validationStatus = 'valid';
            this.healthStatus = 'healthy';
            console.log('Phone.email service initialized successfully');

        } catch (error) {
            console.error('Failed to initialize Phone.email service:', error);
            this.isConfigured = false;
            this.validationStatus = 'invalid';
            this.healthStatus = 'down';
            this.lastError = error.message;
        }
    }

    /**
     * Send OTP via SMS using Phone.email API
     * @param {string} phoneNumber - Recipient phone number
     * @param {string} otp - OTP code
     * @param {string} userName - User's name for personalization
     * @returns {Promise<{success: boolean, messageId?: string, estimatedDelivery?: number, error?: string}>}
     */
    async sendSMS(phoneNumber, otp, userName = 'User') {
        try {
            if (!this.isConfigured) {
                console.log(`[PHONE.EMAIL SERVICE - TEST MODE] SMS OTP for ${phoneNumber}: ${otp}`);
                return {
                    success: true,
                    messageId: 'test-sms-' + Date.now(),
                    estimatedDelivery: 30, // 30 seconds
                    testMode: true
                };
            }

            const payload = {
                to: this.normalizePhoneNumber(phoneNumber),
                message: this.generateSMSMessage(otp, userName),
                type: 'sms'
            };

            const response = await this.makeAPIRequest('/send', 'POST', payload);

            if (response.success) {
                this.resetErrorCount();
                return {
                    success: true,
                    messageId: response.messageId,
                    estimatedDelivery: response.estimatedDelivery || 60
                };
            } else {
                this.incrementErrorCount();
                return {
                    success: false,
                    error: response.error || 'SMS delivery failed'
                };
            }

        } catch (error) {
            console.error('Phone.email SMS delivery error:', error);
            this.incrementErrorCount();
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Send OTP via email using Phone.email API
     * @param {string} email - Recipient email address
     * @param {string} otp - OTP code
     * @param {string} userName - User's name for personalization
     * @returns {Promise<{success: boolean, messageId?: string, estimatedDelivery?: number, error?: string}>}
     */
    async sendEmail(email, otp, userName = 'User') {
        try {
            if (!this.isConfigured) {
                console.log(`[PHONE.EMAIL SERVICE - TEST MODE] Email OTP for ${email}: ${otp}`);
                return {
                    success: true,
                    messageId: 'test-email-' + Date.now(),
                    estimatedDelivery: 10, // 10 seconds
                    testMode: true
                };
            }

            const payload = {
                to: email,
                subject: 'Email Verification - Your OTP Code',
                message: this.generateEmailMessage(otp, userName),
                html: this.generateEmailHTML(otp, userName),
                type: 'email'
            };

            const response = await this.makeAPIRequest('/send', 'POST', payload);

            if (response.success) {
                this.resetErrorCount();
                return {
                    success: true,
                    messageId: response.messageId,
                    estimatedDelivery: response.estimatedDelivery || 30
                };
            } else {
                this.incrementErrorCount();
                return {
                    success: false,
                    error: response.error || 'Email delivery failed'
                };
            }

        } catch (error) {
            console.error('Phone.email email delivery error:', error);
            this.incrementErrorCount();
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Send OTP based on method type
     * @param {string} method - 'sms' or 'email'
     * @param {string} recipient - Phone number or email address
     * @param {string} otp - OTP code
     * @param {string} userName - User's name for personalization
     * @returns {Promise<{success: boolean, messageId?: string, estimatedDelivery?: number, error?: string}>}
     */
    async sendOTP(method, recipient, otp, userName = 'User') {
        if (method === 'sms') {
            return await this.sendSMS(recipient, otp, userName);
        } else if (method === 'email') {
            return await this.sendEmail(recipient, otp, userName);
        } else {
            return {
                success: false,
                error: 'Invalid delivery method. Must be "sms" or "email".'
            };
        }
    }

    /**
     * Get delivery status for a message
     * @param {string} messageId - Message ID from Phone.email
     * @returns {Promise<{success: boolean, status?: string, deliveredAt?: Date, error?: string}>}
     */
    async getDeliveryStatus(messageId) {
        try {
            if (!this.isConfigured) {
                return {
                    success: true,
                    status: 'delivered',
                    deliveredAt: new Date(),
                    testMode: true
                };
            }

            const response = await this.makeAPIRequest(`/status/${messageId}`, 'GET');

            if (response.success) {
                return {
                    success: true,
                    status: response.status,
                    deliveredAt: response.deliveredAt ? new Date(response.deliveredAt) : null
                };
            } else {
                return {
                    success: false,
                    error: response.error || 'Failed to get delivery status'
                };
            }

        } catch (error) {
            console.error('Phone.email status check error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Test delivery functionality
     * @param {string} method - 'sms' or 'email'
     * @param {string} recipient - Phone number or email address
     * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
     */
    async testDelivery(method, recipient) {
        try {
            const testOTP = '123456';
            const result = await this.sendOTP(method, recipient, testOTP, 'Test User');

            if (result.success) {
                return {
                    success: true,
                    messageId: result.messageId,
                    message: `Test ${method} sent successfully to ${recipient}`
                };
            } else {
                return {
                    success: false,
                    error: result.error
                };
            }

        } catch (error) {
            console.error('Phone.email test delivery error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Validate Phone.email credentials and connectivity
     * @returns {Promise<{success: boolean, accountInfo?: object, error?: string}>}
     */
    async validateCredentials() {
        try {
            if (!this.apiKey) {
                this.validationStatus = 'invalid';
                return {
                    success: false,
                    error: 'Phone.email API key not configured'
                };
            }

            const response = await this.makeAPIRequest('/account', 'GET');

            if (response.success) {
                this.validationStatus = 'valid';
                this.healthStatus = 'healthy';
                this.lastValidation = new Date();
                this.resetErrorCount();

                return {
                    success: true,
                    accountInfo: {
                        accountId: response.accountId,
                        balance: response.balance,
                        status: response.status
                    }
                };
            } else {
                this.validationStatus = 'invalid';
                this.healthStatus = 'degraded';
                this.incrementErrorCount();

                return {
                    success: false,
                    error: response.error || 'Credential validation failed'
                };
            }

        } catch (error) {
            console.error('Phone.email credential validation error:', error);
            this.validationStatus = 'invalid';
            this.healthStatus = 'down';
            this.incrementErrorCount();

            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Make HTTP request to Phone.email API
     * @param {string} endpoint - API endpoint
     * @param {string} method - HTTP method
     * @param {object} data - Request payload
     * @returns {Promise<object>} API response
     */
    async makeAPIRequest(endpoint, method = 'GET', data = null) {
        try {
            const url = `${this.apiUrl}${endpoint}`;
            const options = {
                method,
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                    'User-Agent': 'PropertyRental-OTP/1.0'
                }
            };

            if (data && (method === 'POST' || method === 'PUT')) {
                options.body = JSON.stringify(data);
            }

            const response = await fetch(url, options);
            const responseData = await response.json();

            if (response.ok) {
                return {
                    success: true,
                    ...responseData
                };
            } else {
                return {
                    success: false,
                    error: responseData.error || `HTTP ${response.status}: ${response.statusText}`
                };
            }

        } catch (error) {
            // Network or parsing error
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Normalize phone number for Phone.email API
     * @param {string} phoneNumber - Input phone number
     * @returns {string} Normalized phone number
     */
    normalizePhoneNumber(phoneNumber) {
        if (!phoneNumber) return '';

        // Remove all non-digit characters except +
        let normalized = phoneNumber.replace(/[^\d+]/g, '');

        // If it doesn't start with +, assume it's a US number and add +1
        if (!normalized.startsWith('+')) {
            if (normalized.length === 10) {
                normalized = '+1' + normalized;
            } else if (normalized.length === 11 && normalized.startsWith('1')) {
                normalized = '+' + normalized;
            } else if (normalized.length > 0) {
                normalized = '+' + normalized;
            }
        }

        return normalized;
    }

    /**
     * Generate SMS message content
     * @param {string} otp - OTP code
     * @param {string} userName - User's name
     * @returns {string} SMS message
     */
    generateSMSMessage(otp, userName) {
        return `Hello ${userName}! Your verification code is: ${otp}. This code expires in 10 minutes. Do not share this code with anyone. - Property Rental Platform`;
    }

    /**
     * Generate email message content (plain text)
     * @param {string} otp - OTP code
     * @param {string} userName - User's name
     * @returns {string} Email message
     */
    generateEmailMessage(otp, userName) {
        return `
Hello ${userName},

Your verification code is: ${otp}

This code expires in 10 minutes. Do not share this code with anyone.

If you didn't request this verification, please ignore this email.

Best regards,
The Property Rental Team
        `.trim();
    }

    /**
     * Generate email HTML content
     * @param {string} otp - OTP code
     * @param {string} userName - User's name
     * @returns {string} HTML email content
     */
    generateEmailHTML(otp, userName) {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Email Verification</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background-color: #ffffff; padding: 30px; border: 1px solid #e9ecef; }
                .otp-code { font-size: 32px; font-weight: bold; color: #007bff; text-align: center; 
                           padding: 20px; background-color: #f8f9fa; border-radius: 8px; margin: 20px 0; 
                           letter-spacing: 4px; }
                .footer { background-color: #f8f9fa; padding: 15px; text-align: center; 
                         border-radius: 0 0 8px 8px; font-size: 12px; color: #6c757d; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Email Verification</h1>
                </div>
                <div class="content">
                    <p>Hello ${userName},</p>
                    <p>Your verification code is:</p>
                    
                    <div class="otp-code">${otp}</div>
                    
                    <p><strong>Important:</strong></p>
                    <ul>
                        <li>This OTP is valid for 10 minutes only</li>
                        <li>Do not share this code with anyone</li>
                        <li>If you didn't request this verification, please ignore this email</li>
                    </ul>
                    
                    <p>Best regards,<br>The Property Rental Team</p>
                </div>
                <div class="footer">
                    <p>This is an automated message. Please do not reply to this email.</p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    /**
     * Increment error count and update health status
     */
    incrementErrorCount() {
        this.errorCount++;
        if (this.errorCount >= 5) {
            this.healthStatus = 'down';
        } else if (this.errorCount >= 3) {
            this.healthStatus = 'degraded';
        }
    }

    /**
     * Reset error count and update health status
     */
    resetErrorCount() {
        this.errorCount = 0;
        this.healthStatus = 'healthy';
    }

    /**
     * Check if service is ready for use
     * @returns {boolean} Service readiness status
     */
    isReady() {
        return this.isConfigured && this.validationStatus === 'valid';
    }

    /**
     * Get service status information
     * @returns {object} Service status details
     */
    getStatus() {
        return {
            configured: this.isConfigured,
            validationStatus: this.validationStatus,
            healthStatus: this.healthStatus,
            errorCount: this.errorCount,
            lastError: this.lastError,
            lastValidation: this.lastValidation,
            apiKey: this.apiKey ? 'configured' : 'not configured',
            apiUrl: this.apiUrl
        };
    }

    /**
     * Get service capabilities
     * @returns {object} Service capabilities
     */
    getCapabilities() {
        return {
            sms: true,
            email: true,
            deliveryTracking: true,
            realTimeStatus: true,
            globalCoverage: true
        };
    }
}

// Create and export a singleton instance
const phoneEmailService = new PhoneEmailService();
export default phoneEmailService;