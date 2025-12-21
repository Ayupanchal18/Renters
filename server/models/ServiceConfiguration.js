import mongoose from "mongoose";
const { Schema } = mongoose;

const ServiceConfigurationSchema = new Schema(
    {
        serviceName: {
            type: String,
            enum: ['phone-email', 'twilio', 'smtp'],
            required: true,
            unique: true,
            index: true
        },
        displayName: {
            type: String,
            required: true
        },
        isEnabled: {
            type: Boolean,
            default: true,
            index: true
        },
        isPrimary: {
            type: Boolean,
            default: false,
            index: true
        },
        priority: {
            type: Number,
            required: true,
            index: true
        },
        capabilities: [{
            type: String,
            enum: ['sms', 'email']
        }],
        credentials: {
            type: Schema.Types.Mixed,
            required: true
        },
        lastValidated: {
            type: Date,
            index: true
        },
        validationStatus: {
            type: String,
            enum: ['valid', 'invalid', 'pending', 'unknown'],
            default: 'pending',
            index: true
        },
        healthStatus: {
            type: String,
            enum: ['healthy', 'degraded', 'down', 'unknown'],
            default: 'unknown',
            index: true
        },
        errorCount: {
            type: Number,
            default: 0
        },
        lastError: {
            message: String,
            timestamp: Date,
            code: String
        },
        metrics: {
            totalRequests: { type: Number, default: 0 },
            successfulRequests: { type: Number, default: 0 },
            failedRequests: { type: Number, default: 0 },
            averageResponseTime: { type: Number, default: 0 },
            lastUsed: Date
        },
        configuration: {
            retryAttempts: { type: Number, default: 3 },
            timeoutMs: { type: Number, default: 30000 },
            rateLimitPerMinute: { type: Number, default: 60 },
            enableFallback: { type: Boolean, default: true }
        }
    },
    {
        timestamps: true,
        collection: 'serviceconfigurations'
    }
);

// Indexes for efficient queries
ServiceConfigurationSchema.index({ isEnabled: 1, priority: 1 });
ServiceConfigurationSchema.index({ validationStatus: 1, healthStatus: 1 });
ServiceConfigurationSchema.index({ lastValidated: 1 });

// Static methods for service management
ServiceConfigurationSchema.statics.getEnabledServices = async function (capability = null) {
    const query = { isEnabled: true };

    if (capability) {
        query.capabilities = capability;
    }

    return await this.find(query)
        .sort({ priority: 1 })
        .lean();
};

ServiceConfigurationSchema.statics.getPrimaryService = async function (capability = null) {
    const query = {
        isEnabled: true,
        isPrimary: true,
        validationStatus: 'valid',
        healthStatus: { $in: ['healthy', 'degraded'] }
    };

    if (capability) {
        query.capabilities = capability;
    }

    return await this.findOne(query).lean();
};

ServiceConfigurationSchema.statics.getFallbackServices = async function (capability = null, excludeService = null) {
    const query = {
        isEnabled: true,
        isPrimary: false,
        validationStatus: 'valid',
        healthStatus: { $in: ['healthy', 'degraded'] }
    };

    if (capability) {
        query.capabilities = capability;
    }

    if (excludeService) {
        query.serviceName = { $ne: excludeService };
    }

    return await this.find(query)
        .sort({ priority: 1 })
        .lean();
};

ServiceConfigurationSchema.statics.updateServiceHealth = async function (serviceName, healthData) {
    const update = {
        healthStatus: healthData.status,
        lastValidated: new Date(),
        validationStatus: healthData.validationStatus || 'valid'
    };

    if (healthData.error) {
        update.lastError = {
            message: healthData.error,
            timestamp: new Date(),
            code: healthData.errorCode || 'UNKNOWN'
        };
        if (!update.$inc) update.$inc = {};
        update.$inc.errorCount = 1;
    } else {
        update.errorCount = 0;
    }

    if (healthData.metrics) {
        update['metrics.lastUsed'] = new Date();
        if (healthData.metrics.responseTime) {
            if (!update.$inc) update.$inc = {};
            update.$inc['metrics.totalRequests'] = 1;
            if (healthData.metrics.success) {
                update.$inc['metrics.successfulRequests'] = 1;
            } else {
                update.$inc['metrics.failedRequests'] = 1;
            }
        }
    }

    return await this.findOneAndUpdate(
        { serviceName },
        update,
        { new: true, upsert: false }
    );
};

ServiceConfigurationSchema.statics.getServiceMetrics = async function (serviceName = null, timeRange = 24) {
    const matchStage = serviceName ? { serviceName } : {};

    return await this.aggregate([
        { $match: matchStage },
        {
            $project: {
                serviceName: 1,
                displayName: 1,
                isEnabled: 1,
                healthStatus: 1,
                validationStatus: 1,
                metrics: 1,
                successRate: {
                    $cond: [
                        { $gt: ["$metrics.totalRequests", 0] },
                        {
                            $multiply: [
                                { $divide: ["$metrics.successfulRequests", "$metrics.totalRequests"] },
                                100
                            ]
                        },
                        0
                    ]
                },
                errorRate: {
                    $cond: [
                        { $gt: ["$metrics.totalRequests", 0] },
                        {
                            $multiply: [
                                { $divide: ["$metrics.failedRequests", "$metrics.totalRequests"] },
                                100
                            ]
                        },
                        0
                    ]
                }
            }
        }
    ]);
};

// Instance methods
ServiceConfigurationSchema.methods.updateMetrics = function (responseTime, success = true) {
    this.metrics.totalRequests += 1;
    this.metrics.lastUsed = new Date();

    if (success) {
        this.metrics.successfulRequests += 1;
    } else {
        this.metrics.failedRequests += 1;
        this.errorCount += 1;
    }

    // Update average response time
    const totalSuccessful = this.metrics.successfulRequests;
    if (totalSuccessful > 0) {
        this.metrics.averageResponseTime =
            ((this.metrics.averageResponseTime * (totalSuccessful - 1)) + responseTime) / totalSuccessful;
    }

    return this.save();
};

ServiceConfigurationSchema.methods.recordError = function (error, errorCode = 'UNKNOWN') {
    this.errorCount += 1;
    this.lastError = {
        message: error,
        timestamp: new Date(),
        code: errorCode
    };

    // Update health status based on error count
    if (this.errorCount >= 10) {
        this.healthStatus = 'down';
    } else if (this.errorCount >= 5) {
        this.healthStatus = 'degraded';
    }

    return this.save();
};

ServiceConfigurationSchema.methods.resetErrors = function () {
    this.errorCount = 0;
    this.lastError = undefined;
    this.healthStatus = 'healthy';

    return this.save();
};

// Additional static methods for enhanced monitoring
ServiceConfigurationSchema.statics.getHealthSummary = async function () {
    return await this.aggregate([
        {
            $group: {
                _id: "$healthStatus",
                count: { $sum: 1 },
                services: { $push: "$serviceName" }
            }
        },
        {
            $sort: { _id: 1 }
        }
    ]);
};

ServiceConfigurationSchema.statics.getConfigurationAlerts = async function () {
    const alerts = [];
    const fiveMinutesAgo = new Date(Date.now() - (5 * 60 * 1000));

    // Find services that haven't been validated recently
    const staleServices = await this.find({
        isEnabled: true,
        $or: [
            { lastValidated: { $lt: fiveMinutesAgo } },
            { lastValidated: null }
        ]
    }).lean();

    for (const service of staleServices) {
        alerts.push({
            type: 'stale_validation',
            severity: 'warning',
            serviceName: service.serviceName,
            message: `Service ${service.serviceName} validation is stale`,
            lastValidated: service.lastValidated
        });
    }

    // Find services with high error counts
    const errorServices = await this.find({
        isEnabled: true,
        errorCount: { $gte: 5 }
    }).lean();

    for (const service of errorServices) {
        const severity = service.errorCount >= 10 ? 'critical' : 'warning';
        alerts.push({
            type: 'high_error_count',
            severity,
            serviceName: service.serviceName,
            message: `Service ${service.serviceName} has ${service.errorCount} errors`,
            errorCount: service.errorCount,
            lastError: service.lastError
        });
    }

    // Find services that are down
    const downServices = await this.find({
        isEnabled: true,
        healthStatus: 'down'
    }).lean();

    for (const service of downServices) {
        alerts.push({
            type: 'service_down',
            severity: 'critical',
            serviceName: service.serviceName,
            message: `Service ${service.serviceName} is down`,
            lastError: service.lastError
        });
    }

    return alerts;
};

ServiceConfigurationSchema.statics.initializeDefaultConfigurations = async function () {
    const defaultConfigs = [
        {
            serviceName: 'phone-email',
            displayName: 'Phone.email Service',
            isPrimary: true,
            priority: 1,
            capabilities: ['sms', 'email'],
            credentials: {
                apiKey: process.env.PHONE_EMAIL_API_KEY || '',
                apiSecret: process.env.PHONE_EMAIL_API_SECRET || ''
            },
            configuration: {
                retryAttempts: 3,
                timeoutMs: 30000,
                rateLimitPerMinute: 100,
                enableFallback: true
            }
        },
        {
            serviceName: 'twilio',
            displayName: 'Twilio SMS Service',
            isPrimary: false,
            priority: 2,
            capabilities: ['sms'],
            credentials: {
                accountSid: process.env.TWILIO_ACCOUNT_SID || '',
                authToken: process.env.TWILIO_AUTH_TOKEN || '',
                fromNumber: process.env.TWILIO_FROM_NUMBER || ''
            },
            configuration: {
                retryAttempts: 2,
                timeoutMs: 20000,
                rateLimitPerMinute: 60,
                enableFallback: true
            }
        },
        {
            serviceName: 'smtp',
            displayName: 'SMTP Email Service',
            isPrimary: false,
            priority: 3,
            capabilities: ['email'],
            credentials: {
                host: process.env.SMTP_HOST || '',
                port: process.env.SMTP_PORT || 587,
                secure: process.env.SMTP_SECURE === 'true',
                user: process.env.SMTP_USER || '',
                pass: process.env.SMTP_PASS || ''
            },
            configuration: {
                retryAttempts: 2,
                timeoutMs: 25000,
                rateLimitPerMinute: 50,
                enableFallback: false
            }
        }
    ];

    for (const config of defaultConfigs) {
        await this.findOneAndUpdate(
            { serviceName: config.serviceName },
            config,
            { upsert: true, new: true }
        );
    }

    console.log('✅ Default service configurations initialized');
};

export const ServiceConfiguration = mongoose.models.ServiceConfiguration || mongoose.model("ServiceConfiguration", ServiceConfigurationSchema);