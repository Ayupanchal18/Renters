import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
    alertId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    type: {
        type: String,
        required: true,
        enum: [
            'delivery_failure_rate',
            'service_unavailable',
            'no_deliveries',
            'configuration_invalid',
            'high_error_count',
            'system_degradation',
            'user_escalation'
        ]
    },
    severity: {
        type: String,
        required: true,
        enum: ['critical', 'warning', 'info'],
        default: 'warning'
    },
    status: {
        type: String,
        required: true,
        enum: ['active', 'acknowledged', 'resolved', 'suppressed'],
        default: 'active'
    },
    title: {
        type: String,
        required: true,
        maxlength: 200
    },
    description: {
        type: String,
        required: true,
        maxlength: 1000
    },
    source: {
        type: String,
        required: true,
        enum: ['delivery_metrics', 'service_monitor', 'user_escalation', 'system_health']
    },
    affectedServices: [{
        type: String,
        enum: ['phone-email', 'twilio', 'smtp', 'all']
    }],
    affectedUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    metrics: {
        failureRate: Number,
        errorCount: Number,
        affectedDeliveries: Number,
        timeRange: String,
        threshold: Number,
        actualValue: Number
    },
    context: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    escalationLevel: {
        type: Number,
        default: 1,
        min: 1,
        max: 3
    },
    escalationHistory: [{
        level: Number,
        escalatedAt: Date,
        escalatedBy: String,
        reason: String,
        notificationsSent: [String]
    }],
    acknowledgedBy: {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        username: String,
        acknowledgedAt: Date,
        notes: String
    },
    resolvedBy: {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        username: String,
        resolvedAt: Date,
        resolution: String,
        resolutionNotes: String
    },
    suppressedUntil: Date,
    suppressionReason: String,
    notificationsSent: [{
        channel: {
            type: String,
            enum: ['email', 'sms', 'slack', 'webhook']
        },
        recipient: String,
        sentAt: Date,
        success: Boolean,
        error: String
    }],
    autoResolved: {
        type: Boolean,
        default: false
    },
    resolutionTime: Number, // Time in milliseconds from creation to resolution
    tags: [String],
    relatedAlerts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Alert'
    }]
}, {
    timestamps: true,
    collection: 'alerts'
});

// Indexes for efficient querying
alertSchema.index({ status: 1, severity: 1 });
alertSchema.index({ type: 1, createdAt: -1 });
alertSchema.index({ affectedServices: 1 });
alertSchema.index({ createdAt: -1 });
alertSchema.index({ escalationLevel: 1, status: 1 });

// Virtual for alert age
alertSchema.virtual('age').get(function () {
    return Date.now() - this.createdAt.getTime();
});

// Virtual for time to resolution
alertSchema.virtual('timeToResolution').get(function () {
    if (this.status === 'resolved' && this.resolvedBy.resolvedAt) {
        return this.resolvedBy.resolvedAt.getTime() - this.createdAt.getTime();
    }
    return null;
});

// Static methods for alert management
alertSchema.statics.getActiveAlerts = function (severity = null) {
    const query = { status: { $in: ['active', 'acknowledged'] } };
    if (severity) {
        query.severity = severity;
    }
    return this.find(query).sort({ severity: 1, createdAt: -1 });
};

alertSchema.statics.getAlertsByType = function (type, timeRangeHours = 24) {
    const cutoffTime = new Date(Date.now() - (timeRangeHours * 60 * 60 * 1000));
    return this.find({
        type,
        createdAt: { $gte: cutoffTime }
    }).sort({ createdAt: -1 });
};

alertSchema.statics.getAlertMetrics = function (timeRangeHours = 24) {
    const cutoffTime = new Date(Date.now() - (timeRangeHours * 60 * 60 * 1000));

    return this.aggregate([
        {
            $match: {
                createdAt: { $gte: cutoffTime }
            }
        },
        {
            $group: {
                _id: {
                    severity: '$severity',
                    status: '$status'
                },
                count: { $sum: 1 },
                avgResolutionTime: {
                    $avg: {
                        $cond: [
                            { $eq: ['$status', 'resolved'] },
                            '$resolutionTime',
                            null
                        ]
                    }
                }
            }
        },
        {
            $sort: { '_id.severity': 1, '_id.status': 1 }
        }
    ]);
};

alertSchema.statics.getEscalationCandidates = function (maxAgeMinutes = 30) {
    const cutoffTime = new Date(Date.now() - (maxAgeMinutes * 60 * 1000));

    return this.find({
        status: 'active',
        severity: { $in: ['critical', 'warning'] },
        createdAt: { $lte: cutoffTime },
        escalationLevel: { $lt: 3 }
    }).sort({ severity: 1, createdAt: 1 });
};

// Instance methods
alertSchema.methods.acknowledge = function (userId, username, notes = '') {
    this.status = 'acknowledged';
    this.acknowledgedBy = {
        userId,
        username,
        acknowledgedAt: new Date(),
        notes
    };
    return this.save();
};

alertSchema.methods.resolve = function (userId, username, resolution, notes = '') {
    this.status = 'resolved';
    this.resolvedBy = {
        userId,
        username,
        resolvedAt: new Date(),
        resolution,
        resolutionNotes: notes
    };
    this.resolutionTime = Date.now() - this.createdAt.getTime();
    return this.save();
};

alertSchema.methods.escalate = function (reason = 'Automatic escalation due to age') {
    if (this.escalationLevel < 3) {
        this.escalationLevel += 1;
        this.escalationHistory.push({
            level: this.escalationLevel,
            escalatedAt: new Date(),
            escalatedBy: 'system',
            reason,
            notificationsSent: []
        });
        return this.save();
    }
    return Promise.resolve(this);
};

alertSchema.methods.suppress = function (durationMinutes = 60, reason = '') {
    this.status = 'suppressed';
    this.suppressedUntil = new Date(Date.now() + (durationMinutes * 60 * 1000));
    this.suppressionReason = reason;
    return this.save();
};

alertSchema.methods.addNotification = function (channel, recipient, success, error = null) {
    this.notificationsSent.push({
        channel,
        recipient,
        sentAt: new Date(),
        success,
        error
    });
    return this.save();
};

// Pre-save middleware to generate alertId
alertSchema.pre('save', function (next) {
    if (this.isNew && !this.alertId) {
        this.alertId = `ALT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    }
    next();
});

// Pre-save middleware to update resolution time
alertSchema.pre('save', function (next) {
    if (this.isModified('status') && this.status === 'resolved' && !this.resolutionTime) {
        this.resolutionTime = Date.now() - this.createdAt.getTime();
    }
    next();
});

export const Alert = mongoose.model('Alert', alertSchema);