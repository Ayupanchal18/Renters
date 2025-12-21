import mongoose from "mongoose";
const { Schema } = mongoose;

const DeliveryAttemptSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        otpId: {
            type: Schema.Types.ObjectId,
            ref: "OTP",
            required: true,
            index: true
        },
        deliveryId: {
            type: String,
            required: true,
            unique: true,
            index: true
        },
        service: {
            type: String,
            enum: ['phone-email', 'twilio', 'smtp'],
            required: true,
            index: true
        },
        method: {
            type: String,
            enum: ['sms', 'email'],
            required: true,
            index: true
        },
        recipient: {
            type: String,
            required: true,
            index: true
        },
        status: {
            type: String,
            enum: ['pending', 'sent', 'delivered', 'failed', 'expired'],
            default: 'pending',
            index: true
        },
        messageId: {
            type: String,
            index: true
        },
        error: {
            type: String
        },
        retryCount: {
            type: Number,
            default: 0
        },
        estimatedDelivery: {
            type: Date
        },
        actualDelivery: {
            type: Date
        },
        deliveryTime: {
            type: Number // milliseconds
        },
        testMode: {
            type: Boolean,
            default: false,
            index: true
        },
        metadata: {
            userAgent: String,
            ipAddress: String,
            requestId: String,
            serviceResponse: Schema.Types.Mixed,
            testIdentifier: String // For test delivery identification
        }
    },
    {
        timestamps: true,
        collection: 'deliveryattempts'
    }
);

// Compound indexes for efficient queries
DeliveryAttemptSchema.index({ userId: 1, createdAt: -1 });
DeliveryAttemptSchema.index({ service: 1, status: 1, createdAt: -1 });
DeliveryAttemptSchema.index({ deliveryId: 1, createdAt: -1 });
DeliveryAttemptSchema.index({ status: 1, createdAt: -1 });
DeliveryAttemptSchema.index({ testMode: 1, createdAt: -1 });

// TTL index to automatically remove old delivery attempts (30 days)
DeliveryAttemptSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

// Static methods for analytics and reporting
DeliveryAttemptSchema.statics.getDeliveryStats = async function (timeRange = 24) {
    const cutoffTime = new Date(Date.now() - (timeRange * 60 * 60 * 1000));

    const stats = await this.aggregate([
        {
            $match: {
                createdAt: { $gte: cutoffTime }
            }
        },
        {
            $group: {
                _id: null,
                totalAttempts: { $sum: 1 },
                successfulAttempts: {
                    $sum: {
                        $cond: [{ $in: ["$status", ["sent", "delivered"]] }, 1, 0]
                    }
                },
                failedAttempts: {
                    $sum: {
                        $cond: [{ $eq: ["$status", "failed"] }, 1, 0]
                    }
                },
                averageDeliveryTime: {
                    $avg: {
                        $cond: [
                            { $and: [{ $ne: ["$deliveryTime", null] }, { $gt: ["$deliveryTime", 0] }] },
                            "$deliveryTime",
                            null
                        ]
                    }
                }
            }
        }
    ]);

    return stats[0] || {
        totalAttempts: 0,
        successfulAttempts: 0,
        failedAttempts: 0,
        averageDeliveryTime: 0
    };
};

DeliveryAttemptSchema.statics.getServiceStats = async function (timeRange = 24) {
    const cutoffTime = new Date(Date.now() - (timeRange * 60 * 60 * 1000));

    return await this.aggregate([
        {
            $match: {
                createdAt: { $gte: cutoffTime }
            }
        },
        {
            $group: {
                _id: "$service",
                totalAttempts: { $sum: 1 },
                successfulAttempts: {
                    $sum: {
                        $cond: [{ $in: ["$status", ["sent", "delivered"]] }, 1, 0]
                    }
                },
                failedAttempts: {
                    $sum: {
                        $cond: [{ $eq: ["$status", "failed"] }, 1, 0]
                    }
                },
                averageDeliveryTime: {
                    $avg: {
                        $cond: [
                            { $and: [{ $ne: ["$deliveryTime", null] }, { $gt: ["$deliveryTime", 0] }] },
                            "$deliveryTime",
                            null
                        ]
                    }
                }
            }
        },
        {
            $addFields: {
                successRate: {
                    $multiply: [
                        { $divide: ["$successfulAttempts", "$totalAttempts"] },
                        100
                    ]
                }
            }
        },
        {
            $sort: { totalAttempts: -1 }
        }
    ]);
};

DeliveryAttemptSchema.statics.getUserDeliveryHistory = async function (userId, limit = 50) {
    return await this.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('otpId', 'type contact expiresAt')
        .lean();
};

DeliveryAttemptSchema.statics.getFailureAnalysis = async function (timeRange = 24) {
    const cutoffTime = new Date(Date.now() - (timeRange * 60 * 60 * 1000));

    return await this.aggregate([
        {
            $match: {
                createdAt: { $gte: cutoffTime },
                status: 'failed'
            }
        },
        {
            $group: {
                _id: {
                    service: "$service",
                    errorType: {
                        $cond: [
                            { $regexMatch: { input: "$error", regex: /network|timeout|connection/i } },
                            "network",
                            {
                                $cond: [
                                    { $regexMatch: { input: "$error", regex: /invalid|format|number/i } },
                                    "validation",
                                    {
                                        $cond: [
                                            { $regexMatch: { input: "$error", regex: /rate|limit|quota/i } },
                                            "rate_limit",
                                            "other"
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                },
                count: { $sum: 1 },
                examples: { $push: { error: "$error", recipient: "$recipient", createdAt: "$createdAt" } }
            }
        },
        {
            $addFields: {
                examples: { $slice: ["$examples", 3] } // Limit to 3 examples per error type
            }
        },
        {
            $sort: { count: -1 }
        }
    ]);
};

DeliveryAttemptSchema.statics.getDeliveryTrends = async function (days = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    return await this.aggregate([
        {
            $match: {
                createdAt: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: {
                    date: {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$createdAt"
                        }
                    },
                    service: "$service",
                    status: "$status"
                },
                count: { $sum: 1 }
            }
        },
        {
            $group: {
                _id: {
                    date: "$_id.date",
                    service: "$_id.service"
                },
                statusCounts: {
                    $push: {
                        status: "$_id.status",
                        count: "$count"
                    }
                },
                totalAttempts: { $sum: "$count" }
            }
        },
        {
            $sort: { "_id.date": 1, "_id.service": 1 }
        }
    ]);
};

DeliveryAttemptSchema.statics.getTestDeliveryStats = async function (timeRange = 24) {
    const cutoffTime = new Date(Date.now() - (timeRange * 60 * 60 * 1000));

    const stats = await this.aggregate([
        {
            $match: {
                createdAt: { $gte: cutoffTime },
                testMode: true
            }
        },
        {
            $group: {
                _id: null,
                totalTests: { $sum: 1 },
                successfulTests: {
                    $sum: {
                        $cond: [{ $in: ["$status", ["sent", "delivered"]] }, 1, 0]
                    }
                },
                failedTests: {
                    $sum: {
                        $cond: [{ $eq: ["$status", "failed"] }, 1, 0]
                    }
                },
                averageTestTime: {
                    $avg: {
                        $cond: [
                            { $and: [{ $ne: ["$deliveryTime", null] }, { $gt: ["$deliveryTime", 0] }] },
                            "$deliveryTime",
                            null
                        ]
                    }
                }
            }
        }
    ]);

    return stats[0] || {
        totalTests: 0,
        successfulTests: 0,
        failedTests: 0,
        averageTestTime: 0
    };
};

DeliveryAttemptSchema.statics.getTestDeliveryHistory = async function (userId, limit = 20) {
    return await this.find({
        userId,
        testMode: true
    })
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('service method recipient status error messageId deliveryTime createdAt metadata.testIdentifier')
        .lean();
};

DeliveryAttemptSchema.statics.getAlertConditions = async function () {
    const oneHourAgo = new Date(Date.now() - (60 * 60 * 1000));
    const fifteenMinutesAgo = new Date(Date.now() - (15 * 60 * 1000));

    const alerts = [];

    // Check for high failure rate in last hour
    const hourlyStats = await this.getDeliveryStats(1);
    if (hourlyStats.totalAttempts > 10) {
        const failureRate = (hourlyStats.failedAttempts / hourlyStats.totalAttempts) * 100;
        if (failureRate > 50) {
            alerts.push({
                type: 'high_failure_rate',
                severity: 'critical',
                message: `High failure rate detected: ${failureRate.toFixed(1)}% in the last hour`,
                data: hourlyStats
            });
        }
    }

    // Check for service-specific issues
    const serviceStats = await this.getServiceStats(1);
    for (const service of serviceStats) {
        const failureRate = (service.failedAttempts / service.totalAttempts) * 100;
        if (failureRate > 75 && service.totalAttempts > 5) {
            alerts.push({
                type: 'service_degradation',
                severity: 'warning',
                message: `Service ${service._id} showing high failure rate: ${failureRate.toFixed(1)}%`,
                data: service
            });
        }
    }

    // Check for no successful deliveries in last 15 minutes (if there were attempts)
    const recentAttempts = await this.countDocuments({
        createdAt: { $gte: fifteenMinutesAgo }
    });

    if (recentAttempts > 0) {
        const recentSuccesses = await this.countDocuments({
            createdAt: { $gte: fifteenMinutesAgo },
            status: { $in: ['sent', 'delivered'] }
        });

        if (recentSuccesses === 0) {
            alerts.push({
                type: 'no_successful_deliveries',
                severity: 'critical',
                message: `No successful deliveries in the last 15 minutes despite ${recentAttempts} attempts`,
                data: { attempts: recentAttempts, successes: recentSuccesses }
            });
        }
    }

    return alerts;
};

export const DeliveryAttempt = mongoose.models.DeliveryAttempt || mongoose.model("DeliveryAttempt", DeliveryAttemptSchema);