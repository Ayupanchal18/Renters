import mongoose from "mongoose";
const { Schema } = mongoose;

/**
 * NotificationLog Model
 * Tracks all admin-sent notifications for delivery logs
 */
const NotificationLogSchema = new Schema(
    {
        // Notification details
        subject: {
            type: String,
            required: true,
            trim: true
        },
        message: {
            type: String,
            required: true
        },
        // Delivery channel
        channel: {
            type: String,
            enum: ['email', 'sms', 'push', 'in-app'],
            required: true,
            index: true
        },
        // Type of notification
        type: {
            type: String,
            enum: ['individual', 'broadcast', 'targeted'],
            required: true,
            index: true
        },
        // Recipients
        recipients: [{
            userId: { type: Schema.Types.ObjectId, ref: 'User' },
            email: String,
            phone: String,
            status: {
                type: String,
                enum: ['pending', 'sent', 'delivered', 'failed', 'bounced'],
                default: 'pending'
            },
            sentAt: Date,
            deliveredAt: Date,
            failedAt: Date,
            error: String
        }],
        // Summary counts
        totalRecipients: {
            type: Number,
            default: 0
        },
        sentCount: {
            type: Number,
            default: 0
        },
        deliveredCount: {
            type: Number,
            default: 0
        },
        failedCount: {
            type: Number,
            default: 0
        },
        // Template used (if any)
        templateId: {
            type: Schema.Types.ObjectId,
            ref: 'NotificationTemplate'
        },
        // Targeting criteria (for targeted notifications)
        targetCriteria: {
            roles: [String],
            userIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
            filters: Schema.Types.Mixed
        },
        // Admin who sent the notification
        sentBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        // Scheduling
        scheduledAt: Date,
        completedAt: Date,
        // Status
        status: {
            type: String,
            enum: ['draft', 'scheduled', 'sending', 'completed', 'failed', 'cancelled'],
            default: 'draft',
            index: true
        }
    },
    { timestamps: true }
);

// Indexes
NotificationLogSchema.index({ sentBy: 1, createdAt: -1 });
NotificationLogSchema.index({ status: 1, createdAt: -1 });
NotificationLogSchema.index({ type: 1, channel: 1 });
NotificationLogSchema.index({ 'recipients.userId': 1 });

export const NotificationLog =
    mongoose.models.NotificationLog ||
    mongoose.model("NotificationLog", NotificationLogSchema);
