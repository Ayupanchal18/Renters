import mongoose from "mongoose";
const { Schema } = mongoose;

const SecurityAuditLogSchema = new Schema(
    {
        userId: {
            type: String,
            required: false,
            default: 'system',
            index: true
        },
        action: {
            type: String,
            enum: [
                'password_change',
                'phone_update',
                'email_verification',
                'phone_verification',
                'account_deletion',
                'email_otp_sent',
                'phone_otp_sent',
                'email_verification_attempt',
                'phone_verification_attempt',
                'email_otp_send_failed',
                'phone_otp_send_failed',
                'email_verification_failed',
                'phone_verification_failed',
                // API request actions
                'password_change_request',
                'phone_update_request',
                'account_deletion_request',
                'account_phone_update',
                'otp_request',
                'otp_verification_request',
                'api_request',
                // Security monitoring actions
                'security_alert_triggered',
                'suspicious_activity_detected',
                'location_change_detected',
                'multiple_ip_verification_attempts',
                'rapid_requests_detected',
                'security_measures_recommended',
                // Authentication actions
                'auth_register',
                'auth_login_success',
                'auth_login_failed',
                'auth_login_blocked',
                'auth_login_rate_limited',
                'auth_logout',
                // Social login actions
                'auth_social_login_google',
                'auth_social_login_facebook',
                'auth_social_login_success',
                'auth_social_login_failed',
                // Admin notification actions
                'admin_notification_queued',
                'admin_notification_processed',
                'admin_notification_sent',
                'admin_notification_failed',
                'admin_alert_triggered',
                'admin_escalation_triggered',
                // Catch-all for any future actions
                'other'
            ],
            required: true,
            index: true
        },
        ipAddress: {
            type: String,
            required: true
        },
        userAgent: {
            type: String,
            required: true
        },
        success: {
            type: Boolean,
            required: true,
            index: true
        },
        details: {
            type: Schema.Types.Mixed,
            default: {}
        }
    },
    { timestamps: true }
);

// Compound indexes for efficient queries
SecurityAuditLogSchema.index({ userId: 1, action: 1 });
SecurityAuditLogSchema.index({ userId: 1, createdAt: -1 });
SecurityAuditLogSchema.index({ action: 1, success: 1 });
SecurityAuditLogSchema.index({ createdAt: -1 });

// TTL index to automatically remove old audit logs (keep for 1 year)
SecurityAuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

export const SecurityAuditLog = mongoose.models.SecurityAuditLog || mongoose.model("SecurityAuditLog", SecurityAuditLogSchema);