import mongoose from "mongoose";
const { Schema } = mongoose;

const OTPSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        type: {
            type: String,
            enum: ["email", "phone"],
            required: true
        },
        contact: {
            type: String,
            required: true,
            index: true
        }, // email address or phone number
        otpHash: {
            type: String,
            required: true
        }, // hashed OTP for security
        expiresAt: {
            type: Date,
            required: true
        },
        attempts: {
            type: Number,
            default: 0
        },
        verified: {
            type: Boolean,
            default: false,
            index: true
        },
        deliveryId: {
            type: String,
            required: true,
            unique: true,
            index: true
        }, // Links to DeliveryAttempt records
        deliveryStatus: {
            type: String,
            enum: ['pending', 'sent', 'delivered', 'failed', 'expired'],
            default: 'pending',
            index: true
        },
        lastDeliveryAttempt: {
            type: Date,
            index: true
        },
        deliveryMethod: {
            type: String,
            enum: ['sms', 'email'],
            index: true
        },
        deliveryService: {
            type: String,
            enum: ['phone-email', 'twilio', 'smtp'],
            index: true
        }
    },
    { timestamps: true }
);

// Compound indexes for efficient queries
OTPSchema.index({ userId: 1, type: 1, verified: 1 });
OTPSchema.index({ contact: 1, type: 1 });
OTPSchema.index({ deliveryId: 1, deliveryStatus: 1 });
OTPSchema.index({ userId: 1, deliveryStatus: 1, createdAt: -1 });
OTPSchema.index({ deliveryService: 1, deliveryStatus: 1, createdAt: -1 });

// TTL index to automatically remove expired OTPs
OTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static methods for delivery tracking and analytics
OTPSchema.statics.getDeliveryMetrics = async function (timeRange = 24) {
    const cutoffTime = new Date(Date.now() - (timeRange * 60 * 60 * 1000));

    const metrics = await this.aggregate([
        {
            $match: {
                createdAt: { $gte: cutoffTime }
            }
        },
        {
            $group: {
                _id: null,
                totalOTPs: { $sum: 1 },
                deliveredOTPs: {
                    $sum: {
                        $cond: [{ $eq: ["$deliveryStatus", "delivered"] }, 1, 0]
                    }
                },
                failedOTPs: {
                    $sum: {
                        $cond: [{ $eq: ["$deliveryStatus", "failed"] }, 1, 0]
                    }
                },
                verifiedOTPs: {
                    $sum: {
                        $cond: [{ $eq: ["$verified", true] }, 1, 0]
                    }
                }
            }
        },
        {
            $addFields: {
                deliveryRate: {
                    $multiply: [
                        { $divide: ["$deliveredOTPs", "$totalOTPs"] },
                        100
                    ]
                },
                verificationRate: {
                    $multiply: [
                        { $divide: ["$verifiedOTPs", "$deliveredOTPs"] },
                        100
                    ]
                }
            }
        }
    ]);

    return metrics[0] || {
        totalOTPs: 0,
        deliveredOTPs: 0,
        failedOTPs: 0,
        verifiedOTPs: 0,
        deliveryRate: 0,
        verificationRate: 0
    };
};

OTPSchema.statics.getServiceDeliveryStats = async function (timeRange = 24) {
    const cutoffTime = new Date(Date.now() - (timeRange * 60 * 60 * 1000));

    return await this.aggregate([
        {
            $match: {
                createdAt: { $gte: cutoffTime },
                deliveryService: { $ne: null }
            }
        },
        {
            $group: {
                _id: {
                    service: "$deliveryService",
                    method: "$deliveryMethod"
                },
                totalOTPs: { $sum: 1 },
                deliveredOTPs: {
                    $sum: {
                        $cond: [{ $eq: ["$deliveryStatus", "delivered"] }, 1, 0]
                    }
                },
                failedOTPs: {
                    $sum: {
                        $cond: [{ $eq: ["$deliveryStatus", "failed"] }, 1, 0]
                    }
                },
                verifiedOTPs: {
                    $sum: {
                        $cond: [{ $eq: ["$verified", true] }, 1, 0]
                    }
                }
            }
        },
        {
            $addFields: {
                deliveryRate: {
                    $multiply: [
                        { $divide: ["$deliveredOTPs", "$totalOTPs"] },
                        100
                    ]
                },
                verificationRate: {
                    $cond: [
                        { $gt: ["$deliveredOTPs", 0] },
                        {
                            $multiply: [
                                { $divide: ["$verifiedOTPs", "$deliveredOTPs"] },
                                100
                            ]
                        },
                        0
                    ]
                }
            }
        },
        {
            $sort: { totalOTPs: -1 }
        }
    ]);
};

OTPSchema.statics.getUserOTPHistory = async function (userId, limit = 20) {
    return await this.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('type contact deliveryStatus deliveryMethod deliveryService verified expiresAt createdAt')
        .lean();
};

export const OTP = mongoose.models.OTP || mongoose.model("OTP", OTPSchema);