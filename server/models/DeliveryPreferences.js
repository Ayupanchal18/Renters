import mongoose from "mongoose";
const { Schema } = mongoose;

const DeliveryPreferencesSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
            index: true
        },
        preferredMethod: {
            type: String,
            enum: ['sms', 'email', 'auto'],
            default: 'auto'
        },
        preferredService: {
            type: String,
            enum: ['phone-email', 'twilio', 'smtp', 'auto'],
            default: 'auto'
        },
        allowFallback: {
            type: Boolean,
            default: true
        },
        fallbackOrder: [{
            service: {
                type: String,
                enum: ['phone-email', 'twilio', 'smtp']
            },
            method: {
                type: String,
                enum: ['sms', 'email']
            },
            priority: Number
        }],
        notificationSettings: {
            deliveryConfirmation: {
                type: Boolean,
                default: true
            },
            failureAlerts: {
                type: Boolean,
                default: true
            },
            retryNotifications: {
                type: Boolean,
                default: false
            },
            estimatedDeliveryTime: {
                type: Boolean,
                default: true
            }
        },
        deliveryWindow: {
            enabled: {
                type: Boolean,
                default: false
            },
            startTime: {
                type: String, // HH:MM format
                default: '08:00'
            },
            endTime: {
                type: String, // HH:MM format
                default: '22:00'
            },
            timezone: {
                type: String,
                default: 'UTC'
            }
        },
        rateLimiting: {
            maxAttemptsPerHour: {
                type: Number,
                default: 10
            },
            maxAttemptsPerDay: {
                type: Number,
                default: 50
            },
            cooldownMinutes: {
                type: Number,
                default: 5
            }
        },
        accessibility: {
            largeText: {
                type: Boolean,
                default: false
            },
            highContrast: {
                type: Boolean,
                default: false
            },
            screenReader: {
                type: Boolean,
                default: false
            }
        }
    },
    {
        timestamps: true,
        collection: 'deliverypreferences'
    }
);

// Indexes for efficient queries
DeliveryPreferencesSchema.index({ userId: 1 });
DeliveryPreferencesSchema.index({ preferredMethod: 1 });
DeliveryPreferencesSchema.index({ preferredService: 1 });

// Static methods
DeliveryPreferencesSchema.statics.getOrCreate = async function (userId) {
    let preferences = await this.findOne({ userId });

    if (!preferences) {
        preferences = new this({
            userId,
            preferredMethod: 'auto',
            preferredService: 'auto',
            allowFallback: true,
            notificationSettings: {
                deliveryConfirmation: true,
                failureAlerts: true,
                retryNotifications: false,
                estimatedDeliveryTime: true
            }
        });

        await preferences.save();
    }

    return preferences;
};

DeliveryPreferencesSchema.statics.updatePreferences = async function (userId, updates) {
    return await this.findOneAndUpdate(
        { userId },
        { $set: updates },
        { new: true, upsert: true }
    );
};

DeliveryPreferencesSchema.statics.getPreferenceStats = async function () {
    return await this.aggregate([
        {
            $group: {
                _id: null,
                totalUsers: { $sum: 1 },
                smsPreferred: {
                    $sum: { $cond: [{ $eq: ["$preferredMethod", "sms"] }, 1, 0] }
                },
                emailPreferred: {
                    $sum: { $cond: [{ $eq: ["$preferredMethod", "email"] }, 1, 0] }
                },
                autoPreferred: {
                    $sum: { $cond: [{ $eq: ["$preferredMethod", "auto"] }, 1, 0] }
                },
                phoneEmailServicePreferred: {
                    $sum: { $cond: [{ $eq: ["$preferredService", "phone-email"] }, 1, 0] }
                },
                fallbackEnabled: {
                    $sum: { $cond: ["$allowFallback", 1, 0] }
                }
            }
        }
    ]);
};

// Instance methods
DeliveryPreferencesSchema.methods.getDeliveryPlan = function (availableServices) {
    const plan = [];

    // If user has specific preferences, honor them
    if (this.preferredService !== 'auto' && this.preferredMethod !== 'auto') {
        const preferredService = availableServices.find(s =>
            s.serviceName === this.preferredService &&
            s.capabilities.includes(this.preferredMethod)
        );

        if (preferredService) {
            plan.push({
                service: this.preferredService,
                method: this.preferredMethod,
                priority: 1
            });
        }
    }

    // Add fallback services if enabled
    if (this.allowFallback) {
        // Use custom fallback order if defined
        if (this.fallbackOrder && this.fallbackOrder.length > 0) {
            for (const fallback of this.fallbackOrder) {
                const service = availableServices.find(s =>
                    s.serviceName === fallback.service &&
                    s.capabilities.includes(fallback.method)
                );

                if (service && !plan.some(p => p.service === fallback.service && p.method === fallback.method)) {
                    plan.push({
                        service: fallback.service,
                        method: fallback.method,
                        priority: fallback.priority || plan.length + 1
                    });
                }
            }
        } else {
            // Use default fallback order based on service priority
            for (const service of availableServices) {
                for (const capability of service.capabilities) {
                    if (!plan.some(p => p.service === service.serviceName && p.method === capability)) {
                        plan.push({
                            service: service.serviceName,
                            method: capability,
                            priority: service.priority
                        });
                    }
                }
            }
        }
    }

    // Sort by priority
    return plan.sort((a, b) => a.priority - b.priority);
};

DeliveryPreferencesSchema.methods.isWithinDeliveryWindow = function () {
    if (!this.deliveryWindow.enabled) {
        return true;
    }

    const now = new Date();
    const userTimezone = this.deliveryWindow.timezone || 'UTC';

    // Convert current time to user's timezone
    const userTime = new Intl.DateTimeFormat('en-US', {
        timeZone: userTimezone,
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
    }).format(now);

    const currentTime = userTime.replace(':', '');
    const startTime = this.deliveryWindow.startTime.replace(':', '');
    const endTime = this.deliveryWindow.endTime.replace(':', '');

    return currentTime >= startTime && currentTime <= endTime;
};

DeliveryPreferencesSchema.methods.checkRateLimit = async function () {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - (60 * 60 * 1000));
    const oneDayAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));

    // Import DeliveryAttempt model to check recent attempts
    const { DeliveryAttempt } = await import('./DeliveryAttempt.js');

    const [hourlyCount, dailyCount] = await Promise.all([
        DeliveryAttempt.countDocuments({
            userId: this.userId,
            createdAt: { $gte: oneHourAgo }
        }),
        DeliveryAttempt.countDocuments({
            userId: this.userId,
            createdAt: { $gte: oneDayAgo }
        })
    ]);

    return {
        withinHourlyLimit: hourlyCount < this.rateLimiting.maxAttemptsPerHour,
        withinDailyLimit: dailyCount < this.rateLimiting.maxAttemptsPerDay,
        hourlyCount,
        dailyCount,
        hourlyLimit: this.rateLimiting.maxAttemptsPerHour,
        dailyLimit: this.rateLimiting.maxAttemptsPerDay
    };
};

export const DeliveryPreferences = mongoose.models.DeliveryPreferences || mongoose.model("DeliveryPreferences", DeliveryPreferencesSchema);