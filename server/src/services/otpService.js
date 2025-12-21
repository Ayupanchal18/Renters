import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { OTP } from '../../models/OTP.js';
import { User } from '../../models/User.js';

/**
 * OTP Service for generating, validating, and managing one-time passwords
 * Implements security best practices including hashing, expiration, and rate limiting
 */
class OTPService {
    constructor() {
        this.OTP_LENGTH = 6;
        this.OTP_EXPIRY_MINUTES = 10;
        this.MAX_ATTEMPTS = 5;
        this.RATE_LIMIT_WINDOW_MINUTES = 15;
        this.SALT_ROUNDS = 12;
    }

    /**
     * Generate a cryptographically secure OTP
     * @returns {string} 6-digit numeric OTP
     */
    generateOTP() {
        // Use crypto.randomInt for cryptographically secure random numbers
        const min = Math.pow(10, this.OTP_LENGTH - 1);
        const max = Math.pow(10, this.OTP_LENGTH) - 1;
        return crypto.randomInt(min, max + 1).toString();
    }

    /**
     * Hash OTP for secure storage
     * @param {string} otp - Plain text OTP
     * @returns {Promise<string>} Hashed OTP
     */
    async hashOTP(otp) {
        return await bcrypt.hash(otp, this.SALT_ROUNDS);
    }

    /**
     * Verify OTP against stored hash
     * @param {string} otp - Plain text OTP to verify
     * @param {string} hash - Stored hash to compare against
     * @returns {Promise<boolean>} True if OTP matches hash
     */
    async verifyOTP(otp, hash) {
        return await bcrypt.compare(otp, hash);
    }

    /**
     * Generate unique delivery ID
     * @returns {string} Unique delivery ID
     */
    generateDeliveryId() {
        return `delivery_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
    }

    /**
     * Create and store a new OTP for user verification
     * @param {string} userId - User ID
     * @param {string} type - 'email' or 'phone'
     * @param {string} contact - Email address or phone number
     * @returns {Promise<{otp: string, expiresAt: Date, deliveryId: string}>} Generated OTP and expiration
     */
    async createOTP(userId, type, contact) {
        // Check rate limiting - prevent too many OTP requests
        await this.checkRateLimit(userId, type);

        // Generate new OTP and delivery ID
        const otp = this.generateOTP();
        const otpHash = await this.hashOTP(otp);
        const expiresAt = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000);
        const deliveryId = this.generateDeliveryId();

        // Invalidate any existing OTPs for this user/type combination
        await OTP.updateMany(
            { userId, type, verified: false },
            { verified: true } // Mark as verified to effectively invalidate
        );

        // Create new OTP record
        const otpRecord = new OTP({
            userId,
            type,
            contact,
            otpHash,
            expiresAt,
            attempts: 0,
            verified: false,
            deliveryId,
            deliveryStatus: 'pending',
            deliveryMethod: type === 'phone' ? 'sms' : 'email'
        });

        await otpRecord.save();

        return { otp, expiresAt, otpId: otpRecord._id, deliveryId };
    }

    /**
     * Validate an OTP and mark user as verified if successful
     * @param {string} userId - User ID
     * @param {string} type - 'email' or 'phone'
     * @param {string} contact - Email address or phone number
     * @param {string} otp - OTP to validate
     * @returns {Promise<{success: boolean, message: string, verified?: boolean}>}
     */
    async validateOTP(userId, type, contact, otp) {
        // Find the most recent unverified OTP for this user/type/contact
        const otpRecord = await OTP.findOne({
            userId,
            type,
            contact,
            verified: false,
            expiresAt: { $gt: new Date() }
        }).sort({ createdAt: -1 });

        if (!otpRecord) {
            return {
                success: false,
                message: 'Invalid or expired OTP. Please request a new one.'
            };
        }

        // Check if too many attempts have been made
        if (otpRecord.attempts >= this.MAX_ATTEMPTS) {
            // Mark as verified to invalidate it
            otpRecord.verified = true;
            await otpRecord.save();

            return {
                success: false,
                message: 'Too many failed attempts. Please request a new OTP.'
            };
        }

        // Increment attempt counter
        otpRecord.attempts += 1;
        await otpRecord.save();

        // Verify the OTP
        const isValid = await this.verifyOTP(otp, otpRecord.otpHash);

        if (!isValid) {
            return {
                success: false,
                message: `Invalid OTP. ${this.MAX_ATTEMPTS - otpRecord.attempts} attempts remaining.`
            };
        }

        // OTP is valid - mark as verified and update user
        otpRecord.verified = true;
        await otpRecord.save();

        // Update user verification status
        const updateField = type === 'email' ? 'emailVerified' : 'phoneVerified';
        const timestampField = type === 'email' ? 'emailVerifiedAt' : 'phoneVerifiedAt';

        await User.findByIdAndUpdate(userId, {
            [updateField]: true,
            [timestampField]: new Date()
        });

        return {
            success: true,
            message: `${type === 'email' ? 'Email' : 'Phone number'} verified successfully.`,
            verified: true
        };
    }

    /**
     * Check rate limiting for OTP generation
     * @param {string} userId - User ID
     * @param {string} type - 'email' or 'phone'
     * @throws {Error} If rate limit exceeded
     */
    async checkRateLimit(userId, type) {
        const rateLimitStart = new Date(Date.now() - this.RATE_LIMIT_WINDOW_MINUTES * 60 * 1000);

        const recentOTPs = await OTP.countDocuments({
            userId,
            type,
            createdAt: { $gte: rateLimitStart }
        });

        if (recentOTPs >= 3) { // Allow max 3 OTP requests per window
            const error = new Error(`Rate limit exceeded. Please wait ${this.RATE_LIMIT_WINDOW_MINUTES} minutes before requesting another OTP.`);
            error.code = 'RATE_LIMIT_EXCEEDED';
            throw error;
        }
    }

    /**
     * Clean up expired OTPs (called periodically)
     * @returns {Promise<number>} Number of cleaned up records
     */
    async cleanupExpiredOTPs() {
        const result = await OTP.deleteMany({
            expiresAt: { $lt: new Date() }
        });

        return result.deletedCount;
    }

    /**
     * Get OTP statistics for monitoring
     * @param {string} userId - User ID (optional)
     * @returns {Promise<Object>} OTP statistics
     */
    async getOTPStats(userId = null) {
        const query = userId ? { userId } : {};

        const [total, verified, expired, pending] = await Promise.all([
            OTP.countDocuments(query),
            OTP.countDocuments({ ...query, verified: true }),
            OTP.countDocuments({ ...query, expiresAt: { $lt: new Date() } }),
            OTP.countDocuments({ ...query, verified: false, expiresAt: { $gt: new Date() } })
        ]);

        return { total, verified, expired, pending };
    }
}

export default new OTPService();