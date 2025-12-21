import mongoose from "mongoose";
const { Schema } = mongoose;

const NotificationDeliverySchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        // Notification details
        type: {
            type: String,
            enum: [
                'passwordChange',
                'phoneUpdate',
                'accountDeletion',
                'loginFromNewDevice',
                'failedLoginAttempts',
                'emailVerification',
                'phoneVerification',
                'propertyUpdate',
                'messageReceived'
            ],
            required: true,
            index: true,
        },

        // Delivery method and details
        deliveryMethod: {
            type: String,
            enum: ['email', 'sms'],
            required: true,
        },

        recipient: {
            type: String,
            required: true, // email address or phone number
        },

        // Delivery status tracking
        status: {
            type: String,
            enum: ['pending', 'sent', 'delivered', 'failed', 'bounced'],
            default: 'pending',
            index: true,
        },

        // External service tracking
        externalId: {
            type: String, // messageId from email service or messageSid from SMS
            index: true,
        },

        // Delivery attempts and timing
        attempts: {
            type: Number,
            default: 0,
        },

        sentAt: {
            type: Date,
        },

        deliveredAt: {
            type: Date,
        },

        failedAt: {
            type: Date,
        },

        // Error information
        error: {
            message: String,
            code: String,
            details: Schema.Types.Mixed,
        },

        // Notification content metadata
        subject: String,
        template: String,

        // Context data for the notification
        context: {
            type: Schema.Types.Mixed,
            default: {},
        },

        // Retry information
        nextRetryAt: Date,
        maxRetries: {
            type: Number,
            default: 3,
        },
    },
    { timestamps: true }
);

// Indexes for efficient querying
NotificationDeliverySchema.index({ userId: 1, type: 1 });
NotificationDeliverySchema.index({ status: 1, nextRetryAt: 1 });
NotificationDeliverySchema.index({ createdAt: -1 });
NotificationDeliverySchema.index({ externalId: 1 }, { sparse: true });

// Static methods for tracking delivery
NotificationDeliverySchema.statics.trackDelivery = async function (deliveryData) {
    const delivery = new this(deliveryData);
    return await delivery.save();
};

NotificationDeliverySchema.statics.updateDeliveryStatus = async function (externalId, status, additionalData = {}) {
    const updateData = {
        status,
        ...additionalData
    };

    if (status === 'sent') {
        updateData.sentAt = new Date();
    } else if (status === 'delivered') {
        updateData.deliveredAt = new Date();
    } else if (status === 'failed' || status === 'bounced') {
        updateData.failedAt = new Date();
    }

    return await this.findOneAndUpdate(
        { externalId },
        updateData,
        { new: true }
    );
};

NotificationDeliverySchema.statics.getDeliveryStats = async function (userId, timeRange = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeRange);

    const stats = await this.aggregate([
        {
            $match: {
                userId: new mongoose.Types.ObjectId(userId),
                createdAt: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: {
                    type: '$type',
                    status: '$status',
                    deliveryMethod: '$deliveryMethod'
                },
                count: { $sum: 1 }
            }
        }
    ]);

    return stats;
};

NotificationDeliverySchema.statics.getFailedDeliveries = async function (retryable = true) {
    const query = {
        status: 'failed',
        attempts: { $lt: this.schema.paths.maxRetries.default }
    };

    if (retryable) {
        query.$or = [
            { nextRetryAt: { $lte: new Date() } },
            { nextRetryAt: { $exists: false } }
        ];
    }

    return await this.find(query).sort({ createdAt: 1 });
};

export const NotificationDelivery =
    mongoose.models.NotificationDelivery ||
    mongoose.model("NotificationDelivery", NotificationDeliverySchema);