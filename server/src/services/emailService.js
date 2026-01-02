import { createTransport } from 'nodemailer';

/**
 * Email Service for sending OTP codes and notifications
 * Supports SMTP configuration via environment variables
 * Falls back to test mode when SMTP is not configured or fails
 */
class EmailService {
    constructor() {
        this.transporter = null;
        this.isConfigured = false;
        this.testMode = false;
        this.initializeTransporter();
    }

    /**
     * Initialize the email transporter based on environment configuration
     */
    initializeTransporter() {
        // Always start as configured and in test mode
        // This ensures the service is always available
        this.isConfigured = true;
        this.testMode = true;

        try {
            // Check if email configuration is provided
            const emailConfig = {
                host: process.env.SMTP_HOST,
                port: parseInt(process.env.SMTP_PORT) || 587,
                secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            };

            // If no SMTP config, stay in test mode
            if (!emailConfig.host || !emailConfig.auth.user) {
                console.log('Email service initialized in TEST MODE (no SMTP config)');
                return;
            }

            this.transporter = createTransport(emailConfig);

            // Don't verify on startup - it wastes email quota
            // Verification will happen on first actual email send
            this.testMode = false;
            console.log('Email service initialized with SMTP config (will verify on first send)');

        } catch (error) {
            console.error('Failed to initialize SMTP, using test mode:', error.message);
            // Stay in test mode
        }
    }

    /**
     * Send OTP verification email
     * @param {string} email - Recipient email address
     * @param {string} otp - OTP code to send
     * @param {string} userName - User's name for personalization
     * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
     */
    async sendOTPEmail(email, otp, userName = 'User') {
        try {
            if (this.testMode || !this.transporter) {
                // In development/test mode, log the OTP instead of sending
                console.log(`\n========================================`);
                console.log(`[EMAIL SERVICE - TEST MODE]`);
                console.log(`To: ${email}`);
                console.log(`OTP Code: ${otp}`);
                console.log(`========================================\n`);
                return {
                    success: true,
                    messageId: 'test-mode-' + Date.now(),
                    testMode: true
                };
            }

            const mailOptions = {
                from: process.env.SMTP_FROM || process.env.SMTP_USER,
                to: email,
                subject: 'Email Verification - Your OTP Code',
                html: this.generateOTPEmailTemplate(otp, userName),
                text: this.generateOTPEmailText(otp, userName)
            };

            const info = await this.transporter.sendMail(mailOptions);

            return {
                success: true,
                messageId: info.messageId
            };

        } catch (error) {
            console.error('Failed to send OTP email:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Send password change notification email
     * @param {string} email - Recipient email address
     * @param {string} userName - User's name for personalization
     * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
     */
    async sendPasswordChangeNotification(email, userName = 'User') {
        try {
            if (!this.isConfigured) {
                console.log(`[EMAIL SERVICE - TEST MODE] Password change notification for ${email}`);
                return {
                    success: true,
                    messageId: 'test-mode-' + Date.now(),
                    testMode: true
                };
            }

            const mailOptions = {
                from: process.env.SMTP_FROM || process.env.SMTP_USER,
                to: email,
                subject: 'Password Changed - Security Notification',
                html: this.generatePasswordChangeTemplate(userName),
                text: this.generatePasswordChangeText(userName)
            };

            const info = await this.transporter.sendMail(mailOptions);

            return {
                success: true,
                messageId: info.messageId
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
     * Send account deletion confirmation email
     * @param {string} email - Recipient email address
     * @param {string} userName - User's name for personalization
     * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
     */
    async sendAccountDeletionConfirmation(email, userName = 'User') {
        try {
            if (!this.isConfigured) {
                console.log(`[EMAIL SERVICE - TEST MODE] Account deletion confirmation for ${email}`);
                return {
                    success: true,
                    messageId: 'test-mode-' + Date.now(),
                    testMode: true
                };
            }

            const mailOptions = {
                from: process.env.SMTP_FROM || process.env.SMTP_USER,
                to: email,
                subject: 'Account Deleted - Confirmation',
                html: this.generateAccountDeletionTemplate(userName),
                text: this.generateAccountDeletionText(userName)
            };

            const info = await this.transporter.sendMail(mailOptions);

            return {
                success: true,
                messageId: info.messageId
            };

        } catch (error) {
            console.error('Failed to send account deletion confirmation:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Generate HTML template for OTP email
     * @param {string} otp - OTP code
     * @param {string} userName - User's name
     * @returns {string} HTML template
     */
    generateOTPEmailTemplate(otp, userName) {
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
                .warning { color: #dc3545; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Email Verification</h1>
                </div>
                <div class="content">
                    <p>Hello ${userName},</p>
                    <p>Thank you for using our property rental platform. To complete your email verification, please use the following One-Time Password (OTP):</p>
                    
                    <div class="otp-code">${otp}</div>
                    
                    <p><strong>Important:</strong></p>
                    <ul>
                        <li>This OTP is valid for 10 minutes only</li>
                        <li>Do not share this code with anyone</li>
                        <li>If you didn't request this verification, please ignore this email</li>
                    </ul>
                    
                    <p>If you have any questions, please contact our support team.</p>
                    
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
     * Generate plain text version for OTP email
     * @param {string} otp - OTP code
     * @param {string} userName - User's name
     * @returns {string} Plain text content
     */
    generateOTPEmailText(otp, userName) {
        return `
Hello ${userName},

Thank you for using our property rental platform. To complete your email verification, please use the following One-Time Password (OTP):

${otp}

Important:
- This OTP is valid for 10 minutes only
- Do not share this code with anyone
- If you didn't request this verification, please ignore this email

If you have any questions, please contact our support team.

Best regards,
The Property Rental Team

This is an automated message. Please do not reply to this email.
        `.trim();
    }

    /**
     * Generate HTML template for password change notification
     * @param {string} userName - User's name
     * @returns {string} HTML template
     */
    generatePasswordChangeTemplate(userName) {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Changed</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background-color: #ffffff; padding: 30px; border: 1px solid #e9ecef; }
                .footer { background-color: #f8f9fa; padding: 15px; text-align: center; 
                         border-radius: 0 0 8px 8px; font-size: 12px; color: #6c757d; }
                .alert { background-color: #d4edda; border: 1px solid #c3e6cb; color: #155724; 
                        padding: 15px; border-radius: 4px; margin: 15px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Password Changed Successfully</h1>
                </div>
                <div class="content">
                    <p>Hello ${userName},</p>
                    
                    <div class="alert">
                        <strong>Security Notice:</strong> Your account password has been successfully changed.
                    </div>
                    
                    <p>This email confirms that your password was changed on ${new Date().toLocaleString()}.</p>
                    
                    <p><strong>If you made this change:</strong></p>
                    <p>No further action is required. Your account is secure.</p>
                    
                    <p><strong>If you did NOT make this change:</strong></p>
                    <ul>
                        <li>Contact our support team immediately</li>
                        <li>Review your account for any unauthorized activity</li>
                        <li>Consider enabling additional security measures</li>
                    </ul>
                    
                    <p>Best regards,<br>The Property Rental Team</p>
                </div>
                <div class="footer">
                    <p>This is an automated security notification. Please do not reply to this email.</p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    /**
     * Generate plain text version for password change notification
     * @param {string} userName - User's name
     * @returns {string} Plain text content
     */
    generatePasswordChangeText(userName) {
        return `
Hello ${userName},

SECURITY NOTICE: Your account password has been successfully changed.

This email confirms that your password was changed on ${new Date().toLocaleString()}.

If you made this change:
No further action is required. Your account is secure.

If you did NOT make this change:
- Contact our support team immediately
- Review your account for any unauthorized activity
- Consider enabling additional security measures

Best regards,
The Property Rental Team

This is an automated security notification. Please do not reply to this email.
        `.trim();
    }

    /**
     * Generate HTML template for account deletion confirmation
     * @param {string} userName - User's name
     * @returns {string} HTML template
     */
    generateAccountDeletionTemplate(userName) {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Account Deleted</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background-color: #ffffff; padding: 30px; border: 1px solid #e9ecef; }
                .footer { background-color: #f8f9fa; padding: 15px; text-align: center; 
                         border-radius: 0 0 8px 8px; font-size: 12px; color: #6c757d; }
                .alert { background-color: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; 
                        padding: 15px; border-radius: 4px; margin: 15px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Account Deletion Confirmed</h1>
                </div>
                <div class="content">
                    <p>Hello ${userName},</p>
                    
                    <div class="alert">
                        <strong>Account Deletion:</strong> Your account has been permanently deleted.
                    </div>
                    
                    <p>This email confirms that your account and all associated data have been permanently removed from our system on ${new Date().toLocaleString()}.</p>
                    
                    <p><strong>What has been deleted:</strong></p>
                    <ul>
                        <li>Your user profile and personal information</li>
                        <li>All property listings you created</li>
                        <li>Your conversation history</li>
                        <li>Saved preferences and settings</li>
                    </ul>
                    
                    <p>Thank you for using our property rental platform. If you decide to return in the future, you'll need to create a new account.</p>
                    
                    <p>Best regards,<br>The Property Rental Team</p>
                </div>
                <div class="footer">
                    <p>This is an automated confirmation. Please do not reply to this email.</p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    /**
     * Generate plain text version for account deletion confirmation
     * @param {string} userName - User's name
     * @returns {string} Plain text content
     */
    generateAccountDeletionText(userName) {
        return `
Hello ${userName},

ACCOUNT DELETION: Your account has been permanently deleted.

This email confirms that your account and all associated data have been permanently removed from our system on ${new Date().toLocaleString()}.

What has been deleted:
- Your user profile and personal information
- All property listings you created
- Your conversation history
- Saved preferences and settings

Thank you for using our property rental platform. If you decide to return in the future, you'll need to create a new account.

Best regards,
The Property Rental Team

This is an automated confirmation. Please do not reply to this email.
        `.trim();
    }

    /**
     * Check if email service is properly configured
     * @returns {boolean} Configuration status
     */
    isReady() {
        return this.isConfigured;
    }

    /**
     * Send phone update notification email
     * @param {string} email - Recipient email address
     * @param {string} userName - User's name for personalization
     * @param {string} newPhone - New phone number (optional)
     * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
     */
    async sendPhoneUpdateNotification(email, userName = 'User', newPhone = null) {
        try {
            if (!this.isConfigured) {
                console.log(`[EMAIL SERVICE - TEST MODE] Phone update notification for ${email}`);
                return {
                    success: true,
                    messageId: 'test-mode-' + Date.now(),
                    testMode: true
                };
            }

            const mailOptions = {
                from: process.env.SMTP_FROM || process.env.SMTP_USER,
                to: email,
                subject: 'Phone Number Updated - Security Notification',
                html: this.generatePhoneUpdateTemplate(userName, newPhone),
                text: this.generatePhoneUpdateText(userName, newPhone)
            };

            const info = await this.transporter.sendMail(mailOptions);

            return {
                success: true,
                messageId: info.messageId
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
     * Send new device login notification email
     * @param {string} email - Recipient email address
     * @param {string} userName - User's name for personalization
     * @param {object} context - Login context (device, location, etc.)
     * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
     */
    async sendNewDeviceLoginNotification(email, userName = 'User', context = {}) {
        try {
            if (!this.isConfigured) {
                console.log(`[EMAIL SERVICE - TEST MODE] New device login notification for ${email}`);
                return {
                    success: true,
                    messageId: 'test-mode-' + Date.now(),
                    testMode: true
                };
            }

            const mailOptions = {
                from: process.env.SMTP_FROM || process.env.SMTP_USER,
                to: email,
                subject: 'New Device Login - Security Alert',
                html: this.generateNewDeviceLoginTemplate(userName, context),
                text: this.generateNewDeviceLoginText(userName, context)
            };

            const info = await this.transporter.sendMail(mailOptions);

            return {
                success: true,
                messageId: info.messageId
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
     * Send failed login attempts notification email
     * @param {string} email - Recipient email address
     * @param {string} userName - User's name for personalization
     * @param {object} context - Failed login context
     * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
     */
    async sendFailedLoginNotification(email, userName = 'User', context = {}) {
        try {
            if (!this.isConfigured) {
                console.log(`[EMAIL SERVICE - TEST MODE] Failed login notification for ${email}`);
                return {
                    success: true,
                    messageId: 'test-mode-' + Date.now(),
                    testMode: true
                };
            }

            const mailOptions = {
                from: process.env.SMTP_FROM || process.env.SMTP_USER,
                to: email,
                subject: 'Failed Login Attempts - Security Alert',
                html: this.generateFailedLoginTemplate(userName, context),
                text: this.generateFailedLoginText(userName, context)
            };

            const info = await this.transporter.sendMail(mailOptions);

            return {
                success: true,
                messageId: info.messageId
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
     * Generate HTML template for phone update notification
     * @param {string} userName - User's name
     * @param {string} newPhone - New phone number
     * @returns {string} HTML template
     */
    generatePhoneUpdateTemplate(userName, newPhone) {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Phone Number Updated</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background-color: #ffffff; padding: 30px; border: 1px solid #e9ecef; }
                .footer { background-color: #f8f9fa; padding: 15px; text-align: center; 
                         border-radius: 0 0 8px 8px; font-size: 12px; color: #6c757d; }
                .alert { background-color: #d4edda; border: 1px solid #c3e6cb; color: #155724; 
                        padding: 15px; border-radius: 4px; margin: 15px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Phone Number Updated</h1>
                </div>
                <div class="content">
                    <p>Hello ${userName},</p>
                    
                    <div class="alert">
                        <strong>Security Notice:</strong> Your phone number has been successfully updated.
                    </div>
                    
                    <p>This email confirms that your phone number was updated on ${new Date().toLocaleString()}.</p>
                    
                    ${newPhone ? `<p><strong>New phone number:</strong> ${newPhone}</p>` : ''}
                    
                    <p><strong>If you made this change:</strong></p>
                    <p>No further action is required. Your account is secure.</p>
                    
                    <p><strong>If you did NOT make this change:</strong></p>
                    <ul>
                        <li>Contact our support team immediately</li>
                        <li>Review your account for any unauthorized activity</li>
                        <li>Consider changing your password</li>
                    </ul>
                    
                    <p>Best regards,<br>The Property Rental Team</p>
                </div>
                <div class="footer">
                    <p>This is an automated security notification. Please do not reply to this email.</p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    /**
     * Generate plain text version for phone update notification
     * @param {string} userName - User's name
     * @param {string} newPhone - New phone number
     * @returns {string} Plain text content
     */
    generatePhoneUpdateText(userName, newPhone) {
        return `
Hello ${userName},

SECURITY NOTICE: Your phone number has been successfully updated.

This email confirms that your phone number was updated on ${new Date().toLocaleString()}.

${newPhone ? `New phone number: ${newPhone}` : ''}

If you made this change:
No further action is required. Your account is secure.

If you did NOT make this change:
- Contact our support team immediately
- Review your account for any unauthorized activity
- Consider changing your password

Best regards,
The Property Rental Team

This is an automated security notification. Please do not reply to this email.
        `.trim();
    }

    /**
     * Generate HTML template for new device login notification
     * @param {string} userName - User's name
     * @param {object} context - Login context
     * @returns {string} HTML template
     */
    generateNewDeviceLoginTemplate(userName, context) {
        const { device, location, ipAddress, timestamp } = context;

        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New Device Login</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background-color: #ffffff; padding: 30px; border: 1px solid #e9ecef; }
                .footer { background-color: #f8f9fa; padding: 15px; text-align: center; 
                         border-radius: 0 0 8px 8px; font-size: 12px; color: #6c757d; }
                .alert { background-color: #fff3cd; border: 1px solid #ffeaa7; color: #856404; 
                        padding: 15px; border-radius: 4px; margin: 15px 0; }
                .details { background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 15px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>New Device Login Detected</h1>
                </div>
                <div class="content">
                    <p>Hello ${userName},</p>
                    
                    <div class="alert">
                        <strong>Security Alert:</strong> We detected a login from a new device.
                    </div>
                    
                    <p>A new login to your account was detected with the following details:</p>
                    
                    <div class="details">
                        <p><strong>Time:</strong> ${timestamp || new Date().toLocaleString()}</p>
                        ${device ? `<p><strong>Device:</strong> ${device}</p>` : ''}
                        ${location ? `<p><strong>Location:</strong> ${location}</p>` : ''}
                        ${ipAddress ? `<p><strong>IP Address:</strong> ${ipAddress}</p>` : ''}
                    </div>
                    
                    <p><strong>If this was you:</strong></p>
                    <p>No further action is required. Your account is secure.</p>
                    
                    <p><strong>If this was NOT you:</strong></p>
                    <ul>
                        <li>Change your password immediately</li>
                        <li>Review your account for any unauthorized activity</li>
                        <li>Contact our support team</li>
                        <li>Consider enabling additional security measures</li>
                    </ul>
                    
                    <p>Best regards,<br>The Property Rental Team</p>
                </div>
                <div class="footer">
                    <p>This is an automated security alert. Please do not reply to this email.</p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    /**
     * Generate plain text version for new device login notification
     * @param {string} userName - User's name
     * @param {object} context - Login context
     * @returns {string} Plain text content
     */
    generateNewDeviceLoginText(userName, context) {
        const { device, location, ipAddress, timestamp } = context;

        return `
Hello ${userName},

SECURITY ALERT: We detected a login from a new device.

A new login to your account was detected with the following details:

Time: ${timestamp || new Date().toLocaleString()}
${device ? `Device: ${device}` : ''}
${location ? `Location: ${location}` : ''}
${ipAddress ? `IP Address: ${ipAddress}` : ''}

If this was you:
No further action is required. Your account is secure.

If this was NOT you:
- Change your password immediately
- Review your account for any unauthorized activity
- Contact our support team
- Consider enabling additional security measures

Best regards,
The Property Rental Team

This is an automated security alert. Please do not reply to this email.
        `.trim();
    }

    /**
     * Generate HTML template for failed login notification
     * @param {string} userName - User's name
     * @param {object} context - Failed login context
     * @returns {string} HTML template
     */
    generateFailedLoginTemplate(userName, context) {
        const { attempts, lastAttempt, ipAddress, location } = context;

        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Failed Login Attempts</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background-color: #ffffff; padding: 30px; border: 1px solid #e9ecef; }
                .footer { background-color: #f8f9fa; padding: 15px; text-align: center; 
                         border-radius: 0 0 8px 8px; font-size: 12px; color: #6c757d; }
                .alert { background-color: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; 
                        padding: 15px; border-radius: 4px; margin: 15px 0; }
                .details { background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 15px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Failed Login Attempts Detected</h1>
                </div>
                <div class="content">
                    <p>Hello ${userName},</p>
                    
                    <div class="alert">
                        <strong>Security Alert:</strong> Multiple failed login attempts detected on your account.
                    </div>
                    
                    <p>We detected ${attempts || 'multiple'} failed login attempts on your account:</p>
                    
                    <div class="details">
                        <p><strong>Last attempt:</strong> ${lastAttempt || new Date().toLocaleString()}</p>
                        ${ipAddress ? `<p><strong>IP Address:</strong> ${ipAddress}</p>` : ''}
                        ${location ? `<p><strong>Location:</strong> ${location}</p>` : ''}
                    </div>
                    
                    <p><strong>If these attempts were made by you:</strong></p>
                    <p>Please ensure you're using the correct password. If you've forgotten your password, you can reset it.</p>
                    
                    <p><strong>If these attempts were NOT made by you:</strong></p>
                    <ul>
                        <li>Change your password immediately</li>
                        <li>Review your account for any unauthorized activity</li>
                        <li>Contact our support team</li>
                        <li>Consider enabling additional security measures</li>
                    </ul>
                    
                    <p>Your account remains secure, but we recommend taking action if these attempts were unauthorized.</p>
                    
                    <p>Best regards,<br>The Property Rental Team</p>
                </div>
                <div class="footer">
                    <p>This is an automated security alert. Please do not reply to this email.</p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    /**
     * Generate plain text version for failed login notification
     * @param {string} userName - User's name
     * @param {object} context - Failed login context
     * @returns {string} Plain text content
     */
    generateFailedLoginText(userName, context) {
        const { attempts, lastAttempt, ipAddress, location } = context;

        return `
Hello ${userName},

SECURITY ALERT: Multiple failed login attempts detected on your account.

We detected ${attempts || 'multiple'} failed login attempts on your account:

Last attempt: ${lastAttempt || new Date().toLocaleString()}
${ipAddress ? `IP Address: ${ipAddress}` : ''}
${location ? `Location: ${location}` : ''}

If these attempts were made by you:
Please ensure you're using the correct password. If you've forgotten your password, you can reset it.

If these attempts were NOT made by you:
- Change your password immediately
- Review your account for any unauthorized activity
- Contact our support team
- Consider enabling additional security measures

Your account remains secure, but we recommend taking action if these attempts were unauthorized.

Best regards,
The Property Rental Team

This is an automated security alert. Please do not reply to this email.
        `.trim();
    }

    /**
     * Get service status information
     * @returns {object} Service status details
     */
    getStatus() {
        return {
            configured: this.isConfigured,
            testMode: this.testMode,
            ready: this.isConfigured, // Always ready (either SMTP or test mode)
            host: process.env.SMTP_HOST || 'not configured',
            port: process.env.SMTP_PORT || 'not configured',
            secure: process.env.SMTP_SECURE === 'true',
            user: process.env.SMTP_USER ? 'configured' : 'not configured'
        };
    }

    /**
     * Send admin alert email
     * @param {string} email - Admin email address
     * @param {string} subject - Email subject
     * @param {string} htmlContent - HTML email content
     * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
     */
    async sendAdminAlert(email, subject, htmlContent) {
        try {
            if (!this.isConfigured) {
                console.log(`[TEST MODE] Admin Alert Email to ${email}: ${subject}`);
                return {
                    success: true,
                    messageId: `test_${Date.now()}`,
                    testMode: true
                };
            }

            const mailOptions = {
                from: `"OTP System Alerts" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
                to: email,
                subject: subject,
                html: htmlContent,
                priority: 'high',
                headers: {
                    'X-Priority': '1',
                    'X-MSMail-Priority': 'High',
                    'Importance': 'high'
                }
            };

            const info = await this.transporter.sendMail(mailOptions);

            console.log(`Admin alert email sent to ${email}: ${info.messageId}`);
            return {
                success: true,
                messageId: info.messageId
            };

        } catch (error) {
            console.error(`Failed to send admin alert email to ${email}:`, error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// Create and export a singleton instance
const emailService = new EmailService();
export default emailService;